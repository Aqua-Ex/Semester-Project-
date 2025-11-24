/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'electric-purple': '#7A33FF',
        'mint-pop': '#4AF2C3',
        'laser-coral': '#FF6464',
        'sunbeam-yellow': '#FFD93D',
        // Dark mode colors
        'deep-graphite': '#1A1A1E',
        'soft-charcoal': '#2A2A30',
        'cloud-gray': '#D9D9E0',
        // Light mode colors
        'light-bg': '#F5F5F7',
        'light-surface': '#FFFFFF',
        'light-card': '#F9F9FB',
        'light-text': '#1A1A1E',
        'light-text-secondary': '#6B7280',
      },
      fontFamily: {
        'header': ['Fredoka', 'Poppins', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'decorative': ['Sora', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-purple-mint': 'linear-gradient(135deg, #7A33FF, #4AF2C3)',
        'gradient-coral-yellow': 'linear-gradient(135deg, #FF6464, #FFD93D)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(122, 51, 255, 0.25)',
        'glow-mint': '0 0 20px rgba(74, 242, 195, 0.25)',
        'glow-coral': '0 0 20px rgba(255, 100, 100, 0.25)',
      },
      borderRadius: {
        'card': '20px',
        'card-lg': '28px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(122, 51, 255, 0.25)' },
          '50%': { boxShadow: '0 0 30px rgba(122, 51, 255, 0.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

