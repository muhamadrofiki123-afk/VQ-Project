/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2F7BFF',    
        'accent-purple': '#8A1FFF',   
        'dark-bg': '#050505',         
        'silver-white': '#F2F2F2',    
      },
      theme: {
  extend: {
    keyframes: {
      wiggle: {
        '0%, 100%': { transform: 'rotate(-2deg) scale(1.03)' },
        '25%': { transform: 'rotate(2deg) scale(1.05)' },
        '50%': { transform: 'rotate(-1.5deg) scale(1.04)' },
        '75%': { transform: 'rotate(1.5deg) scale(1.05)' },
      },
    },
    animation: {
      wiggle: 'wiggle 0.5s ease-in-out infinite',
    },
  },
},
      // INI ADALAH MESIN ANIMASINYA
      animation: {
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}