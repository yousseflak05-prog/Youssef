import React from "react";
import { useEnter } from "../animations";

type SlideInProps = {
  /** Frames to wait (within the current section) before entering */
  delay: number;
  /** Direction the element travels FROM */
  from?: "bottom" | "left";
  /** Travel distance in px */
  distance?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Generic entrance wrapper: fades in while sliding from `from`.
 * Used for every text element so all entrances share one motion curve.
 */
export const SlideIn: React.FC<SlideInProps> = ({
  delay,
  from = "bottom",
  distance = 48,
  style,
  children,
}) => {
  const progress = useEnter(delay);

  const offset = (1 - progress) * distance;
  const transform =
    from === "bottom" ? `translateY(${offset}px)` : `translateX(${-offset}px)`;

  return (
    <div style={{ opacity: progress, transform, ...style }}>{children}</div>
  );
};
