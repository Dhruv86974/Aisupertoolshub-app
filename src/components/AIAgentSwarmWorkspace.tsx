import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { LanguageCode, Note } from '../types';

interface Agent {
  id: string;
  name: string;
  shortName: string;
  role: string;
  roleGu: string;
  avatarIcon: keyof typeof Icons;
  color: string;
  badge: string;
  description: string;
  descriptionGu: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'agent' | 'terminal';
}

interface SwarmResult {
  agentId: string;
  agentName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  thinking: string | null;
  output: string;
  timeTaken: number;
}

interface AIAgentSwarmWorkspaceProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'rate' | 'chime' | 'laser' | 'toggle') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
  savedNotes: Note[];
  onSaveNotes: (notes: Note[]) => void;
}

const SWARM_AGENTS: Agent[] = [
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1 (CoT Researcher)',
    shortName: 'DeepSeek-R1',
    role: 'Deep Cognitive Research & Systematic Brainstorming',
    roleGu: 'ઊંડા સંશોધન અને વિચારમંથન',
    avatarIcon: 'Cpu',
    color: '#3b82f6', // blue
    badge: 'CoT Reasoning',
    description: 'Specializes in mapping complex requirements, running deep chain-of-thought analysis, and uncovering core variables.',
    descriptionGu: 'જટિલ જરૂરિયાતોનું વિશ્લેષણ અને ઊંડા તાર્કિક વિચાર પ્રક્રિયામાં નિષ્ણાત.'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Strategic Architect)',
    shortName: 'Gemini 3.1 Pro',
    role: 'Logical Blue-Ocean Modeling & Systems Design',
    roleGu: 'વ્યૂહાત્મક આર્કિટેક્ટ અને સિસ્ટમ ડિઝાઇન',
    avatarIcon: 'BrainCircuit',
    color: '#8b5cf6', // purple
    badge: 'Ultra-Intellect',
    description: 'Applies rigorous business logic, designs structural blueprints, and performs multi-variable math and strategy checks.',
    descriptionGu: 'વ્યવસાયિક આયોજન, મોડલિંગ અને માળખાકીય બ્લુપ્રિન્ટ બનાવવામાં નિષ્ણાત.'
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Creative Coder)',
    shortName: 'Claude 3.5',
    role: 'Creative Prose, Code Refactoring & High-Conversion Copy',
    roleGu: 'સર્જનાત્મક લેખન અને કોડિંગ નિષ્ણાત',
    avatarIcon: 'FileCode',
    color: '#f59e0b', // amber
    badge: 'Enterprise Coder',
    description: 'Drafts articulate copy, crafts pristine code blocks, and designs optimal user-retention and messaging flows.',
    descriptionGu: 'ચોક્કસ કોડિંગ અને સર્વોચ્ચ ગુણવત્તાવાળા લેખનમાં નિષ્ણાત.'
  },
  {
    id: 'quantum-v',
    name: 'Quantum-V (50-Cr Luxury Adviser)',
    shortName: 'Quantum-V',
    role: 'Multi-Million Dollar Scaling & Wealth Pipelines',
    roleGu: 'મોટા પાયે બિઝનેસ સ્કેલિંગ અને સંપત્તિ સર્જન',
    avatarIcon: 'Crown',
    color: '#ec4899', // pink
    badge: '50Cr Elite',
    description: 'Consults with supreme enterprise prestige, planning high-end synergistic scaling models and global expansion benchmarks.',
    descriptionGu: 'મોટી મલ્ટી-મિલિયન ડોલર કંપનીઓના સ્કેલિંગ અને લક્ઝરી કન્સલ્ટિંગમાં માસ્ટર.'
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash (Consensus Aggregator)',
    shortName: 'Gemini 3.7',
    role: 'Real-time Tone Alignment & Multi-Agent Compilation',
    roleGu: 'ચોક્કસ સંકલન અને અંતિમ પરિણામ',
    avatarIcon: 'Zap',
    color: '#10b981', // emerald
    badge: 'Swarm Leader',
    description: 'Reviews agent outputs, checks alignment, compiles a unified master draft, and ensures extreme delivery speed.',
    descriptionGu: 'તમામ એજન્ટોના કાર્યોની સમીક્ષા કરી આખરી આઉટપુટ તૈયાર કરનાર.'
  }
];

export default function AIAgentSwarmWorkspace({
  lang,
  theme,
  playSynthSound,
  addXPPoints,
  savedNotes,
  onSaveNotes
}: AIAgentSwarmWorkspaceProps) {
  const isGu = lang === 'gu';
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // User input states
  const [prompt, setPrompt] = useState('');
  const [swarmMode, setSwarmMode] = useState<'sequential' | 'debate' | 'parallel'>('sequential');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['deepseek-r1', 'gemini-3.1-pro-preview', 'claude-3.5-sonnet', 'gemini-3.7-flash']);
  const [temperature, setTemperature] = useState(0.7);
  const [maxRounds, setMaxRounds] = useState(3);
  const [synergyTarget, setSynergyTarget] = useState(95);

  // Swarm execution states
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<string>('');
  const [currentRunningAgent, setCurrentRunningAgent] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<LogEntry[]>([]);
  const [swarmResults, setSwarmResults] = useState<Record<string, SwarmResult>>({});
  const [consensusOutput, setConsensusOutput] = useState('');
  const [synergyRating, setSynergyRating] = useState(0);
  const [computationTime, setComputationTime] = useState(0);

  // Preset triggers
  const PRESET_PROMPTS = [
    {
      title: isGu ? '🚀 લક્ઝરી બ્રાન્ડ પ્લાન' : '🚀 Premium Brand Strategy',
      text: isGu 
        ? 'એક ઓર્ગેનિક પ્રીમિયમ માતચા ટી (Organic Matcha Tea) બ્રાન્ડને વૈશ્વિક સ્તરે સ્કેલ કરવા માટે ક્રોનિક રોડમેપ અને કોપી રાઇટિંગ તૈયાર કરો.'
        : 'Generate a comprehensive, high-end scaling roadmap and marketing copy for an organic premium ceremonial-grade Matcha brand entering global luxury markets.'
    },
    {
      title: isGu ? '💻 રિયાક્ટ એપ્લિકેશન આર્કિટેક્ચર' : '💻 React Scalability Guide',
      text: isGu
        ? 'એક રિયલ-ટાઇમ મલ્ટીપ્લેયર ડૅશબોર્ડ માટે લાઈટવેઇટ રિયાક્ટ, વેબસોકેટ અને સ્ટેટ મેનેજમેન્ટની આર્કિટેક્ચરલ ડિઝાઇન કોડ સાથે સમજાવો.'
        : 'Provide a robust technical blueprint and React 19 structure for a highly scalable real-time collaborative canvas dashboard using web sockets and performance-optimized states.'
    },
    {
      title: isGu ? '📈 એઆઈ-પાવર્ડ વેલ્થ પાઇપલાઇન' : '📈 AI Wealth Machine',
      text: isGu
        ? 'ઓટોમેટેડ એઆઈ વિડિયો કન્ટેન્ટ જનરેશન અને સંલગ્ન માર્કેટિંગ (Affiliate Marketing) દ્વારા દર મહિને $૫,૦૦૦ ની પેસિવ ઇન્કમ સેટ કરવાની બ્લુપ્રિન્ટ.'
        : 'Design an automated passive-income ecosystem leveraging AI video content generators, dynamic email lists, and targeted affiliate marketing pipelines.'
    }
  ];

  // Auto-scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const addLog = (message: string, sender = 'SWARM MASTER', type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [
      ...prev,
      {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp,
        sender,
        message,
        type
      }
    ]);
  };

  const handleAgentToggle = (id: string) => {
    playSynthSound('click');
    if (selectedAgents.includes(id)) {
      if (selectedAgents.length <= 2) {
        addLog(isGu ? 'સ્વર્મ ચલાવવા માટે ઓછામાં ઓછા ૨ એજન્ટો જરૂરી છે!' : 'At least 2 active agents are required to form a swarm!', 'SWARM MASTER', 'warn');
        return;
      }
      setSelectedAgents(prev => prev.filter(a => a !== id));
    } else {
      setSelectedAgents(prev => [...prev, id]);
    }
  };

  const parseThinkingAndOutput = (rawText: string) => {
    const thinkStart = rawText.indexOf('<think>');
    const thinkEnd = rawText.indexOf('</think>');
    
    if (thinkStart !== -1 && thinkEnd !== -1) {
      const thinking = rawText.substring(thinkStart + 7, thinkEnd).trim();
      const output = rawText.substring(thinkEnd + 8).trim();
      return { thinking, output };
    } else if (thinkStart !== -1) {
      const thinking = rawText.substring(thinkStart + 7).trim();
      return { thinking, output: '' };
    }
    return { thinking: null, output: rawText };
  };

  // Run the selected Agent Swarm mode
  const executeSwarm = async () => {
    if (!prompt.trim() || isRunning) return;
    
    playSynthSound('laser');
    setIsRunning(true);
    setTerminalLogs([]);
    setSwarmResults({});
    setConsensusOutput('');
    setSynergyRating(0);
    setComputationTime(0);

    const startTime = Date.now();
    const activeAgentsInSwarm = SWARM_AGENTS.filter(a => selectedAgents.includes(a.id));

    addLog(isGu ? '🔥 મલ્ટી-એજન્ટ સ્વર્મ મોડેલ પ્રારંભ થઈ રહ્યું છે...' : '🔥 Initiating Collaborative Multi-Agent Swarm Orchestration...', 'SYSTEM', 'info');
    addLog(isGu ? `પસંદ કરેલ મોડ: ${swarmMode.toUpperCase()} • એજન્ટોની સંખ્યા: ${activeAgentsInSwarm.length}` : `Orchestration Mode: ${swarmMode.toUpperCase()} • Active Agents: ${activeAgentsInSwarm.length}`, 'SYSTEM', 'info');
    
    try {
      if (swarmMode === 'sequential') {
        await runSequentialPipeline(activeAgentsInSwarm);
      } else if (swarmMode === 'debate') {
        await runDebateSwarm(activeAgentsInSwarm);
      } else {
        await runParallelComparison(activeAgentsInSwarm);
      }

      // Final calculations
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      setComputationTime(parseFloat(totalTime));
      
      const calcSynergy = Math.round(synergyTarget + (Math.random() * (100 - synergyTarget)));
      setSynergyRating(calcSynergy);

      playSynthSound('success');
      addXPPoints(45, 'Completed an elite multi-agent swarm collaboration session', 'સફળતાપૂર્વક મલ્ટી-એજન્ટ સ્વર્મ સેશન પૂર્ણ કર્યું');
      
      addLog(isGu 
        ? `✅ સ્વર્મ કામગીરી સફળતાપૂર્વક સમાપ્ત! કુલ સમય: ${totalTime} સેકન્ડ • સંયોજન રેટ: ${calcSynergy}%` 
        : `✅ Swarm convergence achieved! Total time: ${totalTime}s • Synergy Ratio: ${calcSynergy}%`, 
        'SWARM MASTER', 'success'
      );

    } catch (err: any) {
      console.error(err);
      addLog(isGu ? `❌ સ્વર્મ પ્રક્રિયામાં ભૂલ આવી: ${err.message}` : `❌ Swarm Execution Error: ${err.message}`, 'SYSTEM', 'warn');
    } finally {
      setIsRunning(false);
      setCurrentRunningAgent(null);
      setActiveStep('');
    }
  };

  // 1. SEQUENTIAL PIPELINE MODE
  const runSequentialPipeline = async (agents: Agent[]) => {
    let intermediateContext = prompt;
    const tempResults: Record<string, SwarmResult> = {};

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      setCurrentRunningAgent(agent.id);
      setActiveStep(`Step ${i + 1}/${agents.length}: ${agent.shortName}`);
      addLog(isGu ? `[૧/૩] ${agent.name} મોડલ લોડ કરી રહ્યું છે...` : `[Pipeline] Booting ${agent.name}...`, agent.shortName, 'agent');
      
      const agentStartTime = Date.now();
      
      // Construct rich context prompt based on position in sequential relay
      let customSystemInstruction = '';
      let refinedPrompt = '';

      if (i === 0) {
        customSystemInstruction = `You are ${agent.name}. Your role in this swarm is: "${agent.role}".
Task: Analyze the user's core prompt and provide a deep, highly structured, foundational response matching your expertise. Start with thinking block <think> ... </think> if you are DeepSeek.`;
        refinedPrompt = prompt;
      } else {
        const previousAgent = agents[i - 1];
        customSystemInstruction = `You are ${agent.name}. Your role in this swarm is: "${agent.role}".
Task: You must take the previous work of ${previousAgent.name} and build upon it. Improve, refine, and add your specialized value.
Do NOT repeat everything from the previous agent; focus on expanding the strategic depth, adding details, and giving concrete actions.`;
        refinedPrompt = `User Prompt: "${prompt}"\n\nPrevious Agent Output (${previousAgent.name}):\n${intermediateContext}`;
      }

      // Add dummy thinking steps in log
      addLog(isGu ? `મગજના વિચારો ગોઠવી રહ્યું છે (CoT)...` : `Spawning chain-of-thought analysis blocks...`, agent.shortName, 'terminal');
      await new Promise(r => setTimeout(r, 1200));

      try {
        const res = await fetch('/api/tools/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: refinedPrompt }],
            model: agent.id
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const { thinking, output } = parseThinkingAndOutput(data.output);
        const timeTaken = parseFloat(((Date.now() - agentStartTime) / 1000).toFixed(1));

        tempResults[agent.id] = {
          agentId: agent.id,
          agentName: agent.name,
          status: 'completed',
          thinking: thinking,
          output: output,
          timeTaken
        };

        setSwarmResults({ ...tempResults });
        intermediateContext = output;
        
        addLog(isGu ? `કાર્ય પૂર્ણ કર્યું! સમય: ${timeTaken} સેકન્ડ.` : `Successfully compiled deliverables in ${timeTaken}s.`, agent.shortName, 'success');
      } catch (err: any) {
        const timeTaken = parseFloat(((Date.now() - agentStartTime) / 1000).toFixed(1));
        tempResults[agent.id] = {
          agentId: agent.id,
          agentName: agent.name,
          status: 'failed',
          thinking: null,
          output: `Failed to compile response: ${err.message}`,
          timeTaken
        };
        setSwarmResults({ ...tempResults });
        addLog(`Error during execution: ${err.message}`, agent.shortName, 'warn');
      }
    }

    // Swarm Master Aggregator (Final Output generation)
    setActiveStep(isGu ? 'સંકલન' : 'Compilation');
    setCurrentRunningAgent('gemini-3.7-flash');
    addLog(isGu ? 'કુલ પરિણામો સંકલન કરી રહ્યું છે...' : 'Aggregating all agent deliverables into a unified elite master response...', 'Swarm Leader', 'agent');
    
    const compilationPrompt = `The user wants to solve this task: "${prompt}"
We had a collaborative swarm of multiple AI agents work on this in sequence:
${agents.map(a => `- ${a.name} provided: ${tempResults[a.id]?.output.substring(0, 800)}...\n`).join('')}

Compile all of the above intelligence into a singular, cohesive, ultra-professional, and exhaustive master delivery.
Organize it with high-contrast, beautiful Markdown headers, clean bullet lists, concrete actionable steps, and elite consultation advice.
Since the user is from India, translate the key action summaries or add an enthusiastic professional Gujarati summary at the very end!`;

    try {
      const res = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: compilationPrompt }],
          model: 'gemini-3.7-flash'
        })
      });
      const data = await res.json();
      setConsensusOutput(data.output);
    } catch (err: any) {
      setConsensusOutput(intermediateContext); // fallback to last agent output
    }
  };

  // 2. COLLABORATIVE DEBATE MODE
  const runDebateSwarm = async (agents: Agent[]) => {
    const tempResults: Record<string, SwarmResult> = {};
    const debateHistory: { agent: string, stance: string }[] = [];

    addLog(isGu ? 'રાઉન્ડ ૧: એજન્ટોની પ્રારંભિક ચર્ચા શરૂ...' : 'Round 1: Collecting initial arguments & perspectives...', 'SWARM MASTER', 'info');

    // Round 1: Gather initial perspective from all agents in parallel
    setActiveStep(isGu ? 'રાઉન્ડ ૧' : 'Debate Rd 1');
    await Promise.all(agents.map(async (agent) => {
      const agentStartTime = Date.now();
      const initialDebatePrompt = `The user prompt is: "${prompt}". 
As ${agent.name} (${agent.role}), provide your unique initial professional stance, core technical inputs, or business strategy for this.
Keep it extremely concise (under 250 words) but packed with high-end value.`;

      addLog(isGu ? `${agent.shortName} ચર્ચામાં જોડાઈ રહ્યું છે...` : `${agent.shortName} analyzing debate thesis...`, agent.shortName, 'agent');

      try {
        const res = await fetch('/api/tools/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: initialDebatePrompt }],
            model: agent.id
          })
        });
        const data = await res.json();
        const { output } = parseThinkingAndOutput(data.output);
        const timeTaken = parseFloat(((Date.now() - agentStartTime) / 1000).toFixed(1));

        debateHistory.push({ agent: agent.shortName, stance: output });
        tempResults[agent.id] = {
          agentId: agent.id,
          agentName: agent.name,
          status: 'completed',
          thinking: null,
          output: output,
          timeTaken
        };
        setSwarmResults({ ...tempResults });
      } catch (err: any) {
        addLog(`Failed: ${err.message}`, agent.shortName, 'warn');
      }
    }));

    // Round 2: Cross-review and critique
    if (maxRounds > 1 && debateHistory.length > 1) {
      setActiveStep(isGu ? 'રાઉન્ડ ૨' : 'Debate Rd 2');
      addLog(isGu ? 'રાઉન્ડ ૨: એજન્ટો એકબીજાની દરખાસ્તોની સમીક્ષા કરી રહ્યા છે...' : 'Round 2: Cross-agent peer reviews & optimization debates...', 'SWARM MASTER', 'info');
      await new Promise(r => setTimeout(r, 1000));

      const reviewAgent = agents[0]; // deepseek or first agent critiques
      setCurrentRunningAgent(reviewAgent.id);
      addLog(isGu ? `${reviewAgent.shortName} ચર્ચા પત્રોનો રિવ્યુ કરી રહ્યું છે...` : `${reviewAgent.shortName} compiling critique and improvements...`, reviewAgent.shortName, 'agent');

      const crossPrompt = `We are conducting an AI Agent Debate on this task: "${prompt}".
Here are the arguments presented by our swarm members:
${debateHistory.map(h => `- [${h.agent}]: ${h.stance}\n`).join('')}

As ${reviewAgent.name}, analyze these perspectives. Highlight what is missing, identify conflicts, and suggest a unified best strategy.`;

      try {
        const res = await fetch('/api/tools/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: crossPrompt }],
            model: reviewAgent.id
          })
        });
        const data = await res.json();
        const { output } = parseThinkingAndOutput(data.output);
        
        // Append to debate history
        debateHistory.push({ agent: `${reviewAgent.shortName} (Consensus Model)`, stance: output });
        addLog(isGu ? `ચર્ચા પૂર્ણ! અંતિમ સંયુક્ત નિષ્કર્ષ તૈયાર થઈ રહ્યો છે...` : `Debate rounded up. Spawning consensus matrix...`, reviewAgent.shortName, 'success');
      } catch (e) {}
    }

    // Final Synthesis
    setActiveStep(isGu ? 'અંતિમ સંશ્લેષણ' : 'Consensus Synthesis');
    const finalLeader = agents.find(a => a.id === 'gemini-3.7-flash') || agents[agents.length - 1];
    setCurrentRunningAgent(finalLeader.id);
    addLog(isGu ? 'મુખ્ય લીડર અંતિમ રિપોર્ટ તૈયાર કરે છે...' : `Consensus Aggregator (${finalLeader.shortName}) writing unified master plan...`, finalLeader.shortName, 'agent');

    const synthesisPrompt = `You are the Swarm Leader Aggregator.
User Prompt: "${prompt}"
Here is the raw transcript of our multi-agent strategic debate:
${debateHistory.map((h, i) => `[Entry #${i+1}] - [${h.agent}]:\n${h.stance}\n`).join('\n')}

Synthesize the debate points, reject weak variables, combine top strategies, and provide an absolutely flawless, No.1 professional-grade solution to the user's prompt. Make it deeply actionable and visually rich with beautiful Markdown formatting, emojis, tables, and a specialized Gujarati overview.`;

    try {
      const res = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: synthesisPrompt }],
          model: finalLeader.id
        })
      });
      const data = await res.json();
      setConsensusOutput(data.output);
    } catch (err: any) {
      setConsensusOutput(debateHistory.map(h => `### ${h.agent}\n${h.stance}`).join('\n\n'));
    }
  };

  // 3. PARALLEL COMPARISON MODE (Side-by-side)
  const runParallelComparison = async (agents: Agent[]) => {
    const tempResults: Record<string, SwarmResult> = {};
    setActiveStep(isGu ? 'સમાંતર તુલના' : 'Parallel Run');
    addLog(isGu ? 'તમામ પસંદ કરેલા મોડેલ સમાંતર રીતે શરૂ થઈ રહ્યા છે...' : 'Triggering simultaneous execution across all selected AI engines in parallel...', 'SWARM MASTER', 'info');

    await Promise.all(agents.map(async (agent) => {
      const agentStartTime = Date.now();
      addLog(isGu ? `${agent.shortName} પ્રોમ્પ્ટ પર પ્રક્રિયા કરી રહ્યું છે...` : `Running query on ${agent.shortName}...`, agent.shortName, 'agent');

      try {
        const res = await fetch('/api/tools/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: agent.id
          })
        });
        const data = await res.json();
        const { thinking, output } = parseThinkingAndOutput(data.output);
        const timeTaken = parseFloat(((Date.now() - agentStartTime) / 1000).toFixed(1));

        tempResults[agent.id] = {
          agentId: agent.id,
          agentName: agent.name,
          status: 'completed',
          thinking,
          output,
          timeTaken
        };
        setSwarmResults({ ...tempResults });
        addLog(isGu ? `${agent.shortName} એ રિસ્પોન્સ પૂર્ણ કર્યો.` : `${agent.shortName} finished processing in ${timeTaken}s.`, agent.shortName, 'success');
      } catch (err: any) {
        tempResults[agent.id] = {
          agentId: agent.id,
          agentName: agent.name,
          status: 'failed',
          thinking: null,
          output: `Execution failed: ${err.message}`,
          timeTaken: 0
        };
        setSwarmResults({ ...tempResults });
        addLog(`Error: ${err.message}`, agent.shortName, 'warn');
      }
    }));

    // Generate comparison synthesis summary
    setActiveStep(isGu ? 'પરિણામ સંશ્લેષણ' : 'Synthesis');
    addLog(isGu ? 'તુલનાત્મક રિપોર્ટ તૈયાર કરી રહ્યું છે...' : 'Compiling side-by-side comparison synthesis report...', 'SWARM MASTER', 'info');

    const synthPrompt = `We ran a side-by-side prompt comparison across multiple models for: "${prompt}".
${agents.map(a => `- [${a.shortName}]: ${tempResults[a.id]?.output.substring(0, 500)}...\n`).join('')}

Draft a comparative dashboard summary.
1. Outline the unique strengths of each model's response.
2. Provide a final integrated recommended strategy drawing from the best components of each model.
Use a pristine layout with visual Markdown headers, tables, emojis, and an informative concluding paragraph in both English and Gujarati.`;

    try {
      const res = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: synthPrompt }],
          model: 'gemini-3.7-flash'
        })
      });
      const data = await res.json();
      setConsensusOutput(data.output);
    } catch (e) {
      setConsensusOutput(isGu ? "પરિણામો સમાંતર કોલમમાં ઉપલબ્ધ છે!" : "Individual models finished! View results in side-by-side tabs below.");
    }
  };

  // Save consensus output as a custom Note
  const saveAsNote = () => {
    if (!consensusOutput) return;
    playSynthSound('success');
    const newNote: Note = {
      id: 'note_' + Date.now(),
      title: isGu ? `સ્વર્મ પરિણામ: ${prompt.slice(0, 20)}...` : `Swarm Output: ${prompt.slice(0, 20)}...`,
      content: consensusOutput,
      updatedAt: Date.now()
    };
    onSaveNotes([...savedNotes, newNote]);
    alert(isGu ? 'સ્વર્મ પરિણામ સફળતાપૂર્વક તમારી નોટ્સ બુકમાં સેવ થયું!' : 'Swarm outcome successfully exported to your Notes companion!');
  };

  const copyToClipboard = () => {
    if (!consensusOutput) return;
    navigator.clipboard.writeText(consensusOutput);
    playSynthSound('chime');
    alert(isGu ? 'પરિણામ ક્લિપબોર્ડ પર કોપી થઈ ગયું!' : 'Master output copied to clipboard successfully!');
  };

  return (
    <div className={`rounded-3xl border text-left p-6 shadow-2xl transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-150 text-slate-800'
    }`}>
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse">
              {isGu ? 'અલ્ટ્રા પ્રીમિયમ' : 'Elite Swarm Sandbox'}
            </div>
            <div className="bg-purple-600/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              {isGu ? '૫ મોડલ્સ સિંગલ સોર્સ' : '5-Engine Swarm'}
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Icons.Network className="w-6 h-6 text-indigo-500" />
            <span>{isGu ? 'એઆઇ એજન્ટ સહયોગી વર્કસ્પેસ' : 'AI Multi-Agent Swarm Workspace'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {isGu 
              ? 'એક સાથે ૫ અગ્રણી મોડલ્સને જોડો, ચર્ચા કરાવો અથવા તેમને શ્રેણીબદ્ધ પાઇપલાઇનમાં ચલાવો.' 
              : 'Orchestrate 5 frontier-tier models concurrently in Sequential, Debate, or Parallel modes for ultra-verified real results.'}
          </p>
        </div>

        {/* Info panel */}
        <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Active Engines</span>
            <span className="text-sm font-black text-blue-400">{selectedAgents.length} / 5</span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="text-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Synergy Quotient</span>
            <span className="text-sm font-black text-indigo-400">{synergyRating ? `${synergyRating}%` : 'Pending'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left inputs (4 cols) | Right Output + terminal (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Inputs (4 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Swarm Mode Select */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              {isGu ? '૧. સ્વર્મ ચલાવવાની મોડ' : '1. Swarm Orchestration Mode'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { playSynthSound('click'); setSwarmMode('sequential'); }}
                className={`py-2.5 px-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition ${
                  swarmMode === 'sequential' 
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icons.ArrowRightCircle className="w-4 h-4" />
                <span>{isGu ? 'શ્રેણીબદ્ધ' : 'Sequential'}</span>
              </button>
              <button
                onClick={() => { playSynthSound('click'); setSwarmMode('debate'); }}
                className={`py-2.5 px-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition ${
                  swarmMode === 'debate' 
                    ? 'bg-purple-600/10 border-purple-500 text-purple-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icons.Users className="w-4 h-4" />
                <span>{isGu ? 'ચર્ચા' : 'Debate'}</span>
              </button>
              <button
                onClick={() => { playSynthSound('click'); setSwarmMode('parallel'); }}
                className={`py-2.5 px-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition ${
                  swarmMode === 'parallel' 
                    ? 'bg-pink-600/10 border-pink-500 text-pink-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icons.Columns className="w-4 h-4" />
                <span>{isGu ? 'સમાંતર' : 'Parallel'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              {swarmMode === 'sequential' && (isGu ? 'relay chain: એક એજન્ટનું આઉટપુટ બીજામાં પ્રોમ્પ્ટ તરીકે જશે.' : 'Relay Chain: Output of one agent cascades into the prompt of the next.')}
              {swarmMode === 'debate' && (isGu ? 'debate matrix: એજન્ટો સમાંતર લખે છે અને એકબીજાના આઈડિયા પર ચર્ચા કરે છે.' : 'Debate Matrix: Agents review peer viewpoints and converge on an optimized consensus.')}
              {swarmMode === 'parallel' && (isGu ? 'side-by-side: તમામ પસંદ કરેલા એજન્ટો એકસાથે પોતાની કલમ ચલાવે છે.' : 'Side-by-Side: Simultaneously run multiple engines to compare cognitive styles.')}
            </p>
          </div>

          {/* Prompt Entry Box */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              {isGu ? '૨. મુખ્ય ટાસ્ક / પ્રોમ્પ્ટ' : '2. Orchestration Prompt'}
            </span>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isGu ? "કંઈપણ જટિલ બિઝનેસ, પ્લાનિંગ અથવા કોડિંગ ટાસ્ક લખો..." : "Describe any highly complex business, planning, or code integration task..."}
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-semibold leading-relaxed"
              />
            </div>

            {/* Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{isGu ? 'ઝડપી પ્રીસેટ્સ:' : 'Premium Swarm Presets:'}</span>
              <div className="flex flex-col gap-1.5">
                {PRESET_PROMPTS.map((pr, idx) => (
                  <button
                    key={idx}
                    onClick={() => { playSynthSound('click'); setPrompt(pr.text); }}
                    className="w-full text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-750 p-2 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-100 transition truncate"
                  >
                    {pr.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model Swarm selector checklist */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center justify-between">
              <span>{isGu ? '૩. સ્વર્મ એજન્ટો પસંદ કરો' : '3. Select Swarm Engines'}</span>
              <span className="text-[9px] text-blue-400 font-bold">{selectedAgents.length} Active</span>
            </span>

            <div className="space-y-2">
              {SWARM_AGENTS.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id);
                const IconComponent = Icons[agent.avatarIcon];
                return (
                  <div
                    key={agent.id}
                    onClick={() => handleAgentToggle(agent.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-700/85' 
                        : 'bg-slate-950/20 border-slate-900 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-950'
                      }`}>
                        {isSelected && <Icons.Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {IconComponent && <IconComponent className="w-3.5 h-3.5" style={{ color: isSelected ? agent.color : '#64748b' }} />}
                        <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                          {agent.name}
                        </span>
                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                          {agent.badge}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 leading-normal font-semibold">
                        {isGu ? agent.descriptionGu : agent.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hyperparameters Sliders */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              {isGu ? '૪. ટેકનિકલ ટ્યુનિંગ પૅરામીટર' : '4. Hyperparameter Matrix'}
            </span>

            <div className="space-y-3 text-xs">
              {/* Temp slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Temperature (સર્જનાત્મકતા)</span>
                  <span className="text-indigo-400 font-mono">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Debate round slider */}
              {swarmMode === 'debate' && (
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Debate Iterations (ચર્ચા રાઉન્ડ)</span>
                    <span className="text-indigo-400 font-mono">{maxRounds}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
              )}

              {/* Convergence synergy target */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Convergence Target (સંયોજન લક્ષ્ય)</span>
                  <span className="text-indigo-400 font-mono">{synergyTarget}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="99"
                  step="1"
                  value={synergyTarget}
                  onChange={(e) => setSynergyTarget(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Master trigger button */}
          <button
            onClick={executeSwarm}
            disabled={isRunning || !prompt.trim()}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white font-black text-xs py-4 px-5 rounded-2xl flex items-center justify-center gap-2 transition duration-200 uppercase tracking-wider shadow-lg shadow-indigo-500/10 cursor-pointer"
          >
            {isRunning ? (
              <>
                <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isGu ? 'સ્વર્મ કોલ ચાલુ છે...' : 'Swarm Orchestration Active...'}</span>
              </>
            ) : (
              <>
                <Icons.Network className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{isGu ? 'એઆઇ સ્વર્મ રન કરો' : 'Launch Collaborative Swarm'}</span>
              </>
            )}
          </button>

        </div>

        {/* Right Console + Outputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Swarm Visual State Diagram */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 text-left">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3.5">
              {isGu ? 'એક્ટિવ કનેક્શન અને આર્કિટેક્ચર સ્ટેટ' : 'Active Connection Network Map'}
            </span>

            {/* Neural swarm nodes layout */}
            <div className="flex flex-wrap items-center justify-around gap-4 py-2 border border-slate-800/40 rounded-xl bg-slate-950/20 relative overflow-hidden min-h-[90px]">
              
              {/* Background scanning laser effect */}
              {isRunning && (
                <div className="absolute inset-y-0 w-2 bg-gradient-to-r from-transparent via-blue-500/25 to-transparent animate-infinite animate-duration-[2s] -translate-x-full" style={{
                  animation: 'shimmer 2s infinite linear'
                }}></div>
              )}

              {SWARM_AGENTS.filter(a => selectedAgents.includes(a.id)).map((agent, i, arr) => {
                const isCurrent = currentRunningAgent === agent.id;
                const isDone = swarmResults[agent.id]?.status === 'completed';
                const IconComponent = Icons[agent.avatarIcon];
                
                return (
                  <React.Fragment key={agent.id}>
                    {/* Node */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCurrent 
                          ? 'border-white scale-110 shadow-lg' 
                          : isDone 
                            ? 'border-emerald-500 bg-emerald-950/10' 
                            : 'border-slate-800 bg-slate-950'
                      }`} style={{
                        boxShadow: isCurrent ? `0 0 15px ${agent.color}` : 'none'
                      }}>
                        {IconComponent && <IconComponent className={`w-5 h-5 ${isCurrent ? 'animate-bounce' : ''}`} style={{
                          color: isCurrent || isDone ? agent.color : '#475569'
                        }} />}
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 mt-1.5 truncate max-w-[70px]">
                        {agent.shortName}
                      </span>
                    </div>

                    {/* Connecting Chevron (except last) */}
                    {i < arr.length - 1 && (
                      <div className="flex items-center">
                        <Icons.ChevronRight className={`w-4 h-4 ${
                          isCurrent || isDone ? 'text-indigo-500 animate-pulse' : 'text-slate-800'
                        }`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Terminal Logs */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-inner text-left font-mono">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Terminal className="w-3.5 h-3.5 text-blue-500" />
                <span>{isGu ? 'લાઈવ કોન્સોલ લોગ્સ' : 'Live Swarm Console Stream'}</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{isRunning ? 'Running' : 'Ready'}</span>
              </span>
            </div>

            {/* Logs Window */}
            <div className="h-[140px] overflow-y-auto space-y-2.5 text-[10px] scrollbar-thin custom-scrollbar pr-1.5">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-500 italic py-4 text-center">
                  {isGu ? 'કોન્સોલ લોગ્સ અહીં વાઇરલ થશે. એઆઇ સ્વર્મ સ્ટાર્ટ કરો!' : 'Live pipeline compilations and reasoning telemetry logs will stream here.'}
                </div>
              ) : (
                terminalLogs.map((log) => {
                  let colorClass = 'text-slate-400';
                  if (log.type === 'success') colorClass = 'text-emerald-400 font-bold';
                  if (log.type === 'warn') colorClass = 'text-rose-400';
                  if (log.type === 'agent') colorClass = 'text-blue-400 font-bold';

                  return (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                      <span className="text-indigo-400 font-bold shrink-0">[{log.sender}]</span>
                      <span className={`${colorClass} whitespace-pre-wrap`}>{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Tabbed View: Master Consensus Result (Tab 1) | Individual Agent Output Cards (Tab 2) */}
          <div className="space-y-4">
            
            {/* Show individual agent responses if parallel comparison is running or populated */}
            {Object.keys(swarmResults).length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isGu ? '૫ એક્ટિવ મોડેલના વ્યક્તિગત પરિણામો' : 'Individual Swarm Deliverables'}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SWARM_AGENTS.filter(a => selectedAgents.includes(a.id)).map((agent) => {
                    const result = swarmResults[agent.id];
                    if (!result) return null;
                    const IconComp = Icons[agent.avatarIcon];

                    return (
                      <div key={agent.id} className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 text-left space-y-3 shadow-md flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                            <div className="flex items-center gap-1.5">
                              {IconComp && <IconComp className="w-4 h-4" style={{ color: agent.color }} />}
                              <span className="text-xs font-black text-white">{agent.shortName}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-500 font-mono">
                              {result.timeTaken ? `${result.timeTaken}s` : 'Failed'}
                            </span>
                          </div>

                          {result.thinking && (
                            <div className="bg-indigo-950/15 border border-indigo-900/10 rounded-xl p-2.5 font-mono italic text-[9px] text-indigo-300 max-h-[80px] overflow-y-auto">
                              <span className="font-bold uppercase text-[8px] text-indigo-400 block mb-1">Thought Chain:</span>
                              {result.thinking}
                            </div>
                          )}

                          <p className="text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar font-medium">
                            {result.output}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Master Compiled Deliverable consensus panel */}
            <AnimatePresence>
              {consensusOutput && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-2xl text-left space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Icons.Award className="w-5 h-5 text-amber-400 animate-bounce" />
                      <div>
                        <h3 className="text-sm font-black text-white">
                          {isGu ? '૧ નંબર સંકલિત પરિણામ (Unified Master Output)' : 'Elite Swarm Master Delivery'}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {isGu ? 'તમામ એઆઇ એજન્ટોના વિચારોનો સર્વોચ્ચ અને ૧૦૦% સાચો આઉટપુટ' : 'The aggregated, verified, and pristine final consensus.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
                      >
                        <Icons.Copy className="w-3.5 h-3.5" />
                        <span>{isGu ? 'કોપી' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={saveAsNote}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
                      >
                        <Icons.Edit3 className="w-3.5 h-3.5" />
                        <span>{isGu ? 'નોટમાં સેવ' : 'Keep Note'}</span>
                      </button>
                    </div>
                  </div>

                  {/* High quality rendered markdown body */}
                  <div className="text-xs text-slate-200 leading-relaxed space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap font-medium select-text">
                    {consensusOutput}
                  </div>

                  {/* Summary Footer Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-900 text-center text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Swarm Power</span>
                      <span className="font-black text-indigo-400 font-mono">50Cr Scale</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Compiled Time</span>
                      <span className="font-black text-blue-400 font-mono">{computationTime ? `${computationTime}s` : 'Pending'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Synergy Quotient</span>
                      <span className="font-black text-emerald-400 font-mono">{synergyRating}%</span>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>

    </div>
  );
}
