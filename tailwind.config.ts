import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1B33",
        paper: "#F5F7FA",
        accent: "#2563EB",
        "accent-deep": "#1D4ED8",
        slate: "#5B6472",
        line: "#E3E8EF",
        "line-dark": "#1E2A44",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,27,51,0.04), 0 12px 32px -12px rgba(11,27,51,0.12)",
        lift: "0 2px 4px rgba(11,27,51,0.06), 0 20px 48px -16px rgba(11,27,51,0.20)",
      },
    },
  },
  plugins: [],
};

export default config;
