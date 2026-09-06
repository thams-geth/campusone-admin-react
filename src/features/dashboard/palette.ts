/**
 * Chart colors, sourced from the validated categorical palette in the
 * dataviz skill (references/palette.md) — light mode only, since the
 * app doesn't yet support a dark theme. Slot order is fixed (the
 * CVD-safety mechanism), so departments are assigned colors by index,
 * never re-sorted by value.
 */
export const CATEGORICAL_PALETTE = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
] as const

/** Single-series accent — closest validated slot to the app's brand primary. */
export const ACCENT_COLOR = '#4a3aa7'

export const CHART_INK = {
  secondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
}
