import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          dark: 'var(--emerald-dark)',
        },
        'yellow-glow': 'var(--yellow-glow)',
        'coupang-blue': 'var(--coupang-blue)',
        'coupang-orange': 'var(--coupang-orange)',
      },
    },
  },
  plugins: [],
}

export default config
