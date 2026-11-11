import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { processPath } from "../lib/processor.js";

const testDir = path.join(process.cwd(), "test-fixtures-output");
const inputFile = path.join(testDir, "photo.png");
const outputdir = path.join(testDir, "output");

const setup = async () => {
  await fs.rm(testDir, { recursive: true, force: true });
  await fs.mkdir(testDir, { recursive: true });
  await sharp({
    create: { width: 400, height: 300, channels: 3, background: "#c33" },
  })
    .png()
    .toFile(inputFile);
};

test("output follows format and size order, whichever encode finishes first", async () => {
  await setup();
  const result = await processPath(inputFile, {
    sizes: [300, 100, 200],
    filetypes: "avif,jpeg",
    outputdir,
  });

  assert.deepEqual(
    result.output.map((o) => o.file),
    [
      "photo-300.avif",
      "photo-100.avif",
      "photo-200.avif",
      "photo-300.jpeg",
      "photo-100.jpeg",
      "photo-200.jpeg",
    ]
  );
  // heights come from the encoded file, keeping the 4:3 ratio
  assert.equal(result.output[1].height, 75);
  await fs.rm(testDir, { recursive: true, force: true });
});

test("without sizes, output names the file that was actually written", async () => {
  await setup();
  const result = await processPath(inputFile, { filetypes: "webp", outputdir });

  assert.equal(result.output[0].file, "photo.webp");
  assert.equal(result.output[0].size, 400);
  await fs.stat(path.join(outputdir, "photo.webp"));
  await fs.rm(testDir, { recursive: true, force: true });
});
