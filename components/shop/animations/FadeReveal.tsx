'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type FadeRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
  once?: boolean;
  amount?: number;
  mount?: boolean;
};

export default function FadeReveal({
  children,
  className = '',
  style,
  delay = 0,
  duration = 0.85,
  y = 16,
  scale = 0.992,
  once = true,
  amount = 0.24,
  mount = false,
}: FadeRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const initial = { opacity: 0, y, scale };
  const visible = { opacity: 1, y: 0, scale: 1 };

  return (
    <motion.div
      className={className}
      style={style}
      initial={initial}
      animate={mount ? visible : undefined}
      whileInView={mount ? undefined : visible}
      viewport={mount ? undefined : { once, amount }}
      transition={
        mount
          ? {
              duration: duration + 0.05,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }
          : {
              type: 'tween',
              duration,
              ease: [0.16, 1, 0.3, 1],
              delay,
            }
      }
    >
      {children}
    </motion.div>
  );
}