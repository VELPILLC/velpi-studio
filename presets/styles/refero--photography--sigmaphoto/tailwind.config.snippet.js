/*
 * Sigmaphoto — design tokens
 * Source: https://styles.refero.design/style/67c60ee4-ac38-41ee-834e-ed2a92146417
 * Fetched: 2026-07-04T19:30:52.915Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'slate-ink': '#333333',
        'pure-white': '#ffffff',
        'onyx-black': '#000000',
        'warm-bone': '#faf7ef',
        'ash-gray': '#707070',
        'cobalt-signal': '#0048ff',
        'stone-gray': '#999999'
      },
      fontFamily: {
        'sigma-sans': ['Sigma Sans'],
        'sigma-serif-head': ['Sigma Serif Head'],
        'sigma-serif': ['Sigma Serif'],
        metropolis: ['Metropolis'],
        arial: ['Arial'],
        times: ['Times']
      },
      fontSize: {
        'heading-sm': ['24px', {
          lineHeight: '1.25',
          letterSpacing: '0px'
        }],
        heading: ['48px', {
          lineHeight: '1.25',
          letterSpacing: '-0.3px'
        }],
        display: ['88px', {
          lineHeight: '1.1',
          letterSpacing: '-0.5px'
        }]
      },
      spacing: {
        'section-gap': '80px',
        'element-gap': '16px',
        'card-padding': '16px',
        'page-max-width': '1440px'
      },
      borderRadius: {
        tags: '0px',
        cards: '0px',
        images: '0px',
        inputs: '1px',
        buttons: '0px'
      }
    },
  },
};
