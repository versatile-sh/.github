// Builds the profile (SVG) and social (PNG) images of versatile.sh from the site's own built fonts, every text drawn as outlines.
// Run `node scripts/build-assets.mjs`; SITE_DIR points at a built checkout of the site (default ../versatile.sh), PNGs come from rsvg-convert.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = resolve(ROOT, process.env.SITE_DIR ?? "../versatile.sh");
const MEDIA = join(SITE, "out/_next/static/media");
const ASSETS = join(ROOT, "profile/assets");
const SOCIAL = join(ROOT, "social");
const fontkit = createRequire(join(SITE, "package.json"))("fontkit");

const fonts = readdirSync(MEDIA)
  .filter((file) => file.endsWith(".woff2"))
  .map((file) => fontkit.openSync(join(MEDIA, file)));

function pick(family, italic) {
  const font = fonts
    .filter((candidate) => candidate.familyName === family && (candidate.italicAngle !== 0) === italic)
    .sort((a, b) => b.numGlyphs - a.numGlyphs)[0];
  if (!font) throw new Error(`${family}${italic ? " Italic" : ""} not found in ${MEDIA}; run "pnpm build" in the site first`);
  return font;
}

const FONT = { serif: pick("Instrument Serif", false), italic: pick("Instrument Serif", true), mono: pick("JetBrains Mono", false) };

const THEME = {
  dark: {
    bg: "#0e1116", footer: "#0a0d11", text: "#f5f5f2", muted: "#8a919c", line: "#f5f5f2", grid: 0.1, rule: 0.18,
    light: "#f5f5f2", glow: 0.17, lit: true, tone: { lime: "#c6f432", sky: "#38bdf8", violet: "#a78bfa", amber: "#fbbf24" },
  },
  light: {
    bg: "#f5f5f2", footer: "#f5f5f2", text: "#0e1116", muted: "#5a6270", line: "#0e1116", grid: 0.07, rule: 0.16,
    light: "#ffffff", glow: 0.9, lit: false, tone: { lime: "#5e8c00", sky: "#0284c7", violet: "#7c3aed", amber: "#d97706" },
  },
};

const LEAD = 0.98;
const TRACK = -0.02;
const round = (n) => Math.round(n * 100) / 100;
const compact = (d) => d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (n) => String(round(Number(n))));

function line(spans) {
  const parts = [];
  const box = { x0: Infinity, x1: -Infinity, top: Infinity, bottom: -Infinity };
  const grow = (x0, x1, top, bottom) => {
    box.x0 = Math.min(box.x0, x0);
    box.x1 = Math.max(box.x1, x1);
    box.top = Math.min(box.top, top);
    box.bottom = Math.max(box.bottom, bottom);
  };
  let x = 0;
  for (const span of spans) {
    x += span.gap ?? 0;
    if (span.bar) {
      const [w, h, rx] = span.bar;
      parts.push({ rect: [x, -h, w, h, rx], fill: span.fill });
      grow(x, x + w, -h, 0);
      x += w;
      continue;
    }
    const font = FONT[span.font];
    const k = span.size / font.unitsPerEm;
    const run = font.layout(span.text);
    const paths = [];
    let pen = 0;
    run.glyphs.forEach((glyph, index) => {
      if (glyph.id === 0) throw new Error(`"${span.text}" needs a glyph ${font.familyName} lacks`);
      const at = x + pen * k;
      paths.push(glyph.path.transform(k, 0, 0, -k, at, 0));
      if (glyph.bbox.minX < glyph.bbox.maxX) grow(at + glyph.bbox.minX * k, at + glyph.bbox.maxX * k, -glyph.bbox.maxY * k, -glyph.bbox.minY * k);
      pen += run.positions[index].xAdvance + (span.tracking ?? 0) * font.unitsPerEm;
    });
    parts.push({ paths, fill: span.fill, weight: span.weight });
    x += pen * k;
  }
  return { parts, box };
}

function draw(l, x, y) {
  return l.parts
    .map((part) => {
      if (part.rect) {
        const [rx, ry, w, h, radius] = part.rect.map(round);
        return `<rect x="${round(rx + x)}" y="${round(ry + y)}" width="${w}" height="${h}" rx="${radius}" fill="${part.fill}"/>`;
      }
      const stroke = part.weight ? ` stroke="${part.fill}" stroke-width="${part.weight}" stroke-linejoin="round"` : "";
      return `<path fill="${part.fill}"${stroke} d="${compact(part.paths.map((path) => path.translate(x, y).toSVG()).join(""))}"/>`;
    })
    .join("");
}

const width = (l) => l.box.x1 - l.box.x0;
const left = (l, align, x) => (align === "center" ? x - (l.box.x0 + l.box.x1) / 2 : align === "end" ? x - l.box.x1 : x - l.box.x0);

function column(rows, { x, cy, align = "center" }) {
  let base = 0;
  const placed = rows.map(([l, dy]) => ({ l, y: (base += dy) }));
  const top = Math.min(...placed.map((p) => p.y + p.l.box.top));
  const bottom = Math.max(...placed.map((p) => p.y + p.l.box.bottom));
  const shift = cy - (top + bottom) / 2;
  return { svg: placed.map((p) => draw(p.l, left(p.l, align, x), p.y + shift)).join(""), top: top + shift, bottom: bottom + shift };
}

const cursor = (size, fill) => ({ bar: [0.42 * size, 0.09 * size, 0.03 * size], gap: 0.08 * size, fill });
const tile = (size, fill, gap = 0) => ({ bar: [0.73 * size, 0.73 * size, 0.12 * size], gap, fill });
const mono = (text, size, fill, tracking = 0.14) => ({ font: "mono", text, size, fill, tracking });
const serif = (text, size, fill, font = "serif") => ({ font, text, size, fill, tracking: TRACK });
const wordmark = (t, v, fill = t.text) =>
  line([{ font: "italic", text: "versatile", size: v, fill }, { font: "mono", text: ".sh", size: (v * 0.8) / 1.75, gap: (v * 0.12) / 1.75, fill: t.tone.lime }]);

function thesis(t, size, fill) {
  const run = (rest) => line([serif("Run", size, t.tone.lime), serif(` ${rest}`, size, fill)]);
  return [run("anywhere."), run("anything."), line([serif("Be", size, t.tone.lime, "italic"), serif(" versatile", size, t.text, "italic"), cursor(size, t.tone.lime)])];
}

function heading(t, roman, answer, tone, size, fill) {
  return [...roman.map((text) => line([serif(text, size, fill)])), line([serif(answer, size, t.tone[tone], "italic")])];
}

const stack = (lines, size, tail = []) => [...lines.map((l, index) => [l, index ? LEAD * size : 0]), ...tail];

function backdrop(t, w, h, { radius = 0, fill = t.bg, grid = [0.7 * w, 0.39 * w], beam = [0.48 * w, 0.31 * w], lit } = {}) {
  const ox = round((((w / 2 - 32) % 64) + 64) % 64);
  const ellipse = (id, [rx, ry], stops) =>
    `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${round(w / 2)} 0) scale(${round(rx)} ${round(ry)})">${stops}</radialGradient>`;
  const defs = [
    `<pattern id="grid" width="64" height="64" x="${ox}" y="-1" patternUnits="userSpaceOnUse"><g fill="${t.line}" fill-opacity="${t.grid}"><rect width="1" height="64"/><rect width="64" height="1"/></g></pattern>`,
    ellipse("fade", grid, `<stop offset="0.2" stop-color="#fff"/><stop offset="0.75" stop-color="#000"/>`),
    `<mask id="vignette" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#fade)"/></mask>`,
    ellipse("beam", beam, `<stop offset="0" stop-color="${t.light}" stop-opacity="${t.glow}"/><stop offset="0.72" stop-color="${t.light}" stop-opacity="0"/>`),
    lit && t.lit
      ? `<radialGradient id="lit" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${round(lit.cx)} ${round(lit.top)}) scale(${round(0.62 * lit.w)} ${round(1.3 * lit.h)})"><stop offset="0.08" stop-color="#fff"/><stop offset="0.42" stop-color="#f5f5f2"/><stop offset="1" stop-color="#7c838e"/></radialGradient>`
      : "",
  ].join("");
  const rect = (paint) => `<rect width="${w}" height="${h}" rx="${radius}" ${paint}/>`;
  return { defs, body: rect(`fill="${fill}"`) + rect(`fill="url(#grid)" mask="url(#vignette)"`) + rect(`fill="url(#beam)"`) };
}

const svg = (w, h, label, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><title>${label}</title><defs>${defs}</defs>${body}</svg>\n`;

const ink = (t) => (t.lit ? "url(#lit)" : t.text);
const THESIS = "Run anywhere. Run anything. Be versatile";

function centred(t, w, h, size, tail, { cy = h / 2, ...options } = {}) {
  const lines = thesis(t, size, ink(t));
  const text = column(stack(lines, size, tail), { x: w / 2, cy });
  const back = backdrop(t, w, h, { ...options, lit: { cx: w / 2, top: text.top - 0.1 * size, w: w - 96, h: 3.04 * size } });
  return { defs: back.defs, body: back.body + text.svg };
}

function banner(t) {
  const art = centred(t, 1280, 420, 74, [[line([mono("versatile.sh", 15, t.muted, 0.16)]), 0.66 * 74]], { radius: 16, grid: [900, 520], beam: [620, 400] });
  return svg(1280, 420, `${THESIS}. versatile.sh`, art.defs, art.body);
}

function logo(t) {
  return svg(720, 200, "versatile.sh", "", column([[wordmark(t, 140), 0]], { x: 360, cy: 100 }).svg);
}

function section(t, index, title, tone) {
  const w = 960;
  const h = 168;
  const words = title.split(" ");
  const plain = words.length > 1 ? `${words.slice(0, -1).join(" ")} ` : "";
  const crumb = line([tile(18, t.tone[tone]), mono(`versatile.sh  /  0${index}`, 18, t.muted, 0.04)].map((span, i) => (i ? { ...span, gap: 14 } : span)));
  const head = line([serif(plain, 64, t.text), serif(words.at(-1), 64, t.tone[tone], "italic")]);
  const text = column([[crumb, 0], [head, 82]], { x: w / 2, cy: h / 2 + 4 });
  const back = backdrop(t, w, h, { radius: 16, grid: [680, 260], beam: [460, 200] });
  return svg(w, h, title, back.defs, back.body + text.svg);
}

function footer(t) {
  const w = 1280;
  const h = 260;
  const size = 28;
  const sign = line([serif("Run anywhere. Run anything.", size, t.text), serif(" Be versatile", size, t.tone.lime, "italic"), cursor(size, t.tone.lime)]);
  const top = column([[sign, 0], [line([mono("versatile.sh", 13, t.muted, 0.16)]), 34]], { x: w / 2, cy: 64 });
  const unit = line([{ font: "italic", text: "versatile", size: 1, fill: t.text }]);
  const cut = 0.255;
  const em = (h - top.bottom - 34) / (-unit.box.top - cut);
  const mark = line([{ font: "italic", text: "versatile", size: em, fill: t.text }]);
  const back = backdrop(t, w, h, { radius: 16, fill: t.footer, grid: [900, 300], beam: [560, 260] });
  return svg(w, h, `${THESIS}. versatile.sh`, back.defs, back.body + top.svg + draw(mark, left(mark, "center", w / 2), h + cut * em));
}

function header(t) {
  const art = centred(t, 1500, 500, 70, [[wordmark(t, 36), 1.3 * 70]], { cy: 236, grid: [1050, 560], beam: [720, 470] });
  return svg(1500, 500, `${THESIS}. versatile.sh`, art.defs, art.body);
}

function preview(t) {
  const art = centred(t, 1280, 640, 84, [[wordmark(t, 44), 1.38 * 84]], { grid: [900, 640], beam: [620, 520] });
  return svg(1280, 640, `${THESIS}. versatile.sh`, art.defs, art.body);
}

const CARDS = [
  { name: "01 · Thesis", alt: THESIS, tone: "lime", lines: (t, size) => thesis(t, size, t.text) },
  { name: "02 · Extensible", alt: "Add what is missing without touching what works.", tone: "amber", lines: (t, size) => heading(t, ["Add what is missing", "without touching"], "what works.", "amber", size, t.text) },
  { name: "03 · No lock-in", alt: "No lock-in. Your data, your infrastructure.", tone: "lime", lines: (t, size) => heading(t, ["No lock-in.", "Your data,"], "your infrastructure.", "lime", size, t.text) },
];

function card(t, spec) {
  const w = 1080;
  const h = 1350;
  const margin = 96;
  const widest = Math.max(...CARDS.flatMap((c) => c.lines(t, 100).map(width)));
  const size = Math.min(132, Math.floor((100 * (w - 2 * margin)) / widest));
  const lines = spec.lines(t, size);
  const text = column(stack(lines, size), { x: margin, cy: h / 2 - 16, align: "start" });
  const label = line([tile(24, t.tone[spec.tone]), mono(spec.name.toUpperCase(), 24, t.muted, 0.14)].map((s, i) => (i ? { ...s, gap: 18 } : s)));
  const mark = wordmark(t, 46);
  const back = backdrop(t, w, h, { grid: [760, 900], beam: [560, 640] });
  const body = back.body + text.svg + draw(label, left(label, "start", margin), margin - label.box.top) + draw(mark, left(mark, "start", margin), h - margin);
  return svg(w, h, `${spec.alt} versatile.sh`, back.defs, body);
}

const render = (source, w, h) => execFileSync("rsvg-convert", ["-w", String(w), "-h", String(h), "-f", "png"], { input: source, maxBuffer: 1 << 28 });

const sheet = [];
const written = [];
function emit(dir, name, source, w, h, { png = false, plate, circle = false, scale = 1 } = {}) {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, png ? `${name}.png` : `${name}.svg`);
  const image = render(source, w * scale, h * scale);
  writeFileSync(file, png ? image : source);
  written.push(file);
  sheet.push({ name: relative(ROOT, file), image, w, h, size: `${w * scale}x${h * scale}`, plate, circle });
}

for (const [mode, t] of Object.entries(THEME)) {
  emit(ASSETS, `banner-${mode}`, banner(t), 1280, 420);
  emit(ASSETS, `logo-${mode}`, logo(t), 720, 200, { plate: t.bg });
  [["premises", "Premises", "lime"], ["principles", "Principles", "sky"], ["ship", "What we ship", "violet"], ["posts", "Posts", "amber"], ["connect", "Connect", "lime"]].forEach(([slug, title, tone], index) =>
    emit(ASSETS, `section-${slug}-${mode}`, section(t, index + 1, title, tone), 960, 168),
  );
  emit(ASSETS, `footer-${mode}`, footer(t), 1280, 260);
}

const dark = THEME.dark;
sheet.push({ name: "social/avatar-1024.png", image: readFileSync(join(SOCIAL, "avatar-1024.png")), w: 1024, h: 1024, size: "1024x1024", circle: true });
emit(SOCIAL, "x-header-1500x500", header(dark), 1500, 500, { png: true });
emit(SOCIAL, "bluesky-banner-3000x1000", header(dark), 1500, 500, { png: true, scale: 2 });
emit(SOCIAL, "github-social-preview-1280x640", preview(dark), 1280, 640, { png: true });
CARDS.forEach((spec, index) => emit(SOCIAL, `instagram-post-${index + 1}-1080x1350`, card(dark, spec), 1080, 1350, { png: true }));

const ROWS = [
  ["banner-dark", "banner-light"],
  ["logo-dark", "logo-light", "avatar-1024"],
  ...["premises", "principles", "ship", "posts", "connect"].map((name) => [`section-${name}-dark`, `section-${name}-light`]),
  ["footer-dark", "footer-light"],
  ["x-header-1500x500", "bluesky-banner-3000x1000"],
  ["instagram-post-1-1080x1350", "instagram-post-2-1080x1350", "instagram-post-3-1080x1350", "github-social-preview-1280x640"],
];

function contactSheet() {
  const w = 2400;
  const margin = 56;
  const gap = 32;
  let y = margin + 40;
  const title = line([mono("PROFILE AND SOCIAL IMAGES", 16, dark.muted)]);
  const brand = wordmark(dark, 40);
  const body = [draw(brand, left(brand, "start", margin), y), draw(title, left(title, "end", w - margin), y)];
  y += 48;
  ROWS.forEach((row, rowIndex) => {
    const items = row.map((key) => sheet.find((item) => item.name.endsWith(`/${key}.svg`) || item.name.endsWith(`/${key}.png`)));
    const height = (w - 2 * margin - gap * (items.length - 1)) / items.reduce((sum, item) => sum + item.w / item.h, 0);
    let x = margin;
    items.forEach((item, index) => {
      const iw = (height * item.w) / item.h;
      const href = `data:image/png;base64,${item.image.toString("base64")}`;
      if (item.plate) body.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(iw)}" height="${round(height)}" fill="${item.plate}"/>`);
      if (item.circle) body.push(`<clipPath id="c${rowIndex}${index}"><circle cx="${round(x + iw / 2)}" cy="${round(y + height / 2)}" r="${round(height / 2)}"/></clipPath>`);
      body.push(`<image x="${round(x)}" y="${round(y)}" width="${round(iw)}" height="${round(height)}" href="${href}"${item.circle ? ` clip-path="url(#c${rowIndex}${index})"` : ""}/>`);
      body.push(draw(line([mono(`${item.name}  ${item.size}`, 13, dark.muted, 0.04)]), x, y + height + 24));
      x += iw + gap;
    });
    y += height + 24 + 40;
  });
  const h = Math.ceil(y + margin - 40);
  return { source: svg(w, h, "contact sheet", "", `<rect width="${w}" height="${h}" fill="#151a22"/>${body.join("")}`), w, h };
}

const contact = contactSheet();
writeFileSync(join(SOCIAL, "preview.png"), render(contact.source, contact.w, contact.h));
written.push(join(SOCIAL, "preview.png"));
for (const file of written) console.log(`${relative(ROOT, file).padEnd(52)} ${(statSync(file).size / 1024).toFixed(1).padStart(8)} KB`);
