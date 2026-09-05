// SVG files are vendored unchanged with pinned sources and licenses.
// Embedding each as an SVG image preserves its own styles/gradient IDs even when
// several instances share a slide, and keeps exported presentations self-contained.
const originals = import.meta.glob<string>('../assets/tech-originals/*.svg', {
  eager: true, query: '?raw', import: 'default',
});

export const ORIGINAL_TECH_ICONS = new Map(Object.entries(originals).map(([path, svg]) => [
  path.slice(path.lastIndexOf('/') + 1, -4),
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
]));
