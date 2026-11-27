export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme tokens live as CSS variables in index.css so the light/dark
        // toggle swaps every surface without touching components.
        obsidian: 'rgb(var(--obsidian) / <alpha-value>)', // dark green cards, active nav
        ink: 'rgb(var(--ink) / <alpha-value>)', // primary text
        slate: 'rgb(var(--slate) / <alpha-value>)', // secondary text
        mist: 'rgb(var(--mist) / <alpha-value>)', // tertiary text
        ivory: 'rgb(var(--ivory) / <alpha-value>)', // page canvas
        parchment: 'rgb(var(--parchment) / <alpha-value>)', // cards, sidebar, header
        sand: 'rgb(var(--sand) / <alpha-value>)', // borders and subtle fills
        champagne: {
          DEFAULT: 'rgb(var(--champagne) / <alpha-value>)',
          light: 'rgb(var(--champagne-light) / <alpha-value>)',
        },
        sage: 'rgb(var(--sage) / <alpha-value>)',
        terracotta: 'rgb(var(--terracotta) / <alpha-value>)',
        bordeaux: 'rgb(var(--bordeaux) / <alpha-value>)',
        linen: 'rgb(var(--linen) / <alpha-value>)', // always-light text on dark cards
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [
    // Tailwind 3.4 has no pointer-coarse variant; the wordmark footer sizes
    // tap targets with it, so register the media query here.
    ({ addVariant }) => {
      addVariant('pointer-coarse', '@media (pointer: coarse)');
      addVariant('pointer-fine', '@media (pointer: fine)');
    },
  ],
};
