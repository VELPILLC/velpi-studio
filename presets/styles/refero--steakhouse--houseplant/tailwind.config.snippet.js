/*
 * HOUSEPLANT — design tokens
 * Source: https://styles.refero.design/style/7fdd9506-0a85-41a5-b2a7-c5ce1f31d863
 * Fetched: 2026-07-04T19:30:58.202Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        walnut: '#321e1e',
        linen: '#f4f1e0',
        graphite: '#464545',
        espresso: '#463938',
        onyx: '#000000',
        'soft-sand': '#f4f4f4'
      },
      fontFamily: {
        houseplant: ['Houseplant'],
        roboto: ['Roboto'],
        neuehelvetica55roman: ['NeueHelvetica55Roman'],
        'gtstandard-m': ['GTStandard-M']
      },
      fontSize: {
        caption: ['14px', {
          lineHeight: '1.71',
          letterSpacing: '-0.02px'
        }],
        'body-sm': ['16px', {
          lineHeight: '1.5',
          letterSpacing: '-0.02px'
        }],
        body: ['18px', {
          lineHeight: '1.44',
          letterSpacing: '-0.02px'
        }],
        subheading: ['21px', {
          lineHeight: '1.33',
          letterSpacing: '-0.02px'
        }],
        'heading-sm': ['28px', {
          lineHeight: '1.3',
          letterSpacing: '-0.02px'
        }],
        heading: ['32px', {
          lineHeight: '1.3',
          letterSpacing: '-0.021px'
        }],
        'heading-lg': ['45px', {
          lineHeight: '1.15',
          letterSpacing: '-0.047px'
        }],
        display: ['70px', {
          lineHeight: '1',
          letterSpacing: '-0.05px'
        }]
      },
      spacing: {
        'section-gap': '80-120px',
        'element-gap': '20px',
        'card-padding': '20px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        tags: '4px',
        cards: '8px',
        inputs: '4px',
        buttons: '4px'
      }
    },
  },
};
