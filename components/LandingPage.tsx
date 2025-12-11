import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onEnter: () => void;
}

const SUBTEXT_OPTIONS = [
  "Build your future identity.",
  "Construct your career ecosystem.",
  "Find clarity in chaos.",
  "Design a life that fits you.",
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [subtextIndex, setSubtextIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setSubtextIndex(Math.floor(Math.random() * SUBTEXT_OPTIONS.length));
  }, []);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center h-screen w-full text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="mb-6 flex flex-col items-center"
      >
        <h1 className="text-5xl md:text-7xl font-light tracking-[0.15em] text-zinc-100 select-none mb-2">
          ARCHITECT
        </h1>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.5, duration: 1.5 }}
        className="mb-12 max-w-lg"
      >
        <p className="text-lg font-light text-zinc-400 leading-relaxed">
          Find your direction. Build your ecosystem.<br />Become unstoppable.
        </p>
      </motion.div>

      <div className="h-12 relative flex items-center justify-center mb-16 overflow-hidden w-full">
         <AnimatePresence mode='wait'>
            <motion.p
              key={isHovering ? "hover-text" : `subtext-${subtextIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.5, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-[0.2em] absolute"
            >
              {isHovering ? "Start building your roadmap" : SUBTEXT_OPTIONS[subtextIndex]}
            </motion.p>
         </AnimatePresence>
      </div>

      <motion.button
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onEnter}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="group relative px-10 py-4 bg-zinc-900/50 border border-zinc-800 rounded-full overflow-hidden cursor-pointer backdrop-blur-sm transition-colors hover:border-zinc-600"
      >
        <span className="relative z-10 text-lg font-light text-zinc-200 group-hover:text-white">
          Begin Initialization
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </motion.button>
    </div>
  );
};