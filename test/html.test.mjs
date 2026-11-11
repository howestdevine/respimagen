import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import sharp from "sharp";
import { htmlGenerator } from "../utils.js";

const file = (source, size, ext, height = size / 2) => ({
  source,
  file: `${source}-${size}.${ext}`,
  ext,
  size,
  height,
});

test("htmlGenerator: one filetype gives a plain img", () => {
  const out = htmlGenerator([file("beach", 500, "avif"), file("beach", 1000, "avif")]);

  assert.equal(
    out,
    '<img src="beach-1000.avif" srcset="beach-500.avif 500w, beach-1000.avif 1000w" sizes="100vw" width="1000" height="500" alt="">'
  );
});

test("htmlGenerator: several filetypes give a picture, last type on the img", () => {
  const out = htmlGenerator(
    [
      file("beach", 500, "avif"),
      file("beach", 1000, "avif"),
      file("beach", 500, "webp"),
      file("beach", 500, "jpeg"),
      file("beach", 1000, "jpeg"),
    ],
    "src/img/"
  );

  const lines = out.split("\n");
  assert.equal(lines[0], "<picture>");
  assert.match(lines[1], /<source type="image\/avif" srcset="src\/img\/beach-500\.avif 500w, src\/img\/beach-1000\.avif 1000w"/);
  assert.match(lines[2], /<source type="image\/webp"/);
  assert.match(lines[3], /<img src="src\/img\/beach-1000\.jpeg" srcset="src\/img\/beach-500\.jpeg 500w, src\/img\/beach-1000\.jpeg 1000w"/);
  assert.equal(lines.at(-1), "</picture>");
});

test("htmlGenerator: one block per source image", () => {
  const out = htmlGenerator([file("a", 100, "png"), file("b", 100, "png")]);

  assert.equal(out.split("\n\n").length, 2);
  assert.match(out, /src="a-100\.png"/);
  assert.match(out, /src="b-100\.png"/);
});

test("htmlGenerator returns empty string for empty input", () => {
  assert.equal(htmlGenerator([]), "");
});

test("CLI prints the snippet, and --quiet suppresses it", async () => {
  const dir = path.join(process.cwd(), "test-fixtures-html");
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  const input = path.join(dir, "pic.png");
  await sharp({ create: { width: 200, height: 100, channels: 3, background: "#36c" } })
    .png()
    .toFile(input);

  const run = (...extra) =>
    new Promise((resolve, reject) =>
      execFile(
        process.execPath,
        ["index.js", input, "-s", "100,200", "-t", "webp,png", "-o", path.join(dir, "out"), ...extra],
        (err, stdout) => (err ? reject(err) : resolve(stdout))
      )
    );

  const loud = await run();
  assert.match(loud, /<picture>/);
  assert.match(loud, /width="200" height="100"/);

  const quiet = await run("--quiet");
  assert.doesNotMatch(quiet, /<picture>/);
  assert.match(quiet, /Everything done/);

  await fs.rm(dir, { recursive: true, force: true });
});
