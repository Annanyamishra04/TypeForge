/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--tf-bg) / <alpha-value>)",
        "bg-elevated": "rgb(var(--tf-bg-elevated) / <alpha-value>)",
        surface: "rgb(var(--tf-surface) / <alpha-value>)",
        "surface-hover": "rgb(var(--tf-surface-hover) / <alpha-value>)",
        border: "rgb(var(--tf-border) / <alpha-value>)",
        "border-strong": "rgb(var(--tf-border-strong) / <alpha-value>)",

        "text-primary": "rgb(var(--tf-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--tf-text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--tf-text-tertiary) / <alpha-value>)",

        accent: "rgb(var(--tf-accent) / <alpha-value>)",
        "accent-strong": "rgb(var(--tf-accent-strong) / <alpha-value>)",
        "accent-contrast": "rgb(var(--tf-accent-contrast) / <alpha-value>)",

        success: "rgb(var(--tf-success) / <alpha-value>)",
        danger: "rgb(var(--tf-danger) / <alpha-value>)",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "72rem",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: 1 },
          "50%, 100%": { opacity: 0 },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-up": "fade-up 0.5s ease-out",
      },
    },
  },
  plugins: [],
};
