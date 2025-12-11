
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Network, Box, GitBranch, ArrowRight, MousePointer2, Cpu, ChevronDown, Activity, Layers, Play } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const FeatureCard = ({ title, subtitle, icon: Icon, children, delay }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay, duration: 0.8 }}
      className="flex flex-col h-full bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-colors group backdrop-blur-sm"
    >
      <div className="p-6 border-b border-zinc-800/50 bg-zinc-950/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-indigo-400 group-hover:text-white transition-colors">
                <Icon size={18} />
            </div>
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{title}</h3>
         </div>
         <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-indigo-500 transition-colors" />
      </div>
      <div className="flex-1 p-6 relative">
         <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{subtitle}</p>
         <div className="w-full h-32 md:h-40 bg-zinc-950/50 rounded-lg border border-zinc-800/50 relative overflow-hidden flex items-center justify-center">
            {children}
         </div>
      </div>
    </motion.div>
  );
};

// Abstract representation of the Node Graph
const GraphVisual = () => (
  <div className="relative w-full h-full">
    <motion.div 
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 4, repeat: Infinity }}
      className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]"
    />
    {[...Array(6)].map((_, i) => (
       <motion.div 
          key={i}
          className="absolute w-2 h-2 rounded-full bg-indigo-500"
          initial={{ x: Math.random() * 100, y: Math.random() * 50, opacity: 0.5 }}
          animate={{ x: Math.random() * 200 - 100 + 150, y: Math.random() * 80 - 40 + 80 }}
          transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, repeatType: "mirror" }}
       />
    ))}
    <svg className="absolute inset-0 w-full h-full opacity-20">
       <line x1="30%" y1="40%" x2="70%" y2="60%" stroke="currentColor" className="text-indigo-500" strokeWidth="1" />
       <line x1="70%" y1="60%" x2="50%" y2="30%" stroke="currentColor" className="text-indigo-500" strokeWidth="1" />
    </svg>
  </div>
);

// Abstract representation of the Voxel Avatar
const VoxelVisual = () => (
  <div className="flex items-center justify-center h-full perspective-[800px]">
     <motion.div 
        animate={{ rotateY: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="relative w-16 h-16 preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
     >
        <div className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 translate-z-[32px]" />
        <div className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 -translate-z-[32px]" />
        <div className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rotate-y-90 translate-z-[32px]" />
        <div className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rotate-y-90 -translate-z-[32px]" />
        <div className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rotate-x-90 translate-z-[32px]" />
        <div className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/50 rotate-x-90 -translate-z-[32px]" />
     </motion.div>
  </div>
);

// Abstract representation of the Timeline
const TimelineVisual = () => (
  <div className="flex items-center justify-center w-full h-full px-6 gap-2">
     {[1, 2, 3].map((i) => (
        <React.Fragment key={i}>
           <motion.div 
              initial={{ height: 10 }}
              animate={{ height: [20, 40, 20] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              className="w-8 bg-amber-500/20 border border-amber-500/50 rounded-sm"
           />
           {i < 3 && <div className="h-[1px] w-4 bg-zinc-700" />}
        </React.Fragment>
     ))}
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-[#0f0f11]">
      
      {/* --- HERO SECTION --- */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-6 z-10">
          
          <motion.div 
            style={{ opacity, scale }}
            className="flex flex-col items-center text-center"
          >
              <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <div className="px-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">System Online v1.0</span>
                  </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="mb-8 relative"
              >
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 select-none">
                  CHIMERA
                </h1>
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20 blur-3xl -z-10" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.5, duration: 1.5 }}
                className="mb-12 max-w-lg"
              >
                <p className="text-lg md:text-xl font-light text-zinc-400 leading-relaxed">
                  The architecture of your future self.<br/>
                  <span className="text-zinc-500">Design your identity. Map your mind. Execute.</span>
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center gap-6"
              >
                 <button
                    onClick={onEnter}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    className="group relative px-12 py-5 bg-white text-black rounded-full overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                    <span className="relative z-10 text-sm font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                      Initialize System <ArrowRight size={16} />
                    </span>
                 </button>
                 
                 <div className="text-[10px] text-zinc-600 uppercase tracking-widest animate-pulse flex flex-col items-center gap-2 mt-12">
                     <span>Scroll to explore architecture</span>
                     <ChevronDown size={14} />
                 </div>
              </motion.div>
          </motion.div>
      </section>

      {/* --- OVERVIEW SECTION --- */}
      <section className="min-h-screen relative z-10 bg-[#0f0f11]">
          <div className="max-w-7xl mx-auto px-6 py-24">
              
              <div className="mb-20 text-center">
                  <h2 className="text-3xl md:text-5xl font-light text-white mb-6">Cognitive Architecture</h2>
                  <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
                      Chimera Space is not a productivity tool. It is a visual operating system for your ambition.
                      Externalize your thoughts, build a 3D model of your identity, and let AI construct the path forward.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                  <FeatureCard 
                     title="Neural Mapping" 
                     subtitle="A dynamic, physics-based canvas where thoughts, skills, and values connect automatically." 
                     icon={Network} 
                     delay={0.1}
                  >
                      <GraphVisual />
                  </FeatureCard>
                  
                  <FeatureCard 
                     title="Voxel Identity" 
                     subtitle="Your progress creates a 3D avatar that evolves from 'Observer' to 'Master' as you build." 
                     icon={Box} 
                     delay={0.2}
                  >
                      <VoxelVisual />
                  </FeatureCard>

                  <FeatureCard 
                     title="Strategic Simulation" 
                     subtitle="AI generates detailed execution roadmaps based on real-world models and market data." 
                     icon={GitBranch} 
                     delay={0.3}
                  >
                      <TimelineVisual />
                  </FeatureCard>
              </div>

              {/* --- APP WALKTHROUGH --- */}
              <div className="space-y-32">
                  
                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row items-center gap-12">
                      <div className="flex-1 space-y-6">
                          <div className="text-indigo-500 font-mono text-xs uppercase tracking-widest mb-2">01. Intention</div>
                          <h3 className="text-3xl font-light text-white">Input your raw data.</h3>
                          <p className="text-zinc-400 leading-relaxed">
                              Start by selecting traits, values, and answering deep psychological prompts. 
                              The system analyzes your inputs to build a base profile and identify hidden behavioral loops.
                          </p>
                          <ul className="space-y-2">
                              {['Psychological Profiling', 'Core Loop Detection', 'Gap Analysis'].map(item => (
                                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-500">
                                      <Activity size={14} className="text-indigo-500" /> {item}
                                  </li>
                              ))}
                          </ul>
                      </div>
                      <div className="flex-1 w-full aspect-video bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 relative overflow-hidden group">
                          <div className="absolute top-4 left-4 right-4 flex gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500/20" />
                              <div className="h-2 w-2 rounded-full bg-yellow-500/20" />
                              <div className="h-2 w-2 rounded-full bg-green-500/20" />
                          </div>
                          <div className="mt-8 space-y-3">
                              <div className="w-3/4 h-8 bg-zinc-800 rounded animate-pulse" />
                              <div className="w-1/2 h-8 bg-zinc-800/60 rounded" />
                              <div className="w-full h-24 bg-zinc-800/30 rounded mt-4 border border-indigo-500/20" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent" />
                      </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                      <div className="flex-1 space-y-6">
                          <div className="text-emerald-500 font-mono text-xs uppercase tracking-widest mb-2">02. Construction</div>
                          <h3 className="text-3xl font-light text-white">Generate your ecosystem.</h3>
                          <p className="text-zinc-400 leading-relaxed">
                              Ask the Architect to generate 3 distinctive career narratives. 
                              Select one to spawn a full ecosystem: books to read, skills to learn, and mental models to apply.
                          </p>
                          <ul className="space-y-2">
                              {['Narrative Generation', 'Resource Compilation', 'Skill Trees'].map(item => (
                                  <li key={item} className="flex items-center gap-2 text-sm text-zinc-500">
                                      <Layers size={14} className="text-emerald-500" /> {item}
                                  </li>
                              ))}
                          </ul>
                      </div>
                      <div className="flex-1 w-full aspect-video bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 relative overflow-hidden flex items-center justify-center">
                          <div className="grid grid-cols-2 gap-4 w-full">
                              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                                  <div className="w-8 h-8 rounded bg-emerald-900/30 mb-2" />
                                  <div className="h-2 w-16 bg-zinc-800 rounded mb-1" />
                                  <div className="h-2 w-10 bg-zinc-800/50 rounded" />
                              </div>
                              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg opacity-50">
                                  <div className="w-8 h-8 rounded bg-zinc-900 mb-2" />
                                  <div className="h-2 w-16 bg-zinc-800 rounded mb-1" />
                              </div>
                          </div>
                      </div>
                  </div>

              </div>

              {/* --- FOOTER CTA --- */}
              <div className="mt-40 mb-20 flex flex-col items-center text-center">
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">
                      READY TO BUILD?
                  </h2>
                  <button
                    onClick={onEnter}
                    className="group relative px-16 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-105 shadow-[0_0_60px_rgba(79,70,229,0.3)]"
                  >
                    <span className="relative z-10 text-lg font-bold tracking-[0.2em] uppercase flex items-center gap-3">
                      <Play size={20} fill="currentColor" /> Enter Chimera Space
                    </span>
                 </button>
                 <p className="mt-6 text-xs text-zinc-600 font-mono">
                     SESSION ID: {Date.now().toString(36).toUpperCase()} // SECURE CONNECTION
                 </p>
              </div>

          </div>
      </section>

      {/* --- BACKGROUND OVERLAY --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0f0f11] to-transparent z-20" />
      </div>

    </div>
  );
};
