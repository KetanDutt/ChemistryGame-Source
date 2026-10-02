// Test runner: bundles tests/testEntry.js with the project's own webpack
// setup, executes it in headless Chromium (or a Node VM fallback when no
// browser binary is installed), and runs integration checks for the
// build-to-branch / GitHub Pages deployment system (scripts/deploy.js).
const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

console.log("▸ bundling test entry (webpack)…");
execSync("npx webpack --config webpack/test.js", { cwd: root, stdio: "inherit" });

const bundlePath = path.join(root, "dist-test", "test-bundle.js");
const html = path.join(root, "dist-test", "index.html");
fs.writeFileSync(
    html,
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><script src=\"test-bundle.js\"></script></body></html>"
);

let chrome = process.env.CHROME_PATH || "";
if (!chrome || !fs.existsSync(chrome)) {
    chrome = [
        "/tmp/chr/chromium",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable"
    ].find(p => fs.existsSync(p)) || "";
}

async function runBundleTests() {
    if (chrome) {
        const puppeteer = require("puppeteer-core");
        const env = { ...process.env };
        if (chrome.startsWith("/tmp/chr")) {
            env.LD_LIBRARY_PATH = ["/tmp/chr/lib", env.LD_LIBRARY_PATH].filter(Boolean).join(":");
        }

        const browser = await puppeteer.launch({
            executablePath: chrome,
            headless: "new",
            env,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--use-gl=angle",
                "--use-angle=swiftshader",
                "--enable-unsafe-swiftshader"
            ]
        });
        const page = await browser.newPage();
        page.on("pageerror", e => console.error("  [page error]", e.message));
        await page.goto("file://" + html, { waitUntil: "load" });
        await page.waitForFunction("window.__TEST_RESULTS__ !== undefined", { timeout: 30000 });
        const results = await page.evaluate(() => window.__TEST_RESULTS__);
        await browser.close();
        return results;
    }

    console.log("▸ no Chromium binary found; executing webpack test bundle in Node VM…");
    const code = fs.readFileSync(bundlePath, "utf8");
    const sandbox = { window: {}, console, Math, JSON, Number, Set, Object, Array, Error, String };
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox.window;
    vm.runInNewContext(code, sandbox, { filename: "test-bundle.js" });
    if (!Array.isArray(sandbox.window.__TEST_RESULTS__)) {
        throw new Error("test-bundle.js did not populate window.__TEST_RESULTS__");
    }
    return sandbox.window.__TEST_RESULTS__;
}

async function runDeployTests() {
    const { parseArgs, parseGitHubRepo, deploy } = require("../scripts/deploy");
    const results = [];

    async function check(name, fn) {
        try {
            await fn();
            results.push({ name, pass: true });
        } catch (e) {
            results.push({ name, pass: false, error: String(e && e.message) });
        }
    }

    await check("deploy: parseArgs() parses CLI flags and environment defaults", () => {
        const d = parseArgs([], {});
        if (d.branch !== "gh-pages" || d.remote !== "origin" || d.dir !== "dist") {
            throw new Error(`unexpected defaults: ${JSON.stringify(d)}`);
        }
        const custom = parseArgs(
            ["--branch", "release-pages", "--remote=upstream", "--cname", "chem.example.com", "--skip-build", "--dry-run"],
            {}
        );
        if (
            custom.branch !== "release-pages" ||
            custom.remote !== "upstream" ||
            custom.cname !== "chem.example.com" ||
            !custom.skipBuild ||
            !custom.dryRun
        ) {
            throw new Error(`unexpected parsed args: ${JSON.stringify(custom)}`);
        }
    });

    await check("deploy: parseGitHubRepo() resolves owner, repo and GitHub Pages URL", () => {
        const httpsInfo = parseGitHubRepo("https://github.com/KetanDutt/ChemistryGame-Source.git", {});
        if (
            !httpsInfo ||
            httpsInfo.owner !== "KetanDutt" ||
            httpsInfo.repo !== "ChemistryGame-Source" ||
            httpsInfo.pagesUrl !== "https://ketandutt.github.io/ChemistryGame-Source/"
        ) {
            throw new Error(`bad HTTPS repo parse: ${JSON.stringify(httpsInfo)}`);
        }
        const sshInfo = parseGitHubRepo("git@github.com:KetanDutt/ChemistryGame-Source.git", {});
        if (!sshInfo || sshInfo.pagesUrl !== "https://ketandutt.github.io/ChemistryGame-Source/") {
            throw new Error(`bad SSH repo parse: ${JSON.stringify(sshInfo)}`);
        }
    });

    await check("deploy: pushes production build to target branch without altering working branch", async () => {
        const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "chemgame-deploy-test-"));
        try {
            const bareRemote = path.join(tmpRoot, "remote.git");
            const mockBuild = path.join(tmpRoot, "dist");
            execFileSync("git", ["init", "--bare", bareRemote], { stdio: "ignore" });
            fs.mkdirSync(mockBuild, { recursive: true });
            fs.writeFileSync(path.join(mockBuild, "index.html"), "<!DOCTYPE html><html></html>");
            fs.writeFileSync(path.join(mockBuild, "bundle.min.js"), "console.log('chemistry-game');");

            const branchBefore = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
                cwd: root,
                encoding: "utf8"
            }).trim();

            const res = await deploy(
                {
                    branch: "gh-pages",
                    remote: bareRemote,
                    dir: mockBuild,
                    cname: "chemistry.example.org",
                    skipBuild: true,
                    skipPages: true,
                    cwd: root
                },
                {}
            );

            const branchAfter = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
                cwd: root,
                encoding: "utf8"
            }).trim();

            if (branchBefore !== branchAfter) {
                throw new Error(`working branch changed from ${branchBefore} to ${branchAfter}`);
            }

            const committedFiles = execFileSync(
                "git",
                ["--git-dir", bareRemote, "ls-tree", "--name-only", "refs/heads/gh-pages"],
                { encoding: "utf8" }
            )
                .trim()
                .split(/\r?\n/)
                .sort();

            const expected = [".nojekyll", "404.html", "CNAME", "bundle.min.js", "index.html"];
            if (JSON.stringify(committedFiles) !== JSON.stringify(expected)) {
                throw new Error(`expected files ${JSON.stringify(expected)} on gh-pages, got ${JSON.stringify(committedFiles)}`);
            }
            if (!res || res.branch !== "gh-pages" || !res.deployCommitSha) {
                throw new Error(`unexpected deploy result: ${JSON.stringify(res)}`);
            }
        } finally {
            fs.rmSync(tmpRoot, { recursive: true, force: true });
        }
    });

    return results;
}

(async () => {
    const bundleResults = await runBundleTests();
    const deployResults = await runDeployTests();
    const results = [...bundleResults, ...deployResults];

    let failed = 0;
    results.forEach(r => {
        if (r.pass) console.log(`  ✓ ${r.name}`);
        else {
            failed++;
            console.error(`  ✖ ${r.name}\n      ${r.error}`);
        }
    });
    console.log(`${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
})().catch(e => {
    console.error("✖ runner failed:", e.message);
    process.exit(2);
});
