/**
 * Colour conversion for MapLibre.
 *
 * The design tokens are authored in `oklch()`. Browsers serialise a computed
 * `oklch()` value back as CIE `lab()`, and MapLibre's colour parser accepts
 * neither — so tokens read from the DOM must be converted to sRGB hex before
 * they reach a paint property.
 *
 * Three input forms are handled, because they do not share a lightness scale:
 *
 * - `lab(L% a b)`   — CIE Lab, **L in 0..100**
 * - `oklab(L a b)`  — OKLab, **L in 0..1**
 * - `oklch(L% C H)` — OKLCh, **L in 0..1**
 *
 * Conflating the two lightness scales is the trap here: treating a 0..1 OKLab
 * lightness as 0..100 pushes Y above 1 and produces wildly out-of-gamut colours.
 */

/** CIE Lab / XYZ D65 reference white. */
const D65 = { x: 0.95047, y: 1.0, z: 1.08883 } as const;

/** CIE XYZ (D65) → linear sRGB, row-major. */
const XYZ_TO_LINEAR_SRGB = [
  3.2409699419045226, -1.537383177570094, -0.4986107602930034,
  -0.9692436362808796, 1.8759675015077202, 0.04155505740717559,
  0.05563007969699366, -0.20397695888897652, 1.0569715142428786,
] as const;

/** OKLab → linear sRGB. */
const OKLAB_TO_LINEAR_SRGB = [
  4.0767416621, -3.3077115913, 0.2309699292,
  -1.2684380046, 2.6097574011, -0.3413193965,
  -0.0041960863, -0.7034186147, 1.707614701,
] as const;

const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** sRGB transfer function (linear → encoded). */
function encodeGamma(channel: number): number {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

/** Inverse sRGB transfer function (encoded → linear). */
function decodeGamma(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function toHex(linear: readonly [number, number, number]): string {
  return `#${linear
    .map((channel) => Math.round(clamp01(encodeGamma(channel)) * 255))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function toRgba(linear: readonly [number, number, number], alpha: number): string {
  if (alpha >= 1) return toHex(linear);

  const channels = linear.map((channel) =>
    Math.round(clamp01(encodeGamma(channel)) * 255),
  );

  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${Number(alpha.toFixed(3))})`;
}

/** CIE Lab (L in 0..100) → linear sRGB. */
function labToLinearSrgb(
  lightness: number,
  a: number,
  b: number,
): [number, number, number] {
  const fy = (lightness + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  // Inverse companding f⁻¹.
  const finv = (t: number) =>
    t ** 3 > LAB_EPSILON ? t ** 3 : (LAB_KAPPA * t + 16) / 116;

  const x = D65.x * finv(fx);
  const y = D65.y * finv(fy);
  const z = D65.z * finv(fz);

  return [
    XYZ_TO_LINEAR_SRGB[0] * x + XYZ_TO_LINEAR_SRGB[1] * y + XYZ_TO_LINEAR_SRGB[2] * z,
    XYZ_TO_LINEAR_SRGB[3] * x + XYZ_TO_LINEAR_SRGB[4] * y + XYZ_TO_LINEAR_SRGB[5] * z,
    XYZ_TO_LINEAR_SRGB[6] * x + XYZ_TO_LINEAR_SRGB[7] * y + XYZ_TO_LINEAR_SRGB[8] * z,
  ];
}

/** OKLab (L in 0..1) → linear sRGB. */
function oklabToLinearSrgb(
  lightness: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    OKLAB_TO_LINEAR_SRGB[0] * l + OKLAB_TO_LINEAR_SRGB[1] * m + OKLAB_TO_LINEAR_SRGB[2] * s,
    OKLAB_TO_LINEAR_SRGB[3] * l + OKLAB_TO_LINEAR_SRGB[4] * m + OKLAB_TO_LINEAR_SRGB[5] * s,
    OKLAB_TO_LINEAR_SRGB[6] * l + OKLAB_TO_LINEAR_SRGB[7] * m + OKLAB_TO_LINEAR_SRGB[8] * s,
  ];
}

function oklchToLinearSrgb(
  lightness: number,
  chroma: number,
  hue: number,
): [number, number, number] {
  const radians = (hue * Math.PI) / 180;
  return oklabToLinearSrgb(
    lightness,
    chroma * Math.cos(radians),
    chroma * Math.sin(radians),
  );
}

function parseAlpha(raw: string | undefined): number {
  if (raw === undefined) return 1;
  return raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw);
}

/** `/^\s*([\d.]+%?)/` captures a number that may carry a percent sign. */
const NUMBER = String.raw`\s*([+-]?[\d.]+%?)`;
const ALPHA = String.raw`(?:\s*\/\s*([\d.]+%?))?`;

const LAB_PATTERN = new RegExp(
  String.raw`^lab\(${NUMBER}${NUMBER}${NUMBER}${ALPHA}\s*\)$`,
);
const OKLAB_PATTERN = new RegExp(
  String.raw`^oklab\(${NUMBER}${NUMBER}${NUMBER}${ALPHA}\s*\)$`,
);
const OKLCH_PATTERN = new RegExp(
  String.raw`^oklch\(${NUMBER}${NUMBER}${NUMBER}${ALPHA}\s*\)$`,
);
const RGB_PATTERN = /^rgba?\(/;
const HEX_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** A `0..1` fraction, whether written as `0.5` or `50%`. */
function fraction(raw: string): number {
  return raw.endsWith("%") ? Number(raw.slice(0, -1)) / 100 : Number(raw);
}

/**
 * Convert a CSS colour string to a form MapLibre can parse: `#rrggbb`, or
 * `rgba(r, g, b, a)` when the source carries alpha.
 *
 * Anything already parseable is passed through. Unrecognised input yields
 * `fallback`, so the map always receives a valid colour.
 */
export function toMapColor(value: string, fallback: string): string {
  const input = value.trim().toLowerCase();
  if (!input) return fallback;

  if (HEX_PATTERN.test(input) || RGB_PATTERN.test(input)) return input;

  const lab = LAB_PATTERN.exec(input);
  if (lab) {
    // CIE Lab lightness is 0..100 whether or not it carries a percent sign.
    const lightness = fraction(lab[1]) * 100;
    return toRgba(
      labToLinearSrgb(lightness, Number(lab[2]), Number(lab[3])),
      parseAlpha(lab[4]),
    );
  }

  const oklab = OKLAB_PATTERN.exec(input);
  if (oklab) {
    return toRgba(
      oklabToLinearSrgb(fraction(oklab[1]), Number(oklab[2]), Number(oklab[3])),
      parseAlpha(oklab[4]),
    );
  }

  const oklch = OKLCH_PATTERN.exec(input);
  if (oklch) {
    return toRgba(
      oklchToLinearSrgb(fraction(oklch[1]), Number(oklch[2]), Number(oklch[3])),
      parseAlpha(oklch[4]),
    );
  }

  return fallback;
}

export { decodeGamma, encodeGamma };
