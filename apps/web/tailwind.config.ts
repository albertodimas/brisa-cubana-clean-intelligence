import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand colors (mantener existente)
        brisa: {
          50: "#ecfcff",
          100: "#d6f6fb",
          200: "#acecf4",
          300: "#7adfe9",
          400: "#45d0dc",
          500: "#1ecad3",
          600: "#15aeb6",
          700: "#0f8c94",
          800: "#0c6870",
          900: "#0a4750",
        },
        // Semantic colors (aliases)
        primary: {
          50: "#ecfcff",
          100: "#d6f6fb",
          200: "#acecf4",
          300: "#7adfe9",
          400: "#45d0dc",
          500: "#1ecad3",
          600: "#15aeb6",
          700: "#0f8c94",
          800: "#0c6870",
          900: "#0a4750",
        },
        brandNavy: {
          50: "#f3f6fb",
          100: "#dee4f2",
          200: "#c0cae0",
          300: "#9aa9c7",
          400: "#6f84a9",
          500: "#4d6491",
          600: "#344b77",
          700: "#24385d",
          800: "#162741",
          900: "#0d1a2d",
        },
        success: colors.emerald,
        warning: colors.amber,
        error: colors.red,
        info: colors.blue,
        neutral: colors.slate,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        "0.5": "0.125rem",
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
        8: "2rem",
        10: "2.5rem",
        12: "3rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
        32: "8rem",
        40: "10rem",
        48: "12rem",
        56: "14rem",
        64: "16rem",
      },
      borderRadius: {
        none: "0",
        xs: "0.125rem",
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        DEFAULT:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        md: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        lg: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        xl: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "2xl": "0 50px 100px -20px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none: "none",
      },
      transitionTimingFunction: {
        "ease-elastic": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "ease-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-bounce": "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-smooth",
        "slide-up": "slide-up 0.4s ease-smooth",
        "slide-down": "slide-down 0.4s ease-smooth",
        "scale-in": "scale-in 0.2s ease-smooth",
        shimmer: "shimmer 2s infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
        "3xl": "64px",
      },
      zIndex: {
        "0": "0",
        "10": "10",
        "20": "20",
        "30": "30",
        "40": "40",
        "50": "50",
        "100": "100",
        "200": "200",
        "300": "300",
        "400": "400",
        "500": "500",
        auto: "auto",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, addComponents, theme }) {
      // Utilidades de scrollbar personalizadas
      addUtilities({
        ".scrollbar-thin": {
          scrollbarWidth: "thin",
          scrollbarColor: `${theme("colors.brisa.700")} ${theme("colors.brisa.900")}`,
        },
        ".scrollbar-none": {
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });

      // Utilidades de glassmorphism
      addUtilities({
        ".glass": {
          backgroundColor: "rgba(18, 42, 68, 0.28)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          border: "1px solid rgba(69, 208, 220, 0.15)",
        },
        ".glass-strong": {
          backgroundColor: "rgba(13, 33, 53, 0.52)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(69, 208, 220, 0.25)",
        },
        ".glass-ultra": {
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
          backdropFilter: "blur(20px) saturate(200%) brightness(110%)",
          WebkitBackdropFilter: "blur(20px) saturate(200%) brightness(110%)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        },
        ".glass-frosted": {
          backgroundColor: "rgba(9, 31, 45, 0.62)",
          backdropFilter: "blur(16px) brightness(110%)",
          WebkitBackdropFilter: "blur(16px) brightness(110%)",
          border: "1px solid rgba(69, 208, 220, 0.2)",
          boxShadow: "0 4px 24px rgba(6, 34, 46, 0.35)",
        },
        ".glass-reflection": {
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)",
            animation: "shimmer 3s infinite",
          },
        },
      });

      // Utilidades de text truncate mejoradas
      addUtilities({
        ".line-clamp-1": {
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: "1",
        },
        ".line-clamp-2": {
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: "2",
        },
        ".line-clamp-3": {
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: "3",
        },
      });
    }),
  ],
} satisfies Config;

export default config;
