import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Shared animation helpers. All motion in the template goes through these
 * two hooks so the feel stays consistent: springs for entrances,
 * linear interpolate for fades.
 */

/**
 * Spring-driven entrance. Returns a 0→1 progress value that starts after
 * `delay` frames (relative to the enclosing <Sequence>).
 *
 * damping 200 = fully damped: smooth ease-out with no bounce/overshoot,
 * which keeps the motion minimal and on-brand.
 */
export const useEnter = (delay: number, durationInFrames = 30): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return spring({
    frame: frame - delay,
    fps,
    durationInFrames,
    config: { damping: 200 },
  });
};

/**
 * Per-section fade: eases in over the first `fadeIn` frames and out over
 * the last `fadeOut` frames of a section, so cuts between <Sequence>
 * blocks read as gentle cross-dissolves instead of hard jumps.
 */
export const useSectionOpacity = (
  sectionDuration: number,
  fadeIn = 8,
  fadeOut = 14,
): number => {
  const frame = useCurrentFrame();

  return interpolate(
    frame,
    [0, fadeIn, sectionDuration - fadeOut, sectionDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};
