/*
 * Chester's Garden — design tokens
 * Source: https://styles.refero.design/style/a639fa6c-1705-47c2-b452-d4479469a734
 * Fetched: 2026-07-04T19:30:40.937Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'paper-gray': '#e5e7eb',
        'bone-white': '#fafafa',
        'full-black': '#000000',
        'ink-charcoal': '#171717',
        'soft-graphite': '#404040',
        'pencil-gray': '#a3a3a3',
        'highlight-mint': '#daf5ae',
        'highlight-butter': '#fde5a7',
        'highlight-sage': '#b7f2cc',
        'rust-underline': '#7c2d12',
        'navy-quotation': '#0c4a6e'
      },
      fontFamily: {
        fraunces: ['Fraunces'],
        inter: ['Inter'],
        'ui-monospace': ['ui-monospace']
      },
      fontSize: {
        caption: ['14px', {
          lineHeight: '1.43',
          letterSpacing: '-0.35px'
        }],
        body: ['16px', {
          lineHeight: '1.5',
          letterSpacing: '-0.4px'
        }],
        'heading-sm': ['30px', {
          lineHeight: '1.2',
          letterSpacing: '-0.9px'
        }],
        heading: ['36px', {
          lineHeight: '1.11',
          letterSpacing: '-1.08px'
        }],
        display: ['60px', {
          lineHeight: '1',
          letterSpacing: '-1.8px'
        }]
      },
      spacing: {
        'section-gap': '24px',
        'element-gap': '8px',
        'card-padding': '20px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        tags: '9999px',
        cards: '8px',
        images: '8px',
        buttons: '4px'
      }
    },
  },
};
