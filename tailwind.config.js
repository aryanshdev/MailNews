/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/*.html', './src/*.ejs'],
  theme: {
    extend: {
        animation: {
          'gradient-6': 'gradient 6s linear infinite',
          'gradient-4': 'gradient 4s linear infinite',
        },
        keyframes: {
          'gradient': {
            to: { 'background-position': '200% center' },
          }
        }                    
    },
  },

  plugins: [],
}

