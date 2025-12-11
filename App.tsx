import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Background } from './components/Background';
import { LandingPage } from './components/LandingPage';
import { CognitiveLandscape } from './components/CognitiveLandscape';
import { ViewState } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');

  const handleEnter = () => {
    setView('transitioning');
    // Allow transition animation to play out before mounting landscape fully if needed,
    // but AnimatePresence handles component unmounting nicely.
    setTimeout(() => {
        setView('landscape');
    }, 1500); // Wait for the zoom effect
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f0f11] text-zinc-200">
      <Background intensity={view === 'landscape' ? 'active' : 'calm'} />

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            exit={{ 
                opacity: 0, 
                scale: 1.5, 
                filter: 'blur(20px)',
                transition: { duration: 1.2, ease: "easeInOut" } 
            }}
            className="absolute inset-0"
          >
            <LandingPage onEnter={handleEnter} />
          </motion.div>
        )}

        {/* 
            The transition state is a visual gap where the background shifts 
            and the camera 'zooms'. 
        */}

        {view === 'landscape' && (
          <motion.div
            key="landscape"
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <CognitiveLandscape />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
