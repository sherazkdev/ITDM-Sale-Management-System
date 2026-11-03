import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(357 100% 97%)",
          100: "hsl(357 95% 94%)",
          200: "hsl(357 90% 88%)",
          300: "hsl(357 85% 78%)",
          400: "hsl(357 88% 62%)",
          500: "hsl(357 93% 46%)",
          600: "hsl(357 85% 40%)",
          700: "hsl(357 78% 34%)",
          800: "hsl(357 70% 28%)",
          900: "hsl(357 65% 22%)",
          950: "hsl(357 60% 14%)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(152 60% 42%)",
          foreground: "hsl(0 0% 100%)",
          soft: "hsl(150 60% 95%)",
          softFg: "hsl(152 60% 28%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(0 0% 100%)",
          soft: "hsl(40 100% 96%)",
          softFg: "hsl(30 80% 40%)",
        },
        info: {
          DEFAULT: "hsl(212 90% 55%)",
          foreground: "hsl(0 0% 100%)",
          soft: "hsl(212 100% 96%)",
          softFg: "hsl(212 80% 40%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.05), 0 0 0 1px rgb(15 23 42 / 0.02)",
        soft: "0 8px 24px -8px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.04)",
        pop: "0 10px 30px -10px hsl(357 93% 46% / 0.28)",
        inset: "inset 0 1px 0 0 rgb(255 255 255 / 0.06)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(357 93% 46%) 0%, hsl(0 76% 38%) 100%)",
        "brand-soft":
          "linear-gradient(135deg, hsl(357 100% 97%) 0%, hsl(0 100% 97%) 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
