# Respimagen - AI Coding Agent Instructions

## Project Overview

Respimagen is a Node.js CLI tool and library for batch image processing. It resizes images to multiple sizes and converts them to various formats (AVIF, WebP, JPEG, PNG) using Sharp, then generates responsive image srcset strings.

## Architecture

### Core Module (`lib/processor.js`)

- **Exports**: `processPath(input, options)`
  - `input`: string - file path or directory
  - `options`: object with `{ sizes, filetypes, outputdir, clear }`
  - Returns: `Promise<{ output: Array, srcset?: string, html: string }>`
- Contains all image processing logic using Sharp
- Handles both single files and directories
- Validates filetypes and throws errors for unknown formats
- Can be imported and used programmatically

### CLI Runner (`index.js`)

- Thin wrapper around `lib/processor.js`
- Uses yargs for argument parsing with positional input argument
- Calls `processPath()` and logs results
- Executable with Node.js: `node index.js <input> ...`

### Utilities (`utils.js`)

- **Exports**: `srcsetGenerator(files)`
  - Groups files by extension
  - Formats srcset strings for responsive images
  - Filters invalid entries (missing ext/size)
- **Exports**: `htmlGenerator(files, basePath)`
  - Builds the `<img>` / `<picture>` snippet the CLI prints, one block per source image

### CLI Wrapper (`bin/respimagen.mjs`)

- Shebang wrapper for npm bin exposure
- Spawns `node index.js` with forwarded arguments
- Enables global `respimagen` command via npm

## Key Conventions

### ESM Only

- `package.json` has `"type": "module"`
- All imports use ESM syntax
- Use `.mjs` extension for bin scripts

### Image Processing

- Sizes are optional - if not specified, keeps original dimensions
- Default format: `avif` (modern, efficient format)
- Supported formats: `avif`, `webp`, `jpeg`, `jpg`, `png`
- Output directory: `output/` (configurable)
- File naming with sizes: `{basename}-{size}.{ext}`
- File naming without sizes: `{basename}.{ext}`

### Testing

- Uses Node's built-in test runner (`node:test`)
- Run with: `npm test`
- Integration tests: spawn CLI and verify file output
- Unit tests: directly import and test `processPath()` and `srcsetGenerator()`
- Format tests: verify all supported formats (avif, webp, jpeg, jpg, png) work correctly
- Test fixtures use temporary directories, cleaned up after each test

## Common Tasks

### Running the CLI

```bash
# Single file with multiple formats
node index.js image.jpg -s 500,750 -t webp,avif

# Directory with default avif format
node index.js ./photos -s 300,500,700

# Simplest: just convert to avif, keep original size
node index.js ./photos

# Via wrapper
node bin/respimagen.mjs image.jpg
```

### Running Tests

```bash
npm test
```

### Using Programmatically

```javascript
import { processPath } from "./lib/processor.js";

const result = await processPath("photo.jpg", {
  sizes: [400, 800],
  filetypes: "webp,avif",
  outputdir: "dist",
  clear: true,
});

console.log(result.output); // Array of processed files
console.log(result.srcset); // Srcset string
```

## Known Issues & Gotchas

### Async Array Methods

- **Fixed**: Previously used async predicate in `Array.filter()` which returned promises
- Now uses `Promise.all()` with map+filter pattern for async directory checks

### CLI Argument Parsing

- yargs may parse numeric sizes as numbers
- Always coerce `argv.sizes` to string before calling `.split()`

### File Validation

- `srcsetGenerator` filters invalid entries (missing ext/size, non-numeric size)
- `processPath` validates filetypes and throws clear errors for unknown formats

### Output Directory

- Use `{ force: true }` with `fs.rm()` to handle non-existent directories
- Always create output dir with `{ recursive: true }`

## Dependencies

- **sharp** (^0.34.4): Image processing
- **yargs** (^18.0.0): CLI argument parsing
- **eslint**: Code linting (devDep)

## Next Steps / TODOs

- Add concurrency limiting for large directories (e.g., p-limit)
- Add GitHub Actions CI to run tests on PRs
- Consider additional format validation
- Add benchmarks for performance testing
