"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export function FadeIn({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
