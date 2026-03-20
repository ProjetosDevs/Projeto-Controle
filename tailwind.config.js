/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
          bg: {
            main: '#0a0a0f', // Very dark blue/black
            surface: 'rgba(23, 23, 33, 0.7)', // Glassmorphism base
            hover: 'rgba(38, 38, 54, 0.8)',
            sidebar: '#111116',
          },
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            muted: '#64748b',
          },
          accent: {
            DEFAULT: '#6366f1', // Indigo 500
            hover: '#818cf8', // Indigo 400
            glow: 'rgba(99, 102, 241, 0.35)',
          },
          status: {
            success: '#10b981',
            successBg: 'rgba(16, 185, 129, 0.1)',
            warning: '#f59e0b',
            warningBg: 'rgba(245, 158, 11, 0.1)',
            danger: '#ef4444',
            dangerBg: 'rgba(239, 68, 68, 0.1)',
            info: '#3b82f6',
            infoBg: 'rgba(59, 130, 246, 0.1)',
          },
          border: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
          'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
          'hover': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 15px var(--tw-shadow-color)',
          'glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
