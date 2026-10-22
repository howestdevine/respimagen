# Responsive Images Generator

This is a Node.js script and library that generates responsive images for your website. It uses the [sharp](https://sharp.pixelplumbing.com/) image processing library.

Feel free to use it and modify it to your needs.

## Installation

Use it via npx:

```bash
npx respimagen
```

or install it globally using npm:

```bash
npm install -g respimagen
```

### Show help

```bash
respimagen --help
```

## Usage

```bash
respimagen <input> -s [sizes] -t [filetypes] -o [outputdir] -c [clear]
```

### Options

``` bash
Positional Arguments:
  input            file or directory to process                       [required]

Options:
      --help       Show help                                           [boolean]
      --version    Show version number                                 [boolean]
  -s, --sizes      different sizes to generate, separated by comma. If omitted,
                   keeps original size                               [optional]
  -t, --filetypes  different filetypes to generate, separated by comma
                   Supported: avif, webp, jpeg, jpg, png
                                                             [default: "avif"]
  -o, --outputdir  output directory                           [default: "output"]
  -c               clear the output directory before processing, default false
                                                      [boolean] [default: false]
  -q, --quiet      don't print the HTML snippet       [boolean] [default: false]

```

## The HTML snippet

After every run, respimagen prints markup you can paste straight into your HTML: one block per
source image, with the paths starting from the output directory.

```bash
respimagen beach.jpg -s 500,1000 -t avif,jpeg -o img
```

```html
<picture>
  <source type="image/avif" srcset="img/beach-500.avif 500w, img/beach-1000.avif 1000w" sizes="100vw">
  <img src="img/beach-1000.jpeg" srcset="img/beach-500.jpeg 500w, img/beach-1000.jpeg 1000w" sizes="100vw" width="1000" height="666" alt="">
</picture>
```

- One filetype gives a plain `<img>`. Several give a `<picture>`: a `<source>` per type, and the
  **last** type in `-t` goes on the `<img>` as the fallback. So list them from best to safest:
  `-t avif,webp,jpeg`.
- `width` and `height` are those of the largest file, so the browser reserves the right space.
- Two things are left to you: write the `alt` text, and replace `sizes="100vw"` with the width the
  image really gets in your layout. Respimagelint (<https://ausi.github.io/respimagelint/>) measures it.

## Examples

Resize and convert beach.jpg to 500px and 750px in webp and avif format.

```bash
  respimagen beach.jpg -s 500,750 -t webp,avif
```

Convert all images to avif, keeping original dimensions

```bash
  respimagen  ./photos
```

 Process all images with multiple sizes (avif format)

```bash
  respimagen ./photos -s 300,500,700
```

Process all images with multiple sizes and formats, clearing output first

```bash
  respimagen ./photos -s 300,500,700 -t webp,avif -o output -c
```

## Programmatic Usage

You can also import and use the core functionality in your own Node.js projects:

```javascript
import { processPath } from './lib/processor.js';

// Process a single image
const result = await processPath('photo.jpg', {
  sizes: [400, 800, 1200],
  filetypes: 'webp,avif',
  outputdir: 'dist',
  clear: true
});

console.log(result.output); // Array of processed files
console.log(result.srcset); // Srcset string for responsive images
console.log(result.html); // The same snippet the CLI prints

// Process a directory
const dirResult = await processPath('./images', {
  sizes: [300, 500, 700],
  filetypes: 'avif,jpeg',
  outputdir: 'output'
});
```

## Testing

Run the test suite with:

```bash
npm test
```

## Dependencies

- **sharp** (^0.35.5): Image processing
- **yargs** (^18.2.0): CLI argument parsing

Requires Node.js 20.9 or later.
