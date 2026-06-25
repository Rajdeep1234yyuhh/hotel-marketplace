import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14121F",
        paper: "#FBF8F3",
        brass: "#C8A24B",
        "brass-deep": "#A8842F",
        slate: "#4A4658",
        line: "#E7E0D6",
        "line-dark": "#2A2738",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,18,31,0.04), 0 12px 32px -12px rgba(20,18,31,0.12)",
        lift: "0 2px 4px rgba(20,18,31,0.06), 0 20px 48px -16px rgba(20,18,31,0.20)",
      },
    },
  },
  plugins: [],
};

export default config;
