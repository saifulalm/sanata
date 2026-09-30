import { Plus_Jakarta_Sans, Inter, Manrope } from "next/font/google";

/**
 * Font configuration - Brand Guideline specifies Avenir (commercial font).
 * Since Avenir is not on Google Fonts, we use Nunito Sans as closest alternative
 * that IS available. User can load Avenir via @font-face from CDN if they have license.
 * 
 * Font weights per brand guideline:
 * - Black (900) = Headlines
 * - Heavy (800) = Sub-headlines  
 * - Roman (400) = Body text
 */

// Primary display font - closest Avenir alternative on Google Fonts
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Body font
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Accent font
export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
});
