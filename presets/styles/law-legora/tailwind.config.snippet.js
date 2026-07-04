/*
 * Legora — design tokens
 * Source: https://styles.refero.design/style/f89bad29-019a-48d7-9724-c40a0d7d8171
 * Fetched: 2026-07-04T19:30:11.134Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        parchment: '#fefefc',
        ink: '#000000',
        graphite: '#0a0a0a',
        smoke: '#6b6b6b',
        iron: '#444444',
        'verdigris-wash': '#ebf5ed',
        'slate-mist': '#bdd4f0',
        'pewter-haze': '#98a7aa'
      },
      fontFamily: {
        'sans-serif': ['sans-serif'],
        'rhymes-display': ['Rhymes Display'],
        'suisse-int-l': ['Suisse Int\'l'],
        'aktiv-grotesk-vf': ['Aktiv Grotesk VF'],
        'suisse-intl-book': ['Suisse Intl Book'],
        'playfair-display': ['Playfair Display'],
        inter: ['Inter'],
        'suisse-intl-medium': ['Suisse Intl Medium']
      },
      fontSize: {
        caption: ['11px', {
          lineHeight: '0.8',
          letterSpacing: '0.1px'
        }],
        'heading-sm': ['20px', {
          lineHeight: '1.3',
          letterSpacing: '0px'
        }],
        heading: ['32px', {
          lineHeight: '1.1',
          letterSpacing: '-0.32px'
        }],
        display: ['88px', {
          lineHeight: '0.95',
          letterSpacing: '-1.76px'
        }]
      },
      spacing: {
        'section-gap': '80px',
        'element-gap': '10px',
        'card-padding': '24px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        tags: '2px',
        cards: '8px',
        inputs: '8px',
        buttons: '2px'
      }
    },
  },
};
