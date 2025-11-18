import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        guild: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          accent: "#ec4899",
          dark: "#1e1b4b",
          darker: "#0f172a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
