/**
 * Composite printer SVG artwork onto blank garment product photos.
 * Exact print files stay in public/shop/print; mockups in public/shop/products/{tees,hoodies}.
 *
 * Usage: node scripts/compose-shop-products.mjs
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const bases = path.join(root, "public/shop/products/bases");
const printDir = path.join(root, "public/shop/print");
const outTees = path.join(root, "public/shop/products/tees");
const outHoods = path.join(root, "public/shop/products/hoodies");

fs.mkdirSync(outTees, { recursive: true });
fs.mkdirSync(outHoods, { recursive: true });

/** Design families → print SVG + placement */
const DESIGNS = [
  { id: "gamer", print: "gamer-wordmark.svg", scale: 0.42, y: 0.34 },
  { id: "gamerholic", print: "gamerholic-wordmark.svg", scale: 0.48, y: 0.34 },
  { id: "gamerholic-prize", print: "gamerholic-wordmark-prize.svg", scale: 0.48, y: 0.34 },
  { id: "power-g", print: "power-g-mark.svg", scale: 0.14, y: 0.32, leftChest: true },
  { id: "i-win", print: "i-win-for-a-living.svg", scale: 0.4, y: 0.32 },
  { id: "host-earns", print: "host-earns.svg", scale: 0.42, y: 0.34 },
  { id: "fail-bank", print: "fail-bank.svg", scale: 0.4, y: 0.33 },
  { id: "escrow", print: "escrow-not-trust.svg", scale: 0.42, y: 0.35 },
  { id: "non-custodial", print: "non-custodial.svg", scale: 0.44, y: 0.35 },
  { id: "xft", print: "xfts-that-fight.svg", scale: 0.42, y: 0.32 },
  { id: "monitor", print: "game-monitor.svg", scale: 0.4, y: 0.33 },
  { id: "gg-wp", print: "gg-wp.svg", scale: 0.16, y: 0.32, leftChest: true },
  { id: "host-bps", print: "host-bps.svg", scale: 0.42, y: 0.35 },
  { id: "stack", print: "stack-quietly.svg", scale: 0.44, y: 0.55, back: true },
  { id: "eighteen", print: "eighteen-plus.svg", scale: 0.36, y: 0.32 },
];

/** Force installable fonts for rasterization (print SVGs keep Orbitron for printers). */
function svgForRaster(svgText) {
  return svgText
    .replace(
      /font-family="Orbitron[^"]*"/g,
      'font-family="Arial Black, Helvetica Neue, Arial, sans-serif"',
    )
    .replace(
      /font-family="Share Tech Mono[^"]*"/g,
      'font-family="Courier New, Courier, monospace"',
    )
    .replace(
      /font-family="Rajdhani[^"]*"/g,
      'font-family="Arial, Helvetica, sans-serif"',
    );
}

async function loadPrintPng(printFile, targetW) {
  const raw = fs.readFileSync(path.join(printDir, printFile), "utf8");
  const svg = svgForRaster(raw);
  return sharp(Buffer.from(svg))
    .resize({ width: targetW, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
}

async function composeOne({
  baseFile,
  design,
  outPath,
  view,
}) {
  const basePath = path.join(bases, baseFile);

  // Back-only designs: blank front/side; print only on back view
  if (design.back && view !== "back") {
    await sharp(basePath).jpeg({ quality: 90 }).toFile(outPath);
    return;
  }

  // Side views: only left-chest / micro prints (full chest would look wrong)
  if (view === "side" && !design.leftChest) {
    await sharp(basePath).jpeg({ quality: 90 }).toFile(outPath);
    return;
  }

  const base = sharp(basePath);
  const meta = await base.metadata();
  const W = meta.width || 1024;
  const H = meta.height || 1024;

  const printW = Math.round(W * design.scale);
  const { data: overlay, info } = await loadPrintPng(design.print, printW);

  let left = Math.round((W - info.width) / 2);
  if (design.leftChest) {
    left = Math.round(W * 0.28 - info.width / 2);
  }
  let top = Math.round(H * design.y);
  if (view === "back") {
    top = Math.round(H * (design.back ? 0.38 : 0.36));
  }

  await sharp(basePath)
    .composite([
      {
        input: overlay,
        left: Math.max(0, left),
        top: Math.max(0, Math.min(top, H - info.height)),
      },
    ])
    .jpeg({ quality: 90 })
    .toFile(outPath);
}

async function main() {
  const jobs = [];

  for (const design of DESIGNS) {
    // Tee front / back / side
    jobs.push(
      composeOne({
        baseFile: "tee-front.jpg",
        design,
        outPath: path.join(outTees, `${design.id}-front.jpg`),
        view: "front",
      }),
    );
    jobs.push(
      composeOne({
        baseFile: design.back ? "tee-back.jpg" : "tee-back.jpg",
        design: design.back
          ? design
          : { ...design, scale: design.scale * 0.85, y: 0.36 },
        outPath: path.join(outTees, `${design.id}-back.jpg`),
        view: "back",
      }),
    );
    jobs.push(
      composeOne({
        baseFile: "tee-side.jpg",
        design,
        outPath: path.join(outTees, `${design.id}-side.jpg`),
        view: "side",
      }),
    );

    // Hoodie front / back (pullover)
    jobs.push(
      composeOne({
        baseFile: "hoodie-front.jpg",
        design: { ...design, y: design.y + 0.02, scale: design.scale * 0.95 },
        outPath: path.join(outHoods, `${design.id}-front.jpg`),
        view: "front",
      }),
    );
    jobs.push(
      composeOne({
        baseFile: "hoodie-back.jpg",
        design: {
          ...design,
          y: 0.36,
          scale: design.scale * 0.9,
        },
        outPath: path.join(outHoods, `${design.id}-back.jpg`),
        view: "back",
      }),
    );

    // Zip hoodie front for zip products
    jobs.push(
      composeOne({
        baseFile: "hoodie-zip-front.jpg",
        design: {
          ...design,
          y: design.leftChest ? 0.3 : 0.34,
          scale: design.leftChest ? design.scale : design.scale * 0.9,
        },
        outPath: path.join(outHoods, `${design.id}-zip-front.jpg`),
        view: "front",
      }),
    );
  }

  // Run sequential to avoid sharp overload
  for (const j of jobs) {
    await j;
  }

  console.log(
    "Composed",
    DESIGNS.length,
    "designs × views →",
    outTees,
    outHoods,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
