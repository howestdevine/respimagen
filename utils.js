const srcsetGenerator = (files) => {
  if (!Array.isArray(files) || files.length === 0) return "";

  // keep only valid entries with ext, file and numeric size
  const valid = files.filter(
    (f) => f && f.ext && f.file && Number.isFinite(Number(f.size))
  );

  if (valid.length === 0) return "";

  // group files by extension while preserving input order
  const groupedFiles = valid.reduce((acc, file) => {
    const ext = file.ext;
    if (!acc[ext]) acc[ext] = [];
    acc[ext].push(file);
    return acc;
  }, {});

  // generate srcset for each extension
  const srcsets = Object.values(groupedFiles).map(
    (files) =>
      `srcset="${files
        .map((file) => `${file.file} ${file.size}w`)
        .join(",\n")}"`
  );

  return srcsets.join("\n\n");
};

export { srcsetGenerator };

const mimeTypes = {
  avif: "image/avif",
  webp: "image/webp",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
};

// sizes can't be known from the files: it's the width of the slot in the layout
const SIZES_PLACEHOLDER = "100vw";

/**
 * Turn processed files into ready-to-paste markup, one block per source image.
 * One filetype gives an <img>; several give a <picture> with a <source> per
 * type and the last type on the <img>, so order -t from best to fallback.
 * @param {Array<{source, file, ext, size, height}>} files - processPath output
 * @param {string} [basePath] - prefixed to every file name in the markup
 * @returns {string}
 */
const htmlGenerator = (files, basePath = "") => {
  if (!Array.isArray(files) || files.length === 0) return "";

  const prefix = basePath ? `${basePath.replace(/\/+$/, "")}/` : "";
  const srcset = (group) =>
    group.map((f) => `${prefix}${f.file} ${f.size}w`).join(", ");

  // group by source image, then by extension, preserving input order
  const bySource = files.reduce((acc, file) => {
    const source = file.source ?? "";
    acc[source] ??= {};
    acc[source][file.ext] ??= [];
    acc[source][file.ext].push(file);
    return acc;
  }, {});

  const blocks = Object.values(bySource).map((byExt) => {
    const groups = Object.values(byExt);
    const fallback = groups.at(-1);
    const largest = fallback.reduce((a, b) => (b.size > a.size ? b : a));

    const img = [
      `<img src="${prefix}${largest.file}"`,
      `srcset="${srcset(fallback)}"`,
      `sizes="${SIZES_PLACEHOLDER}"`,
      `width="${largest.size}"`,
      Number.isFinite(largest.height) ? `height="${largest.height}"` : "",
      `alt="">`,
    ]
      .filter(Boolean)
      .join(" ");

    if (groups.length === 1) return img;

    const sources = groups
      .slice(0, -1)
      .map(
        (group) =>
          `  <source type="${mimeTypes[group[0].ext]}" srcset="${srcset(
            group
          )}" sizes="${SIZES_PLACEHOLDER}">`
      );

    return ["<picture>", ...sources, `  ${img}`, "</picture>"].join("\n");
  });

  return blocks.join("\n\n");
};

export { htmlGenerator };
