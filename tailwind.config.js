/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        darkpurple: "#380040",
        cyan: "#048c99",
      },
    },
  },
  plugins: [],
};
