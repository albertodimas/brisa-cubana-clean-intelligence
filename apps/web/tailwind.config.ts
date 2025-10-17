import type { Config } from "tailwindcss";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brisa: {
          50: "#e6f4f1",
          100: "#d5f6eb",
          200: "#b8d9d0",
          300: "#7ee7c4",
          400: "#6fb8a6",
          500: "#4a9d8e",
          600: "#2d7a6e",
          700: "#1a5750",
          800: "#0d3d38",
          900: "#050b0f",
        },
      },
    },
  },
} satisfies Config;

export default config;
