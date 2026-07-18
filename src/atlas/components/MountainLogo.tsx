import React from "react";
import { COLORS } from "../theme";

type MountainLogoProps = {
  /** Rendered width in px (height scales automatically) */
  size: number;
  color?: string;
  strokeWidth?: number;
  /**
   * 0→1 "draw-on" progress for the line art. Omit (or pass 1) for a
   * fully drawn, static logo.
   */
  drawProgress?: number;
  opacity?: number;
};

/**
 * Minimalist Atlas mark: a twin-peak mountain drawn as a single stroke,
 * with a short horizon line beneath. Pure SVG, so it scales losslessly
 * from a footer badge to a full-screen watermark.
 */
export const MountainLogo: React.FC<MountainLogoProps> = ({
  size,
  color = COLORS.white,
  strokeWidth = 5,
  drawProgress = 1,
  opacity = 1,
}) => {
  return (
    <svg
      width={size}
      height={size * (80 / 120)}
      viewBox="0 0 120 80"
      fill="none"
      style={{ opacity, display: "block" }}
    >
      {/* Twin peaks — pathLength=1 lets us animate the draw with a 0→1 dashoffset */}
      <path
        d="M 10 66 L 45 14 L 61 40 L 77 20 L 110 66"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - drawProgress}
      />
      {/* Horizon line, drawn slightly behind the peaks */}
      <path
        d="M 24 74 L 96 74"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - drawProgress}
      />
    </svg>
  );
};
