import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6200EE',
        secondary: '#03DAC6',
        accent: '#FF6F00',
        kagaj: '#FFFEFB',
        ink: '#1A1B25',
        hisab: '#0E7A5A',
        mohar: '#C1272D',
        haldi: '#E8A317',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', '"Times New Roman"', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
