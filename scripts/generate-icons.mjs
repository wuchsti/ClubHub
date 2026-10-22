// One-off dev script to (re)generate public/icons/* from scripts/icon-src/icon.svg.
// Not part of the build/test pipeline. Requires Playwright's Chromium:
//   npx --yes playwright install chromium   (if not already available)
//   node scripts/generate-icons.mjs
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(__dirname, "icon-src/icon.svg"), "utf8");
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192, pad: 0, bg: null },
  { name: "icon-512.png", size: 512, pad: 0, bg: null },
  { name: "icon-maskable-512.png", size: 512, pad: 64, bg: "#171717" },
  { name: "apple-touch-icon.png", size: 180, pad: 0, bg: "#171717" },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const target of targets) {
  const inner = target.size - target.pad * 2;
  await page.setViewportSize({ width: target.size, height: target.size });
  await page.setContent(`
    <html>
      <body style="margin:0;width:${target.size}px;height:${target.size}px;background:${target.bg ?? "transparent"};display:flex;align-items:center;justify-content:center;">
        <div style="width:${inner}px;height:${inner}px;">${svg}</div>
      </body>
    </html>
  `);
  const buffer = await page.screenshot({ omitBackground: !target.bg });
  writeFileSync(join(outDir, target.name), buffer);
  console.log("wrote", target.name);
}

await browser.close();
