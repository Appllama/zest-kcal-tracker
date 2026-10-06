# Asset provenance

This repository contains only the artwork used by Zest and its documentation. The original chat collection, reference recordings, comparison screenshots, rejected assets, unused starter icon, retired Unsplash photograph, and Chat 9's alternative snapshot are excluded.

| Location | Content | Origin |
| --- | --- | --- |
| `assets/cookbooks/zest/photos/` | Breakfast, lunch, dinner snapshots | Original generated images created October 4, 2026 with the built-in image generation tool. Exact retained prompts: [meal-photography.md](../prompts/meal-photography.md). Each is 1086 × 1448. |
| `assets/cookbooks/zest/stickers/` | Toast, bowl, pasta, orange, eggs | Original code-authored SVG illustrations for Zest. |
| `src/cookbooks/zest/components/Lemon.tsx` | Live lemon | Original Skia vector drawing. Its eyes, head, shoes and expression are articulated in code. No raster mascot or reference-app art. |
| `assets/images/icon.svg` and `icon.png` | Resting lemon mark | Original vector adaptation of the live lemon, exported at 1024 × 1024 through macOS Quick Look. The SVG is the editable source. |
| `docs/images/` | Welcome, reply, calendar, keyboard previews and walkthrough | Direct captures of the standalone Release app on iPhone 17 Pro / iOS 27. The walkthrough uses real native input, normal playback speed, and the original 1206 × 2622 aspect ratio, encoded at 60 fps. |

The meal images depict fictional meals, not an actual user's photographs. Calorie and protein estimates are local sample fixtures, not measured nutrition or image-analysis results. The same generated image follows the sample viewfinder, capture review, chat photo, receipt, and diary miniature.

`asset-manifest.json` records each retained asset's bytes and SHA-256. `npm test` verifies those files and detects unlisted artwork. Regenerate after an intentional change with `node scripts/asset-manifest.mjs`. The vector icon is retained as editable source; the app config loads its PNG export.

No image-generation credentials or local generation paths are required or shipped. The generated images are supplied as sample assets; this project does not assert exclusivity or copyright eligibility for machine-generated output. Authored code and vectors are covered by the repository MIT license. Branding rights are separate.
