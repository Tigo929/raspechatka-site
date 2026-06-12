"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal обёртка. Появление при попадании в вьюпорт.
 * Уважает prefers-reduced-motion (тогда контент просто виден).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "span";
}) {
  const MotionTag = { div: motion.div, li: motion.li, span: motion.span }[as];

  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
