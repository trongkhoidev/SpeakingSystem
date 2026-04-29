/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tailwind has slate, blue, green, red by default
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
