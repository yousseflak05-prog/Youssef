import { z } from "zod";

/**
 * Every piece of content in the video is a prop — swap these to re-render
 * the template with different copy without touching any animation code.
 *
 * The schema also powers the props editor in Remotion Studio
 * (right sidebar → "Props"), and can be overridden at render time:
 *
 *   npx remotion render AtlasPromo out/client.mp4 --props=./my-props.json
 */
export const atlasPromoSchema = z.object({
  /** Bold hook statement shown in the opening (0–2s) */
  headline: z.string(),
  /** Smaller supporting line under the headline */
  subheadline: z.string(),
  /** Sequential talking points for the middle section (1–5 items) */
  bullets: z.array(z.string()).min(1).max(5),
  /** Brand tagline shown under the logo in the closing */
  tagline: z.string(),
  /** Call-to-action text rendered inside the button-style border */
  ctaText: z.string(),
  /** Client name shown in the closing footer. Empty string = hidden. */
  clientName: z.string(),
  /**
   * Client logo shown next to the client name. Empty string = hidden.
   * Either a full URL, or a filename inside /public (e.g. "client.png").
   */
  clientLogoUrl: z.string(),
});

export type AtlasPromoProps = z.infer<typeof atlasPromoSchema>;

/** Default copy — acts as the reusable "config" for the template. */
export const defaultAtlasProps: AtlasPromoProps = {
  headline: "Your brand deserves the summit.",
  subheadline: "Atlas builds campaigns that move people.",
  bullets: [
    "Strategy rooted in real audience data",
    "Creative that cuts through the noise",
    "Full-funnel campaigns, one partner",
    "Reporting you can actually read",
  ],
  tagline: "Marketing that climbs.",
  ctaText: "Book a free strategy call",
  clientName: "",
  clientLogoUrl: "",
};
