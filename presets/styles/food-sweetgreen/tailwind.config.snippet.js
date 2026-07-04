/*
 * sweetgreen — design tokens
 * Source: https://styles.refero.design/style/d91841cf-c717-43ef-97a2-400778fa6e1a
 * Fetched: 2026-07-04T19:30:09.635Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'deep-forest': '#00473c',
        'lime-glow': '#e6ff55',
        'sage-mist': '#d8e5d6',
        'warm-sand': '#e8dcc6',
        'cream-canvas': '#f4f3e7',
        'forest-shadow': '#0e150e',
        'pure-ink': '#000000',
        'warm-gray': '#8c8c82',
        'slate-gray': '#555555'
      },
      fontFamily: {
        sweetsans: ['SweetSans'],
        grenette: ['Grenette'],
        sweetsanstext: ['SweetSansText'],
        'sweetsanstext-regular': ['SweetSansText-Regular']
      },
      fontSize: {
        caption: ['12px', {
          lineHeight: '1.33',
          letterSpacing: '0.2px'
        }],
        'body-sm': ['14px', {
          lineHeight: '1.29',
          letterSpacing: '0.24px'
        }],
        body: ['16px', {
          lineHeight: '1.25',
          letterSpacing: '0.27px'
        }],
        'body-lg': ['18px', {
          lineHeight: '1.33',
          letterSpacing: '0.54px'
        }],
        subheading: ['20px', {
          lineHeight: '1.2',
          letterSpacing: '0.6px'
        }],
        'heading-sm': ['24px', {
          lineHeight: '1.21',
          letterSpacing: '1.2px'
        }],
        heading: ['40px', {
          lineHeight: '0.85',
          letterSpacing: '0px'
        }],
        'heading-lg': ['48px', {
          lineHeight: '1',
          letterSpacing: '-2.26px'
        }],
        display: ['70px', {
          lineHeight: '0.85',
          letterSpacing: '0px'
        }],
        'display-lg': ['80px', {
          lineHeight: '1',
          letterSpacing: '0px'
        }]
      },
      spacing: {
        'section-gap': '80px',
        'element-gap': '8px',
        'card-padding': '24px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        cards: '24px',
        small: '4px',
        badges: '20px',
        images: '20px',
        inputs: '8px',
        buttons: '9999px'
      }
    },
  },
};
