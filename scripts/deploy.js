#!/usr/bin/env node
/**
 * Build-to-branch & GitHub Pages publisher for Chemistry Game.
 *
 * Workflow:
 *   1. Runs `npm run build` (unless --skip-build is passed) to emit `dist/`.
 *   2. Stages `dist/` plus `.nojekyll`, `404.html` and optional `CNAME` inside
 *      an isolated temporary Git repository so the current working tree and
 *      checked-out branch are never modified or switched.
 *   3. Force-pushes the built artifact commit to `refs/heads/<branch>`
 *      (default: `gh-pages`) on the target remote (default: `origin`).
 *   4. Configures and triggers GitHub Pages to publish from `<branch>` (`/`)
 *      via the GitHub REST API (`GITHUB_TOKEN` / `GH_TOKEN` or `gh api`).
 */

const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv = process.argv.slice(2), env = process.env) {
    const opts = {
        branch: env.DEPLOY_BRANCH || "gh-pages",
        remote: env.DEPLOY_REMOTE || "origin",
        dir: env.DEPLOY_DIR || "dist",
        cname: env.CNAME || env.DEPLOY_CNAME || "",
        message: env.DEPLOY_MESSAGE || "",
        skipBuild: env.DEPLOY_SKIP_BUILD === "1" || env.DEPLOY_SKIP_BUILD === "true",
        skipPages: env.DEPLOY_SKIP_PAGES === "1" || env.DEPLOY_SKIP_PAGES === "true",
        dryRun: env.DEPLOY_DRY_RUN === "1" || env.DEPLOY_DRY_RUN === "true",
        help: false
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const [flag, inlineVal] = arg.startsWith("--") && arg.includes("=")
            ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)]
            : [arg, undefined];
        const nextVal = () => (inlineVal !== undefined ? inlineVal : argv[++i]);

        switch (flag) {
            case "--branch":
            case "-b":
                opts.branch = nextVal() || opts.branch;
                break;
            case "--remote":
            case "-r":
                opts.remote = nextVal() || opts.remote;
                break;
            case "--dir":
            case "-d":
                opts.dir = nextVal() || opts.dir;
                break;
            case "--cname":
                opts.cname = (nextVal() || "").trim();
                break;
            case "--message":
            case "-m":
                opts.message = nextVal() || "";
                break;
            case "--skip-build":
                opts.skipBuild = true;
                break;
            case "--skip-pages":
                opts.skipPages = true;
                break;
            case "--dry-run":
                opts.dryRun = true;
                break;
            case "--help":
            case "-h":
                opts.help = true;
                break;
            default:
                throw new Error(`Unknown option: ${arg}`);
        }
    }

    return opts;
}

function printHelp() {
    console.log(`Usage: node scripts/deploy.js [options]

Builds the game into dist/, pushes the production bundle to a dedicated branch,
and publishes that branch to GitHub Pages.

Options:
  -b, --branch <name>     Target branch for the build (default: "gh-pages")
  -r, --remote <remote>   Git remote name or URL (default: "origin")
  -d, --dir <path>        Build output directory (default: "dist")
  -m, --message <text>    Custom commit message for the build branch
      --cname <domain>    Custom domain to write to CNAME
      --skip-build        Use existing dist/ without running 'npm run build'
      --skip-pages        Push the branch without calling the GitHub Pages API
      --dry-run           Stage and verify the commit without pushing
  -h, --help              Show this help message

Environment variables:
  DEPLOY_BRANCH, DEPLOY_REMOTE, DEPLOY_DIR, DEPLOY_MESSAGE, CNAME,
  DEPLOY_SKIP_BUILD=1, DEPLOY_SKIP_PAGES=1, DEPLOY_DRY_RUN=1, GITHUB_TOKEN`);
}

function gitOutput(args, cwd = ROOT) {
    try {
        return execFileSync("git", args, {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"]
        }).trim();
    } catch (_) {
        return "";
    }
}

function isDirectUrlOrPath(remote) {
    return (
        /^(https?:\/\/|git@|ssh:\/\/|file:\/\/)/i.test(remote) ||
        remote.startsWith("/") ||
        remote.startsWith("./") ||
        remote.startsWith("../") ||
        fs.existsSync(remote)
    );
}

function resolveRemoteUrl(remote, cwd = ROOT) {
    if (isDirectUrlOrPath(remote)) {
        return remote.startsWith(".") || fs.existsSync(remote)
            ? path.resolve(cwd, remote)
            : remote;
    }
    const url = gitOutput(["remote", "get-url", remote], cwd);
    if (!url) {
        throw new Error(`Could not resolve Git remote "${remote}".`);
    }
    return url;
}

function parseGitHubRepo(remoteUrl, env = process.env) {
    let owner = "";
    let repo = "";

    const m = String(remoteUrl || "").match(
        /github\.com[:/]([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/i
    );
    if (m) {
        owner = m[1];
        repo = m[2];
    } else if (env.GITHUB_REPOSITORY && env.GITHUB_REPOSITORY.includes("/")) {
        const parts = env.GITHUB_REPOSITORY.split("/");
        owner = parts[0];
        repo = parts[1];
    }

    if (!owner || !repo) return null;

    const lowerOwner = owner.toLowerCase();
    const isUserSite = repo.toLowerCase() === `${lowerOwner}.github.io`;
    const pagesUrl = isUserSite
        ? `https://${lowerOwner}.github.io/`
        : `https://${lowerOwner}.github.io/${repo}/`;

    return { owner, repo, pagesUrl };
}

function copyDirectoryRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.name === ".git") continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectoryRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function prepareArtifacts(buildDir, targetDir, options = {}) {
    if (!fs.existsSync(buildDir)) {
        throw new Error(`Build directory not found: ${buildDir}`);
    }
    const indexHtml = path.join(buildDir, "index.html");
    const bundleJs = path.join(buildDir, "bundle.min.js");
    if (!fs.existsSync(indexHtml)) {
        throw new Error(`Missing index.html in ${buildDir}. Did 'npm run build' succeed?`);
    }
    if (!fs.existsSync(bundleJs)) {
        throw new Error(`Missing bundle.min.js in ${buildDir}. Did 'npm run build' succeed?`);
    }

    // Ensure .nojekyll exists in buildDir as well for artifact uploaders.
    fs.writeFileSync(path.join(buildDir, ".nojekyll"), "");
    if (options.cname) {
        fs.writeFileSync(path.join(buildDir, "CNAME"), `${options.cname.trim()}\n`);
    }

    copyDirectoryRecursive(buildDir, targetDir);

    // GitHub Pages helpers:
    // 1. .nojekyll disables Jekyll processing so static assets serve directly.
    fs.writeFileSync(path.join(targetDir, ".nojekyll"), "");
    // 2. 404.html fallback serves the SPA entry point on any deep URL.
    const fallback404 = path.join(targetDir, "404.html");
    if (!fs.existsSync(fallback404)) {
        fs.copyFileSync(indexHtml, fallback404);
    }
    // 3. Optional CNAME for custom domains.
    if (options.cname) {
        fs.writeFileSync(path.join(targetDir, "CNAME"), `${options.cname.trim()}\n`);
    }

    return fs.readdirSync(targetDir).filter(f => f !== ".git").sort();
}

function redactUrl(url) {
    return String(url).replace(/\/\/[^@/]+@/g, "//***@");
}

function buildAuthenticatedPushUrl(remoteUrl, env = process.env) {
    const token = env.GITHUB_TOKEN || env.GH_TOKEN || "";
    if (
        token &&
        env.GITHUB_ACTIONS === "true" &&
        /^https:\/\/github\.com\//i.test(remoteUrl)
    ) {
        const actor = env.GITHUB_ACTOR || "x-access-token";
        return remoteUrl.replace(
            /^https:\/\/github\.com\//i,
            `https://${actor}:${token}@github.com/`
        );
    }
    return remoteUrl;
}

function githubApiRequest(method, apiPath, body, token) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                hostname: "api.github.com",
                path: apiPath,
                method,
                headers: {
                    "User-Agent": "chemistry-game-deploy-script",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(payload
                        ? {
                              "Content-Type": "application/json",
                              "Content-Length": Buffer.byteLength(payload)
                          }
                        : {})
                }
            },
            res => {
                let raw = "";
                res.on("data", chunk => {
                    raw += chunk;
                });
                res.on("end", () => {
                    let parsed = null;
                    try {
                        parsed = raw ? JSON.parse(raw) : null;
                    } catch (_) {
                        parsed = { raw };
                    }
                    resolve({ status: res.statusCode || 0, data: parsed });
                });
            }
        );
        req.on("error", reject);
        if (payload) req.write(payload);
        req.end();
    });
}

function ghCliApi(method, endpoint, body) {
    const args = [
        "api",
        "-X",
        method,
        "-H",
        "Accept: application/vnd.github+json",
        endpoint
    ];
    const opts = {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"]
    };
    if (body) {
        args.push("--input", "-");
        opts.input = JSON.stringify(body);
    }
    try {
        const out = execFileSync("gh", args, opts);
        return {
            status: 200,
            data: out ? JSON.parse(out) : null
        };
    } catch (err) {
        const stderr = String((err && err.stderr) || "");
        const stdout = String((err && err.stdout) || "");
        const statusMatch = stderr.match(/HTTP\s+(\d{3})/i);
        const status = statusMatch ? Number(statusMatch[1]) : 500;
        let data = null;
        try {
            data = stdout ? JSON.parse(stdout) : { message: stderr.trim() };
        } catch (_) {
            data = { message: (stderr || stdout).trim() };
        }
        return { status, data };
    }
}

async function callGitHubApi(method, endpoint, body = null, env = process.env) {
    const token = env.GITHUB_TOKEN || env.GH_TOKEN || "";
    if (token) {
        return githubApiRequest(method, endpoint, body, token);
    }
    return ghCliApi(method, endpoint.replace(/^\//, ""), body);
}

async function publishGitHubPages({ owner, repo, branch, cname, pagesUrl }, env = process.env) {
    const endpoint = `/repos/${owner}/${repo}/pages`;
    const current = await callGitHubApi("GET", endpoint, null, env);

    if (current.status === 404) {
        console.log(`▸ Enabling GitHub Pages on ${owner}/${repo} from branch "${branch}" (/)…`);
        const created = await callGitHubApi(
            "POST",
            endpoint,
            {
                build_type: "legacy",
                source: { branch, path: "/" }
            },
            env
        );
        if (created.status >= 200 && created.status < 300) {
            if (cname) {
                await callGitHubApi("PUT", endpoint, { cname, source: { branch, path: "/" } }, env);
            }
            const url = (created.data && created.data.html_url) || pagesUrl;
            console.log(`✓ GitHub Pages enabled: ${url}`);
            return { published: true, status: "enabled", url };
        }
        console.warn(
            `⚠ Could not auto-enable GitHub Pages via API (HTTP ${created.status}).\n` +
            `  Branch "${branch}" is pushed. To finish enabling Pages once:\n` +
            `  Open https://github.com/${owner}/${repo}/settings/pages and select:\n` +
            `  Source: "Deploy from a branch" → Branch: "${branch}" / "/ (root)".`
        );
        return { published: false, status: "manual-setup-needed", url: pagesUrl };
    }

    if (current.status >= 200 && current.status < 300) {
        const src = (current.data && current.data.source) || {};
        const needsUpdate =
            src.branch !== branch ||
            src.path !== "/" ||
            (cname && current.data && current.data.cname !== cname);

        if (needsUpdate) {
            console.log(`▸ Updating GitHub Pages source to branch "${branch}" (/)…`);
            const updateBody = {
                build_type: "legacy",
                source: { branch, path: "/" }
            };
            if (cname) updateBody.cname = cname;
            await callGitHubApi("PUT", endpoint, updateBody, env);
        }

        // Request an immediate Pages build so the latest commit on <branch> is published.
        await callGitHubApi("POST", `${endpoint}/builds`, null, env);

        const url =
            (cname ? `https://${cname}/` : null) ||
            (current.data && current.data.html_url) ||
            pagesUrl;
        console.log(`✓ GitHub Pages published from "${branch}": ${url}`);
        return { published: true, status: "updated", url };
    }

    console.warn(
        `⚠ GitHub Pages API returned HTTP ${current.status}. Branch "${branch}" was pushed;\n` +
        `  verify Pages settings at https://github.com/${owner}/${repo}/settings/pages`
    );
    return { published: false, status: "unknown", url: pagesUrl };
}

function writeStepSummary({ branch, commitSha, files, bundleSizeKiB, pagesUrl, dryRun }, env = process.env) {
    const summaryPath = env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) return;
    const lines = [
        "### 🚀 Chemistry Game — GitHub Pages Deployment",
        "",
        "| Field | Value |",
        "| ----- | ----- |",
        `| **Target Branch** | \`${branch}\` |`,
        `| **Source Commit** | \`${commitSha}\` |`,
        `| **Bundle Size** | \`${bundleSizeKiB} KiB\` |`,
        `| **Published Files** | \`${files.join("`, `")}\` |`,
        `| **Mode** | ${dryRun ? "Dry run (not pushed)" : "Pushed & published"} |`
    ];
    if (pagesUrl) {
        lines.push(`| **Live URL** | [${pagesUrl}](${pagesUrl}) |`);
    }
    lines.push("");
    fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

async function deploy(rawOptions = {}, env = process.env) {
    const opts = {
        branch: "gh-pages",
        remote: "origin",
        dir: "dist",
        cname: "",
        message: "",
        skipBuild: false,
        skipPages: false,
        dryRun: false,
        cwd: ROOT,
        ...rawOptions
    };

    const cwd = opts.cwd || ROOT;
    const buildDir = path.resolve(cwd, opts.dir);
    const sourceBranch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"], cwd) || "HEAD";
    const sourceSha = gitOutput(["rev-parse", "--short", "HEAD"], cwd) || "local";
    const remoteUrl = resolveRemoteUrl(opts.remote, cwd);
    const ghRepo = parseGitHubRepo(remoteUrl, env);

    console.log(`▸ Source branch: ${sourceBranch} (${sourceSha}) — will remain untouched`);
    console.log(`▸ Target branch: ${opts.branch} on ${redactUrl(remoteUrl)}`);

    if (!opts.skipBuild) {
        console.log("▸ Building production bundle (npm run build)…");
        execSync("npm run build", { cwd, stdio: "inherit" });
    } else {
        console.log(`▸ Skipping build (--skip-build); using existing ${opts.dir}/`);
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "chemistry-game-pages-"));
    try {
        const files = prepareArtifacts(buildDir, tmpDir, { cname: opts.cname });
        const bundleBytes = fs.statSync(path.join(tmpDir, "bundle.min.js")).size;
        const bundleSizeKiB = (bundleBytes / 1024).toFixed(1);
        console.log(`▸ Prepared ${files.length} files (${files.join(", ")}) — bundle ${bundleSizeKiB} KiB`);

        // Initialize an isolated temporary Git repository so the working tree
        // and checked-out branch of the main repository are never altered.
        execFileSync("git", ["init"], { cwd: tmpDir, stdio: "ignore" });
        execFileSync("git", ["checkout", "-b", opts.branch], { cwd: tmpDir, stdio: "ignore" });

        const userName =
            gitOutput(["config", "user.name"], cwd) ||
            env.GIT_AUTHOR_NAME ||
            env.GITHUB_ACTOR ||
            "github-actions[bot]";
        const userEmail =
            gitOutput(["config", "user.email"], cwd) ||
            env.GIT_AUTHOR_EMAIL ||
            "41898282+github-actions[bot]@users.noreply.github.com";

        execFileSync("git", ["config", "user.name", userName], { cwd: tmpDir, stdio: "ignore" });
        execFileSync("git", ["config", "user.email", userEmail], { cwd: tmpDir, stdio: "ignore" });

        execFileSync("git", ["add", "-A"], { cwd: tmpDir, stdio: "ignore" });
        const commitMessage =
            opts.message || `Deploy production build from ${sourceSha}`;
        execFileSync("git", ["commit", "-m", commitMessage], { cwd: tmpDir, stdio: "ignore" });
        const deployCommitSha = gitOutput(["rev-parse", "--short", "HEAD"], tmpDir);

        if (opts.dryRun) {
            console.log(
                `✓ [dry-run] Created build commit ${deployCommitSha} for refs/heads/${opts.branch} ` +
                `(${files.length} files). Skipping remote push and Pages API.`
            );
            const pagesUrl = opts.cname
                ? `https://${opts.cname}/`
                : ghRepo
                ? ghRepo.pagesUrl
                : "";
            writeStepSummary(
                { branch: opts.branch, commitSha: sourceSha, files, bundleSizeKiB, pagesUrl, dryRun: true },
                env
            );
            return {
                dryRun: true,
                branch: opts.branch,
                sourceSha,
                deployCommitSha,
                files,
                pagesUrl
            };
        }

        const pushUrl = buildAuthenticatedPushUrl(remoteUrl, env);
        console.log(`▸ Pushing build commit ${deployCommitSha} to ${opts.remote} (${opts.branch})…`);
        execFileSync(
            "git",
            ["push", "--force", pushUrl, `HEAD:refs/heads/${opts.branch}`],
            { cwd: tmpDir, stdio: ["ignore", "pipe", "pipe"] }
        );
        console.log(`✓ Pushed production build to branch "${opts.branch}".`);

        let pagesUrl = opts.cname
            ? `https://${opts.cname}/`
            : ghRepo
            ? ghRepo.pagesUrl
            : "";
        let pagesResult = null;

        if (!opts.skipPages && ghRepo) {
            pagesResult = await publishGitHubPages(
                {
                    owner: ghRepo.owner,
                    repo: ghRepo.repo,
                    branch: opts.branch,
                    cname: opts.cname,
                    pagesUrl
                },
                env
            );
            if (pagesResult && pagesResult.url) {
                pagesUrl = pagesResult.url;
            }
        } else if (opts.skipPages) {
            console.log("▸ Skipping GitHub Pages API configuration (--skip-pages).");
        }

        writeStepSummary(
            { branch: opts.branch, commitSha: sourceSha, files, bundleSizeKiB, pagesUrl, dryRun: false },
            env
        );

        return {
            dryRun: false,
            branch: opts.branch,
            sourceSha,
            deployCommitSha,
            files,
            pagesUrl,
            pagesResult
        };
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

if (require.main === module) {
    let opts;
    try {
        opts = parseArgs();
    } catch (err) {
        console.error(`✖ ${err.message}`);
        printHelp();
        process.exit(1);
    }

    if (opts.help) {
        printHelp();
        process.exit(0);
    }

    deploy(opts).catch(err => {
        console.error(`✖ Deployment failed: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    parseArgs,
    parseGitHubRepo,
    prepareArtifacts,
    deploy
};
