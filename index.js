#!/usr/bin/env node
import yargs from "yargs";
import { processPath } from "./lib/processor.js";

const argv = yargs(process.argv.slice(2))
  .usage(
    "Usage: $0 <input> -s [sizes] -t [filetypes] -o [outputdir] -c [clear]"
  )
  .command("$0 <input>", "Process image(s)", (yargs) => {
    yargs.positional("input", {
      describe: "file or directory to process",
      type: "string",
    });
  })
  .alias("s", "sizes")
  .alias("t", "filetypes")
  .alias("o", "outputdir")
  .describe(
    "s",
    "different sizes to generate, separated by comma. If omitted, keeps original size"
  )
  .describe(
    "t",
    "different filetypes to generate, separated by comma. Supported: avif, webp, jpeg, jpg, png"
  )
  .describe("c", "clear the output directory before processing, default false")
  .boolean("c")
  .alias("q", "quiet")
  .describe("q", "don't print the HTML snippet")
  .boolean("q")
  .default({
    filetypes: "avif",
    outputdir: "output",
    c: false,
    q: false,
  })
  .example(
    "$0 beach.jpg -s 500,750 -t webp,avif",
    "Resize and convert beach.jpg to 500px and 750px in webp and avif format"
  )
  .example(
    "$0 ./photos",
    "Convert all images in photos directory to avif (original size)"
  )
  .example(
    "$0 ./photos -s 300,500,700",
    "Process all images in the photos directory to avif with multiple sizes"
  ).argv;

const { input, outputdir } = argv;
const sizes = [];

const parseSize = (value) => {
  const str = String(value).trim();
  const match = str.match(/^(\d+)(?:\s*[x×]\s*\d+)?$/i);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

if (argv.sizes) {
  // yargs may parse a single numeric size as Number (e.g. -s 100),
  // so coerce to string before splitting to avoid calling .split on a Number.
  const sizesRaw =
    typeof argv.sizes === "string" ? argv.sizes : String(argv.sizes);
  sizes.push(
    ...sizesRaw
      .split(",")
      .map((s) => parseSize(s))
      .filter((s) => s !== null)
  );
}

const options = {
  sizes: sizes.length > 0 ? sizes : null,
  filetypes: argv.filetypes,
  outputdir,
  clear: argv.c,
};

try {
  const result = await processPath(input, options);

  // Log results
  for (const item of result.output) {
    console.log(`✅ ${item.file} - ${item.size}`);
  }

  console.log("Everything done");

  if (result.html && !argv.quiet) {
    console.log(`\n${result.html}\n`);
    console.log(
      `Paste it, then: write the alt text, and replace sizes="100vw" with the width the image really gets (respimagelint tells you). Paths start from where you ran this command.`
    );
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
