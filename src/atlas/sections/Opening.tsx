import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { useEnter, useSectionOpacity } from "../animations";
import { SlideIn } from "../components/SlideIn";
import { COLORS, FONT_FAMILY, SAFE_MARGIN, TIMING } from "../theme";

type OpeningProps = {
  headline: string;
  subheadline: string;
};

/**
 * Section 1 (0–2s): the hook.
 * Headline slides up, a thin accent rule expands beneath it,
 * then the subheadline follows a few frames later.
 */
export const Opening: React.FC<OpeningProps> = ({ headline, subheadline }) => {
  const sectionOpacity = useSectionOpacity(TIMING.opening);

  // The accent rule grows with the same spring as the headline entrance
  const ruleProgress = useEnter(10);
  const ruleWidth = interpolate(ruleProgress, [0, 1], [0, 180]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: `0 ${SAFE_MARGIN}px`,
        opacity: sectionOpacity,
        fontFamily: FONT_FAMILY,
      }}
    >
      <SlideIn delay={4}>
        <h1
          style={{
            color: COLORS.white,
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: -1,
            margin: 0,
          }}
        >
          {headline}
        </h1>
      </SlideIn>

      <div
        style={{
          width: ruleWidth,
          height: 6,
          backgroundColor: COLORS.white,
          borderRadius: 3,
          margin: "42px 0",
        }}
      />

      <SlideIn delay={14}>
        <p
          style={{
            color: COLORS.muted,
            fontSize: 42,
            fontWeight: 500,
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          {subheadline}
        </p>
      </SlideIn>
    </AbsoluteFill>
  );
};
