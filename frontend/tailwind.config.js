/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional, Harmonious Dark and Indigo-Vibrant Color Palette
        brand: {
          dark: '#020617',     // Deep Slate background
          card: '#0f172a',     // Slate-900 for modern glass cards
          accent: '#6366f1',   // Glowing Indigo
          success: '#10b981',  // Emerald Green for Present / Approved
          warning: '#f59e0b',  // Amber/Gold for Late / Pending
          danger: '#ef4444',   // Rose Red for Absent / Cancelled
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
