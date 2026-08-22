import { Plus_Jakarta_Sans, Inter, Manrope } from "next/font/google";

export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
});
