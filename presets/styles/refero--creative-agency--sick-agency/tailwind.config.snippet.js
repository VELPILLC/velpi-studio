/*
 * SICK AGENCY — design tokens
 * Source: https://styles.refero.design/style/9ff03bd9-2ce0-474c-8c73-1905dbacc23b
 * Fetched: 2026-07-04T19:30:28.612Z
 * License: harvested from styles.refero.design — free library built for AI agents
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        'voltage-yellow': '#ffc700',
        'radioactive-orange': '#ff4e27',
        'electric-cobalt': '#0029ff',
        'burnt-sienna': '#4d170c',
        'ink-black': '#000000',
        'bone-white': '#ffffff'
      },
      fontFamily: {
        morganite: ['Morganite'],
        thunder: ['Thunder'],
        sentient: ['Sentient'],
        times: ['Times']
      },
      fontSize: {
        caption: ['10px', {
          lineHeight: '1.15'
        }],
        body: ['16px', {
          lineHeight: '1.44',
          letterSpacing: '-0.24px'
        }],
        subheading: ['24px', {
          lineHeight: '1.1',
          letterSpacing: '-0.36px'
        }],
        display: ['122px', {
          lineHeight: '1'
        }],
        'display-lg': ['229px', {
          lineHeight: '0.7'
        }]
      },
      spacing: {},
      borderRadius: {
        badges: '999px',
        inputs: '0px (sharp corners are part of the system identity; only interactive elements get pills)',
        buttons: '999px'
      }
    },
  },
};
