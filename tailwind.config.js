/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dial: {
          950: "#060709",
          900: "#0a0c10",
          850: "#101318",
          800: "#161a22",
          750: "#1d222d",
          700: "#252b39",
          600: "#374154",
        },
        gold: {
          100: "#fdf8ea",
          200: "#f8ecc5",
          300: "#edd58c",
          400: "#dfb851",
          500: "#cf9f2d",
          600: "#b58220",
          700: "#916019",
          800: "#764c1a",
        },
        rosegold: {
          300: "#f4cfc6",
          400: "#e69e8e",
          500: "#d07361",
          600: "#ba5544",
        },
        steel: {
          100: "#eef1f5",
          200: "#d9dfe7",
          300: "#b8c3d1",
          400: "#92a0b3",
          500: "#6e7e93",
          600: "#536173",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "Cinzel", "Playfair Display", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      boxShadow: {
        dial: "0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.07)",
        "dial-lg": "0 20px 50px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(207, 159, 45, 0.2)",
        gold: "0 0 25px -5px rgba(207, 159, 45, 0.25)",
        inset: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "sweep-tick": "tick 1s steps(8) infinite",
        "gear-spin": "spin 20s linear infinite",
        "gear-reverse": "spin-reverse 15s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};
