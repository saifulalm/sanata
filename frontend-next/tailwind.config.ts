import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    // ── Brand Colors ────────────────────────────────────────────────
    colors: {
      // Primary – Charcoal #20282C
      charcoal: {
        DEFAULT: "#20282C",
        50: "#E8ECED",
        100: "#C8CED0",
        200: "#9AA9AD",
        300: "#6C848A",
        400: "#3E5F67",
        500: "#2C3A40",
        600: "#20282C", // base
        700: "#192023",
        800: "#12181B",
        900: "#0C1012",
        950: "#060809",
      },
      // Accent – Desert #C9AD82
      desert: {
        DEFAULT: "#C9AD82",
        50: "#FAF6F0",
        100: "#F2E6D6",
        200: "#E6CEAF",
        300: "#D4B98C", // lighter
        400: "#C9AD82", // base
        500: "#B89A6F", // darker
        600: "#9A7D54",
        700: "#7C6343",
        800: "#5E4932",
        900: "#402F21",
        950: "#221810",
      },
    },

    // ── Typography ──────────────────────────────────────────────────
    fontFamily: {
      display: ["Avenir", "ui-sans-serif", "system-ui", "sans-serif"],
      body: ["Avenir", "ui-sans-serif", "system-ui", "sans-serif"],
      sans: ["Avenir", "ui-sans-serif", "system-ui", "sans-serif"],
    },
    fontSize: {
      "display-2xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "900" }],
      "display-xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "900" }],
      "display-lg": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "800" }],
      "display-md": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "800" }],
      "display-sm": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.005em", fontWeight: "700" }],
      "heading-xl": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
      "heading-lg": ["1.5rem", { lineHeight: "1.3", fontWeight: "700" }],
      "heading-md": ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
      "heading-sm": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
      "eyebrow": ["0.75rem", { lineHeight: "1", letterSpacing: "0.2em", fontWeight: "600" }],
      "body-lg": ["1.125rem", { lineHeight: "1.75", fontWeight: "400" }],
      "body-md": ["1rem", { lineHeight: "1.7", fontWeight: "400" }],
      "body-sm": ["0.875rem", { lineHeight: "1.65", fontWeight: "400" }],
      "caption": ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
    },

    // ── Spacing ─────────────────────────────────────────────────────
    spacing: {
      "18": "4.5rem",
      "22": "5.5rem",
      "26": "6.5rem",
      "30": "7.5rem",
      "34": "8.5rem",
      "section-sm": "4rem",
      "section-md": "6rem",
      "section-lg": "8rem",
      "section-xl": "10rem",
    },

    // ── Border Radius ───────────────────────────────────────────────
    borderRadius: {
      xs: "0.25rem",    // 4px – tight corners
      sm: "0.5rem",     // 8px
      DEFAULT: "0.75rem", // 12px
      md: "0.875rem",   // 14px
      lg: "1rem",       // 16px
      xl: "1.25rem",    // 20px
      "2xl": "1.5rem",  // 24px
      "3xl": "2rem",    // 32px
      "4xl": "2.5rem",  // 40px
      full: "9999px",
      pill: "9999px",
    },

    // ── Shadows ────────────────────────────────────────────────────
    boxShadow: {
      "brand-sm": "0 1px 3px rgba(32,40,44,0.3), 0 1px 2px rgba(32,40,44,0.2)",
      "brand-md": "0 4px 16px rgba(32,40,44,0.25), 0 2px 6px rgba(32,40,44,0.15)",
      "brand-lg": "0 10px 40px rgba(32,40,44,0.3), 0 4px 12px rgba(32,40,44,0.2)",
      "brand-xl": "0 20px 60px rgba(32,40,44,0.35), 0 8px 20px rgba(32,40,44,0.2)",
      "desert-subtle": "0 2px 8px rgba(201,173,130,0.15)",
      "desert-md": "0 4px 20px rgba(201,173,130,0.2)",
      "desert-lg": "0 8px 32px rgba(201,173,130,0.25)",
      "inner-soft": "inset 0 1px 3px rgba(32,40,44,0.15)",
    },

    // ── Transitions ────────────────────────────────────────────────
    transitionDuration: {
      DEFAULT: "250ms",
      "150": "150ms",
      "200": "200ms",
      "300": "300ms",
      "400": "400ms",
      "600": "600ms",
    },
    transitionTimingFunction: {
      DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      brand: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      entrance: "cubic-bezier(0, 0, 0.2, 1)",
      exit: "cubic-bezier(0.4, 0, 1, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },

    // ── Opacity ─────────────────────────────────────────────────────
    opacity: {
      0: "0",
      5: "0.05",
      10: "0.1",
      15: "0.15",
      20: "0.2",
      25: "0.25",
      30: "0.3",
      40: "0.4",
      50: "0.5",
      60: "0.6",
      70: "0.7",
      75: "0.75",
      80: "0.8",
      90: "0.9",
      95: "0.95",
      100: "1",
    },

    // ── Backdrop Blur ───────────────────────────────────────────────
    backdropBlur: {
      xs: "2px",
      sm: "4px",
      DEFAULT: "8px",
      md: "12px",
      lg: "16px",
      xl: "24px",
      "2xl": "40px",
    },
  },

  plugins: [],
} satisfies Config;
