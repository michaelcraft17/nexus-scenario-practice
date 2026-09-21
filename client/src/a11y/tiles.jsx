/**
 * The accessibility menu's tile grid: which tiles exist, the steps each one
 * cycles through, and the per-step icon/label. Ported from the Accessibility
 * Mapper's menu (autism-community-resources, branch
 * ui-refresh-a11y-menu-and-results), adapted to this app's pref values.
 *
 * A tile cycles off -> step 1 -> step 2 -> ... -> off on each click; a tile
 * with a single step is a plain on/off toggle. "Off" is 'default' unless
 * TILE_DEFAULTS says otherwise (this app stores motion's off state as
 * "device", i.e. "follow the OS setting").
 */

const tileSvg = (children) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const monitorIcon = (screen) => tileSvg(<>{screen}<path d="M16 22v5M11 27h10" /></>);

// Crisp vector icons for the two "size" tiles (drawn as strokes, not font
// glyphs, so they look the same at every step). Bigger Text: a small and a
// large slab-serif "T" that both grow with each level.
const slabT = (x, top, w, h, sw) => {
  const tick = Math.min(2.4, h * 0.25);
  return (
    <path
      strokeWidth={sw}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      d={`M${x} ${top}h${w}M${x} ${top}v${tick}M${x + w} ${top}v${tick}M${x + w / 2} ${top}v${h}M${x + w / 2 - w * 0.2} ${top + h}h${w * 0.4}`}
    />
  );
};
const textSizeIcon = ([ws, hs, wb, hb]) => {
  const gap = 2;
  const x0 = (32 - (ws + gap + wb)) / 2;
  const base = 28;
  return tileSvg(<>{slabT(x0, base - hs, ws, hs, 1.9)}{slabT(x0 + ws + gap, base - hb, wb, hb, 2.2)}</>);
};
const TEXT_SIZE_LEVELS = [[6, 8, 12, 16], [7.5, 10, 14.5, 20], [9, 12, 16, 22], [9.5, 13, 17, 24]];

// Line Height: the double arrow always spans exactly the block of lines, so
// it stretches as the spacing grows.
const lineHeightIcon = (sp) => {
  const H = 3 * sp;
  const top = 16 - H / 2;
  const bot = 16 + H / 2;
  return tileSvg(
    <>
      <path strokeWidth="2.2" d={`M6 ${top - 1}v${H + 2}M6 ${top - 1}l-3 3.5M6 ${top - 1}l3 3.5M6 ${bot + 1}l-3-3.5M6 ${bot + 1}l3-3.5`} />
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M13 ${top + k * sp}h16`} />)}
    </>
  );
};

const DROP = "M16 4s9 10 9 16a9 9 0 01-18 0c0-6 9-16 9-16z";

/** Icon for a tile in its off state (also the fallback for any step
 * without its own icon in ICONS_ON). */
const TILE_ICONS = {
  contrast: tileSvg(<><circle cx="16" cy="16" r="11" /><path d="M16 5a11 11 0 010 22z" fill="currentColor" /></>),
  links: tileSvg(<path d="M13 10h-3a6 6 0 000 12h3M19 10h3a6 6 0 010 12h-3M11 16h10" />),
  textSize: tileSvg(<path d="M3 9h11M8.5 9v14M14 9v0M15 6h14M22 6v18" />),
  spacing: tileSvg(<path d="M4 16h24M4 16l4-4M4 16l4 4M28 16l-4-4M28 16l-4 4" strokeDasharray="3 3" />),
  motion: tileSvg(<><circle cx="16" cy="16" r="6" /><path d="M14 13v6M18 13v6" /><path d="M16 3v3M16 26v3M3 16h3M26 16h3M7 7l2 2M23 23l2 2M7 25l2-2M23 9l2-2" /></>),
  hideImages: tileSvg(<><path d="M4 8h14M4 8v18h22v-9" /><path d="M4 22l6-6 5 5 3-3 8 7" /><path d="M22 4l6 6M28 4l-6 6" /></>),
  typeface: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <text x="16" y="23" textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor" fontFamily="Georgia,serif">Df</text>
    </svg>
  ),
  cursor: tileSvg(<path d="M8 4l16 12-7 1.5 4 7-3.5 1.8-4-7L8 22z" />),
  tooltips: tileSvg(<><path d="M5 6h22v16H16l-6 5v-5H5z" /><path d="M16 11v1M16 15v4" /></>),
  lineHeight: tileSvg(<path d="M6 4v24M6 4l-3 4M6 4l3 4M6 28l-3-4M6 28l3-4M14 8h14M14 14h14M14 20h14M14 26h14" />),
  textAlign: tileSvg(<path d="M4 7h24M4 13h16M4 19h24M4 25h16" />),
  saturation: tileSvg(<path d="M16 4s9 10 9 16a9 9 0 01-18 0c0-6 9-16 9-16zM16 4v25" fill="none" />),
};

/** Per-step icons: a tile swaps its icon (and label, see LABELS_ON) as it
 * moves through its steps. */
const ICONS_ON = {
  contrast: {
    invert: monitorIcon(<><rect x="3" y="5" width="26" height="17" rx="2" /><path d="M5 5h24L3 22V7a2 2 0 012-2z" fill="currentColor" /><circle cx="16" cy="13.5" r="3.2" fill="#fff" /></>),
    dark: monitorIcon(<><rect x="3" y="5" width="26" height="17" rx="2" fill="currentColor" /><circle cx="16" cy="13.5" r="3.2" fill="#fff" stroke="none" /></>),
    light: monitorIcon(<><rect x="3" y="5" width="26" height="17" rx="2" /><circle cx="16" cy="13.5" r="3.2" fill="currentColor" stroke="none" /></>),
  },
  // "tT" letters grow with each of the 4 levels
  textSize: Object.fromEntries(["large", "largest", "huge", "giant"].map((v, i) => [v, textSizeIcon(TEXT_SIZE_LEVELS[i])])),
  // dashed double arrow widens with each step
  spacing: Object.fromEntries(
    [["1", 7], ["2", 10], ["3", 13.5]].map(([v, w]) => [
      v,
      tileSvg(<><path d={`M${16 - w} 16h${2 * w}`} strokeDasharray="3 3" /><path d={`M${16 - w} 16l4-4M${16 - w} 16l4 4M${16 + w} 16l-4-4M${16 + w} 16l-4 4`} /></>),
    ])
  ),
  motion: {
    reduce: tileSvg(<><circle cx="16" cy="16" r="6.5" /><path d="M14 12.5l6 3.5-6 3.5z" fill="currentColor" /><path d="M16 3v3M16 26v3M3 16h3M26 16h3M7 7l2 2M23 23l2 2M7 25l2-2M23 9l2-2" /></>),
  },
  typeface: {
    legible: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <text x="16" y="23" textAnchor="middle" fontSize="19" fontWeight="600" fill="currentColor" fontFamily="Verdana,Arial,sans-serif">Ab</text>
      </svg>
    ),
  },
  cursor: {
    mask: tileSvg(<><rect x="4" y="6" width="24" height="20" rx="2" /><rect x="4" y="6" width="24" height="6" fill="currentColor" /><rect x="4" y="20" width="24" height="6" fill="currentColor" /></>),
    guide: tileSvg(<><rect x="4" y="6" width="24" height="20" rx="2" /><rect x="4" y="13" width="24" height="6" fill="currentColor" /></>),
  },
  // line spacing (and the arrow) grows with each step
  lineHeight: Object.fromEntries([["1", 4], ["2", 6.5], ["3", 9]].map(([v, sp]) => [v, lineHeightIcon(sp)])),
  textAlign: {
    left: tileSvg(<path d="M5 7h22M5 13h14M5 19h22M5 25h14" />),
    right: tileSvg(<path d="M5 7h22M13 13h14M5 19h22M13 25h14" />),
    center: tileSvg(<path d="M5 7h22M9 13h14M5 19h22M9 25h14" />),
    justify: tileSvg(<path d="M5 7h22M5 13h22M5 19h22M5 25h22" />),
  },
  saturation: {
    low: tileSvg(<><path d={DROP} /><path d="M16 4C13 8 7 14 7 20a9 9 0 009 9z" fill="currentColor" /></>),
    high: tileSvg(<><path d={DROP} fill="currentColor" /><path d="M11.5 20a4.6 4.6 0 002.6 4.2" stroke="#fff" strokeWidth="1.6" /></>),
    mono: tileSvg(<><path d={DROP} /><path d="M11 16.5h10M9.5 20.5h13M10 24.5h12" strokeWidth="1.6" /></>),
  },
};

/** A few tiles show a different icon while off than their generic one. */
const ICON_OFF_OVERRIDES = {
  textSize: textSizeIcon([7, 9, 13.5, 18]),
  lineHeight: lineHeightIcon(5.5),
  spacing: tileSvg(<><path d="M7 16h18" strokeDasharray="3 3" /><path d="M6 16l4-4M6 16l4 4M26 16l-4-4M26 16l-4 4" /></>),
  saturation: tileSvg(<><path d={DROP} fill="currentColor" /><path d="M11.5 20a4.6 4.6 0 002.6 4.2" stroke="#fff" strokeWidth="1.6" /></>),
};

const LABELS_ON = {
  contrast: { high: "Higher Contrast", invert: "Invert Colors", dark: "Dark Contrast", light: "Light Contrast" },
  spacing: { 1: "Light Spacing", 2: "Moderate Spacing", 3: "Heavy Spacing" },
  motion: { reduce: "Animations Paused" },
  hideImages: { on: "Images Hidden" },
  typeface: { legible: "Legible Fonts" },
  cursor: { black: "Big Cursor", mask: "Reading Mask", guide: "Reading Guide" },
  lineHeight: { 1: "Line Height (1.5x)", 2: "Line Height (1.75x)", 3: "Line Height (2x)" },
  textAlign: { left: "Align Left", right: "Align Right", center: "Align Center", justify: "Justify" },
  saturation: { low: "Low Saturation", high: "High Saturation", mono: "Desaturate" },
};

// Saturation steps get their own accent (navy for low, grey for desaturate).
const TONES_ON = { saturation: { low: "#3c4f9c", mono: "#5b616e" } };

export const A11Y_TILES = [
  { key: "contrast", label: "Contrast +", steps: ["high", "invert", "dark", "light"] },
  { key: "links", label: "Highlight Links", steps: ["on"] },
  { key: "textSize", label: "Bigger Text", steps: ["large", "largest", "huge", "giant"] },
  { key: "spacing", label: "Text Spacing", steps: ["1", "2", "3"] },
  { key: "motion", label: "Pause Animations", steps: ["reduce"] },
  { key: "hideImages", label: "Hide Images", steps: ["on"] },
  { key: "typeface", label: "Dyslexia Friendly", steps: ["dyslexia", "legible"] },
  { key: "cursor", label: "Cursor", steps: ["black", "mask", "guide"] },
  { key: "tooltips", label: "Tooltips", steps: ["on"] },
  { key: "lineHeight", label: "Line Height", steps: ["1", "2", "3"] },
  { key: "textAlign", label: "Text Align", steps: ["left", "right", "center", "justify"] },
  { key: "saturation", label: "Saturation", steps: ["low", "high", "mono"] },
];

const TILE_DEFAULTS = { motion: "device" };
export const tileOff = (key) => TILE_DEFAULTS[key] || "default";

/** The next value when a tile is clicked: the step after the current one,
 * or back to off after the last. An unrecognised current value (off, or a
 * stale one from an older version) counts as off. */
export function nextTileValue(tile, current) {
  const i = tile.steps.indexOf(current);
  return i + 1 < tile.steps.length ? tile.steps[i + 1] : tileOff(tile.key);
}

/** Everything the panel needs to draw one tile in its current state. */
export function describeTile(tile, current) {
  const i = tile.steps.indexOf(current);
  const on = i >= 0;
  const label = (on && LABELS_ON[tile.key]?.[current]) || tile.label;
  const icon = (on && ICONS_ON[tile.key]?.[current]) || ICON_OFF_OVERRIDES[tile.key] || TILE_ICONS[tile.key];
  const tone = on ? TONES_ON[tile.key]?.[current] : undefined;
  return { on, stepIndex: i, label, icon, tone };
}

export const ResetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 109-9 9 9 0 00-6.7 3M3 4v5h5" />
  </svg>
);

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
