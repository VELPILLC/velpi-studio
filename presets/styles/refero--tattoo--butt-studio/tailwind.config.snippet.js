/*
 * BUTT STUDIO — design tokens
 * Source: https://styles.refero.design/style/c6e55968-fa2d-47c9-b833-2c4ad1e74906
 * Fetched: 2026-07-04T19:31:01.648Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'ink-black': '#000000',
        paper: '#ffffff',
        carbon: '#131313',
        'bone-gray': '#e0e0e0',
        'studio-indigo': '#31338e'
      },
      fontFamily: {
        helvetica: ['helvetica'],
        caslon: ['Caslon'],
        'sometimes-times': ['Sometimes Times']
      },
      fontSize: {
        body: ['20px', {
          lineHeight: '1.2',
          letterSpacing: '-0.6px'
        }],
        heading: ['42px', {
          lineHeight: '1',
          letterSpacing: '-0.84px'
        }],
        display: ['200px', {
          lineHeight: '1',
          letterSpacing: '-4px'
        }]
      },
      spacing: {
        'element-gap': '20px',
        'card-padding': '20px'
      },
      borderRadius: {
        cards: '0px (sharp, like printed paper)',
        badges: '50px-68px (rounded pill, almost stadium)',
        buttons: '50px (pill-shaped)'
      }
    },
  },
};
