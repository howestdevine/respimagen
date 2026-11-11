import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import sharp from "sharp";
import test from "node:test";
import assert from "node:assert/strict";

const tmpDir = path.join(process.cwd(), "test", "tmp");
const fixturesDir = path.join(process.cwd(), "test", "fixtures");

const run = (file, args) =>
  new Promise((resolve, reject) => {
    execFile(file, args, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) return reject({ err, stdout, stderr });
      resolve({ stdout, stderr });
    });
  });

const ensureDir = async (d) => {
  await fs.rm(d, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(d, { recursive: true });
};

test("integration CLI single file", async () => {
  await ensureDir(tmpDir);
  await ensureDir(fixturesDir);

  const inputImage = path.join(fixturesDir, "test.png");
  const outDir = path.join(tmpDir, "output");

  // create a tiny 200x200 red PNG
  await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toFile(inputImage);

  const nodeBin = process.execPath;
  const cliArgs = [
    "index.js",
    inputImage,
    "-s",
    "100",
    "-t",
    "jpeg",
    "-o",
    outDir,
    "-c",
  ];

  const { stdout } = await run(nodeBin, cliArgs);
  assert.match(stdout, /Everything done/);

  const expectedFile = path.join(outDir, "test-100.jpeg");
  const stat = await fs.stat(expectedFile);
  assert.ok(stat.isFile());

  // cleanup
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  await fs.rm(fixturesDir, { recursive: true, force: true }).catch(() => {});
});

test("integration CLI accepts width×height sizes", async () => {
  await ensureDir(tmpDir);
  await ensureDir(fixturesDir);

  const inputImage = path.join(fixturesDir, "test.png");
  const outDir = path.join(tmpDir, "output");

  // create a tiny 200x200 red PNG
  await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toFile(inputImage);

  const nodeBin = process.execPath;
  const cliArgs = [
    "index.js",
    inputImage,
    "-s",
    "70×50, 40×20",
    "-t",
    "jpeg",
    "-o",
    outDir,
    "-c",
  ];

  const { stdout } = await run(nodeBin, cliArgs);
  assert.match(stdout, /Everything done/);

  const expectedFiles = [
    path.join(outDir, "test-70.jpeg"),
    path.join(outDir, "test-40.jpeg"),
  ];
  for (const f of expectedFiles) {
    const stat = await fs.stat(f);
    assert.ok(stat.isFile());
  }

  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  await fs.rm(fixturesDir, { recursive: true, force: true }).catch(() => {});
});
