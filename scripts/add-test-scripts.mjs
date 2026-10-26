// Adds the test / check scripts to package.json (safe to run more than once):  node scripts/add-test-scripts.mjs
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(file, "utf8"));
const scripts = {
  typecheck: "next typegen && tsc --noEmit",
  test: "vitest run",
  "test:integration": "node tests/run-integration.mjs",
  "test:e2e": "playwright test",
  check: "npm run typecheck && npm run lint && npm test",
};
pkg.scripts = { ...pkg.scripts, ...Object.fromEntries(Object.entries(scripts).filter(([name]) => !(name in (pkg.scripts ?? {})))) };
writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
console.log("package.json scripts:", Object.keys(pkg.scripts).join(", "));

// Older copies of this script wrote "tsc --noEmit". That fails when .next holds types of deleted pages, so upgrade it.
if (pkg.scripts.typecheck === "tsc --noEmit") {
  pkg.scripts.typecheck = scripts.typecheck;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  console.log("typecheck script upgraded");
}
