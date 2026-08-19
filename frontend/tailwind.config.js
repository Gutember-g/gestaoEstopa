/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1E1E2D',
          950: '#151521',
        },
        slate: {
          100: '#F3F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(148, 163, 184, 0.1), 0 1px 2px 0 rgba(148, 163, 184, 0.06)',
        'card-hover': '0 4px 12px -2px rgba(148, 163, 184, 0.15), 0 2px 4px -1px rgba(148, 163, 184, 0.08)',
        'hero': '0 10px 25px -5px rgba(37, 99, 235, 0.25), 0 8px 10px -6px rgba(37, 99, 235, 0.1)',
      },
    },
  },
  plugins: [],
}
