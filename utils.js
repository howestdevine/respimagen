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
