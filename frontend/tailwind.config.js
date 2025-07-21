/** @type {import('tailwindcss').Config} */

const { nextui } = require("@nextui-org/react");

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        light: {
          bg: "#fffde7",        // amarillo pastel claro
          card: "#ffffff",      // blanco puro
          text: "#1e1e1e",      // gris oscuro neutro
          accent: "#ffca28",    // amarillo dorado vibrante
          secondary: "#3f51b5", // índigo vibrante
        },
        dark: {
          bg: "#1a1a2e",        // azul muy oscuro
          card: "#16213e",      // azul oscuro
          text: "#f3f4f6",      // gris claro
          accent: "#ffeb3b",    // amarillo brillante
          secondary: "#82b1ff", // azul celeste pastel
        },
      },
      boxShadow: {
        glass: "0 8px 24px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [
    nextui({
      layout: {
        disabledOpacity: "0.3",
        radius: {
          small: "2px",
          medium: "4px",
          large: "6px",
        },
        borderWidth: {
          small: "1px",
          medium: "1px",
          large: "2px",
        },
      },
      themes: {
        light: {},
        dark: {},
      },
    }),
  ],
};
