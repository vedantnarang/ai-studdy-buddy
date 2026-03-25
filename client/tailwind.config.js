/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode: only activates when 'dark' class is on <html>
  // Toggle with: document.documentElement.classList.toggle('dark')
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
};
