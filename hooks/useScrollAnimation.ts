"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";

export const useScrollAnimation = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return { ref, isInView };
};

export const useParallax = (value: number) => {
  return `translateY(${value * 0.5}px)`;
};