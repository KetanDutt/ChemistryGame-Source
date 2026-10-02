// Test runner: bundles tests/testEntry.js with the project's own webpack
// setup, executes it in headless Chromium and reports the results.
//
// Browser resolution order: $CHROME_PATH, then common system paths.
// (The sandbox Chromium from @sparticuz needs LD_LIBRARY_PATH=/tmp/chr/lib;
//  the runner wires that up automatically when that binary is used.)
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

console.log("▸ bundling test entry (webpack)…");
execSync("npx webpack --config webpack/test.js", { cwd: root, stdio: "inherit" });

const html = path.join(root, "dist-test", "index.html");
fs.writeFileSync(html, "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><script src=\"test-bundle.js\"></script></body></html>");

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
if (!chrome) {
    console.error("✖ No Chromium/Chrome binary found. Install one or set CHROME_PATH.");
    process.exit(2);
}

const puppeteer = require("puppeteer-core");

(async () => {
    const env = { ...process.env };
    if (chrome.startsWith("/tmp/chr")) env.LD_LIBRARY_PATH = ["/tmp/chr/lib", env.LD_LIBRARY_PATH].filter(Boolean).join(":");

    const browser = await puppeteer.launch({
        executablePath: chrome,
        headless: "new",
        env,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
            "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    });
    const page = await browser.newPage();
    page.on("pageerror", e => console.error("  [page error]", e.message));
    await page.goto("file://" + html, { waitUntil: "load" });
    await page.waitForFunction("window.__TEST_RESULTS__ !== undefined", { timeout: 30000 });
    const results = await page.evaluate(() => window.__TEST_RESULTS__);
    await browser.close();

    let failed = 0;
    results.forEach(r => {
        if (r.pass) console.log(`  ✓ ${r.name}`);
        else { failed++; console.error(`  ✖ ${r.name}\n      ${r.error}`); }
    });
    console.log(`${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
})().catch(e => {
    console.error("✖ runner failed:", e.message);
    process.exit(2);
});
