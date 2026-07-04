/*
 * Eventbrite — design tokens
 * Source: https://styles.refero.design/style/1fa0d9da-966f-4d43-9775-e156bec3a3b3
 * Fetched: 2026-07-04T19:30:49.190Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'aubergine-ink': '#39364f',
        'pure-white': '#ffffff',
        'warm-linen': '#f8f7fa',
        'soft-mist': '#dbdae3',
        'pale-silver': '#bec0c6',
        'cloud-veil': '#eeedf2',
        'periwinkle-tint': '#dee5ff',
        carbon: '#000000',
        smoke: '#6f7287',
        'plum-depth': '#1e0a3c',
        'indigo-slate': '#585163',
        'electric-iris': '#3659e3',
        'ember-orange': '#f05537'
      },
      fontFamily: {
        'neue-plak': ['Neue Plak'],
        'neue-plak-text': ['Neue Plak Text']
      },
      fontSize: {
        caption: ['12px', {
          lineHeight: '1.43'
        }],
        'body-sm': ['14px', {
          lineHeight: '1.43'
        }],
        body: ['16px', {
          lineHeight: '1.5'
        }],
        subheading: ['18px', {
          lineHeight: '1.43'
        }],
        'heading-sm': ['24px', {
          lineHeight: '1.33'
        }],
        heading: ['32px', {
          lineHeight: '1.2'
        }]
      },
      spacing: {
        'section-gap': '64-80px',
        'element-gap': '12px',
        'card-padding': '12-16px',
        'page-max-width': '1200px'
      },
      borderRadius: {
        nav: '100px (pill nav containers)',
        tags: '20px',
        cards: '40px',
        badges: '20px',
        inputs: '4px',
        buttons: '360px (pill)'
      }
    },
  },
};
