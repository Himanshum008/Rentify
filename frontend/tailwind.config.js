/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#eff6ff',
          border: '#bfdbfe',
          dark: '#1e40af'
        },
        dark: {
          DEFAULT: '#0f172a',
          card: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
