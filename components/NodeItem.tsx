import React from 'react';
import { motion } from 'framer-motion';
import { NodeData, NodeType } from '../types';
import { Move, CornerRightDown, CircleDashed, Sparkles, BookOpen, Heart, Activity } from 'lucide-react';

interface NodeItemProps {
  node: NodeData;
  onDragStart: (e: any) => void;
  onDrag: (e: any) => void;
  onDragEnd: (e: any) => void;
}

export const NodeItem: React.FC<NodeItemProps> = ({ node, onDragStart, onDrag, onDragEnd }) => {
  const getStyles = (type: NodeType) => {
    switch (type) {
      case NodeType.INSIGHT:
        return "bg-zinc-800/90 border-zinc-600/50 shadow-[0_0_30px_rgba(255,255,255,0.05)] text-zinc-200";
      case NodeType.DIRECTION:
        return "bg-indigo-950/80 border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.2)] text-indigo-100";
      case NodeType.SKILL:
        return "bg-emerald-950/80 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] text-emerald-100";
      case NodeType.VALUE:
        return "bg-amber-950/80 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] text-amber-100";
      case NodeType.GAP:
        return "bg-zinc-900/30 border-dashed border-zinc-600/40 text-zinc-400 backdrop-blur-sm";
      case NodeType.USER_INPUT:
      default:
        return "bg-zinc-900/90 border-zinc-500/50 text-zinc-100";
    }
  };

  const getIcon = (type: NodeType) => {
    switch (type) {
      case NodeType.INSIGHT: return <Sparkles size={14} className="opacity-70" />;
      case NodeType.DIRECTION: return <CornerRightDown size={14} className="opacity-70" />;
      case NodeType.SKILL: return <BookOpen size={14} className="opacity-70" />;
      case NodeType.VALUE: return <Heart size={14} className="opacity-70" />;
      case NodeType.GAP: return <CircleDashed size={14} className="opacity-50" />;
      default: return <Activity size={14} className="opacity-50" />;
    }
  };

  const isGap = node.type === NodeType.GAP;

  return (
    <motion.div
      drag
      dragMomentum={false} 
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        x: node.x, 
        y: node.y,
        borderColor: isGap ? ["rgba(82, 82, 91, 0.4)", "rgba(161, 161, 170, 0.6)", "rgba(82, 82, 91, 0.4)"] : undefined
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        borderColor: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
      className={`absolute flex items-center gap-3 px-5 py-3 rounded-full border cursor-grab active:cursor-grabbing select-none hover:border-opacity-100 hover:scale-105 transition-all z-10 ${getStyles(node.type)}`}
      style={{
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      {getIcon(node.type)}
      <span className="text-sm font-medium tracking-wide max-w-[200px] truncate">
        {node.label}
      </span>
    </motion.div>
  );
};