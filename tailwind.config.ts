import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090C10",
        surface: {
          DEFAULT: "#0F141D",
          muted: "#131A26",
          hover: "#182130",
          active: "#1E2A3D",
        },
        border: {
          subtle: "#17202E",
          DEFAULT: "#202C3F",
          strong: "#30415D",
        },
        brand: {
          blue: "#0284C7",
          cyan: "#38BDF8",
          emerald: "#10B981",
          rose: "#EF4444",
          amber: "#F59E0B",
          purple: "#8B5CF6",
        },
        market: {
          up: "#10B981",
          down: "#EF4444",
          neutral: "#94A3B8",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "'Courier New'",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
