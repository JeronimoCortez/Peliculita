import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        peli: {
          bg: "#0b0d10",
          card: "#181b20",
          accent: "#e50914",
          accentHover: "#f6121d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
