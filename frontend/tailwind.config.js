/** Configure Tailwind source scanning and WriteSpace's warm editorial tokens. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fbf7ef',
        ink: '#302a24',
        clay: '#9b4a2f',
        ochre: '#c98727',
        mist: '#efe4d2',
        moss: '#3d5b46',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        editorial: '0 20px 50px rgba(78, 57, 35, 0.13)',
      },
    },
  },
  plugins: [],
};
