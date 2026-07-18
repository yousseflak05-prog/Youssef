import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AtlasPromoProps } from "./schema";
import { Closing } from "./sections/Closing";
import { Middle } from "./sections/Middle";
import { Opening } from "./sections/Opening";
import { COLORS, TIMING } from "./theme";

/**
 * AtlasPromo — vertical (1080x1920) promo template for Atlas.
 *
 * Pure composition shell: it paints the brand background and lays the
 * three sections on the timeline. All copy arrives via props (see
 * schema.ts), all timing/brand values via theme.ts — so re-rendering
 * with new content never touches this file or the sections' animations.
 *
 * Timeline:  [ Opening 0–2s ][ Middle 2–13s ][ Closing 13–18s ]
 */
export const AtlasPromo: React.FC<AtlasPromoProps> = ({
  headline,
  subheadline,
  bullets,
  tagline,
  ctaText,
  clientName,
  clientLogoUrl,
}) => {
  return (
    <AbsoluteFill
      style={{
        // Navy base with a soft radial glow for depth without noise
        background: `radial-gradient(120% 90% at 50% 30%, ${COLORS.navySoft} 0%, ${COLORS.navy} 65%)`,
      }}
    >
      <Sequence durationInFrames={TIMING.opening} name="Opening">
        <Opening headline={headline} subheadline={subheadline} />
      </Sequence>

      <Sequence
        from={TIMING.opening}
        durationInFrames={TIMING.middle}
        name="Middle"
      >
        <Middle bullets={bullets} />
      </Sequence>

      <Sequence
        from={TIMING.opening + TIMING.middle}
        durationInFrames={TIMING.closing}
        name="Closing"
      >
        <Closing
          tagline={tagline}
          ctaText={ctaText}
          clientName={clientName}
          clientLogoUrl={clientLogoUrl}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
