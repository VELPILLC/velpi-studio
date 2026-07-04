/*
 * Aurora — design tokens
 * Source: https://styles.refero.design/style/fe7b8533-f56b-46bd-8713-f18886a1e986
 * Fetched: 2026-07-04T19:30:17.370Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'horizon-navy': '#001733',
        'signal-blue': '#006aed',
        'cyan-dawn': '#18dcdc',
        'slate-whisper': '#68748d',
        'graphite-dim': '#464e5d',
        fog: '#d1d6e0',
        mist: '#e6e9f0',
        hailstone: '#f3f4f8',
        'paper-white': '#ffffff',
        coal: '#000000'
      },
      fontFamily: {
        inter: ['Inter'],
        arial: ['Arial']
      },
      fontSize: {
        caption: ['12px', {
          lineHeight: '1.3',
          letterSpacing: '0px'
        }],
        'body-sm': ['14px', {
          lineHeight: '1.4',
          letterSpacing: '0px'
        }],
        body: ['16px', {
          lineHeight: '1.5',
          letterSpacing: '0px'
        }],
        subheading: ['20px', {
          lineHeight: '1.2',
          letterSpacing: '-0.6px'
        }],
        'subheading-lg': ['24px', {
          lineHeight: '1.2',
          letterSpacing: '-0.72px'
        }],
        'heading-sm': ['36px', {
          lineHeight: '1.1',
          letterSpacing: '-1.368px'
        }],
        heading: ['44px', {
          lineHeight: '1',
          letterSpacing: '-1.672px'
        }],
        'heading-lg': ['52px', {
          lineHeight: '0.97',
          letterSpacing: '-2.08px'
        }],
        display: ['64px', {
          lineHeight: '0.96',
          letterSpacing: '-2.56px'
        }],
        hero: ['90px', {
          lineHeight: '0.96',
          letterSpacing: '-3.6px'
        }]
      },
      spacing: {
        'section-gap': '96px',
        'element-gap': '8px',
        'card-padding': '24px',
        'page-max-width': '1280px'
      },
      borderRadius: {
        cards: '8px',
        badges: '4px',
        buttons: '8px',
        iconbuttons: '9999px'
      }
    },
  },
};
