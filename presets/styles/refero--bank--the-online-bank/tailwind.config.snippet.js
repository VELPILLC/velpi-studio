/*
 * The online bank — design tokens
 * Source: https://styles.refero.design/style/e9f07a27-bdd4-4f6a-8132-329d014aa5f4
 * Fetched: 2026-07-04T19:30:19.088Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'deep-teal': '#088177',
        ink: '#1b1b1b',
        'canvas-warmth': '#faf8f5',
        'surface-white': '#ffffff',
        hairline: '#e9e9e9',
        'border-soft': '#d9d9d9',
        'pure-black': '#000000',
        'teal-mist': '#d8edeb',
        'blush-neutral': '#f5e1e3'
      },
      fontFamily: {
        n26: ['N26'],
        'n26-extended': ['N26-Extended']
      },
      fontSize: {
        caption: ['11px', {
          lineHeight: '1.38',
          letterSpacing: '0.21px'
        }],
        'body-sm': ['14px', {
          lineHeight: '1.5',
          letterSpacing: '0.22px'
        }],
        body: ['16px', {
          lineHeight: '1.5',
          letterSpacing: '0.16px'
        }],
        subheading: ['20px', {
          lineHeight: '1.43',
          letterSpacing: '0.16px'
        }],
        'heading-sm': ['24px', {
          lineHeight: '1.38',
          letterSpacing: '0.19px'
        }],
        heading: ['32px', {
          lineHeight: '1.25',
          letterSpacing: '0px'
        }],
        'heading-lg': ['44px', {
          lineHeight: '1.2',
          letterSpacing: '0px'
        }],
        display: ['80px', {
          lineHeight: '1.1',
          letterSpacing: '0px'
        }]
      },
      spacing: {
        'section-gap': '64-80px',
        'element-gap': '8-16px',
        'card-padding': '32-48px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        images: '24px',
        inputs: '4px',
        buttons: '8px',
        'small-elements': '4px'
      }
    },
  },
};
