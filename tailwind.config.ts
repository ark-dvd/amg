import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
      },
      colors: {
        gold: '#b09060',
        'accent-light': '#c9a96e',
        charcoal: '#1a1a1a',
        surface: '#f7f5f2',
        border: '#e8e4df',
        muted: '#6b6560',
      },
    },
  },
  plugins: [typography],
}

export default config
