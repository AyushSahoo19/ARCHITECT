
import { GoogleGenAI, Type } from "@google/genai";
import { NodeData, LandscapeAnalysis, GuidancePhase, NodeType, Story, Roadmap, SelectionCategory, ExplorationData, PsycheAnalysis, QuestionDefinition, TabSection } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract sources from grounding metadata
function extractSources(response: any): string[] {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const uris = chunks
        .map((c: any) => c.web?.uri)
        .filter((u: string) => !!u);
    return [...new Set(uris)] as string[];
}

// Robust JSON Parser with Repair Capability
function cleanAndParseJSON(text: string): any {
    if (!text) return null;
    
    // 1. Simple Clean
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    // 2. Try fast parse
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Proceed to repair
    }

    // 3. Find Start
    const firstOpenBrace = cleaned.indexOf('{');
    const firstOpenBracket = cleaned.indexOf('[');
    
    let startIndex = -1;
    let mode: 'OBJECT' | 'ARRAY' = 'OBJECT';
    
    if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
        startIndex = firstOpenBrace;
        mode = 'OBJECT';
    } else if (firstOpenBracket !== -1) {
        startIndex = firstOpenBracket;
        mode = 'ARRAY';
    } else {
        return null;
    }

    // 4. Stack-based traversal to find end or repair point
    const stack: string[] = [];
    let inString = false;
    let isEscaped = false;
    
    stack.push(mode === 'OBJECT' ? '}' : ']');

    let i = startIndex + 1;
    for (; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        if (isEscaped) {
            isEscaped = false;
            continue;
        }
        
        if (char === '\\') {
            isEscaped = true;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
            continue;
        }
        
        if (!inString) {
            if (char === '{') stack.push('}');
            else if (char === '[') stack.push(']');
            else if (char === '}' || char === ']') {
                const expected = stack[stack.length - 1];
                if (char === expected) {
                    stack.pop();
                    if (stack.length === 0) {
                        // Found complete valid JSON
                        try {
                            return JSON.parse(cleaned.substring(startIndex, i + 1));
                        } catch (e) {
                            // Continue if parse fails (rare)
                        }
                    }
                }
            }
        }
    }

    // 5. Repair Truncated JSON
    console.warn("Attempting to repair truncated JSON...");
    let recovered = cleaned.substring(startIndex);
    
    // If cut off inside a string, close it
    if (inString) {
        recovered += '"';
    }

    // Trim whitespace
    recovered = recovered.trim();

    // Handle trailing comma (invalid in JSON)
    if (recovered.endsWith(',')) {
        recovered = recovered.slice(0, -1);
    }

    // Handle trailing colon (incomplete key-value pair), e.g., "key": 
    if (recovered.endsWith(':')) {
        recovered += ' null';
    }
    
    // Close all open structures
    while (stack.length > 0) {
        recovered += stack.pop();
    }

    try {
        return JSON.parse(recovered);
    } catch (e) {
        console.error("JSON Repair Failed:", e);
        return null;
    }
}

// --- NEW: Generate Deep Psyche Analysis ---
export const generatePsycheAnalysis = async (nodes: NodeData[]): Promise<PsycheAnalysis> => {
    const traits = nodes.filter(n => n.type === NodeType.TRAIT).map(n => n.label).join(', ');
    const values = nodes.filter(n => n.type === NodeType.VALUE).map(n => n.label).join(', ');
    const answers = nodes.filter(n => n.type === NodeType.USER_INPUT || n.type === NodeType.BELIEF).map(n => n.label).join('; ');

    const prompt = `Analyze this user based on their inputs.
    Traits: ${traits}
    Values: ${values}
    Statements: ${answers}
    
    Predict their psychological profile.
    CRITICAL: Identify a "Core Behavioral Loop" - a specific, repeating recursive cycle of behavior they likely fall into (can be a strength or a trap, e.g. "You seek perfection to avoid criticism, which delays execution, leading to rushed work.").
    
    Return JSON:
    {
        "archetype": "Title (e.g. The Visionary Builder)",
        "subconsciousDrivers": ["Deep motivation 1", "Deep motivation 2"],
        "behaviorPatterns": ["Likely habit 1", "Likely habit 2"],
        "coreBehavioralLoop": "A single, insightful sentence describing their recursive behavioral loop.",
        "predictedChallenges": ["Potential pitfall 1", "Potential pitfall 2"],
        "growthLever": "The one thing they need to master to succeed"
    }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        archetype: { type: Type.STRING },
                        subconsciousDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        behaviorPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                        coreBehavioralLoop: { type: Type.STRING },
                        predictedChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
                        growthLever: { type: Type.STRING }
                    }
                }
            }
        });
        const data = response.text ? cleanAndParseJSON(response.text) : null;
        if (data) {
            return {
                archetype: data.archetype || "The Emerging Explorer",
                subconsciousDrivers: Array.isArray(data.subconsciousDrivers) ? data.subconsciousDrivers : [],
                behaviorPatterns: Array.isArray(data.behaviorPatterns) ? data.behaviorPatterns : [],
                coreBehavioralLoop: data.coreBehavioralLoop || "Analyzing patterns...",
                predictedChallenges: Array.isArray(data.predictedChallenges) ? data.predictedChallenges : [],
                growthLever: data.growthLever || "Clarity"
            };
        }
        throw new Error("Invalid format");
    } catch (e) {
        return { 
            archetype: "The Architect", 
            subconsciousDrivers: [], 
            behaviorPatterns: [], 
            coreBehavioralLoop: "Pattern recognition pending...",
            predictedChallenges: [], 
            growthLever: "Clarity" 
        };
    }
}

// --- NEW: Comprehensive Question Set ---
export const getDeepQuestions = (): QuestionDefinition[] => {
    return [
        {
            id: 'q1',
            text: 'What is the ultimate "Why" behind your ambition?',
            category: 'VISION',
            options: ['To prove them wrong', 'To experience total freedom', 'To change the course of history', 'To protect my family', 'To master my craft', 'Curiosity about the unknown']
        },
        {
            id: 'q2',
            text: 'What is your relationship with financial wealth?',
            category: 'LIFESTYLE',
            options: ['It is a tool for freedom', 'It is a scorecard of success', 'It is necessary evil', 'I want enough to not think about it', 'I want empire-level wealth']
        },
        {
            id: 'q3',
            text: 'When do you feel most "in flow"?',
            category: 'LIFESTYLE',
            options: ['Solving complex logical problems', 'Creating something from nothing', 'Leading and influencing people', 'Deep solitary research', 'High-pressure execution']
        },
        {
            id: 'q4',
            text: 'What currently holds you back the most?',
            category: 'GAP',
            options: ['Fear of failure/judgment', 'Lack of clear direction', 'Procrastination/Discipline', 'Financial constraints', 'Imposter syndrome', 'Overthinking']
        },
        {
            id: 'q5',
            text: 'If you could download one belief into your mind, what would it be?',
            category: 'BELIEF',
            options: ['"I am unstoppable"', '"Money flows easily to me"', '"I am enough"', '"Failure is just data"', '"My time is valuable"']
        },
        {
            id: 'q6',
            text: 'What does a "perfect day" look like in 5 years?',
            category: 'VISION',
            options: ['Deep work in a cabin', 'Boardroom meetings in a skyscraper', 'Traveling without an itinerary', 'Building in a workshop/lab', 'Spending all day with family']
        },
        {
            id: 'q_ambitious',
            text: 'What scale of impact are you aiming for?',
            category: 'VISION',
            requiredTraits: ['Ambitious', 'Visionary'],
            options: ['Industry Leader', 'Global Icon', 'Community Pillar', 'Silent Billionaire']
        },
        {
            id: 'q_creative',
            text: 'How do you handle structure?',
            category: 'LIFESTYLE',
            requiredTraits: ['Creative', 'Spontaneous'],
            options: ['I need total chaos', 'I need loose boundaries', 'I need strict routine to create', 'I hate authority']
        },
        {
            id: 'q_analytical',
            text: 'How do you make big decisions?',
            category: 'BELIEF',
            requiredTraits: ['Analytical', 'Logical'],
            options: ['Data-driven analysis', 'Gut feeling backed by logic', 'Simulation of outcomes', 'Expert consultation']
        }
    ];
};

// 1. Enhanced Categorization
export const categorizeInput = async (input: string): Promise<{ label: string; type: NodeType }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Classify this user input. Input: "${input}"
      Categories: SKILL, VALUE, DIRECTION, GAP, INSIGHT, BELIEF. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['INSIGHT', 'DIRECTION', 'GAP', 'SKILL', 'VALUE', 'USER_INPUT', 'BELIEF'] }
          }
        }
      }
    });
    return response.text ? cleanAndParseJSON(response.text) : { label: input, type: NodeType.USER_INPUT };
  } catch (error) {
    return { label: input, type: NodeType.USER_INPUT };
  }
};

// 2. Main Guidance Logic
export const advanceGuidanceSession = async (nodes: NodeData[], currentPhase: GuidancePhase, activeTabId?: string): Promise<LandscapeAnalysis> => {
  const userNodes = nodes.filter(n => n.type !== NodeType.SYSTEM_MSG);
  const context = userNodes.map(n => `"${n.label}" (${n.type})`).join('; ');
  
  const systemInstruction = `
    You are 'The Career-Mind Architect'.
    Current Phase: ${currentPhase}. Active Tab: ${activeTabId || 'None'}.
    User Context: [${context}]
    
    Goal: Profile user, build ecosystem.
    If the user asks for "Books", "Strategies", or "Frameworks", set 'newTabCreated' in output.
    
    Output JSON. Keep it robust.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Analyze context and guide.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextQuestion: { type: Type.STRING },
            suggestedOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            phase: { type: Type.STRING, enum: Object.values(GuidancePhase) },
            readyForStories: { type: Type.BOOLEAN },
            newTabCreated: { 
                type: Type.OBJECT, 
                properties: { id: {type: Type.STRING}, title: {type: Type.STRING}, content: {type: Type.STRING} },
                nullable: true
            },
            connections: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { sourceId: { type: Type.STRING }, targetId: { type: Type.STRING } } }
            }
          }
        }
      }
    });

    return response.text ? cleanAndParseJSON(response.text) : { 
        nextQuestion: "Continue?", suggestedOptions: [], phase: currentPhase, connections: [] 
    };
  } catch (error) {
    console.error("Guidance Error:", error);
    return { nextQuestion: "What matters most?", suggestedOptions: [], phase: currentPhase, connections: [] };
  }
};

// 3. Story Generation (Enhanced with Real World Parallels)
export const generateStories = async (nodes: NodeData[]): Promise<Story[]> => {
  const context = nodes.map(n => `${n.label} (${n.type})`).join('; ');
  const prompt = `Based on these user traits and inputs: [${context}], generate 3 distinct high-level career narratives.
  
  CRITICAL: For EACH story, find a SPECIFIC "Real World Model" (a famous successful person, historical or modern) whose path closely mirrors this narrative.
  
  Return valid JSON. Be concise.
  Each story object must have:
  - id, title, narrative, philosophy, matchReason
  - realWorldModel: Name of the famous person.
  - modelTitle: A cool moniker (e.g. "The First Principles Thinker").
  - keyMindset: A short quote/belief.
  - fact: A verifiable fact about their path.
  `;
  
  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    narrative: { type: Type.STRING },
                    philosophy: { type: Type.STRING },
                    matchReason: { type: Type.STRING },
                    realWorldModel: { type: Type.STRING },
                    modelTitle: { type: Type.STRING },
                    keyMindset: { type: Type.STRING },
                    fact: { type: Type.STRING }
                }
            }
          }
        }
      });
      const parsed = response.text ? cleanAndParseJSON(response.text) : [];
      return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
      console.error("Story generation failed:", e);
      return [];
  }
};

// 4. Roadmap & Ecosystem Generation (Deep with Search)
export const generateRoadmap = async (story: Story, nodes: NodeData[]): Promise<Roadmap> => {
  const context = nodes.map(n => `${n.label} (${n.type})`).join('; ');

  // Reduced verbosity instructions to prevent token limit truncation
  const prompt = `Create a career ecosystem for story: "${story.title}". Context: [${context}].
    Use Google Search for real-world inspirations and books.
    
    Output Strict JSON. Be CONCISE to avoid truncation.
    Structure:
    {
      "ecosystemTitle": "string",
      "identityShift": "string",
      "vision": "string (max 15 words)",
      "traits": ["string (max 3)"],
      "principles": ["string (max 3)"],
      "frameworks": ["string (max 3)"],
      "strategies": ["string (max 3)"],
      "inspirations": ["string (max 3)"],
      "books": [{ "title": "string", "author": "string", "reason": "string", "keyInsight": "string" }],
      "phases": [{ 
          "id": "string", 
          "phase": number, 
          "title": "string", 
          "duration": "string", 
          "goal": "string", 
          "strategies": ["string (the first-principles)"],
          "habits": ["string"], 
          "skillsToLearn": ["string"],
          "resources": [{ "title": "string", "type": "string", "link": "string" }],
          "keyVision": "string"
      }]
    }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  if (response.text) {
      const data = cleanAndParseJSON(response.text);
      if (data) {
        data.phases = data.phases?.map((p: any, i: number) => ({
            ...p, 
            id: p.id || `phase-${i}-${Date.now()}`,
            strategies: Array.isArray(p.strategies) ? p.strategies : [],
            skillsToLearn: Array.isArray(p.skillsToLearn) ? p.skillsToLearn : [],
            habits: Array.isArray(p.habits) ? p.habits : [],
            resources: Array.isArray(p.resources) ? p.resources : [],
            keyVision: p.keyVision || "Establish baseline capability."
        })) || [];
        data.principles = Array.isArray(data.principles) ? data.principles : [];
        data.frameworks = Array.isArray(data.frameworks) ? data.frameworks : [];
        data.books = Array.isArray(data.books) ? data.books : [];
        data.strategies = Array.isArray(data.strategies) ? data.strategies : [];
        data.inspirations = Array.isArray(data.inspirations) ? data.inspirations : [];
        data.traits = Array.isArray(data.traits) ? data.traits : [];
        
        data.id = `roadmap-${Date.now()}`;
        data.createdAt = Date.now();
        data.sources = extractSources(response);
        return data;
      }
  }
  return { 
      id: `roadmap-${Date.now()}`, 
      createdAt: Date.now(), 
      ecosystemTitle: "Path", 
      identityShift: "", 
      phases: [], 
      principles: [], 
      frameworks: [], 
      vision: "", 
      traits: [] 
  };
};

// --- NEW: Merge Roadmaps ---
export const mergeRoadmaps = async (r1: Roadmap, r2: Roadmap): Promise<Roadmap> => {
    const prompt = `Merge these two career ecosystems into a single, cohesive "Hybrid Master Plan".
    
    Roadmap 1: "${r1.ecosystemTitle}" (Vision: ${r1.vision})
    Roadmap 2: "${r2.ecosystemTitle}" (Vision: ${r2.vision})
    
    Create a new roadmap that synergizes the strengths of both. 
    It should not just append phases, but integrate them logically.
    
    Return JSON Structure matching the Roadmap interface.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            // Schema omitted for brevity, assuming model follows structure from prompts above or inference
        }
    });

    const data = response.text ? cleanAndParseJSON(response.text) : null;
    if (data) {
        // Ensure data integrity
         data.phases = data.phases?.map((p: any, i: number) => ({
            ...p, 
            id: p.id || `phase-${i}-${Date.now()}`,
            strategies: Array.isArray(p.strategies) ? p.strategies : [],
            skillsToLearn: Array.isArray(p.skillsToLearn) ? p.skillsToLearn : [],
            habits: Array.isArray(p.habits) ? p.habits : [],
            resources: Array.isArray(p.resources) ? p.resources : [],
             keyVision: p.keyVision || "Hybrid capability baseline."
        })) || [];
        
        return {
            ...data,
            id: `merged-${Date.now()}`,
            createdAt: Date.now(),
            mergedFrom: [r1.id, r2.id]
        };
    }
    return r1; // Fallback
};

// --- NEW: Modify Roadmap (AI Agent for Ecosystem) ---
export const modifyRoadmap = async (currentRoadmap: Roadmap, userPrompt: string): Promise<Roadmap> => {
    const prompt = `Modify the current roadmap based on user request: "${userPrompt}".
    
    Current Roadmap Summary:
    Title: ${currentRoadmap.ecosystemTitle}
    Vision: ${currentRoadmap.vision}
    Phases: ${currentRoadmap.phases.length}
    Inspirations: ${currentRoadmap.inspirations?.join(', ')}
    
    User Instructions:
    - If asked to "add a phase", create a new phase object and append it.
    - If asked to "add inspirations", add to the inspirations array.
    - If asked to "refine vision", update the vision string.
    - If uncertain, try to fulfill the request logically within the Roadmap structure.
    
    CRITICAL: Return the FULL updated Roadmap JSON object. Do not truncate.
    Maintain existing fields unless modified.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const data = response.text ? cleanAndParseJSON(response.text) : null;
        if (data) {
             // Re-hydrate ID if lost, or create new version ID
             return {
                 ...data,
                 id: currentRoadmap.id, // Keep same ID or make new version? Let's keep ID for now to emulate 'edit'
                 createdAt: Date.now(), // Update timestamp
                 phases: data.phases?.map((p: any, i: number) => ({
                    ...p, 
                    id: p.id || `phase-${i}-${Date.now()}`,
                    strategies: Array.isArray(p.strategies) ? p.strategies : [],
                    skillsToLearn: Array.isArray(p.skillsToLearn) ? p.skillsToLearn : [],
                    habits: Array.isArray(p.habits) ? p.habits : [],
                    resources: Array.isArray(p.resources) ? p.resources : [],
                    keyVision: p.keyVision || "Updated capability."
                })) || []
             };
        }
        return currentRoadmap;
    } catch (e) {
        console.error("Failed to modify roadmap:", e);
        return currentRoadmap;
    }
}

// 5. Generate Drill-Down Details (Exploration with Search)
export const generateItemDetails = async (itemTitle: string, contextType: string): Promise<ExplorationData> => {
    const prompt = `Research "${itemTitle}" (context: "${contextType}").
    Use Google Search. Return valid JSON. Be concise.
    {
        "content": "Overview (max 40 words)",
        "steps": ["Actionable step 1", "Actionable step 2"],
        "marketOutlook": "Trend",
        "averageSalary": "Salary",
        "topCompanies": ["Company 1", "Company 2"],
        "relatedRoles": ["Role 1"]
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });
    
    const data = response.text ? cleanAndParseJSON(response.text) : null;
    const fallback = { content: "Analysis unavailable.", steps: [] };
    
    const safeData = {
        ...fallback,
        ...(data || {}),
        steps: Array.isArray(data?.steps) ? data.steps : [],
        topCompanies: Array.isArray(data?.topCompanies) ? data.topCompanies : [],
        relatedRoles: Array.isArray(data?.relatedRoles) ? data.relatedRoles : []
    };

    return { ...safeData, title: itemTitle, sources: extractSources(response) };
};

// --- NEW: Generate Dynamic Tab Section ---
export const generateTabSection = async (promptText: string, tabContext: string): Promise<TabSection> => {
    const prompt = `Context: "${tabContext}". Request: "Section about ${promptText}".
    Create content. Return JSON:
    {
        "id": "generated-id",
        "type": "TEXT" or "LIST" or "GRID" or "QUOTE",
        "title": "Title",
        "content": "Content",
        "items": ["Item 1", "Item 2"]
    }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['TEXT', 'LIST', 'GRID', 'QUOTE'] },
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        items: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        const data = response.text ? cleanAndParseJSON(response.text) : null;
        return data || { id: Date.now().toString(), type: 'TEXT', title: 'Error', content: 'Could not generate section.' };
    } catch (e) {
        return { id: Date.now().toString(), type: 'TEXT', title: 'Error', content: 'Generation failed.' };
    }
}

// 6. Selection Lists
export const getSelectionLists = async (): Promise<SelectionCategory[]> => {
    return [
        {
            id: 'domains',
            title: 'Domains',
            items: ['Technology', 'Healthcare', 'Finance', 'Education', 'Clean Energy', 'Space', 'Media', 'Biotech', 'Artificial Intelligence', 'Robotics', 'Agriculture', 'Urban Planning', 'Psychology', 'Law', 'Arts & Culture', 'Gaming', 'Cybersecurity', 'Logistics', 'Fashion', 'Gastronomy']
        },
        {
            id: 'careers',
            title: 'Archetypes & Roles',
            items: ['Founder', 'Product Manager', 'Software Engineer', 'Designer', 'Data Scientist', 'Writer', 'Investor', 'Researcher', 'Educator', 'Artist', 'Consultant', 'Strategist', 'Executive', 'Sales Leader', 'Community Builder', 'Policy Maker', 'Healer', 'Athlete', 'Nomad', 'Maker']
        },
        {
            id: 'skills',
            title: 'High-Value Skills',
            items: ['Strategic Thinking', 'Coding', 'UI/UX Design', 'Copywriting', 'Public Speaking', 'Data Analysis', 'Negotiation', 'Leadership', 'Project Management', 'Financial Literacy', 'Sales', 'Marketing', 'Emotional Intelligence', 'Systems Thinking', 'Critical Thinking', 'Storytelling', 'Video Editing', 'Foreign Languages', 'Mediation', 'Prompt Engineering']
        },
        {
            id: 'values',
            title: 'Core Values',
            items: ['Freedom', 'Autonomy', 'Creativity', 'Impact', 'Wealth', 'Stability', 'Community', 'Family', 'Adventure', 'Mastery', 'Integrity', 'Spirituality', 'Health', 'Fame', 'Power', 'Service', 'Knowledge', 'Balance', 'Authenticity', 'Loyalty']
        },
        {
            id: 'traits',
            title: 'Personality Traits',
            items: ['Ambitious', 'Curious', 'Resilient', 'Empathetic', 'Analytical', 'Organized', 'Spontaneous', 'Introverted', 'Extroverted', 'Diplomatic', 'Bold', 'Cautious', 'Optimistic', 'Realistic', 'Visionary', 'Detail-oriented', 'Patient', 'Competitive', 'Generous', 'Independent']
        },
        {
            id: 'struggles',
            title: 'Current Gaps',
            items: ['Procrastination', 'Imposter Syndrome', 'Burnout', 'Lack of Direction', 'Financial Stress', 'Fear of Failure', 'Perfectionism', 'Loneliness', 'Skill Gap', 'Network Gap', 'Confidence', 'Focus', 'Discipline', 'Health Issues', 'Time Management', 'Indecision']
        },
        {
            id: 'questions_important',
            title: 'Reflective Questions',
            items: ['Who am I without my job?', 'What is enough?', 'Who do I want to help?', 'What is my legacy?', 'What am I afraid of?', 'What gives me energy?', 'What drains me?', 'Who do I admire?', 'What is my definition of success?', 'What would I do for free?']
        },
        {
            id: 'questions_interesting',
            title: 'Speculative Questions',
            items: ['What if I moved to a new country?', 'What if I started a business today?', 'What if I changed careers entirely?', 'What if I wrote a book?', 'What if I took a sabbatical?', 'What if I learned to code?', 'What if I lived off-grid?', 'What if I became a teacher?']
        },
        {
            id: 'inspiration',
            title: 'Inspirations',
            items: ['Steve Jobs', 'Elon Musk', 'Oprah', 'Naval Ravikant', 'Leonardo da Vinci', 'Marie Curie', 'Richard Feynman', 'Maya Angelou', 'Barack Obama', 'Serena Williams', 'Hayao Miyazaki', 'J.K. Rowling', 'Tim Ferriss', 'Brené Brown', 'Satoshi Nakamoto']
        }
    ];
};
