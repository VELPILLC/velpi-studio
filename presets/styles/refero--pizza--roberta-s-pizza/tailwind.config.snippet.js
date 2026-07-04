/*
 * Roberta's Pizza — design tokens
 * Source: https://styles.refero.design/style/3e497155-bd96-4134-a4a5-855bd885a25c
 * Fetched: 2026-07-04T19:30:54.693Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'roberta-red': '#ed2023',
        charcoal: '#2b2f36',
        'pure-white': '#ffffff',
        'pure-black': '#000000',
        'shadow-gray': '#bfbfbf'
      },
      fontFamily: {
        'offset-tm': ['Offset TM'],
        borensa: ['Borensa']
      },
      fontSize: {
        caption: ['14px', {
          lineHeight: '1.5',
          letterSpacing: '0.56px'
        }],
        'body-sm': ['16px', {
          lineHeight: '1.5'
        }],
        body: ['20px', {
          lineHeight: '1.5',
          letterSpacing: '0.8px'
        }],
        subheading: ['24px', {
          lineHeight: '1.3',
          letterSpacing: '0.96px'
        }],
        'heading-sm': ['34px', {
          lineHeight: '1.25',
          letterSpacing: '1.36px'
        }],
        heading: ['54px', {
          lineHeight: '1.25',
          letterSpacing: '2.16px'
        }],
        'heading-lg': ['80px', {
          lineHeight: '1.1',
          letterSpacing: '3.2px'
        }],
        display: ['120px', {
          lineHeight: '0.88',
          letterSpacing: '-2.4px'
        }]
      },
      spacing: {
        'section-gap': '64-80px',
        'element-gap': '20-30px',
        'card-padding': '20-30px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        pills: '9999px (from 16000px raw value)',
        buttons: '7.2px',
        asymmetric: '80px (for shapes that round two corners and square the other two)'
      }
    },
  },
};
