/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mech: {
          red: "#ef4444",
          green: "#22c55e",
          purple: "#a855f7",
          blue: "#3b82f6",
          gray: "#6b7280",
          dark: "#111827",
        },
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        flash: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
        flash: "flash 0.3s ease-in-out 3",
      },
    },
  },
  plugins: [],
};
