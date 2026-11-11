import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import sharp from "sharp";
import test from "node:test";
import assert from "node:assert/strict";

const tmpDir = path.join(process.cwd(), "test", "tmp-dir");
const fixturesDir = path.join(process.cwd(), "test", "fixtures-dir");

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

test("integration CLI directory", async () => {
  await ensureDir(tmpDir);
  await ensureDir(fixturesDir);

  const inputDir = fixturesDir;
  const outDir = path.join(tmpDir, "output");

  // create two tiny images
  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 0, g: 255, b: 0 },
    },
  })
    .png()
    .toFile(path.join(inputDir, "a.png"));

  await sharp({
    create: {
      width: 150,
      height: 150,
      channels: 3,
      background: { r: 0, g: 0, b: 255 },
    },
  })
    .png()
    .toFile(path.join(inputDir, "b.png"));

  const nodeBin = process.execPath;
  const cliArgs = [
    "index.js",
    inputDir,
    "-s",
    "50",
    "-t",
    "jpeg",
    "-o",
    outDir,
    "-c",
  ];

  const { stdout } = await run(nodeBin, cliArgs);
  assert.match(stdout, /Everything done/);

  const expectedFiles = [
    path.join(outDir, "a-50.jpeg"),
    path.join(outDir, "b-50.jpeg"),
  ];
  for (const f of expectedFiles) {
    const stat = await fs.stat(f);
    assert.ok(stat.isFile());
  }

  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  await fs.rm(fixturesDir, { recursive: true, force: true }).catch(() => {});
});
