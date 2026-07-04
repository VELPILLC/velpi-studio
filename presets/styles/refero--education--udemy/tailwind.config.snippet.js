/*
 * Udemy — design tokens
 * Source: https://styles.refero.design/style/c03afcbd-96ed-4b7f-8d0a-277fc0042ba7
 * Fetched: 2026-07-04T19:30:30.609Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: '#2a2b3f',
        obsidian: '#202230',
        graphite: '#33364a',
        slate: '#3d4055',
        steel: '#595c73',
        fog: '#9194ac',
        mist: '#b7b9cd',
        chalk: '#d1d2e0',
        porcelain: '#e9eaf2',
        paper: '#f6f7f9',
        canvas: '#ffffff',
        aubergine: '#6d28d2',
        'lavender-haze': '#c0c4fc',
        ember: '#c4710d'
      },
      fontFamily: {
        'udemy-sans': ['Udemy Sans']
      },
      fontSize: {
        caption: ['12px', {
          lineHeight: '1.5'
        }],
        'body-sm': ['14px', {
          lineHeight: '1.5'
        }],
        body: ['16px', {
          lineHeight: '1.6'
        }],
        subheading: ['18px', {
          lineHeight: '1.5'
        }],
        'heading-sm': ['24px', {
          lineHeight: '1.4'
        }],
        heading: ['32px', {
          lineHeight: '1.2'
        }]
      },
      spacing: {
        'section-gap': '48px',
        'element-gap': '16px',
        'card-padding': '24px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        cards: '8px',
        pills: '1000px',
        inputs: '4px',
        buttons: '8px',
        largecards: '16px',
        featurecards: '24px'
      }
    },
  },
};
