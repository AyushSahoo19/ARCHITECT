
export type ViewState = 'landing' | 'transitioning' | 'landscape';

export enum NodeType {
  INSIGHT = 'INSIGHT',
  DIRECTION = 'DIRECTION',
  GAP = 'GAP',
  SKILL = 'SKILL',
  VALUE = 'VALUE',
  USER_INPUT = 'USER_INPUT',
  SYSTEM_MSG = 'SYSTEM_MSG',
  TRAIT = 'TRAIT',
  BELIEF = 'BELIEF',
}

export enum GuidancePhase {
  WELCOME = 'WELCOME',
  INTENTION = 'INTENTION',
  REALITY = 'REALITY',
  MINDSET = 'MINDSET',
  INSPIRATION = 'INSPIRATION',
  STORIES = 'STORIES',
  ROADMAP = 'ROADMAP'
}

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null; 
  fy?: number | null;
  isDragging?: boolean;
  category?: string; // For Kanban
}

export interface LinkData {
  source: string | NodeData;
  target: string | NodeData;
  strength?: number;
}

export interface Story {
  id: string;
  title: string;
  narrative: string;
  philosophy: string;
  matchReason: string;
  // New Fields
  realWorldModel: string; // e.g. "Elon Musk"
  modelTitle: string; // e.g. "The First Principles Thinker"
  keyMindset: string; // Quote or belief
  fact: string; // Real world fact
}

export interface RoadmapPhase {
  id: string; // Added for DnD key
  phase: number;
  title: string;
  duration: string;
  goal: string;
  habits: string[];
  skillsToLearn: string[];
  detailedWorkflow?: string[]; // Drill down content
  strategies?: string[];
  resources?: { title: string; type: string; link?: string }[];
  keyVision?: string;
}

export interface BookRecommendation {
    title: string;
    author: string;
    reason: string;
    keyInsight: string;
}

export interface EcosystemData {
    id: string;
    title: string;
    description: string;
}

export interface Roadmap {
  id: string; // Unique ID for versioning
  createdAt: number;
  ecosystemTitle: string;
  identityShift: string;
  phases: RoadmapPhase[];
  principles: string[];
  frameworks: string[];
  vision: string;
  traits: string[];
  books?: BookRecommendation[];
  strategies?: string[];
  inspirations?: string[];
  sources?: string[];
  mergedFrom?: string[]; // IDs of parents if merged
}

export interface ExplorationData {
    title: string;
    content: string;
    steps: string[];
    sources?: string[];
    marketOutlook?: string;
    averageSalary?: string;
    topCompanies?: string[];
    relatedRoles?: string[];
}

export interface PsycheAnalysis {
    archetype: string;
    subconsciousDrivers: string[];
    behaviorPatterns: string[];
    coreBehavioralLoop: string; // New field for specific pattern prediction
    predictedChallenges: string[];
    growthLever: string;
}

export interface LandscapeAnalysis {
  connections: { sourceId: string; targetId: string }[];
  nextQuestion: string;
  suggestedOptions: string[];
  phase: GuidancePhase;
  hiddenAnalysis?: string;
  readyForStories?: boolean; 
  newTabCreated?: { id: string; title: string; content: any }; // Signal to create tab
}

export interface SelectionCategory {
  id: string;
  title: string;
  items: string[];
}

export interface QuestionDefinition {
    id: string;
    text: string;
    category: 'VISION' | 'BELIEF' | 'GAP' | 'LIFESTYLE';
    options: string[];
    requiredTraits?: string[]; // Only show if these traits are selected
}

export type TabType = 'GRAPH' | 'SELECTION' | 'STORIES' | 'ECOSYSTEM' | 'BOOKS' | 'FRAMEWORKS' | 'STRATEGIES' | 'INSPIRATION' | 'IDENTITY' | 'PSYCHE_BOARD';

export interface TabSection {
    id: string;
    type: 'HERO' | 'TEXT' | 'LIST' | 'GRID' | 'QUOTE';
    title?: string;
    content?: string;
    items?: string[];
}

export interface WorkspaceTab {
    id: string;
    label: string;
    type: TabType;
    data?: any;
    sections?: TabSection[]; // New modular structure
    isRemovable?: boolean;
}

export type AvatarStage = 'OBSERVER' | 'SEEKER' | 'ARCHITECT' | 'MASTER';
