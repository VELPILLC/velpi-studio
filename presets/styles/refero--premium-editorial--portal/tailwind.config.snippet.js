/*
 * Portal — design tokens
 * Source: https://styles.refero.design/style/b9aeb945-2f6e-4557-9115-e3ff3a8f8dc8
 * Fetched: 2026-07-04T19:30:56.347Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'signal-blue': '#007aff',
        'ink-black': '#000000',
        graphite: '#3e3e3e',
        smoke: '#636363',
        'paper-white': '#ffffff',
        'ash-mist': '#f7f7f7',
        'dusk-gradient': '#7a7fd4'
      },
      fontFamily: {
        'perfectly-nineties-regular': ['Perfectly Nineties Regular'],
        inter: ['Inter'],
        'system-sans-serif': ['System sans-serif']
      },
      fontSize: {
        micro: ['10px', {
          lineHeight: '1.2',
          letterSpacing: '-0.2px'
        }],
        caption: ['12px', {
          lineHeight: '1.2',
          letterSpacing: '-0.24px'
        }],
        'body-sm': ['14px', {
          lineHeight: '1.3',
          letterSpacing: '-0.28px'
        }],
        body: ['16px', {
          lineHeight: '1.35',
          letterSpacing: '-0.32px'
        }],
        'heading-sm': ['18px', {
          lineHeight: '1.35',
          letterSpacing: '-0.36px'
        }],
        heading: ['36px', {
          lineHeight: '1',
          letterSpacing: '0px'
        }],
        display: ['48px', {
          lineHeight: '1',
          letterSpacing: '0px'
        }]
      },
      spacing: {
        'section-gap': '80-120px',
        'element-gap': '10px',
        'card-padding': '20px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        nav: '22px',
        cards: '22-30px',
        badges: '50px',
        images: '30-40px',
        buttons: '50px'
      }
    },
  },
};
