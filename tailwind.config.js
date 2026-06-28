/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: "#00f0ff",
          blue: "#0066ff",
          indigo: "#6366f1",
          pink: "#ff007f",
          purple: "#a855f7",
          green: "#10b981",
          yellow: "#f59e0b",
          red: "#ef4444",
          dark: "#0b0f19",
          slate: "#1e293b",
          light: "#f8fafc"
        }
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        mono: ["Fira Code", "Courier New", "monospace"]
      },
      boxShadow: {
        neon: "0 0 15px rgba(0, 240, 255, 0.4)",
        "neon-pink": "0 0 15px rgba(255, 0, 127, 0.4)",
        "neon-green": "0 0 15px rgba(16, 185, 129, 0.4)"
      }
    },
  },
  plugins: [],
}
