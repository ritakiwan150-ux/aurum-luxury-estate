// Converts the scroll-animation frames (public/images/ezgif-frame-###.jpg) to WebP.
// Usage:   npm i -D sharp   &&   node scripts/optimize-frames.mjs
// Then add  NEXT_PUBLIC_SCROLL_FRAME_EXT=webp  to .env.local and restart `npm run dev`.
// The original JPGs are left untouched, so you can switch back at any time.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = path.resolve("public/images");
const quality = Number(process.env.WEBP_QUALITY ?? 72);

const files = (await readdir(dir)).filter((name) => /^ezgif-frame-\d+\.jpg$/i.test(name)).sort();
if (!files.length) {
  console.error(`No ezgif-frame-###.jpg files found in ${dir}`);
  process.exit(1);
}

let before = 0;
let after = 0;
for (const name of files) {
  const input = path.join(dir, name);
  const output = path.join(dir, name.replace(/\.jpg$/i, ".webp"));
  await sharp(input).webp({ quality, effort: 5 }).toFile(output);
  before += (await stat(input)).size;
  after += (await stat(output)).size;
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
console.log(`Converted ${files.length} frames: ${mb(before)} MB -> ${mb(after)} MB (${Math.round((1 - after / before) * 100)}% smaller)`);
console.log("Now set NEXT_PUBLIC_SCROLL_FRAME_EXT=webp in .env.local and restart the dev server.");
