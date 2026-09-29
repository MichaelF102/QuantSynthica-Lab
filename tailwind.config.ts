import type { Config } from "tailwindcss";

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
        background: "#131722",
        surface: {
          DEFAULT: "#1e222d",
          muted: "#2a2e39",
          hover: "#2a2e39",
          active: "#363a45",
          elevated: "#1e222d",
        },
        border: {
          subtle: "#1e222d",
          DEFAULT: "#2a2e39",
          strong: "#434651",
        },
        brand: {
          blue: "#2962FF",
          cyan: "#2962FF",
          emerald: "#089981",
          rose: "#f23645",
          amber: "#2962FF",
          purple: "#ab47bc",
        },
        market: {
          up: "#089981",
          down: "#f23645",
          neutral: "#787b86",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Trebuchet MS",
          "Arial",
          "sans-serif",
        ],
        serif: [
          "var(--font-sans)",
          "Trebuchet MS",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        panel: "0 2px 4px rgba(0,0,0,0.35)",
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
