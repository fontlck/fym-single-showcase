/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0d0d0f",
          primary: "#ddfe78",
          secondary: "#a3aaf5",
          accent: "#ee7944"
        }
      }
    }
  },
  plugins: []
}
