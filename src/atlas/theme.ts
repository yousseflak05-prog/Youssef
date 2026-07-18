/**
 * Atlas brand constants + section timing.
 *
 * Everything visual (colors, fonts) and temporal (section lengths) lives
 * here so the animation code never hardcodes brand values. Change the
 * brand or re-pace the video by editing this single file.
 */

export const COLORS = {
  /** Dark navy background */
  navy: "#1a2332",
  /** Slightly lighter navy, used for the background's radial glow */
  navySoft: "#243044",
  /** Primary text */
  white: "#ffffff",
  /** Secondary / muted text (subheadlines, tagline, labels) */
  muted: "#93a4bd",
} as const;

export const FONT_FAMILY =
  '"Helvetica Neue", Helvetica, "Arial Black", Arial, sans-serif';

/** Horizontal safe margin so text never touches the edges (px at 1080 wide) */
export const SAFE_MARGIN = 96;

export const FPS = 30;

/**
 * Section lengths in frames (at 30fps).
 * Opening 2s → Middle 11s → Closing 5s = 18s total.
 */
export const TIMING = {
  opening: 60,
  middle: 330,
  closing: 150,
} as const;

export const TOTAL_DURATION_IN_FRAMES =
  TIMING.opening + TIMING.middle + TIMING.closing;
