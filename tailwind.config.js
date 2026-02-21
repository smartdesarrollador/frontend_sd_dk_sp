/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          strip: "#1e1e2e",
          panel: "#13131f",
        },
      },
    },
  },
  plugins: [],
};
