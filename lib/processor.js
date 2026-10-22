import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { srcsetGenerator, htmlGenerator } from "../utils.js";

const defaultFiletypeSettings = [
  { id: "avif" },
  { id: "webp" },
  { id: "jpeg", options: { mozjpeg: true } },
  { id: "jpg", options: { mozjpeg: true } },
  { id: "png" },
];

// describe one written file; sharp's info carries the real dimensions
const describe = (source, file, ext, info) => ({
  source,
  file,
  ext,
  size: info.width,
  height: info.height,
});

/**
 * Process a file or directory and generate resized/converted images.
 * @param {string} input - path to file or directory
 * @param {object} options - { sizes: number[]|null, filetypes: string|array, outputdir: string, clear: boolean }
 * @returns {Promise<{ output: Array, srcset?: string, html: string }>} resolves when processing finished
 */
export async function processPath(input, options = {}) {
  const queue = [];

  const sizes = Array.isArray(options.sizes) ? options.sizes : [];
  const filetypesRaw = options.filetypes || "avif,jpeg";
  const outputdir = options.outputdir || "output";
  const clear = !!options.clear;

  const formats = (
    typeof filetypesRaw === "string" ? filetypesRaw.split(",") : filetypesRaw
  ).map((f) =>
    defaultFiletypeSettings.find(
      (df) => df.id.toLowerCase() === String(f).toLowerCase()
    )
  );

  // validate formats
  if (formats.some((f) => !f)) {
    const bad = (
      typeof filetypesRaw === "string" ? filetypesRaw.split(",") : filetypesRaw
    ).filter(
      (f) =>
        !defaultFiletypeSettings.find(
          (df) => df.id.toLowerCase() === String(f).toLowerCase()
        )
    );
    throw new Error(`Unknown filetypes: ${bad.join(",")}`);
  }

  // resolve input
  const inputPath = path.resolve(input);
  let files = [];
  const stats = await fs.stat(inputPath);
  if (stats.isFile()) files.push(inputPath);
  else if (stats.isDirectory()) {
    const rawDirFils = await fs.readdir(inputPath);
    const directoryFiles = rawDirFils.map((file) =>
      path.join(inputPath, file)
    );
    const checks = await Promise.all(
      directoryFiles.map(async (file) => {
        try {
          const check = await fs.lstat(file);
          return { file, isFile: check.isFile() };
        } catch {
          return { file, isFile: false };
        }
      })
    );
    files = checks.filter((c) => c.isFile).map((c) => c.file);
  } else {
    throw new Error(`${inputPath} is neither a file nor a directory`);
  }

  if (clear) {
    await fs.rm(outputdir, { recursive: true, force: true });
  }

  await fs.mkdir(outputdir, { recursive: true });

  for (const file of files) {
    const filename = path.basename(file, path.extname(file));
    const image = sharp(file);

    for (const format of formats) {
      if (sizes.length > 0) {
        for (const size of sizes) {
          const name = `${filename}-${size}.${format.id}`;
          queue.push(
            image
              .clone()
              .resize({ width: size })
              .toFormat(format.id, format.options)
              .toFile(`${outputdir}/${name}`)
              .then((info) => describe(filename, name, format.id, info))
          );
        }
      } else {
        // no sizes -> keep original width
        const name = `${filename}.${format.id}`;
        queue.push(
          image
            .clone()
            .toFormat(format.id, format.options)
            .toFile(`${outputdir}/${name}`)
            .then((info) => describe(filename, name, format.id, info))
        );
      }
    }
  }

  // Promise.all keeps queue order, so the output (and the srcset) follows
  // file, format and size order instead of whichever encode finished first
  const output = await Promise.all(queue);

  const result = { output, html: htmlGenerator(output, outputdir) };
  if (sizes.length !== 0) result.srcset = srcsetGenerator(output);
  return result;
}

export default { processPath };
