/**
 * Chart colours, one set per theme — validated with the data-viz palette
 * validator against the app's own card surfaces (#ffffff light, #242424
 * dark): categorical slots pass lightness, chroma, colour-blind and
 * contrast checks; the ordinal ramps (ordered buckets: receivables age,
 * stock age) are one hue, monotone, with visible steps, clearing the
 * surface. Status colours are reserved for good / warning / critical and
 * always come with an icon and a label.
 */
const LIGHT = {
  series1: "#2a78d6", // blue — B2B / the single series
  series2: "#eb6834", // orange — counter
  grid: "#e1e0d9",
  axis: "#898781",
  ink: "#0b0b0b",
  ink2: "#52514e",
  surface: "#ffffff",
  aging: ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"],
  stockAge: ["#86b6ef", "#2a78d6", "#1c5cab", "#0d366b"],
};
const DARK = {
  series1: "#3987e5",
  series2: "#d95926",
  grid: "#333331",
  axis: "#898781",
  ink: "#ffffff",
  ink2: "#c3c2b7",
  surface: "#242424",
  aging: ["#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#cde2fb"],
  stockAge: ["#256abf", "#6da7ec", "#9ec5f4", "#cde2fb"],
};
export const STATUS = { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b", info: "#3987e5" };
export const vizPalette = (theme) => (theme === "light" ? LIGHT : DARK);
