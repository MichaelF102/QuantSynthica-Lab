import type { Config } from "tailwindcss";

/**
 * Theme tokens are CSS variables (see app/globals.css). The helper below keeps
 * Tailwind opacity modifiers (e.g. `border-border/80`) working with var() colours.
 */
const token = (name: string): string =>
  (({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined || opacityValue === "1"
      ? `var(${name})`
      : `color-mix(in srgb, var(${name}) ${Number(opacityValue) * 100}%, transparent)`) as unknown as string;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DESIGN.md §4.1 semantic tokens
        canvas: token("--bg-canvas"),
        surface: {
          DEFAULT: token("--bg-surface"),
          // legacy aliases kept so existing class names resolve to the navy palette
          muted: token("--hover-bg"),
          hover: token("--hover-bg"),
          active: "#16213a",
          elevated: token("--bg-surface"),
        },
        border: {
          DEFAULT: token("--border-color"),
          subtle: token("--border-color"),
          strong: "#334155",
        },
        primary: token("--text-primary"),
        secondary: token("--text-secondary"),
        accent: {
          DEFAULT: token("--accent-color"),
          hover: "#1D4ED8",
          subtle: token("--accent-subtle-color"),
        },
        positive: { DEFAULT: token("--positive-color"), subtle: token("--positive-subtle-color") },
        negative: { DEFAULT: token("--negative-color"), subtle: token("--negative-subtle-color") },
        warning: { DEFAULT: token("--warning-color"), subtle: token("--warning-subtle-color") },
        background: token("--bg-canvas"),
        // legacy brand/market aliases mapped onto the one-accent-per-meaning palette
        brand: {
          blue: "#2563EB",
          cyan: "#3B82F6",
          emerald: "#10B981",
          rose: "#F43F5E",
          amber: "#F59E0B",
          purple: "#A855F7",
        },
        market: {
          up: "#10B981",
          down: "#F43F5E",
          neutral: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        panel: "0 10px 15px -3px rgba(0,0,0,0.2)",
      },
      keyframes: {
        "qs-fade-up": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "qs-fade-up 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
