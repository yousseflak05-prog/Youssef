import React from "react";
import { AbsoluteFill } from "remotion";
import { useEnter, useSectionOpacity } from "../animations";
import { MountainLogo } from "../components/MountainLogo";
import { SlideIn } from "../components/SlideIn";
import { COLORS, FONT_FAMILY, SAFE_MARGIN, TIMING } from "../theme";

type MiddleProps = {
  bullets: string[];
};

/**
 * Section 2 (2–13s): supporting points.
 * A small logo + wordmark anchor the top, a huge faint mountain
 * watermark keeps the brand subtly present, and the bullets slide in
 * one after another. Stagger adapts to the bullet count so any
 * 1–5 items pace themselves across the section automatically.
 */
export const Middle: React.FC<MiddleProps> = ({ bullets }) => {
  const sectionOpacity = useSectionOpacity(TIMING.middle);

  // Spread entrances across the section, leaving the last bullet
  // at least ~3s of screen time before the closing.
  const stagger = Math.floor((TIMING.middle - 110) / bullets.length);

  const headerProgress = useEnter(0);

  return (
    <AbsoluteFill
      style={{ opacity: sectionOpacity, fontFamily: FONT_FAMILY }}
    >
      {/* Faint oversized watermark, subtly present behind the content */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <MountainLogo size={900} opacity={0.05} strokeWidth={3} />
      </AbsoluteFill>

      {/* Top brand anchor: small logo + wordmark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: `${SAFE_MARGIN}px ${SAFE_MARGIN}px 0`,
          opacity: headerProgress,
        }}
      >
        <MountainLogo size={72} strokeWidth={7} />
        <span
          style={{
            color: COLORS.white,
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: 10,
          }}
        >
          ATLAS
        </span>
      </div>

      {/* Sequentially animated talking points */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 72,
          padding: `0 ${SAFE_MARGIN}px`,
        }}
      >
        {bullets.map((text, i) => (
          <SlideIn key={i} delay={18 + i * stagger} from="left">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
              {/* Peak-shaped bullet marker */}
              <svg
                width={40}
                height={40}
                viewBox="0 0 40 40"
                fill="none"
                style={{ flexShrink: 0, marginTop: 10 }}
              >
                <path
                  d="M 6 30 L 20 10 L 34 30"
                  stroke={COLORS.white}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p
                style={{
                  color: COLORS.white,
                  fontSize: 46,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {text}
              </p>
            </div>
          </SlideIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};
