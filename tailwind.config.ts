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
        'aladin-blue': 'var(--aladin-blue)',
        'aladin-orange': 'var(--aladin-orange)',
      },
    },
  },
  plugins: [],
}

export default config
