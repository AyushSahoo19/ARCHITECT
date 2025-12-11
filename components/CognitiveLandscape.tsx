
// ... (imports remain the same)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Mic, Send, Sparkles, Layout, ArrowRight, ArrowLeft, Activity, Grid, List, Layers, 
  Cpu, Book, Lightbulb, Target, X, Plus, User, Globe, Briefcase, Wrench, ChevronRight, 
  ChevronLeft, Star, Search, Compass, Anchor, Link as LinkIcon, Building2, TrendingUp, DollarSign,
  CheckCircle, Brain, Eye, Lock, Zap, GripVertical, Clock, Quote, Edit2, Command, Repeat, GitCommit, GitPullRequest, Milestone, Save, FolderOpen, Merge, Check, Flag
} from 'lucide-react';
import { NodeData, NodeType, LinkData, GuidancePhase, Story, Roadmap, SelectionCategory, WorkspaceTab, TabType, AvatarStage, PsycheAnalysis, QuestionDefinition, TabSection, RoadmapPhase } from '../types';
import { NodeItem } from './NodeItem';
import { UserAvatar } from './UserAvatar';
import { categorizeInput, advanceGuidanceSession, generateStories, generateRoadmap, getSelectionLists, generateItemDetails, generatePsycheAnalysis, getDeepQuestions, generateTabSection, mergeRoadmaps, modifyRoadmap } from '../services/geminiService';

// ... (SIDEBAR_CATEGORIES, EditableText, PhaseBlueprint components remain the same)
// --- Sidebar Data Configuration ---
const SIDEBAR_CATEGORIES = [
    { 
        id: 'domains', 
        label: 'Domains', 
        icon: Globe, 
        items: ['Technology', 'Healthcare', 'Finance', 'Creative Arts', 'Sustainability', 'Space', 'Education', 'Media', 'Science'] 
    },
    { 
        id: 'careers', 
        label: 'Careers', 
        icon: Briefcase, 
        items: ['Product Manager', 'UX Designer', 'Founder', 'Software Engineer', 'Data Scientist', 'Strategist', 'Investor', 'Researcher', 'Writer'] 
    },
    { 
        id: 'skills', 
        label: 'Skills', 
        icon: Cpu, 
        items: ['Strategic Thinking', 'Coding', 'Visual Design', 'Public Speaking', 'Data Analysis', 'Negotiation', 'Leadership', 'Empathy', 'Systems Thinking'] 
    },
    { 
        id: 'inspiration', 
        label: 'Inspirations', 
        icon: Star, 
        items: ['Elon Musk', 'Steve Jobs', 'Marie Curie', 'Leonardo da Vinci', 'Naval Ravikant', 'Oprah Winfrey', 'Richard Feynman'] 
    },
    { 
        id: 'library', 
        label: 'Library', 
        icon: Book, 
        items: ['Zero to One', 'Thinking Fast & Slow', 'Atomic Habits', 'The Alchemist', 'Sapiens', 'Principles', 'Deep Work'] 
    },
    { 
        id: 'tools', 
        label: 'Tools', 
        icon: Wrench, 
        items: ['First Principles', 'Pareto Principle', 'Second Order Thinking', 'Inversion', 'Compounding', 'Regret Minimization'] 
    },
];

// --- Simple Inline Editable Component ---
const EditableText = ({ 
    text, 
    onChange, 
    className, 
    multiline = false 
}: { text: string, onChange: (val: string) => void, className?: string, multiline?: boolean }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(text);

    useEffect(() => setValue(text || ''), [text]);

    const handleBlur = () => {
        setIsEditing(false);
        if (value !== text) onChange(value);
    };

    if (isEditing) {
        return multiline ? (
            <textarea
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                className={`bg-zinc-800/50 text-white outline-none border border-indigo-500/50 rounded p-1 w-full resize-none ${className}`}
                rows={4}
            />
        ) : (
            <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                className={`bg-zinc-800/50 text-white outline-none border border-indigo-500/50 rounded p-1 w-full ${className}`}
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className={`cursor-text hover:bg-white/5 rounded px-1 -mx-1 transition-colors relative group ${className}`}
        >
            {value || <span className="opacity-30 italic">Click to edit</span>}
            <span className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 text-zinc-500"><Edit2 size={10}/></span>
        </div>
    );
};

// --- Phase Diagram Component (Detail View with Cards) ---
const PhaseBlueprint = ({ 
    phase, 
    onBack, 
    onPrev, 
    onNext, 
    hasPrev, 
    hasNext,
    onUpdate,
    onAskAI 
}: { 
    phase: RoadmapPhase, 
    onBack: () => void, 
    onPrev: () => void, 
    onNext: () => void, 
    hasPrev: boolean, 
    hasNext: boolean,
    onUpdate: (field: keyof RoadmapPhase, value: any, index?: number) => void,
    onAskAI: (prompt: string) => void
}) => {
    if (!phase) return <div className="p-10 text-zinc-500">Phase data unavailable.</div>;

    const strategies = phase.strategies || ["Strategy 1", "Strategy 2", "Strategy 3"];
    const habits = phase.habits || [];
    const skills = phase.skillsToLearn || [];
    const resources = phase.resources || [];
    const keyVision = phase.keyVision || "Establish baseline capability.";
    
    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0c] relative overflow-hidden">
             {/* Blueprint Background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
             
             {/* Navigation Header */}
             <div className="relative z-10 flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors border border-zinc-800">
                         <Layout size={18} />
                     </button>
                     <div>
                         <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Phase {phase.phase} Blueprint</div>
                         <h2 className="text-xl font-light text-white">{phase.title}</h2>
                     </div>
                 </div>
                 <div className="flex gap-2">
                     <button disabled={!hasPrev} onClick={onPrev} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                         <ChevronLeft size={20} />
                     </button>
                     <button disabled={!hasNext} onClick={onNext} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                         <ChevronRight size={20} />
                     </button>
                 </div>
             </div>

             {/* Diagram Canvas */}
             <div className="flex-1 overflow-auto p-10 flex flex-col items-center justify-start min-h-[600px] relative z-0">
                 
                 {/* Level 1: The Goal (Root) */}
                 <div className="flex flex-col items-center mb-16 relative group">
                      <div className="w-[400px] bg-zinc-900/80 border border-indigo-500/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.15)] text-center relative z-10">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0a0a0c] px-3 py-1 text-xs text-indigo-400 font-bold uppercase tracking-widest border border-indigo-500/30 rounded-full">Primary Objective</div>
                          <EditableText text={phase.goal} onChange={(val) => onUpdate('goal', val)} multiline className="text-lg text-white font-light" />
                      </div>
                      {/* Connector Down */}
                      <div className="h-16 w-0.5 bg-indigo-500/30 absolute top-full left-1/2 -translate-x-1/2" />
                 </div>
                 
                 {/* Vision Block */}
                 <div className="mb-16 max-w-2xl bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex items-start gap-4">
                      <Eye size={20} className="text-zinc-500 flex-shrink-0 mt-1" />
                      <div>
                           <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Phase Vision</h4>
                           <p className="text-zinc-300 italic">
                              "<EditableText text={keyVision} onChange={(val) => onUpdate('keyVision', val)} multiline />"
                           </p>
                      </div>
                 </div>

                 {/* Level 2: Strategies (First Principles) */}
                 <div className="w-full max-w-6xl mb-16 relative">
                     {/* Connector Crossbar */}
                     <div className="absolute -top-16 left-[20%] right-[20%] h-0.5 bg-indigo-500/30 top-0 border-t border-indigo-500/30" />
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {strategies.map((strategy, i) => (
                             <div key={i} className="flex flex-col items-center relative">
                                  {/* Connector from Top */}
                                  <div className="h-16 w-0.5 bg-indigo-500/30 absolute -top-16 left-1/2 -translate-x-1/2" />
                                  
                                  <div className="w-full bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl text-center relative z-10 hover:border-zinc-600 transition-colors group">
                                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 font-mono rounded border border-zinc-700">Principle 0{i+1}</div>
                                      <EditableText text={strategy} onChange={(val) => onUpdate('strategies', val, i)} className="text-sm text-zinc-300" />
                                  </div>

                                  {/* Connector Down to Execution */}
                                  <div className="h-12 w-0.5 bg-zinc-700/30 absolute top-full left-1/2 -translate-x-1/2" />
                                  
                                  {/* Level 3: Execution Items (Split Habits/Skills) */}
                                  <div className="mt-12 w-full space-y-3 relative">
                                      {/* Distribute items visually */}
                                      {[...habits, ...skills].filter((_, idx) => idx % 3 === i).map((item, idx) => {
                                          const isHabit = habits.includes(item);
                                          const realIdx = isHabit ? habits.indexOf(item) : skills.indexOf(item);
                                          const field = isHabit ? 'habits' : 'skillsToLearn';

                                          return (
                                              <div key={`${field}-${idx}`} className="bg-[#121215] border border-zinc-800/80 p-3 rounded-lg flex items-center gap-3 relative group/item hover:border-zinc-600 cursor-help" title="Click to ask AI about this">
                                                  {/* Connectors */}
                                                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-px bg-zinc-800" />
                                                  <div className="absolute -left-4 top-[-24px] bottom-1/2 w-px bg-zinc-800" style={{ display: idx === 0 ? 'block' : 'none', height: '36px' }} />
                                                  <div className="absolute -left-4 top-[-24px] bottom-1/2 w-px bg-zinc-800" style={{ display: idx > 0 ? 'block' : 'none', height: '60px', top: '-48px' }} />

                                                  {isHabit ? <Activity size={12} className="text-amber-500/70" /> : <Cpu size={12} className="text-emerald-500/70" />}
                                                  <EditableText text={item} onChange={(val) => onUpdate(field, val, realIdx)} className="text-xs text-zinc-400 flex-1" />
                                                  
                                                  {/* AI Assist Hover Button */}
                                                  <button 
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          onAskAI(`Provide details and resources for: ${item}`);
                                                      }}
                                                      className="opacity-0 group-hover/item:opacity-100 p-1 bg-zinc-800 rounded text-indigo-400 hover:text-white transition-opacity"
                                                  >
                                                      <Sparkles size={10} />
                                                  </button>
                                              </div>
                                          );
                                      })}
                                  </div>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Level 4: Resources Card System */}
                 {resources.length > 0 && (
                     <div className="w-full max-w-6xl mt-8">
                         <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Book size={14} /> Intelligence Assets</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             {resources.map((res, i) => (
                                 <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900/60 transition-colors">
                                     <div className="text-[10px] text-zinc-500 uppercase mb-1">{res.type}</div>
                                     <div className="text-sm text-zinc-300 font-medium mb-2">{res.title}</div>
                                     {res.link && <a href={res.link} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">Access <ArrowRight size={10} /></a>}
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* AI Generation Trigger */}
                 <div className="mt-12 mb-20 w-full max-w-md">
                      <div className="flex items-center justify-center p-4 border border-dashed border-zinc-800 rounded-xl hover:bg-zinc-900/30 cursor-pointer group"
                           onClick={() => onAskAI(`Expand on Phase ${phase.phase}: add specific tools and network strategies.`)}
                      >
                          <Sparkles size={16} className="text-zinc-600 group-hover:text-indigo-400 mr-2" />
                          <span className="text-sm text-zinc-500 group-hover:text-zinc-300">Generate additional phase resources</span>
                      </div>
                 </div>
             </div>
        </div>
    );
};

export const CognitiveLandscape: React.FC = () => {
  // ... (State declarations remain the same)
  // --- Core State ---
  const [nodes, setNodes] = useState<NodeData[]>([]);
  
  // --- Guidance System State ---
  const [currentPhase, setCurrentPhase] = useState<GuidancePhase>(GuidancePhase.WELCOME);
  const [question, setQuestion] = useState("Before we build your future, let’s understand who you are becoming.");
  const [options, setOptions] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [readyForStories, setReadyForStories] = useState(false);
  
  // --- Intention Mode State ---
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [deepQuestions, setDeepQuestions] = useState<QuestionDefinition[]>([]);
  const [psycheAnalysis, setPsycheAnalysis] = useState<PsycheAnalysis | null>(null);

  // --- Workspace State ---
  const [inputMode, setInputMode] = useState<'CHAT' | 'SELECT' | 'INTENTION'>('INTENTION'); 
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0); 
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);

  // --- Ecosystem Management State ---
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]);
  const [showRoadmapSelector, setShowRoadmapSelector] = useState(false);
  const [mergeSelectIds, setMergeSelectIds] = useState<string[]>([]);

  // --- Avatar State ---
  const [avatarStage, setAvatarStage] = useState<AvatarStage>('OBSERVER');
  
  // --- Dynamic Tab State ---
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
      { id: 'graph', label: 'Landscape', type: 'PSYCHE_BOARD', isRemovable: false },
      { id: 'identity', label: 'Identity', type: 'IDENTITY', isRemovable: false }, 
      { id: 'selection', label: 'Explorer', type: 'SELECTION', isRemovable: false },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('graph');

  // --- Drill Down Modal State ---
  const [detailModal, setDetailModal] = useState<{ title: string; content: string; steps: string[] } | null>(null);

  // --- Selection Data ---
  const [selectionCategories, setSelectionCategories] = useState<SelectionCategory[]>([]);
  const [customItemInput, setCustomItemInput] = useState<{ [key: string]: string }>({});
  const [explorerSearch, setExplorerSearch] = useState("");

  // --- Sidebar State ---
  const [activeSidebarCategory, setActiveSidebarCategory] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  
  // --- Resizable Panel State ---
  const [leftPanelWidth, setLeftPanelWidth] = useState(450);
  const isResizingRef = useRef(false);

  // --- Section Generator State ---
  const [generateInputOpen, setGenerateInputOpen] = useState<{index: number, tabId: string} | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState("");

  // --- D3 Refs ---
  const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ... (Effects remain the same)
  // Calculate Avatar Stage based on progress
  useEffect(() => {
      if (roadmap) {
          setAvatarStage('MASTER');
      } else if (currentPhase === GuidancePhase.ROADMAP || currentPhase === GuidancePhase.STORIES) {
          setAvatarStage('ARCHITECT');
      } else if (nodes.length > 5) {
          setAvatarStage('SEEKER');
      } else {
          setAvatarStage('OBSERVER');
      }
  }, [nodes.length, currentPhase, roadmap]);

  // Load Questions & Selections
  useEffect(() => {
      getSelectionLists().then(setSelectionCategories);
      setDeepQuestions(getDeepQuestions());
  }, []);

  // Update Psyche Analysis when nodes change (throttled)
  useEffect(() => {
      if (nodes.length > 3) {
          const timeout = setTimeout(async () => {
             const analysis = await generatePsycheAnalysis(nodes);
             setPsycheAnalysis(analysis);
          }, 2000);
          return () => clearTimeout(timeout);
      }
  }, [nodes.length]);

  // --- Auto-detect "Ready" state based on engagement ---
  useEffect(() => {
      if (nodes.length >= 5 && !readyForStories) {
          setReadyForStories(true);
      }
  }, [nodes.length, readyForStories]);

  // --- 1. D3 Simulation Init ---
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Safety check for D3
    if (!d3 || !d3.forceSimulation) {
        console.error("D3 not loaded correctly");
        return;
    }

    try {
        simulationRef.current = d3.forceSimulation<NodeData, LinkData>(nodes)
          .force('charge', d3.forceManyBody().strength(-250))
          .force('collide', d3.forceCollide().radius(60).iterations(2))
          .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
          .force('x', d3.forceX(width / 2).strength(0.01))
          .force('y', d3.forceY(height / 2).strength(0.01))
          .on('tick', () => setNodes(prev => [...prev]));
    } catch (e) {
        console.error("D3 Simulation Error:", e);
    }

    return () => simulationRef.current?.stop();
  }, []); 

  // Sync Nodes
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.nodes(nodes);
      simulationRef.current.alpha(0.5).restart();
    }
  }, [nodes.length]);

  // ... (Interaction Handlers remain the same, except for handleGenerateStories which logic is fine as is)
  
  // Resizing Logic
  const startResizing = useCallback(() => {
      isResizingRef.current = true;
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
  }, []);

  const stopResizing = useCallback(() => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
      if (isResizingRef.current) {
          const newWidth = e.clientX;
          // Constraints
          if (newWidth > 320 && newWidth < 800) {
            setLeftPanelWidth(newWidth);
          }
      }
  }, []);

  const handleStart = () => {
    setHasStarted(true);
    setInputMode('INTENTION');
    setCurrentPhase(GuidancePhase.INTENTION);
  };

  const handleToggleTrait = (trait: string) => {
      if (selectedTraits.includes(trait)) {
          setSelectedTraits(prev => prev.filter(t => t !== trait));
          setNodes(prev => prev.filter(n => n.label !== trait));
      } else {
          setSelectedTraits(prev => [...prev, trait]);
          const newNode: NodeData = {
              id: Date.now().toString(),
              type: NodeType.TRAIT,
              label: trait,
              x: containerRef.current ? containerRef.current.clientWidth / 2 : 0,
              y: containerRef.current ? containerRef.current.clientHeight / 2 : 0,
              category: 'identity'
          };
          setNodes(prev => [...prev, newNode]);
      }
  };

  const handleAnswerQuestion = (questionText: string, answer: string, category: string) => {
      setNodes(prev => {
          const exists = prev.find(n => n.label === answer);
          if (exists) {
              return prev.filter(n => n.label !== answer);
          }
          const newNode: NodeData = {
              id: Date.now().toString() + Math.random(),
              type: category === 'VISION' ? NodeType.DIRECTION : category === 'GAP' ? NodeType.GAP : category === 'BELIEF' ? NodeType.VALUE : NodeType.INSIGHT,
              label: answer,
              x: 0, y: 0,
              category: category.toLowerCase()
          };
          return [...prev, newNode];
      });
      if (nodes.length < 2) setActiveTabId('graph');
  };

  const handleToggleSelect = (item: string, categoryId: string) => {
      let type = NodeType.USER_INPUT;
      if (categoryId === 'values' || categoryId === 'traits') type = NodeType.VALUE;
      if (categoryId === 'skills') type = NodeType.SKILL;
      if (categoryId === 'visions' || categoryId === 'domains' || categoryId === 'careers') type = NodeType.DIRECTION;
      if (categoryId === 'struggles' || categoryId === 'questions_important' || categoryId === 'questions_interesting') type = NodeType.GAP;
      if (categoryId === 'inspiration' || categoryId === 'library' || categoryId === 'tools') type = NodeType.INSIGHT;

      setNodes(prev => {
          const exists = prev.find(n => n.label === item);
          if (exists) {
              return prev.filter(n => n.label !== item);
          } else {
              const newNode: NodeData = {
                  id: Date.now().toString() + Math.random(),
                  type,
                  label: item,
                  x: containerRef.current ? containerRef.current.clientWidth / 2 + (Math.random() - 0.5) * 100 : 0,
                  y: containerRef.current ? containerRef.current.clientHeight / 2 + (Math.random() - 0.5) * 100 : 0,
                  category: categoryId
              };
              return [...prev, newNode];
          }
      });
  };

  const handleCustomAdd = (categoryId: string) => {
      const val = customItemInput[categoryId];
      if (val && val.trim() !== '') {
          handleToggleSelect(val.trim(), categoryId);
          setCustomItemInput(prev => ({ ...prev, [categoryId]: '' }));
      }
  };

  const handleSidebarExplore = async (item: string, categoryId: string) => {
      setIsProcessing(true);
      const details = await generateItemDetails(item, categoryId);
      const newTabId = `explore-${Date.now()}`;
      
      const sections: TabSection[] = [
          { id: 'sec-1', type: 'HERO', title: item, content: details.content },
          { id: 'sec-2', type: 'LIST', title: 'Actionable Steps', items: details.steps },
          { id: 'sec-3', type: 'GRID', title: 'Top Companies', items: details.topCompanies }
      ];

      const newTab: WorkspaceTab = {
          id: newTabId,
          label: item.substring(0, 15) + (item.length > 15 ? '...' : ''),
          type: 'STRATEGIES', 
          data: { title: item, ...details }, 
          sections: sections,
          isRemovable: true
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTabId);
      setIsProcessing(false);
  };

  const handleCloseTab = (tabId: string) => {
      setTabs(prev => prev.filter(t => t.id !== tabId));
      if (activeTabId === tabId) setActiveTabId('graph');
  };

  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);

    const newNode: NodeData = {
      id: Date.now().toString(),
      type: NodeType.USER_INPUT,
      label: text,
      x: containerRef.current ? containerRef.current.clientWidth / 2 + (Math.random() - 0.5) * 50 : 0,
      y: containerRef.current ? containerRef.current.clientHeight / 2 + (Math.random() - 0.5) * 50 : 0,
    };
    
    const category = await categorizeInput(text);
    const finalizedNode = { ...newNode, ...category };
    setNodes(prev => [...prev, finalizedNode]);
    setInputText('');

    const analysis = await advanceGuidanceSession([...nodes, finalizedNode], currentPhase, activeTabId);
    
    setQuestion(analysis.nextQuestion);
    setOptions(analysis.suggestedOptions || []);
    setCurrentPhase(analysis.phase);
    
    if (analysis.newTabCreated) {
        const initialSections: TabSection[] = [
            { id: 's1', type: 'HERO', title: analysis.newTabCreated.title, content: analysis.newTabCreated.content || "Start building here..." }
        ];

        const newTab: WorkspaceTab = {
            id: analysis.newTabCreated.id || `tab-${Date.now()}`,
            label: analysis.newTabCreated.title || "New Insight",
            type: 'STRATEGIES', 
            data: analysis.newTabCreated.content ? (typeof analysis.newTabCreated.content === 'string' ? { title: analysis.newTabCreated.title, content: analysis.newTabCreated.content, steps: [] } : analysis.newTabCreated.content) : null,
            sections: initialSections,
            isRemovable: true
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    }

    if (analysis.readyForStories) setReadyForStories(true);
    
    setIsProcessing(false);
  };

  const handleGenerateStories = async () => {
      setIsProcessing(true);
      const generatedStories = await generateStories(nodes);
      setStories(generatedStories);
      
      const newTab: WorkspaceTab = { id: 'stories', label: 'Narratives', type: 'STORIES', isRemovable: false };
      setTabs(prev => {
          if (prev.find(t => t.id === 'stories')) {
              // Switch to tab if it already exists, stories are updated via state
              return prev;
          }
          return [...prev, newTab];
      });
      setActiveTabId('stories');
      setCurrentPhase(GuidancePhase.STORIES);
      setIsProcessing(false);
  };

  const handleSelectStory = async (story: Story) => {
      setIsProcessing(true);
      const generatedRoadmap = await generateRoadmap(story, nodes);
      
      setSavedRoadmaps(prev => [...prev, generatedRoadmap]);
      setRoadmap(generatedRoadmap);
      
      const ecosystemTab: WorkspaceTab = { id: 'ecosystem', label: 'Ecosystem', type: 'ECOSYSTEM', isRemovable: false };
      const booksTab: WorkspaceTab = { id: 'books', label: 'Library', type: 'BOOKS', isRemovable: true };
      const frameworksTab: WorkspaceTab = { id: 'frameworks', label: 'Frameworks', type: 'FRAMEWORKS', isRemovable: true };
      
      setTabs(prev => {
          const newTabs = [ecosystemTab, booksTab, frameworksTab].filter(nt => !prev.find(t => t.id === nt.id));
          return [...prev, ...newTabs];
      });

      setActiveTabId('ecosystem');
      setCurrentPhase(GuidancePhase.ROADMAP);
      setIsProcessing(false);
  };

  const handleMergeRoadmaps = async () => {
      if (mergeSelectIds.length !== 2) return;
      setIsProcessing(true);
      const r1 = savedRoadmaps.find(r => r.id === mergeSelectIds[0]);
      const r2 = savedRoadmaps.find(r => r.id === mergeSelectIds[1]);
      
      if (r1 && r2) {
          const merged = await mergeRoadmaps(r1, r2);
          setSavedRoadmaps(prev => [...prev, merged]);
          setRoadmap(merged);
          setMergeSelectIds([]);
          setShowRoadmapSelector(false);
      }
      setIsProcessing(false);
  };

  const handleDeepDive = async (title: string, context: string) => {
      setIsProcessing(true);
      const details = await generateItemDetails(title, context);
      setDetailModal({ title, ...details });
      setIsProcessing(false);
  };

  const handleModifyRoadmap = async () => {
      if (!generatePrompt.trim() || !roadmap) return;
      setIsProcessing(true);
      const updatedRoadmap = await modifyRoadmap(roadmap, generatePrompt);
      setRoadmap(updatedRoadmap);
      setGeneratePrompt("");
      setGenerateInputOpen(null);
      setIsProcessing(false);
  };

  // --- Dynamic Section Generation ---
  const handleAddSection = async (tabId: string, index: number) => {
      if (!generatePrompt.trim()) return;
      
      // Check if we are in Ecosystem mode (Roadmap Modification)
      if (tabId === 'ecosystem' || tabId === 'temp-ai') {
          handleModifyRoadmap();
          return;
      }

      setIsProcessing(true);
      const currentTab = tabs.find(t => t.id === tabId);
      const newSection = await generateTabSection(generatePrompt, currentTab?.label || "Context");
      
      setTabs(prev => prev.map(t => {
          if (t.id === tabId) {
              const currentSections = t.sections || [];
              const newSections = [...currentSections];
              newSections.splice(index, 0, newSection);
              return { ...t, sections: newSections };
          }
          return t;
      }));
      
      setGenerateInputOpen(null);
      setGeneratePrompt("");
      setIsProcessing(false);
  };

  // --- D3 Dragging ---
  const handleDragStart = (e: any, node: NodeData) => {
    if (!simulationRef.current) return;
    simulationRef.current.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;
  };
  const handleDragEnd = (e: any, node: NodeData, info: any) => {
    if (!simulationRef.current) return;
    simulationRef.current.alphaTarget(0);
    node.fx = null;
    node.fy = null;
    node.x += info.offset.x;
    node.y += info.offset.y;
    simulationRef.current.nodes(nodes);
    simulationRef.current.alpha(0.5).restart();
  };

  // --- Phase Update Callback ---
  const handlePhaseUpdate = (phaseId: string, field: keyof RoadmapPhase, value: any, arrayIndex?: number) => {
    if (!roadmap) return;
    const newPhases = roadmap.phases.map(p => {
        if (p.id === phaseId) {
            if (arrayIndex !== undefined && Array.isArray(p[field])) {
                const newArray = [...(p[field] as any[])];
                newArray[arrayIndex] = value;
                return { ...p, [field]: newArray };
            }
            return { ...p, [field]: value };
        }
        return p;
    });
    setRoadmap({ ...roadmap, phases: newPhases });
  };

  // --- Render Helpers ---

  // Component for the "Hover to Add" line
  const AddSectionTrigger = ({ index, tabId }: { index: number, tabId: string }) => {
      const isOpen = generateInputOpen?.index === index && generateInputOpen?.tabId === tabId;
      
      if (isOpen) {
          return (
              <div className="py-4">
                  <div className="flex gap-2 items-center bg-zinc-900 border border-indigo-500 rounded-lg p-2 shadow-lg animate-in fade-in slide-in-from-top-2">
                      <Sparkles size={16} className="text-indigo-400" />
                      <input 
                        autoFocus
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                        placeholder={tabId === 'ecosystem' ? "Modify Roadmap (e.g. 'Add a phase', 'Refine vision')..." : "Describe the section to generate..."}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSection(tabId, index)}
                        className="bg-transparent outline-none text-sm text-white flex-1 placeholder-zinc-500"
                      />
                      <button onClick={() => handleAddSection(tabId, index)} className="p-1 hover:bg-indigo-500 rounded text-indigo-400 hover:text-white transition-colors">
                          <ArrowRight size={14} />
                      </button>
                      <button onClick={() => setGenerateInputOpen(null)} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors">
                          <X size={14} />
                      </button>
                  </div>
              </div>
          );
      }

      return (
          <div className="h-4 -my-2 relative group flex items-center justify-center cursor-pointer z-10"
               onClick={() => setGenerateInputOpen({ index, tabId })}
          >
              <div className="w-full h-[1px] bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bg-zinc-950 border border-indigo-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100 shadow-lg text-indigo-400">
                  <Plus size={12} />
              </div>
          </div>
      );
  };

  const renderTabContent = (tab: WorkspaceTab) => {
      // ... (renderTabContent implementation remains the same)
      // --- DYNAMIC SECTION EDITOR (For Strategies, Explorer, etc.) ---
      if (tab.sections && tab.sections.length > 0) {
          return (
              <div className="p-8 overflow-y-auto h-full w-full">
                  <div className="max-w-4xl mx-auto pb-20 space-y-2">
                      {tab.sections.map((section, idx) => (
                          <div key={section.id || idx}>
                             {/* Top Trigger */}
                             {idx === 0 && <AddSectionTrigger index={0} tabId={tab.id} />}
                             
                             <div className="group relative bg-zinc-900/20 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800 p-6 rounded-xl transition-all">
                                 {section.type === 'HERO' && (
                                     <>
                                        <h1 className="text-4xl font-light text-white mb-4">
                                            <EditableText 
                                                text={section.title || ''} 
                                                onChange={(val) => { 
                                                    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, sections: t.sections?.map((s, i) => i === idx ? { ...s, title: val } : s) } : t));
                                                }} 
                                            />
                                        </h1>
                                        <div className="text-lg text-zinc-300 leading-relaxed">
                                            <EditableText 
                                                text={section.content || ''} 
                                                onChange={(val) => { 
                                                    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, sections: t.sections?.map((s, i) => i === idx ? { ...s, content: val } : s) } : t));
                                                }} 
                                                multiline 
                                            />
                                        </div>
                                     </>
                                 )}
                                 {section.type === 'TEXT' && (
                                     <>
                                        <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-wide mb-2">
                                            <EditableText 
                                                text={section.title || ''} 
                                                onChange={(val) => { 
                                                    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, sections: t.sections?.map((s, i) => i === idx ? { ...s, title: val } : s) } : t));
                                                }} 
                                            />
                                        </h3>
                                        <div className="text-zinc-300">
                                            <EditableText 
                                                text={section.content || ''} 
                                                onChange={(val) => { 
                                                    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, sections: t.sections?.map((s, i) => i === idx ? { ...s, content: val } : s) } : t));
                                                }} 
                                                multiline 
                                            />
                                        </div>
                                     </>
                                 )}
                                 {section.type === 'LIST' && (
                                     <>
                                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
                                            <EditableText 
                                                text={section.title || ''} 
                                                onChange={(val) => { 
                                                    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, sections: t.sections?.map((s, i) => i === idx ? { ...s, title: val } : s) } : t));
                                                }} 
                                            />
                                        </h3>
                                        <div className="space-y-3">
                                            {section.items?.map((item, i) => (
                                                <div key={i} className="flex gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                                    <span className="text-indigo-500/50 font-mono text-sm">0{i+1}</span>
                                                    <div className="flex-1 text-zinc-300 text-sm">
                                                        <EditableText 
                                                            text={item} 
                                                            onChange={(val) => { 
                                                                setTabs(prev => prev.map(t => t.id === tab.id ? { 
                                                                    ...t, 
                                                                    sections: t.sections?.map((s, si) => si === idx ? { 
                                                                        ...s, 
                                                                        items: s.items?.map((it, ii) => ii === i ? val : it) 
                                                                    } : s) 
                                                                } : t));
                                                            }} 
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     </>
                                 )}
                                 {section.type === 'GRID' && (
                                     <>
                                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                            <EditableText 
                                                text={section.title || ''} 
                                                onChange={(val) => { 
                                                    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, sections: t.sections?.map((s, i) => i === idx ? { ...s, title: val } : s) } : t));
                                                }} 
                                            />
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {section.items?.map((item, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg border border-zinc-700">
                                                    <EditableText 
                                                        text={item} 
                                                        onChange={(val) => { 
                                                            setTabs(prev => prev.map(t => t.id === tab.id ? { 
                                                                ...t, 
                                                                sections: t.sections?.map((s, si) => si === idx ? { 
                                                                    ...s, 
                                                                    items: s.items?.map((it, ii) => ii === i ? val : it) 
                                                                } : s) 
                                                            } : t));
                                                        }} 
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                     </>
                                 )}
                             </div>

                             {/* Bottom Trigger (Between sections) */}
                             <AddSectionTrigger index={idx + 1} tabId={tab.id} />
                          </div>
                      ))}
                  </div>
              </div>
          );
      }

      switch(tab.type) {
          case 'PSYCHE_BOARD':
          case 'GRAPH':
              return (
                <div ref={wrapperRef} className="w-full h-full relative overflow-hidden bg-[#0f0f11]">
                    {/* Background Toggle between Graph and Board */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                         <button onClick={() => setTabs(prev => prev.map(t => t.id === 'graph' ? {...t, type: 'GRAPH'} : t))} className={`p-2 rounded ${tab.type === 'GRAPH' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><Grid size={16}/></button>
                         <button onClick={() => setTabs(prev => prev.map(t => t.id === 'graph' ? {...t, type: 'PSYCHE_BOARD'} : t))} className={`p-2 rounded ${tab.type === 'PSYCHE_BOARD' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><Layout size={16}/></button>
                    </div>

                    {tab.type === 'GRAPH' && (
                        <div className="w-full h-full cursor-grab active:cursor-grabbing">
                            <AnimatePresence>
                                {nodes.map(node => (
                                    <NodeItem 
                                        key={node.id} 
                                        node={node} 
                                        onDragStart={(e) => handleDragStart(e, node)}
                                        onDrag={() => {}} 
                                        onDragEnd={(e, info) => handleDragEnd(e, node, info)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {tab.type === 'PSYCHE_BOARD' && (
                        <div className="w-full h-full p-8 overflow-y-auto flex flex-col md:flex-row gap-6">
                            {/* Analysis Panel */}
                            <div className="w-full md:w-1/3 space-y-6">
                                <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Brain size={20} className="text-indigo-400" />
                                        <h3 className="text-lg font-medium text-zinc-200">Psychological Profile</h3>
                                    </div>
                                    {psycheAnalysis ? (
                                        <div className="space-y-6">
                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Archetype</div>
                                                <div className="text-2xl font-light text-white">{psycheAnalysis.archetype}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Subconscious Drivers</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {psycheAnalysis.subconsciousDrivers?.map((d, i) => <span key={i} className="px-2 py-1 bg-indigo-900/30 border border-indigo-500/20 rounded text-xs text-indigo-200">{d}</span>)}
                                                </div>
                                            </div>
                                            
                                            {/* Core Behavioral Loop Display */}
                                            <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg">
                                                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Repeat size={12} /> Core Behavioral Loop
                                                </div>
                                                <p className="text-sm text-zinc-300 italic leading-relaxed">
                                                    "{psycheAnalysis.coreBehavioralLoop}"
                                                </p>
                                            </div>

                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Growth Lever</div>
                                                <p className="text-sm text-zinc-400">"{psycheAnalysis.growthLever}"</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-zinc-500 italic animate-pulse">Analyzing neural patterns...</div>
                                    )}
                                </div>
                                <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Eye size={20} className="text-emerald-400" />
                                        <h3 className="text-lg font-medium text-zinc-200">Observed Patterns</h3>
                                    </div>
                                    {psycheAnalysis ? (
                                        <ul className="space-y-2">
                                            {psycheAnalysis.behaviorPatterns?.map((p, i) => (
                                                <li key={i} className="text-sm text-zinc-400 flex gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                                    {p}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-sm text-zinc-500 italic">Gathering data...</div>
                                    )}
                                </div>
                            </div>

                            {/* Kanban Columns */}
                            <div className="flex-1 overflow-x-auto">
                                <div className="flex gap-4 h-full min-w-[800px]">
                                    {['identity', 'vision', 'gap', 'belief'].map((cat) => {
                                        const items = nodes.filter(n => 
                                            (cat === 'identity' && (n.type === NodeType.TRAIT || n.category === 'identity')) ||
                                            (cat === 'vision' && (n.type === NodeType.DIRECTION || n.category === 'vision')) ||
                                            (cat === 'gap' && (n.type === NodeType.GAP || n.category === 'gap')) ||
                                            (cat === 'belief' && (n.type === NodeType.VALUE || n.type === NodeType.BELIEF || n.category === 'belief'))
                                        );

                                        return (
                                            <div key={cat} className="flex-1 bg-zinc-950/30 border border-zinc-800/50 rounded-xl p-4 flex flex-col">
                                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                                                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{cat}</h4>
                                                    <span className="text-xs text-zinc-600">{items.length}</span>
                                                </div>
                                                <div className="flex-1 overflow-y-auto space-y-2">
                                                    {items.map(item => (
                                                        <div key={item.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 shadow-sm">
                                                            {item.label}
                                                        </div>
                                                    ))}
                                                    {items.length === 0 && <div className="text-xs text-zinc-700 italic text-center py-4">Drag ideas here...</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              );
          // ... (Other cases remain unchanged)
          case 'IDENTITY':
              return (
                  <div className="w-full h-full bg-[#09090b] relative">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                      <UserAvatar stage={avatarStage} nodes={nodes} roadmap={roadmap} />
                  </div>
              );
          case 'SELECTION':
              return (
                <div className="p-8 overflow-y-auto h-full w-full">
                    <div className="max-w-7xl mx-auto pb-20">
                        <h2 className="text-3xl font-light text-zinc-200 mb-8 flex items-center gap-3">
                            <List className="text-indigo-500" /> Ecosystem Components
                        </h2>
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                            {selectionCategories.map(category => {
                                // Filter items based on Explorer Search
                                const filteredItems = category.items.filter(item => 
                                    item.toLowerCase().includes(explorerSearch.toLowerCase())
                                );
                                
                                if (filteredItems.length === 0) return null;

                                return (
                                    <div key={category.id} className="break-inside-avoid bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 hover:bg-zinc-900/50 transition-colors">
                                        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                                            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{category.title}</h3>
                                            <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">{filteredItems.length} items</span>
                                        </div>
                                        <div className="flex gap-2 mb-4">
                                            <input 
                                                type="text" 
                                                placeholder={`Add custom ${category.title.toLowerCase()}...`}
                                                value={customItemInput[category.id] || ''}
                                                onChange={(e) => setCustomItemInput({...customItemInput, [category.id]: e.target.value})}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd(category.id)}
                                                className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                                            />
                                            <button onClick={() => handleCustomAdd(category.id)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><Plus size={14} /></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {filteredItems.map(item => {
                                                const isSelected = nodes.some(n => n.label === item);
                                                return (
                                                    <button key={item} onClick={() => handleToggleSelect(item, category.id)} className={`group px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-2 ${isSelected ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}>
                                                        {isSelected && <CheckCircle size={10} className="text-indigo-400" />} {item}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
              );
          case 'STORIES':
              if (stories.length === 0) return <div className="p-8 text-zinc-500 animate-pulse">Generating possible futures...</div>;
              return (
                <div className="relative w-full h-full overflow-hidden bg-[#09090b]">
                   <motion.div 
                       animate={{ 
                           background: `radial-gradient(circle at 70% 30%, ${
                               activeStoryIndex === 0 ? 'rgba(99,102,241,0.08)' : 
                               activeStoryIndex === 1 ? 'rgba(16,185,129,0.08)' : 
                               'rgba(245,158,11,0.08)'
                           }, transparent 60%)` 
                       }}
                       transition={{ duration: 1.5 }}
                       className="absolute inset-0 z-0"
                   />
                   
                   <div className="relative z-10 w-full h-full flex flex-col md:flex-row">
                       
                       <div className="w-full md:w-1/3 lg:w-1/4 h-full border-r border-zinc-800/50 bg-zinc-950/30 backdrop-blur-sm flex flex-col p-8 z-20">
                           <div className="mb-12">
                               <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6">Possible Futures</h2>
                               <div className="space-y-4">
                                   {stories.map((story, idx) => (
                                       <button 
                                           key={story.id} 
                                           onClick={() => setActiveStoryIndex(idx)}
                                           className={`w-full text-left group transition-all duration-300 ${activeStoryIndex === idx ? 'pl-4 border-l-2 border-indigo-500' : 'pl-0 border-l-2 border-transparent hover:pl-2'}`}
                                       >
                                           <div className={`text-2xl font-light transition-colors ${activeStoryIndex === idx ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                               0{idx + 1}
                                           </div>
                                           <div className={`text-sm uppercase tracking-wider ${activeStoryIndex === idx ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                                               {story.modelTitle || story.title}
                                           </div>
                                       </button>
                                   ))}
                               </div>
                           </div>

                           <div className="mt-auto">
                               <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Model Archetype</div>
                               <h3 className="text-xl font-light text-zinc-300 mb-1">
                                   {stories[activeStoryIndex]?.realWorldModel}
                               </h3>
                               <p className="text-xs text-zinc-500 italic">
                                   "{stories[activeStoryIndex]?.fact}"
                               </p>
                           </div>
                       </div>

                       <div className="flex-1 h-full overflow-y-auto relative scrollbar-hide">
                           <AnimatePresence mode='wait'>
                               <motion.div
                                   key={activeStoryIndex}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, y: -20 }}
                                   transition={{ duration: 0.6, ease: "easeOut" }}
                                   className="p-8 md:p-16 max-w-4xl"
                               >
                                   <div className="absolute top-10 right-10 text-[120px] font-black text-zinc-800/20 select-none -z-10 leading-none">
                                       0{activeStoryIndex + 1}
                                   </div>

                                   <div className="mb-12">
                                       <motion.h1 
                                           className="text-5xl md:text-7xl font-thin text-white tracking-tighter mb-6 leading-none"
                                           initial={{ opacity: 0, x: -20 }}
                                           animate={{ opacity: 1, x: 0 }}
                                           transition={{ delay: 0.1, duration: 0.8 }}
                                       >
                                           {stories[activeStoryIndex]?.title?.toUpperCase() || "UNTITLED"}
                                       </motion.h1>
                                       
                                       <motion.div 
                                           className="relative pl-6 border-l-2 border-indigo-500/50"
                                           initial={{ opacity: 0 }}
                                           animate={{ opacity: 1 }}
                                           transition={{ delay: 0.3 }}
                                       >
                                           <p className="text-xl md:text-2xl font-light text-zinc-300 italic leading-relaxed">
                                               "{stories[activeStoryIndex]?.keyMindset || stories[activeStoryIndex]?.philosophy}"
                                           </p>
                                       </motion.div>
                                   </div>

                                   <motion.div 
                                       className="prose prose-invert prose-lg max-w-none text-zinc-400 mb-16 leading-8 font-light"
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1 }}
                                       transition={{ delay: 0.4 }}
                                   >
                                       {(stories[activeStoryIndex]?.narrative || "Loading narrative structure...").split('\n').map((para, i) => (
                                           <p key={i} className="mb-6">{para}</p>
                                       ))}
                                   </motion.div>

                                   <motion.div 
                                       className="flex items-center gap-6"
                                       initial={{ opacity: 0, y: 20 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       transition={{ delay: 0.6 }}
                                   >
                                       <button 
                                           onClick={() => handleSelectStory(stories[activeStoryIndex])}
                                           className="group relative px-8 py-4 bg-white text-black text-sm font-bold tracking-widest uppercase overflow-hidden hover:bg-zinc-200 transition-colors"
                                       >
                                           <span className="relative z-10 flex items-center gap-2">
                                               Initialize This Path <ArrowRight size={16} />
                                           </span>
                                       </button>
                                       
                                       <div className="text-xs text-zinc-600 uppercase tracking-wider">
                                           Generates Phase 1 Roadmap
                                       </div>
                                   </motion.div>
                               </motion.div>
                           </AnimatePresence>
                       </div>
                   </div>
                </div>
              );
          case 'ECOSYSTEM':
              if (!roadmap) return null;
              
              if (activePhaseId) {
                  const currentPhaseIndex = roadmap.phases.findIndex(p => p.id === activePhaseId);
                  if (currentPhaseIndex === -1) return null; // Safety check
                  
                  const activePhase = roadmap.phases[currentPhaseIndex];
                  
                  return (
                      <AnimatePresence mode="wait">
                        <motion.div 
                            key={activePhaseId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            <PhaseBlueprint 
                                phase={activePhase} 
                                onBack={() => setActivePhaseId(null)}
                                onPrev={() => {
                                    if (currentPhaseIndex > 0) setActivePhaseId(roadmap.phases[currentPhaseIndex - 1].id);
                                }}
                                onNext={() => {
                                    if (currentPhaseIndex < roadmap.phases.length - 1) setActivePhaseId(roadmap.phases[currentPhaseIndex + 1].id);
                                }}
                                hasPrev={currentPhaseIndex > 0}
                                hasNext={currentPhaseIndex < roadmap.phases.length - 1}
                                onUpdate={(field, value, index) => handlePhaseUpdate(activePhase.id, field, value, index)}
                                onAskAI={(prompt) => {
                                    setGeneratePrompt(prompt);
                                    setGenerateInputOpen({ index: 999, tabId: 'ecosystem' }); 
                                }}
                            />
                        </motion.div>
                      </AnimatePresence>
                  );
              }

              return (
                <div className="flex flex-col p-6 md:p-10 overflow-y-auto h-full w-full bg-[#0f0f11]">
                    <div className="max-w-7xl mx-auto w-full pb-20">
                        
                        {/* Header and Version Selector */}
                        <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
                             <div className="flex-1">
                                 <h1 className="text-5xl md:text-6xl font-extralight text-white mb-4 tracking-tight">
                                    <EditableText text={roadmap.ecosystemTitle} onChange={(val) => { if(roadmap) { setRoadmap({...roadmap, ecosystemTitle: val}); } }} />
                                 </h1>
                                 <div className="flex items-center gap-3">
                                     <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Identity Shift</div>
                                     <span className="text-xl text-zinc-400 font-light">
                                         <EditableText text={roadmap.identityShift} onChange={(val) => { if(roadmap) { setRoadmap({...roadmap, identityShift: val}); } }} />
                                     </span>
                                 </div>
                             </div>
                             
                             <div className="flex flex-col items-end gap-3 relative">
                                 <button 
                                     onClick={() => setShowRoadmapSelector(!showRoadmapSelector)}
                                     className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                                 >
                                     <FolderOpen size={16} /> Versions ({savedRoadmaps.length})
                                 </button>

                                 {showRoadmapSelector && (
                                     <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                                         <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Saved Architectures</h4>
                                         <div className="space-y-2 max-h-60 overflow-y-auto">
                                             {savedRoadmaps.map((r) => (
                                                 <div key={r.id} className="flex items-center gap-2">
                                                     <div 
                                                         onClick={() => { setRoadmap(r); setShowRoadmapSelector(false); }}
                                                         className={`flex-1 p-3 rounded-lg cursor-pointer border transition-all ${roadmap.id === r.id ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-200' : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
                                                     >
                                                         <div className="text-sm font-medium truncate">{r.ecosystemTitle}</div>
                                                         <div className="text-[10px] text-zinc-600">{new Date(r.createdAt).toLocaleDateString()}</div>
                                                     </div>
                                                     
                                                     <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMergeSelectIds(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : prev.length < 2 ? [...prev, r.id] : prev);
                                                        }}
                                                        className={`w-8 h-8 flex items-center justify-center rounded border ${mergeSelectIds.includes(r.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-zinc-700 text-zinc-700 hover:border-zinc-500'}`}
                                                     >
                                                         {mergeSelectIds.includes(r.id) ? <Check size={14} /> : <Merge size={14} />}
                                                     </button>
                                                 </div>
                                             ))}
                                         </div>
                                         {mergeSelectIds.length === 2 && (
                                             <button 
                                                 onClick={handleMergeRoadmaps}
                                                 className="w-full mt-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                             >
                                                 <Merge size={12} /> Merge Selected (2)
                                             </button>
                                         )}
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* Bento Grid Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
                            {/* ... (Vision, Principles, Inspirations cards same as above) ... */}
                            <div className="lg:col-span-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Quote size={80} /></div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Eye size={16} /> North Star Vision</h3>
                                <p className="text-xl leading-relaxed text-zinc-200 font-light italic">
                                    "<EditableText text={roadmap.vision} onChange={(val) => { if(roadmap) { setRoadmap({...roadmap, vision: val}); } }} multiline />"
                                </p>
                            </div>

                            <div className="lg:col-span-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8">
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers size={16} /> Operating Principles</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {roadmap.principles?.map((p, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/50 transition-all group">
                                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors font-mono text-xs">{i+1}</div>
                                            <span className="text-sm text-zinc-300 font-medium w-full">
                                                <EditableText text={p} onChange={(val) => { if(roadmap) { const newP = [...roadmap.principles]; newP[i] = val; setRoadmap({...roadmap, principles: newP}); } }} />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-12 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 mt-6">
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Star size={16} /> Core Inspirations</h3>
                                <div className="flex flex-wrap gap-4">
                                    {roadmap.inspirations?.map((insp, i) => (
                                        <div key={i} className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-full text-sm text-zinc-300 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                                            <EditableText text={insp} onChange={(val) => { if(roadmap) { const newI = [...(roadmap.inspirations || [])]; newI[i] = val; setRoadmap({...roadmap, inspirations: newI}); } }} />
                                        </div>
                                    ))}
                                    {(!roadmap.inspirations || roadmap.inspirations.length === 0) && (
                                        <div className="text-zinc-600 text-sm italic">No specific inspirations defined yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Timeline Roadmap */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-light text-white mb-8 flex items-center gap-3"><Target size={24} className="text-indigo-500" /> Strategic Timeline</h2>
                            
                            <AddSectionTrigger index={0} tabId="ecosystem" />

                            <div className="w-full overflow-x-auto pb-8 scrollbar-hide">
                                <div className="flex gap-8 min-w-max px-2 relative items-center">
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -z-10 -translate-y-1/2" />
                                    
                                    {roadmap.phases?.map((phase, idx) => (
                                        <div key={phase.id} className="relative group cursor-pointer" onClick={() => setActivePhaseId(phase.id)}>
                                            <div className="w-[300px] h-[380px] bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col justify-between transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-10 backdrop-blur-sm">
                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-[10px] font-bold bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-indigo-400 uppercase tracking-wider">Phase 0{idx+1}</span>
                                                        <span className="text-xs text-zinc-500 font-mono flex items-center gap-1"><Clock size={10} /> {phase.duration}</span>
                                                    </div>
                                                    <h3 className="text-xl font-medium text-white mb-4 line-clamp-2">{phase.title}</h3>
                                                    <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-4">{phase.goal}</p>
                                                </div>
                                                
                                                <div className="border-t border-zinc-800 pt-4">
                                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                                        <span className="flex items-center gap-1"><Cpu size={12}/> {phase.skillsToLearn?.length || 0} Skills</span>
                                                        <span className="flex items-center gap-1"><Activity size={12}/> {phase.habits?.length || 0} Habits</span>
                                                    </div>
                                                    <button className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-xs text-zinc-300 transition-colors uppercase tracking-wider flex items-center justify-center gap-2">
                                                        Open Blueprint <ArrowRight size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute top-1/2 -left-4 w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-indigo-500 transition-colors hidden md:block" />
                                        </div>
                                    ))}
                                    
                                    <button 
                                        onClick={() => {
                                            setGeneratePrompt("Generate a new next phase for this roadmap.");
                                            handleModifyRoadmap();
                                        }}
                                        className="flex flex-col items-center justify-center w-[100px] h-[380px] text-zinc-700 hover:text-indigo-400 transition-colors border border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-xl bg-zinc-900/30 group"
                                    >
                                        <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Add Phase</span>
                                    </button>

                                    <div className="flex items-center justify-center w-[50px] h-[380px] text-zinc-700">
                                        <Flag size={32} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
              );
          case 'BOOKS':
              if (!roadmap?.books) return <div className="p-8 text-zinc-500">No books generated yet.</div>;
              return (
                  <div className="p-8 overflow-y-auto h-full w-full">
                      <h2 className="text-3xl font-light text-zinc-200 mb-10 flex items-center gap-3"><Book size={28} /> Recommended Library</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                          {roadmap.books.map((book, i) => (
                              <div key={i} onClick={() => handleDeepDive(book.title, "Book Summary & Insights")} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-xl hover:border-indigo-500/30 cursor-pointer transition-all group flex flex-col justify-between h-[300px] shadow-lg">
                                  <div>
                                    <h3 className="text-xl font-medium text-zinc-200 group-hover:text-indigo-300 mb-1">{book.title}</h3>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-6">by {book.author}</div>
                                    <p className="text-sm text-zinc-400 mb-6 italic border-l-2 border-zinc-700 pl-4">"{book.keyInsight}"</p>
                                  </div>
                                  <div className="text-xs text-zinc-500 bg-zinc-950 p-3 rounded border border-zinc-800/50">{book.reason}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              );
          case 'FRAMEWORKS':
               if (!roadmap?.frameworks) return <div className="p-8 text-zinc-500">No frameworks generated yet.</div>;
               return (
                   <div className="p-8 overflow-y-auto h-full w-full">
                       <h2 className="text-3xl font-light text-zinc-200 mb-10 flex items-center gap-3"><Grid size={28} /> Mental Models & Frameworks</h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                           {roadmap.frameworks.map((f, i) => (
                               <div key={i} onClick={() => handleDeepDive(f, "Strategic Framework")} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-xl hover:border-emerald-500/30 cursor-pointer transition-all flex items-center justify-between group hover:bg-zinc-800/50 shadow-md">
                                   <span className="text-lg text-zinc-200 font-light">{f}</span>
                                   <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-emerald-400 transition-colors">
                                        <ArrowRight size={16} />
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               );
          default:
              return <div className="p-8 text-zinc-500">Select a tab to view content.</div>;
      }
  };

  // --- Render ---
  return (
    <div className="flex w-full h-screen bg-[#0f0f11] overflow-hidden font-sans">
      
      <AnimatePresence>
        {hasStarted && (
            <motion.div 
                initial={{ width: 0, opacity: 0 }} 
                animate={{ width: sidebarExpanded ? 300 : 70, opacity: 1 }} 
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-md relative z-40 shadow-2xl h-full flex-shrink-0"
            >
                {/* ... (Sidebar logic remains the same) ... */}
                <button 
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    className="absolute -right-3 top-6 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white z-50 shadow-md"
                >
                    {sidebarExpanded ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                </button>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-[70px] flex flex-col items-center py-6 gap-6 border-r border-zinc-800/30 flex-shrink-0">
                         {SIDEBAR_CATEGORIES.map(cat => (
                             <button 
                                key={cat.id}
                                onClick={() => { setActiveSidebarCategory(cat.id); setSidebarExpanded(true); }}
                                className={`p-3 rounded-xl transition-all ${activeSidebarCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                                title={cat.label}
                             >
                                 <cat.icon size={20} />
                             </button>
                         ))}
                    </div>

                    {sidebarExpanded && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                            className="flex-1 overflow-y-auto p-6 w-[230px]"
                        >
                            <h3 className="text-lg font-light text-zinc-200 mb-6 flex items-center gap-2 border-b border-zinc-800 pb-2">
                                {activeSidebarCategory ? SIDEBAR_CATEGORIES.find(c => c.id === activeSidebarCategory)?.label : "Resources"}
                            </h3>
                            
                            {/* NEW: Explorer Search Input */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2">
                                    <Search size={14} className="text-zinc-500" />
                                    <input 
                                        value={explorerSearch}
                                        onChange={(e) => setExplorerSearch(e.target.value)}
                                        placeholder="Filter..." 
                                        className="bg-transparent border-none outline-none text-xs text-zinc-300 w-full placeholder-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {activeSidebarCategory && SIDEBAR_CATEGORIES.find(c => c.id === activeSidebarCategory)?.items
                                    .filter(item => item.toLowerCase().includes(explorerSearch.toLowerCase()))
                                    .map(item => (
                                    <div key={item} className="group flex flex-col p-3 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-lg border border-zinc-800 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm text-zinc-300 font-medium">{item}</span>
                                            {nodes.some(n => n.label === item) && <span className="text-[10px] text-indigo-400 font-bold">ADDED</span>}
                                        </div>
                                        <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleToggleSelect(item, activeSidebarCategory!)}
                                                className={`flex-1 py-1.5 px-2 rounded text-[10px] flex items-center justify-center gap-1 ${nodes.some(n => n.label === item) ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'}`}
                                            >
                                                {nodes.some(n => n.label === item) ? <CheckCircle size={10} /> : <Plus size={10} />}
                                                {nodes.some(n => n.label === item) ? 'Added' : 'Add'}
                                            </button>
                                            <button 
                                                onClick={() => handleSidebarExplore(item, activeSidebarCategory!)}
                                                className="flex-1 py-1.5 px-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded text-[10px] text-zinc-400 hover:text-indigo-300 flex items-center justify-center gap-1"
                                            >
                                                <Search size={10} /> Explore
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden relative">
      
        <div 
            className="h-full bg-zinc-900/40 backdrop-blur-md flex flex-col relative z-20 shadow-2xl flex-shrink-0"
            style={{ width: hasStarted ? leftPanelWidth : '100%' }}
        >
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col scrollbar-hide">
                
                {/* ... (Input mode selector remains the same) ... */}
                <div className="mb-6 flex items-center justify-between opacity-80 sticky top-0 bg-[#121215] z-30 pb-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <Layout size={14} className="text-indigo-400" />
                        <span className="text-xs tracking-[0.2em] font-bold uppercase text-zinc-400">
                             {inputMode}
                        </span>
                    </div>
                    {hasStarted && (
                        <div className="flex gap-1 bg-zinc-800 p-1 rounded-lg">
                            <button 
                                onClick={() => setInputMode('INTENTION')} 
                                className={`p-1.5 rounded-md transition-colors ${inputMode === 'INTENTION' ? 'bg-zinc-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`} 
                                title="Intention Architect"
                            >
                                <Brain size={14} />
                            </button>
                             <button 
                                onClick={() => setInputMode('CHAT')} 
                                className={`p-1.5 rounded-md transition-colors ${inputMode === 'CHAT' ? 'bg-zinc-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`} 
                                title="Chat Mode"
                            >
                                <Mic size={14} />
                            </button>
                            <button 
                                onClick={() => { setInputMode('SELECT'); setActiveTabId('selection'); }} 
                                className={`p-1.5 rounded-md transition-colors ${inputMode === 'SELECT' ? 'bg-zinc-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`} 
                                title="Explorer Mode"
                            >
                                <List size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {hasStarted && readyForStories && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mb-4 px-1"
                    >
                        <button 
                            onClick={handleGenerateStories} 
                            disabled={isProcessing}
                            className="w-full relative group overflow-hidden rounded-xl p-[1px]"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${roadmap ? 'from-emerald-500 via-teal-500 to-emerald-500' : 'from-indigo-500 via-purple-500 to-indigo-500'} animate-gradient-xy opacity-70 group-hover:opacity-100 transition-opacity`} />
                            <div className="relative bg-[#18181b] rounded-xl px-6 py-4 flex items-center justify-between group-hover:bg-[#18181b]/90 transition-colors">
                                <div className="flex flex-col items-start">
                                    <span className={`text-xs font-bold ${roadmap ? 'text-emerald-400' : 'text-indigo-400'} uppercase tracking-widest flex items-center gap-2`}>
                                        <Sparkles size={12} /> {roadmap ? 'Context Updated' : 'System Ready'}
                                    </span>
                                    <span className="text-sm font-light text-white mt-1">
                                        {roadmap ? 'Generate New Alternative Paths' : 'Initialize Ecosystem Architecture'}
                                    </span>
                                </div>
                                <ArrowRight size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                        </button>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {/* ... (The rest of the component flow remains unchanged) ... */}
                    {!hasStarted ? (
                        <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6 mt-10 items-center text-center">
                            <h2 className="text-3xl font-light text-zinc-100 max-w-lg">{question}</h2>
                            <button onClick={handleStart} className="w-fit px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all text-sm tracking-wide">INITIALIZE SEQUENCE</button>
                        </motion.div>
                    ) : (
                        inputMode === 'INTENTION' ? (
                            <motion.div key="intention-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-8 pb-20">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Zap size={14} className="text-amber-400" /> Identity Core (Select Traits)
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectionCategories.find(c => c.id === 'traits')?.items?.map(trait => {
                                            const isSelected = selectedTraits.includes(trait);
                                            return (
                                                <button
                                                    key={trait}
                                                    onClick={() => handleToggleTrait(trait)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected ? 'bg-amber-900/30 text-amber-300 border-amber-500/50' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'}`}
                                                >
                                                    {trait}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Lock size={14} className="text-indigo-400" /> Unlock Deep Architecture
                                    </h3>
                                    <div className="space-y-4">
                                        {deepQuestions.filter(q => !q.requiredTraits || q.requiredTraits.some(t => selectedTraits.includes(t))).map((q, idx) => (
                                            <div key={q.id} className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
                                                <p className="text-zinc-200 text-sm mb-3 font-medium">{q.text}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {q.options.map(opt => {
                                                        const isSelected = nodes.some(n => n.label === opt);
                                                        return (
                                                            <button 
                                                                key={opt}
                                                                onClick={() => handleAnswerQuestion(q.text, opt, q.category)}
                                                                className={`text-[11px] px-2 py-1 rounded border transition-colors text-left ${isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : inputMode === 'CHAT' ? (
                            <motion.div key="chat-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                                <h2 className="text-2xl font-light text-zinc-100 leading-snug">{question}</h2>
                                <div className="flex flex-wrap gap-2">
                                    {options.map((opt, i) => (
                                        <button key={i} onClick={() => handleSubmit(opt)} disabled={isProcessing} className="px-4 py-2 border border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/10 rounded-lg text-sm text-zinc-300 text-left transition-all disabled:opacity-50">
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="explore-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                                 <p className="text-sm text-zinc-400">Add multiple elements to enrich your ecosystem before generating.</p>
                                 <div className="space-y-6">
                                     {selectionCategories.map(cat => (
                                         <div key={cat.id} className="border-b border-zinc-800 pb-4 last:border-0">
                                             <div className="flex justify-between items-center mb-3">
                                                <h3 className="text-sm font-bold text-zinc-300 uppercase">{cat.title}</h3>
                                                <span className="text-[10px] text-zinc-600">{cat.items.length} options</span>
                                             </div>
                                             <div className="flex gap-1 mb-2">
                                                <input 
                                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 outline-none focus:border-indigo-500/50"
                                                    placeholder="Add custom..."
                                                    value={customItemInput[cat.id] || ''}
                                                    onChange={(e) => setCustomItemInput({...customItemInput, [cat.id]: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd(cat.id)}
                                                />
                                                <button onClick={() => handleCustomAdd(cat.id)} className="bg-zinc-800 text-zinc-400 hover:text-white px-2 rounded"><Plus size={12} /></button>
                                             </div>
                                             <div className="flex flex-wrap gap-1.5">
                                                 {cat.items.map(item => {
                                                     const isSelected = nodes.some(n => n.label === item);
                                                     return (
                                                         <button 
                                                            key={item}
                                                            onClick={() => handleToggleSelect(item, cat.id)}
                                                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${isSelected ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/40' : 'bg-zinc-800/40 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'}`}
                                                         >
                                                             {item}
                                                         </button>
                                                     )
                                                 })}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>

            {hasStarted && inputMode === 'CHAT' && (
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(inputText); }} className="flex items-center gap-3">
                        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type freely to edit or add..." disabled={isProcessing} className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm" />
                        <button type="submit" disabled={!inputText.trim() || isProcessing} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white"><Send size={16} /></button>
                    </form>
                </div>
            )}
        </div>

        {hasStarted && (
            <div 
                onMouseDown={startResizing}
                className="w-1 bg-zinc-800 hover:bg-indigo-500 hover:w-1.5 transition-all cursor-col-resize z-30 flex items-center justify-center group flex-shrink-0"
            >
                <div className="h-8 w-1 bg-zinc-600 rounded-full group-hover:bg-white" />
            </div>
        )}

        <div className="relative flex-1 h-full bg-[#0f0f11] overflow-hidden flex flex-col" ref={containerRef}>
            
            {hasStarted && (
                <div className="h-14 border-b border-zinc-800 flex items-center px-4 overflow-x-auto gap-2 bg-zinc-900/20 backdrop-blur-sm scrollbar-hide flex-shrink-0">
                    {tabs.map(tab => (
                        <div key={tab.id} className="relative group">
                            <button
                                onClick={() => setActiveTabId(tab.id)}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeTabId === tab.id ? 'bg-zinc-800 text-indigo-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                            >
                                {tab.label}
                                {tab.isRemovable && (
                                    <span 
                                        onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                                        className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                                    >
                                        <X size={10} />
                                    </span>
                                )}
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={() => setInputText("Create a new tab for...")}
                        className="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50 rounded-lg" 
                        title="Ask AI to create new tab"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            )}

            <div className="flex-1 relative overflow-hidden bg-[#0f0f11]">
                {tabs.map(tab => (
                    <div key={tab.id} className={`absolute inset-0 transition-opacity duration-300 ${activeTabId === tab.id ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                        {renderTabContent(tab)}
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {detailModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-8"
                        onClick={() => setDetailModal(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#18181b] border border-zinc-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6 border-b border-zinc-800 pb-4">
                                <h2 className="text-2xl font-light text-zinc-100">{detailModal.title}</h2>
                                <button onClick={() => setDetailModal(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="prose prose-invert prose-zinc max-w-none">
                                <p className="text-zinc-300 text-lg leading-relaxed mb-6">{detailModal.content}</p>
                                
                                {detailModal.marketOutlook && (
                                    <div className="flex gap-4 mb-6">
                                        <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                                            <div className="text-[10px] text-zinc-500 uppercase">Trend</div>
                                            <div className="text-sm text-zinc-200">{detailModal.marketOutlook}</div>
                                        </div>
                                    </div>
                                )}

                                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Actionable Workflow</h3>
                                <ul className="space-y-3">
                                    {detailModal.steps.map((step, i) => (
                                        <li key={i} className="flex gap-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                            <span className="text-zinc-500 font-mono text-sm">0{i+1}</span>
                                            <span className="text-zinc-300 text-sm">{step}</span>
                                        </li>
                                    ))}
                                </ul>

                                {detailModal.sources && detailModal.sources.length > 0 && (
                                    <div className="mt-8 pt-4 border-t border-zinc-800">
                                         <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">Sources</h3>
                                         <div className="flex flex-wrap gap-2">
                                            {detailModal.sources.map((src, i) => (
                                                <a key={i} href={src} target="_blank" className="text-[10px] text-zinc-500 hover:text-indigo-400 truncate max-w-[200px]">{new URL(src).hostname}</a>
                                            ))}
                                         </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isProcessing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-sm text-indigo-300 font-medium tracking-widest animate-pulse">SEARCHING & COMPUTING...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
