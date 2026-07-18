import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { useEnter, useSectionOpacity } from "../animations";
import { MountainLogo } from "../components/MountainLogo";
import { SlideIn } from "../components/SlideIn";
import { COLORS, FONT_FAMILY, TIMING } from "../theme";

type ClosingProps = {
  tagline: string;
  ctaText: string;
  clientName: string;
  clientLogoUrl: string;
};

/** Resolve either a full URL or a filename inside /public */
const resolveAsset = (src: string) =>
  src.startsWith("http") ? src : staticFile(src);

/**
 * Section 3 (13–18s): the brand moment.
 * Logo draws itself on and springs to center, wordmark + tagline appear
 * beneath, then the CTA button scales in. An optional client footer
 * ("Prepared for …") renders only when clientName/clientLogoUrl are set.
 */
export const Closing: React.FC<ClosingProps> = ({
  tagline,
  ctaText,
  clientName,
  clientLogoUrl,
}) => {
  const sectionOpacity = useSectionOpacity(TIMING.closing, 8, 20);

  // Logo entrance: draw-on stroke + gentle scale settle
  const logoProgress = useEnter(0, 45);
  const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1]);

  // CTA entrance
  const ctaProgress = useEnter(52);
  const ctaScale = interpolate(ctaProgress, [0, 1], [0.9, 1]);

  const hasClientFooter = clientName !== "" || clientLogoUrl !== "";

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: sectionOpacity,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ transform: `scale(${logoScale})` }}>
        <MountainLogo size={280} strokeWidth={6} drawProgress={logoProgress} />
      </div>

      <SlideIn delay={22} distance={24} style={{ marginTop: 48 }}>
        <div
          style={{
            color: COLORS.white,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: 16,
            textAlign: "center",
            // Offset the trailing letter-spacing so the word looks centered
            paddingLeft: 16,
          }}
        >
          ATLAS
        </div>
      </SlideIn>

      <SlideIn delay={34} distance={24} style={{ marginTop: 20 }}>
        <p
          style={{
            color: COLORS.muted,
            fontSize: 40,
            fontWeight: 500,
            margin: 0,
            textAlign: "center",
          }}
        >
          {tagline}
        </p>
      </SlideIn>

      {/* Button-style CTA */}
      <div
        style={{
          marginTop: 96,
          opacity: ctaProgress,
          transform: `scale(${ctaScale})`,
          border: `3px solid ${COLORS.white}`,
          borderRadius: 999,
          padding: "30px 64px",
          color: COLORS.white,
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {ctaText}
      </div>

      {hasClientFooter && (
        <SlideIn
          delay={62}
          distance={16}
          style={{ position: "absolute", bottom: 100 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <span
              style={{
                color: COLORS.muted,
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              Prepared for
            </span>
            {clientLogoUrl !== "" ? (
              <Img
                src={resolveAsset(clientLogoUrl)}
                style={{ height: 56, objectFit: "contain" }}
              />
            ) : (
              <span
                style={{ color: COLORS.white, fontSize: 32, fontWeight: 700 }}
              >
                {clientName}
              </span>
            )}
          </div>
        </SlideIn>
      )}
    </AbsoluteFill>
  );
};
