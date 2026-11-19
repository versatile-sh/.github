# scripts

## build-assets.mjs

Builds the images of the organization profile and of the social accounts in the site's identity (ink and paper, lime accent, Instrument Serif with JetBrains Mono, 64px grid and light from the top). Every text is drawn as outlines, so GitHub shows the SVGs exactly as designed without web fonts.

```
node scripts/build-assets.mjs
```

| Needs | Why |
| --- | --- |
| A built checkout of the site at `../versatile.sh` (`pnpm install && pnpm build` there), or `SITE_DIR=/path/to/site` | Fonts come from its `out/_next/static/media/*.woff2`, found by family name; `fontkit` comes from its `node_modules` |
| `rsvg-convert` (librsvg) | Renders the PNGs |

| Output | What |
| --- | --- |
| `profile/assets/*-{dark,light}.svg` | Banner, logo, section dividers and footer for the profile README (`<picture>` with `prefers-color-scheme`) |
| `social/*.png` | Avatar, X and Bluesky headers, GitHub social preview, three Instagram cards (dark only) |
| `social/preview.png` | Contact sheet of everything, for review |

Copy and colours live at the top of the script (`THEME`, `CARDS`, `THESIS`); change them there and run it again. The outputs are generated: never edit them by hand.
