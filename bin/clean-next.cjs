/**
 * Removes `.next` before `next dev` so webpack never serves stale chunk references
 * (unstyled HTML, "Cannot find module './682.js'", 404 on /_next/static/...).
 * `npm run dev` runs this every time; use `npm run dev:fast` to skip (riskier).
 */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(__dirname, "..", ".next");
try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("[clean-next] Removed .next (fresh dev build)");
} catch (e) {
  if (e && e.code !== "ENOENT") console.error("[clean-next]", e);
}
