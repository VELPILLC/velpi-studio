/**
 * SOURCE: https://github.com/tsparticles/tsparticles/blob/main/utils/configs/src/b/basic.ts
 * REPO: https://github.com/tsparticles/tsparticles
 * LICENSE: MIT
 * AUTHOR: tsParticles (Matteo Bruni)
 * EFFECT: background
 * INTENSITY: medium
 * DEPENDENCY: js-library
 * CSS-PORT: approximate: the classic particle-links network is approximated with a fixed constellation of glowing dots joined by faint lines, gently drifting as a group; no interactivity without JS.
 *
 * Usage: await loadSlim(tsParticles); await tsParticles.load({ id: "tsparticles", options });
 * Official "basic" config source below (unmodified).
 */
import type { ISourceOptions } from "@tsparticles/engine";

const options: ISourceOptions = {
  key: "basic",
  name: "Basic",
  particles: {
    number: {
      value: 200,
      density: {
        enable: true,
      },
    },
    paint: {
      fill: {
        color: {
          value: "#ff0000",
          animation: {
            enable: true,
            speed: 20,
            sync: true,
          },
        },
        enable: true,
      },
    },
    shape: {
      type: "circle",
    },
    opacity: {
      value: 0.5,
    },
    size: {
      value: {
        min: 1,
        max: 3,
      },
    },
    links: {
      enable: true,
      distance: 150,
      color: "#f0f0f0",
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 6,
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "repulse",
      },
      onClick: {
        enable: true,
        mode: "push",
      },
    },
    modes: {
      repulse: {
        distance: 100,
      },
      push: {
        quantity: 4,
      },
    },
  },
  background: {
    color: "#0d0d0d",
  },
};

export default options;
