"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function InteractiveHero() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fixed values to prevent hydration mismatch
  const floatingElements = [
    { id: 0, size: 120, duration: 15, delay: 0, left: 10, top: 20 },
    { id: 1, size: 80, duration: 18, delay: 0.5, left: 70, top: 60 },
    { id: 2, size: 100, duration: 20, delay: 1, left: 85, top: 30 },
    { id: 3, size: 60, duration: 16, delay: 1.5, left: 5, top: 70 },
    { id: 4, size: 90, duration: 22, delay: 2, left: 90, top: 80 },
  ];

  if (!isClient) {
    return null; // Prevent SSR/hydration mismatch
  }

  return (
    <>
      {/* Floating background elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-600/20 backdrop-blur-sm"
          style={{
            width: element.size,
            height: element.size,
            left: `${element.left}%`,
            top: `${element.top}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            delay: element.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </>
  );
}
