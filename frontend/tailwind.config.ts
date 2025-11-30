import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8A373F", // Deep Wine (로고 색상)
        background: "#F8F5F0", // Warm Cream
        text: "#3A3A3A", // Dark Charcoal
        secondary: "#6B7280", // Warm Gray
        accent: "#A4B0BE", // Muted Blue
      },
      fontFamily: {
        serif: ["var(--font-serif)", "var(--font-playfair)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"],
      },
      backgroundImage: {
        'hero-pattern': "url('https://www.genspark.ai/api/files/s/k3dEEpTL')",
      }
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
