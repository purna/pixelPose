/**
 * spriteLoader.js
 * Loads and caches SVG body-part images for sprite rendering.
 *
 * Each SVG is fetched, serialised to a Blob URL, and drawn into an
 * HTMLImageElement so the canvas renderer can call ctx.drawImage() on it.
 *
 * Pivot convention (matches the SVG files):
 *   Every part is drawn with its PROXIMAL pivot at (0, 0) in its own
 *   coordinate system.  The renderer translates to the proximal joint,
 *   rotates to the bone angle, then draws the image offset so the pivot
 *   dot sits at the origin.
 */

// ─── Part catalogue ──────────────────────────────────────────────────────────
// Maps bodyType → { boneKey: { file, pivotY, naturalH } }
//   file      – path relative to project root
//   pivotY    – Y position of the PROXIMAL pivot inside the SVG viewBox
//               (used to align the image so the pivot sits at canvas origin)
//   naturalH  – full height of the SVG viewBox (for scale calc)

const PART_CATALOGUE = {
  'adult-male': {
    'head':         { file: 'assets/parts/human/head.svg',         pivotY: 29,  naturalH: 90  },
    'neck':         { file: 'assets/parts/human/neck.svg',         pivotY: 4,   naturalH: 44  },
    'torso':        { file: 'assets/parts/human/torso.svg',        pivotY: 6,   naturalH: 112 },
    'pelvis':       { file: 'assets/parts/human/pelvis.svg',       pivotY: 6,   naturalH: 50  },
    'upper-arm-l':  { file: 'assets/parts/human/upper-arm-l.svg',  pivotY: 4,   naturalH: 96  },
    'upper-arm-r':  { file: 'assets/parts/human/upper-arm-r.svg',  pivotY: 4,   naturalH: 96  },
    'lower-arm-l':  { file: 'assets/parts/human/lower-arm-l.svg',  pivotY: 4,   naturalH: 80  },
    'lower-arm-r':  { file: 'assets/parts/human/lower-arm-r.svg',  pivotY: 4,   naturalH: 80  },
    'hand-l':       { file: 'assets/parts/human/hand-l.svg',       pivotY: 34,  naturalH: 44  },
    'hand-r':       { file: 'assets/parts/human/hand-r.svg',       pivotY: 34,  naturalH: 44  },
    'upper-leg-l':  { file: 'assets/parts/human/upper-leg-l.svg',  pivotY: 4,   naturalH: 112 },
    'upper-leg-r':  { file: 'assets/parts/human/upper-leg-r.svg',  pivotY: 4,   naturalH: 112 },
    'lower-leg-l':  { file: 'assets/parts/human/lower-leg-l.svg',  pivotY: 4,   naturalH: 108 },
    'lower-leg-r':  { file: 'assets/parts/human/lower-leg-r.svg',  pivotY: 4,   naturalH: 108 },
    'foot-l':       { file: 'assets/parts/human/foot-l.svg',       pivotY: 14,  naturalH: 30  },
    'foot-r':       { file: 'assets/parts/human/foot-r.svg',       pivotY: 14,  naturalH: 30  },
  },
  horse: {
    'head':                { file: 'assets/parts/horse/head.svg',               pivotY: 85,  naturalH: 90  },
    'neck':                { file: 'assets/parts/horse/neck.svg',               pivotY: 5,   naturalH: 110 },
    'body':                { file: 'assets/parts/horse/body.svg',               pivotY: 20,  naturalH: 80  },
    'upper-leg-front-l':   { file: 'assets/parts/horse/upper-leg-front-l.svg', pivotY: 4,   naturalH: 104 },
    'upper-leg-front-r':   { file: 'assets/parts/horse/upper-leg-front-r.svg', pivotY: 4,   naturalH: 104 },
    'lower-leg-front-l':   { file: 'assets/parts/horse/lower-leg-front-l.svg', pivotY: 4,   naturalH: 92  },
    'lower-leg-front-r':   { file: 'assets/parts/horse/lower-leg-front-r.svg', pivotY: 4,   naturalH: 92  },
    'upper-leg-rear-l':    { file: 'assets/parts/horse/upper-leg-rear-l.svg',  pivotY: 4,   naturalH: 100 },
    'upper-leg-rear-r':    { file: 'assets/parts/horse/upper-leg-rear-r.svg',  pivotY: 4,   naturalH: 100 },
    'lower-leg-rear-l':    { file: 'assets/parts/horse/lower-leg-rear-l.svg',  pivotY: 4,   naturalH: 88  },
    'lower-leg-rear-r':    { file: 'assets/parts/horse/lower-leg-rear-r.svg',  pivotY: 4,   naturalH: 88  },
    'hoof-l':              { file: 'assets/parts/horse/hoof-l.svg',            pivotY: 10,  naturalH: 26  },
    'hoof-r':              { file: 'assets/parts/horse/hoof-r.svg',            pivotY: 10,  naturalH: 26  },
    'tail':                { file: 'assets/parts/horse/tail.svg',              pivotY: 6,   naturalH: 80  },
  },
  dog: {
    'head':        { file: 'assets/parts/dog/head.svg',       pivotY: 64,  naturalH: 70  },
    'neck':        { file: 'assets/parts/dog/neck.svg',       pivotY: 4,   naturalH: 72  },
    'body':        { file: 'assets/parts/dog/body.svg',       pivotY: 18,  naturalH: 64  },
    'upper-leg-l': { file: 'assets/parts/dog/upper-leg-l.svg', pivotY: 4, naturalH: 76  },
    'upper-leg-r': { file: 'assets/parts/dog/upper-leg-r.svg', pivotY: 4, naturalH: 76  },
    'lower-leg-l': { file: 'assets/parts/dog/lower-leg-l.svg', pivotY: 4, naturalH: 64  },
    'lower-leg-r': { file: 'assets/parts/dog/lower-leg-r.svg', pivotY: 4, naturalH: 64  },
    'paw-l':       { file: 'assets/parts/dog/paw-l.svg',       pivotY: 6,  naturalH: 26  },
    'paw-r':       { file: 'assets/parts/dog/paw-r.svg',       pivotY: 6,  naturalH: 26  },
    'tail':        { file: 'assets/parts/dog/tail.svg',        pivotY: 6,  naturalH: 60  },
  },
  cat: {
    'head':        { file: 'assets/parts/cat/head.svg',       pivotY: 64,  naturalH: 68  },
    'neck':        { file: 'assets/parts/cat/neck.svg',       pivotY: 4,   naturalH: 56  },
    'body':        { file: 'assets/parts/cat/body.svg',       pivotY: 14,  naturalH: 56  },
    'upper-leg-l': { file: 'assets/parts/cat/upper-leg-l.svg', pivotY: 4, naturalH: 64  },
    'upper-leg-r': { file: 'assets/parts/cat/upper-leg-r.svg', pivotY: 4, naturalH: 64  },
    'lower-leg-l': { file: 'assets/parts/cat/lower-leg-l.svg', pivotY: 4, naturalH: 52  },
    'lower-leg-r': { file: 'assets/parts/cat/lower-leg-r.svg', pivotY: 4, naturalH: 52  },
    'paw-l':       { file: 'assets/parts/cat/paw-l.svg',       pivotY: 6,  naturalH: 22  },
    'paw-r':       { file: 'assets/parts/cat/paw-r.svg',       pivotY: 6,  naturalH: 22  },
    'tail':        { file: 'assets/parts/cat/tail.svg',        pivotY: 6,  naturalH: 90  },
  },
};

// Alias female and child to human parts
PART_CATALOGUE['adult-female'] = PART_CATALOGUE['adult-male'];
PART_CATALOGUE['child']        = PART_CATALOGUE['adult-male'];

// ─── Cache ───────────────────────────────────────────────────────────────────
// partCache[bodyType][partKey] = { img: HTMLImageElement, meta: { pivotY, naturalH, w, h } }
const partCache = {};

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Load (or return cached) all parts for a given body type.
 * Returns a Promise that resolves once every image is ready.
 * @param {string} bodyType  e.g. 'adult-male' | 'horse' | 'dog' | 'cat'
 * @returns {Promise<Object>}  the loaded part map for this body type
 */
export async function loadSprites(bodyType) {
  const catalogue = PART_CATALOGUE[bodyType];
  if (!catalogue) return {};

  if (partCache[bodyType]) return partCache[bodyType];

  partCache[bodyType] = {};

  const promises = Object.entries(catalogue).map(([partKey, meta]) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        partCache[bodyType][partKey] = {
          img,
          pivotY: meta.pivotY,
          naturalH: meta.naturalH,
          w: img.naturalWidth,
          h: img.naturalHeight,
        };
        resolve();
      };
      img.onerror = () => {
        // Part file missing — resolve silently so other parts still load
        console.warn(`[spriteLoader] missing: ${meta.file}`);
        resolve();
      };
      img.src = meta.file;
    });
  });

  await Promise.all(promises);
  return partCache[bodyType];
}

/**
 * Return the cached part map synchronously (null if not yet loaded).
 * @param {string} bodyType
 */
export function getSprites(bodyType) {
  return partCache[bodyType] || null;
}

/**
 * Clear cached sprites (e.g. after hot-reload in dev).
 */
export function clearSpriteCache() {
  Object.keys(partCache).forEach(k => delete partCache[k]);
}