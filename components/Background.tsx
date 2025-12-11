import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundProps {
  intensity: 'calm' | 'active';
}

export const Background: React.FC<BackgroundProps> = ({ intensity }) => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#0f0f11]">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#18181b] to-[#09090b] opacity-80" />

      {/* Floating Orbs - Calm State */}
      <motion.div
        animate={{
          scale: intensity === 'active' ? 1.5 : 1,
          opacity: intensity === 'active' ? 0.3 : 0.5,
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[120px]"
      />
      
      <motion.div
        animate={{
          scale: intensity === 'active' ? 1.2 : 1,
          opacity: intensity === 'active' ? 0.4 : 0.4,
          x: [0, -30, 30, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-slate-800/20 blur-[100px]"
      />

       <motion.div
        animate={{
            opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] rounded-full bg-zinc-700/10 blur-[80px]"
      />

      {/* Grid Overlay for Landscape Mode */}
      {intensity === 'active' && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
        />
      )}
    </div>
  );
};
