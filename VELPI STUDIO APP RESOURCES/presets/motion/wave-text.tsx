/**
 * SOURCE: https://github.com/educlopez/smoothui/blob/main/packages/smoothui/components/wave-text/index.tsx
 * REPO: https://github.com/educlopez/smoothui
 * LICENSE: MIT
 * AUTHOR: SmoothUI (Eduardo Calvo)
 * EFFECT: text-effect
 * INTENSITY: medium
 * DEPENDENCY: framer-motion
 * CSS-PORT: direct: each letter wrapped in an inline-block span bobbing on a translateY keyframe with per-letter animation-delay, reproducing the staggered wave.
 */
import { motion, useReducedMotion } from "motion/react";
import type React from "react";

export interface WaveTextProps {
  amplitude?: number;
  children: string;
  className?: string;
  duration?: number;
  staggerDelay?: number;
}

const WaveText: React.FC<WaveTextProps> = ({
  children,
  amplitude = 8,
  duration = 1.2,
  staggerDelay = 0.05,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className={className} style={{ display: "inline-block" }}>
      {children.split("").map((char, i) => (
        <motion.span
          animate={
            shouldReduceMotion
              ? { y: 0 }
              : { y: [0, -amplitude, 0, amplitude * 0.5, 0] }
          }
          key={`${i}-${char}`}
          style={{
            display: "inline-block",
            willChange: shouldReduceMotion ? undefined : "transform",
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  repeat: Number.POSITIVE_INFINITY,
                  duration,
                  delay: i * staggerDelay,
                  ease: [0.37, 0, 0.63, 1],
                  times: [0, 0.25, 0.5, 0.75, 1],
                }
          }
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
};

export default WaveText;
