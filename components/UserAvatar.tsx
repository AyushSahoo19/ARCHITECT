
import React, { useState, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, PanInfo } from 'framer-motion';
import { AvatarStage, NodeData, Roadmap, NodeType } from '../types';
import { Database, Zap, Target, MousePointer2, Maximize } from 'lucide-react';

interface UserAvatarProps {
  stage: AvatarStage;
  nodes: NodeData[];
  roadmap: Roadmap | null;
}

// --- CONSTANTS ---
const VOXEL_SIZE = 5; // Increased slightly for better visibility

// --- 3D ENGINE PRIMITIVES ---

interface VoxelProps { 
  x: number; y: number; z: number; 
  w: number; h: number; d: number; 
  color: string; opacity?: number; emissive?: boolean; shading?: boolean;
}

// A geometrically correct CSS 3D Voxel
const Voxel: React.FC<VoxelProps> = ({ 
  x, y, z, 
  w, h, d, 
  color, 
  opacity = 1,
  emissive = false,
  shading = true
}) => {
  
  // Dimensions in pixels
  const wp = w * VOXEL_SIZE;
  const hp = h * VOXEL_SIZE;
  const dp = d * VOXEL_SIZE;

  // Offsets (half-sizes)
  const hwp = wp / 2;
  const hhp = hp / 2;
  const hdp = dp / 2;

  // Container Transform
  // Note: Y is inverted to map 'Up' to screen 'Up' (CSS Y is Down)
  const transform = `translate3d(${x * VOXEL_SIZE}px, ${-y * VOXEL_SIZE}px, ${z * VOXEL_SIZE}px)`;

  // Shared Face Styles
  const baseFaceStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transformOrigin: '50% 50%', // Rotate around center of the face
    background: color,
    opacity,
    backfaceVisibility: opacity < 1 ? 'visible' : 'hidden', // Hide backfaces for solid objects to avoid z-fighting artifacts
    boxShadow: emissive ? `0 0 ${Math.max(wp, hp, dp)}px ${color}` : 'none',
    border: '0.5px solid rgba(0,0,0,0.1)', // Outline for "block" effect
  };

  // Face-specific transforms (Standard Box Geometry)
  // Front/Back use WxH. Right/Left use DxH. Top/Bottom use WxD.
  return (
    <div style={{ 
      position: 'absolute', 
      transformStyle: 'preserve-3d', 
      transform, 
      width: 0, 
      height: 0 
    }}>
      {/* Front (Z+) */}
      <div style={{ 
        ...baseFaceStyle, 
        width: wp, height: hp, 
        transform: `translate3d(-50%, -50%, ${hdp}px)`,
        filter: shading ? 'brightness(1.0)' : 'none'
      }} />
      
      {/* Back (Z-) */}
      <div style={{ 
        ...baseFaceStyle, 
        width: wp, height: hp, 
        transform: `translate3d(-50%, -50%, -${hdp}px) rotateY(180deg)`,
        filter: shading ? 'brightness(0.5)' : 'none'
      }} />
      
      {/* Right (X+) */}
      <div style={{ 
        ...baseFaceStyle, 
        width: dp, height: hp, 
        transform: `translate3d(-50%, -50%, 0) rotateY(90deg) translateZ(${hwp}px)`,
        filter: shading ? 'brightness(0.75)' : 'none'
      }} />
      
      {/* Left (X-) */}
      <div style={{ 
        ...baseFaceStyle, 
        width: dp, height: hp, 
        transform: `translate3d(-50%, -50%, 0) rotateY(-90deg) translateZ(${hwp}px)`,
        filter: shading ? 'brightness(0.65)' : 'none'
      }} />
      
      {/* Top (Y+) - Faces Up (Screen Up is -Y) */}
      <div style={{ 
        ...baseFaceStyle, 
        width: wp, height: dp, 
        transform: `translate3d(-50%, -50%, 0) rotateX(90deg) translateZ(${hhp}px)`,
        filter: shading ? 'brightness(1.2)' : 'none'
      }} />
      
      {/* Bottom (Y-) */}
      <div style={{ 
        ...baseFaceStyle, 
        width: wp, height: dp, 
        transform: `translate3d(-50%, -50%, 0) rotateX(-90deg) translateZ(${hhp}px)`,
        filter: shading ? 'brightness(0.25)' : 'none'
      }} />
    </div>
  );
};

// --- PROCEDURAL GENERATORS ---

const generateHair = (color: string, style: 'messy' | 'neat') => {
  const voxels = [];
  const density = style === 'messy' ? 35 : 50;
  
  for (let i = 0; i < density; i++) {
    const x = (Math.random() - 0.5) * 9;
    const z = (Math.random() - 0.5) * 9;
    const y = 8 + Math.random() * 4;
    const s = 1 + Math.random() * 1.5;
    voxels.push(
      <Voxel key={`hair-${i}`} x={x} y={y} z={z} w={s} h={s} d={s} color={color} />
    );
  }
  return voxels;
};

const generateEnvironment = (count: number, radius: number, color: string) => {
  return Array.from({ length: count }).map((_, i) => {
    const r = radius + (Math.random() * radius * 0.5);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 60;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const s = Math.random() * 2;
    return (
      <Voxel key={`env-${i}`} x={x} y={y} z={z} w={s} h={s} d={s} color={color} opacity={0.6} emissive />
    );
  });
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ stage, nodes, roadmap }) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- MOTION CONTROLS ---
  const rx = useMotionValue(-20);
  const ry = useMotionValue(45);
  const scale = useMotionValue(1);
  
  const smoothRx = useSpring(rx, { stiffness: 120, damping: 20 });
  const smoothRy = useSpring(ry, { stiffness: 120, damping: 20 });
  const smoothScale = useSpring(scale, { stiffness: 200, damping: 25 });

  const handlePan = (event: any, info: PanInfo) => {
    ry.set(ry.get() + info.delta.x * 0.5);
    rx.set(Math.max(-80, Math.min(80, rx.get() - info.delta.y * 0.5)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const newScale = scale.get() - e.deltaY * 0.001;
    scale.set(Math.max(0.4, Math.min(3.5, newScale)));
  };

  // --- CHARACTER CONFIG ---
  const colors = useMemo(() => ({
    skin: '#ffdbac',
    eyes: '#00ffff',
    hair: '#27272a',
    primary: stage === 'MASTER' ? '#f59e0b' : stage === 'ARCHITECT' ? '#ef4444' : '#3b82f6',
    secondary: '#18181b',
    tech: '#10b981',
    glow: stage === 'MASTER' ? '#fbbf24' : '#6366f1'
  }), [stage]);

  const hairVoxels = useMemo(() => generateHair(colors.hair, 'messy'), [colors.hair]);
  const envVoxels = useMemo(() => generateEnvironment(50, 70, colors.glow), [colors.glow]);

  // Derived Stats
  const skills = nodes.filter(n => n.type === NodeType.SKILL).map(n => n.label);
  const currentGoal = roadmap && roadmap.phases && roadmap.phases.length > 0 
    ? roadmap.phases[0].title 
    : "Initializing...";

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-hidden bg-[#050505] relative cursor-move select-none"
      ref={containerRef}
      onWheel={handleWheel}
    >
      
      {/* --- HUD OVERLAY (Non-Rotated) --- */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none select-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>
            {stage}
          </h1>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] text-emerald-500 font-mono uppercase">System Online</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-20 text-right pointer-events-none select-none">
         <div className="text-[10px] text-zinc-600 font-mono mb-1">VOXEL ENGINE v2.2</div>
         <div className="text-xs text-zinc-500 flex items-center justify-end gap-2">
            <MousePointer2 size={12} /> Drag to Rotate
            <span className="w-px h-3 bg-zinc-800 mx-1" />
            <Maximize size={12} /> Scroll to Zoom
         </div>
      </div>

      {/* --- 3D SCENE ROOT --- */}
      <motion.div 
        className="relative w-full h-full flex items-center justify-center perspective-[1200px]"
        onPan={handlePan}
        onPanStart={() => setIsDragging(true)}
        onPanEnd={() => setIsDragging(false)}
        style={{ touchAction: 'none' }}
      >
        <motion.div
          className="preserve-3d relative"
          style={{ 
            rotateX: smoothRx, 
            rotateY: smoothRy, 
            scale: smoothScale,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* --- THE AVATAR CONSTRUCT --- */}
          <motion.div 
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="preserve-3d"
          >
            {/* 1. HEAD */}
            <div style={{ transform: 'translate3d(0, -28px, 0)', transformStyle: 'preserve-3d' }}>
               {/* Cranium */}
               <Voxel x={0} y={0} z={0} w={9} h={9} d={8} color={colors.skin} />
               {/* Hair Base */}
               <Voxel x={0} y={1} z={-2} w={9.5} h={8} d={6} color={colors.hair} />
               <Voxel x={0} y={4.5} z={0} w={9.5} h={2} d={9} color={colors.hair} />
               
               {/* Procedural Hair */}
               <div style={{ transform: 'translate3d(0, 0, 0)', transformStyle: 'preserve-3d' }}>
                 {hairVoxels}
               </div>

               {/* Face */}
               <Voxel x={2} y={-1} z={4.2} w={2} h={1.5} d={0.5} color={colors.eyes} emissive /> {/* Eye R */}
               <Voxel x={-2} y={-1} z={4.2} w={2} h={1.5} d={0.5} color={colors.eyes} emissive /> {/* Eye L */}
               <Voxel x={0} y={-3.5} z={4.2} w={2} h={0.5} d={0.5} color="#d4b096" /> {/* Mouth */}

               {/* Tech Visor */}
               {(stage === 'ARCHITECT' || stage === 'MASTER') && (
                 <Voxel x={0} y={-1} z={4.5} w={10} h={2.5} d={1} color={colors.tech} opacity={0.6} emissive />
               )}
            </div>

            {/* 2. NECK */}
            <div style={{ transform: 'translate3d(0, -18px, 0)', transformStyle: 'preserve-3d' }}>
                <Voxel x={0} y={0} z={0} w={4} h={4} d={4} color={colors.skin} />
                <Voxel x={0} y={-2} z={0} w={6} h={2} d={5} color={colors.secondary} /> {/* Collar */}
            </div>

            {/* 3. TORSO */}
            <div style={{ transform: 'translate3d(0, -8px, 0)', transformStyle: 'preserve-3d' }}>
                {/* Core Body */}
                <Voxel x={0} y={0} z={0} w={10} h={12} d={6} color={colors.primary} />
                {/* Reactor */}
                <Voxel x={0} y={2} z={3.2} w={3} h={3} d={0.5} color={colors.glow} emissive />
                {/* Detail Plates */}
                <Voxel x={3} y={0} z={3.1} w={3} h={8} d={0.2} color={colors.secondary} />
                <Voxel x={-3} y={0} z={3.1} w={3} h={8} d={0.2} color={colors.secondary} />
                {/* Backpack/Unit */}
                <Voxel x={0} y={1} z={-3.5} w={8} h={10} d={3} color={colors.secondary} />
            </div>

            {/* 4. HIPS */}
            <div style={{ transform: 'translate3d(0, 4px, 0)', transformStyle: 'preserve-3d' }}>
                <Voxel x={0} y={0} z={0} w={9} h={5} d={5.5} color={colors.secondary} />
                <Voxel x={0} y={-0.5} z={2.8} w={4} h={2} d={0.5} color={colors.primary} />
            </div>

            {/* 5. ARMS */}
            {/* Right Arm */}
            <div style={{ transform: 'translate3d(8px, -11px, 0)', transformStyle: 'preserve-3d' }}>
                <Voxel x={0} y={0} z={0} w={5} h={5} d={5} color={colors.primary} /> {/* Shoulder */}
                <motion.div 
                  animate={{ rotateX: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transform: 'translate3d(0, -5px, 0)', transformStyle: 'preserve-3d' }}
                >
                    <Voxel x={0} y={-2} z={0} w={3.5} h={5} d={3.5} color={colors.skin} /> {/* Upper Arm */}
                    <div style={{ transform: 'translate3d(0, -6px, 0)', transformStyle: 'preserve-3d' }}>
                       <Voxel x={0} y={-2} z={0} w={4.5} h={5} d={4.5} color={colors.secondary} /> {/* Forearm */}
                       <Voxel x={0} y={-6} z={0} w={3} h={3} d={3} color={colors.skin} /> {/* Hand */}
                    </div>
                </motion.div>
            </div>
            
            {/* Left Arm */}
            <div style={{ transform: 'translate3d(-8px, -11px, 0)', transformStyle: 'preserve-3d' }}>
                <Voxel x={0} y={0} z={0} w={5} h={5} d={5} color={colors.primary} /> {/* Shoulder */}
                <motion.div 
                  animate={{ rotateX: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  style={{ transform: 'translate3d(0, -5px, 0)', transformStyle: 'preserve-3d' }}
                >
                     <Voxel x={0} y={-2} z={0} w={3.5} h={5} d={3.5} color={colors.skin} /> {/* Upper Arm */}
                    <div style={{ transform: 'translate3d(0, -6px, 0)', transformStyle: 'preserve-3d' }}>
                       <Voxel x={0} y={-2} z={0} w={4.5} h={5} d={4.5} color={colors.secondary} /> {/* Forearm */}
                       <Voxel x={0} y={-6} z={0} w={3} h={3} d={3} color={colors.skin} /> {/* Hand */}
                       
                       {/* Floating UI */}
                       {(stage === 'ARCHITECT' || stage === 'MASTER') && (
                         <motion.div 
                            animate={{ rotateY: 360 }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            style={{ transform: 'translate3d(0, -8px, 0)', transformStyle: 'preserve-3d' }}
                         >
                            <Voxel x={0} y={0} z={4} w={2} h={2} d={0.2} color={colors.glow} emissive opacity={0.8} />
                         </motion.div>
                       )}
                    </div>
                </motion.div>
            </div>

            {/* 6. LEGS */}
            {/* Right Leg */}
            <div style={{ transform: 'translate3d(2.5px, 0, 0)', transformStyle: 'preserve-3d' }}>
               <Voxel x={0} y={-5} z={0} w={4} h={8} d={4} color={colors.secondary} /> {/* Thigh */}
               <div style={{ transform: 'translate3d(0, -10px, 0)', transformStyle: 'preserve-3d' }}>
                  <Voxel x={0} y={0} z={0.5} w={4.2} h={2} d={4.2} color={colors.primary} /> {/* Knee */}
                  <Voxel x={0} y={-4} z={0} w={3.8} h={8} d={3.8} color={colors.primary} /> {/* Shin */}
                  <Voxel x={0} y={-9} z={0.5} w={4.5} h={3} d={6} color={colors.secondary} /> {/* Boot */}
               </div>
            </div>
            
            {/* Left Leg */}
            <div style={{ transform: 'translate3d(-2.5px, 0, 0)', transformStyle: 'preserve-3d' }}>
               <Voxel x={0} y={-5} z={0} w={4} h={8} d={4} color={colors.secondary} /> {/* Thigh */}
               <div style={{ transform: 'translate3d(0, -10px, 0)', transformStyle: 'preserve-3d' }}>
                   <Voxel x={0} y={0} z={0.5} w={4.2} h={2} d={4.2} color={colors.primary} /> {/* Knee */}
                   <Voxel x={0} y={-4} z={0} w={3.8} h={8} d={3.8} color={colors.primary} /> {/* Shin */}
                   <Voxel x={0} y={-9} z={0.5} w={4.5} h={3} d={6} color={colors.secondary} /> {/* Boot */}
               </div>
            </div>

          </motion.div>

          {/* --- ENVIRONMENT --- */}
          
          {/* Base Platform */}
          <div style={{ transform: 'translate3d(0, -25px, 0)', transformStyle: 'preserve-3d' }}>
             <Voxel x={0} y={0} z={0} w={28} h={2} d={28} color="#18181b" shading={false} />
             <Voxel x={0} y={1.2} z={0} w={20} h={1} d={20} color="#27272a" />
             {/* Glow Ring */}
             <div style={{ 
               transform: 'rotateX(90deg) translateZ(1.5px)', 
               width: '140px', height: '140px', 
               position: 'absolute', left: '-70px', top: '-70px', 
               background: `radial-gradient(circle, ${colors.glow}22 0%, transparent 60%)`, 
               pointerEvents: 'none' 
             }} />
          </div>

          {/* Floating Data Particles */}
          <motion.div 
            animate={{ rotateY: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            style={{ transformStyle: 'preserve-3d' }}
          >
             {envVoxels}
          </motion.div>

        </motion.div>
      </motion.div>

      {/* --- INFO CARDS --- */}
      <div className="absolute bottom-0 w-full max-w-5xl px-6 pb-6 pointer-events-none">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pointer-events-auto">
             <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500/50 transition-colors group">
                 <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform"><Database size={20} /></div>
                 <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Memory Core</div>
                     <div className="text-xl font-light text-white">{nodes.length} <span className="text-sm text-zinc-600">Nodes</span></div>
                 </div>
             </div>
             
             <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl flex items-center gap-4 hover:border-emerald-500/50 transition-colors group">
                 <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform"><Zap size={20} /></div>
                 <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Skill Matrix</div>
                     <div className="text-xl font-light text-white">{skills.length} <span className="text-sm text-zinc-600">Active</span></div>
                 </div>
             </div>

             <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 rounded-xl flex items-center gap-4 hover:border-amber-500/50 transition-colors group">
                 <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 group-hover:scale-110 transition-transform"><Target size={20} /></div>
                 <div>
                     <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Current Focus</div>
                     <div className="text-sm font-medium text-white truncate w-32">{currentGoal}</div>
                 </div>
             </div>
         </div>
      </div>

    </div>
  );
};
