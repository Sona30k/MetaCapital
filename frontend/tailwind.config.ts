import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#070A0F",
          900: "#0B1020",
          800: "#101A2C",
          700: "#19243A",
          200: "#D6DBE6",
        },
        accent: {
          500: "#7C3AED",
          400: "#A78BFA",
        },
        success: "#22C55E",
        danger: "#EF4444",
        warn: "#F59E0B",
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0,0,0,.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;

