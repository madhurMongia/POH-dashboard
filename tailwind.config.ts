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
        poh: {
          orange: "var(--color-orange)",
          pink: "var(--color-pink)",
          yellow: "var(--color-yellow)",
          bg: {
            primary: "var(--bg-primary)",
            secondary: "var(--bg-secondary)",
          },
          text: {
            primary: "var(--text-primary)",
            secondary: "var(--text-secondary)",
          },
          stroke: "var(--stroke)",
          tint: {
            purple: "var(--tint-purple)",
            green: "var(--tint-green)",
            lightGreen: "var(--tint-light-green)",
            blue: "var(--tint-blue)",
            red: "var(--tint-red)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
