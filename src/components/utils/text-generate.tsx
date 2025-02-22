"use client";

import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

type TextGenerateEffectProps = {
  text: string;
  duration?: number;
} & React.ComponentProps<"span">;

export function TextGenerateEffect({
  text,
  duration = 0.2,
  className,
}: TextGenerateEffectProps) {
  const words = text
    .split(/(\s+)/)
    .map((word) => (/\s+/.exec(word) ? "\u00A0" : word));

  return (
    <motion.div className={cn("w-full", className)}>
      {words.map((char, index) => (
        <motion.span
          key={index}
          className="inline-block text-muted-foreground"
          initial={{ opacity: 0, filter: "blur(4px)", y: 5 }}
          whileInView={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
          }}
          transition={{
            ease: "easeOut",
            duration: duration,
            delay: index * 0.015,
          }}
          viewport={{ once: true }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}
