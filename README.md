## Meme Maker

Lightweight in-browser meme generator: pick a template (or upload your own image), add top/bottom text, resize it, and download the finished meme as a PNG. All text is rendered in classic meme style (white with a black border) using an HTML5 canvas.

### Features

- **Template selection**: Choose from a few built-in meme templates or upload any image from your computer.
- **Live preview**: See your meme update instantly as you type.
- **Resizable text**: Use the slider to adjust text size.
- **Classic styling**: White, bold text with a black outline for readability.
- **One-click download**: Export the final meme as a PNG image.

### How to run

- **Simplest**: Double-click `index.html` to open it in your browser.
- **Optional local server** (if you have Node.js):
  - Run `npm install -g serve` (once, globally), or use `npx serve .` inside this folder.
  - Open the provided local URL in your browser.

### Using your own templates from `assets/`

1. Put your template images in the `assets/` folder (jpg/png/webp all work).
2. Add them to `assets/manifest.json`.

Example `assets/manifest.json`:

```json
{
  "templates": [
    { "label": "My template", "src": "my-photo.jpg" },
    { "label": "Another one", "src": "another.png" }
  ]
}
```

Notes:

- If you open `index.html` directly (file://), some browsers block loading `assets/manifest.json`. If your `Assets folder` templates don’t show up, run via the **local server** option above.
- You can still use **Upload your own** at any time — it doesn’t depend on `assets/`.

