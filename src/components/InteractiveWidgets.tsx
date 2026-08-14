import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Sparkles, RefreshCw, Copy, Check, Download, 
  Play, Pause, Square, Lock, Activity, Pipette, Search, Layers,
  Trash2, Plus, ArrowRight, Image as ImageIcon, Volume2, Mic, FileText,
  Calculator, DollarSign, Heart, Sliders, ChevronRight,
  GitFork, ZoomIn, ZoomOut, Eye, Edit2, PlusCircle,
  Camera, UploadCloud, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import jsQR from 'jsqr';
import { Tool, Note, LanguageCode, TRANSLATIONS } from '../types';
import AITrendPredictionWidget from './AITrendPredictionWidget';
import AIAppCompilerWidget from './AIAppCompilerWidget';
import AIVoiceClonerWidget from './AIVoiceClonerWidget';

interface WidgetProps {
  tool: Tool;
  lang: LanguageCode;
  onAddHistory: (input: Record<string, any>, output: string) => void;
  savedNotes: Note[];
  onSaveNotes: (notes: Note[]) => void;
  userTier: 'free' | 'pro' | 'elite';
  onUseCredit: () => boolean;
  theme?: 'dark' | 'light';
}

export default function InteractiveWidgets(props: WidgetProps) {
  const { tool } = props;
  if (tool.id === 'ai-trend-prediction') return <AITrendPredictionWidget {...props} />;
  if (tool.id === 'ai-app-compiler') return <AIAppCompilerWidget {...props} />;
  if (tool.id === 'ai-voice-cloner') return <AIVoiceClonerWidget {...props} />;

  if (tool.id === 'ai-mindmap') return <AIMindMapWidget {...props} />;
  if (tool.id === 'ai-chat') return <AIChatWidget {...props} />;
  if (tool.id === 'website-generator') return <WebsiteGeneratorWidget {...props} />;
  if (tool.id === 'ocr-reader') return <OCRReaderWidget {...props} />;
  if (tool.id === 'qr-generator') return <QRGeneratorWidget {...props} />;
  if (tool.id === 'qr-scanner') return <QRScannerWidget {...props} />;
  if (tool.id === 'password-generator') return <PasswordGeneratorWidget {...props} />;
  if (tool.id === 'rich-notes') return <RichNotesWidget {...props} />;
  if (tool.id === 'unit-converter') return <UnitConverterWidget {...props} />;
  if (tool.id === 'color-picker') return <ColorPickerWidget {...props} />;
  if (tool.id === 'seo-tags') return <SEOTagsWidget {...props} />;
  if (tool.id === 'scientific-calc' || tool.id === 'financial-calc' || tool.id === 'health-calc') return <CalculatorSuiteWidget {...props} />;
  if (tool.id === 'text-to-speech') return <TextToSpeechWidget {...props} />;
  if (tool.id === 'speech-to-text') return <SpeechToTextWidget {...props} />;
  if (tool.id === 'image-compressor') return <ImageCompressorWidget {...props} />;
  if (tool.id === 'upi-invoice') return <UPIInvoiceWidget {...props} />;
  if (tool.id === 'image-prompter') return <ImagePrompterWidget {...props} />;

  return <GenericAIWidget {...props} />;
}

// ================= 0. AI MIND MAP & CONCEPT VISUALIZER =================
interface MindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  description: string;
  type: 'root' | 'branch' | 'leaf';
  collapsed?: boolean;
}

function AIMindMapWidget({
  tool,
  lang,
  onAddHistory,
  savedNotes,
  onSaveNotes,
  userTier,
  onUseCredit
}: WidgetProps) {
  const isGu = lang === 'gu';
  const isHi = lang === 'hi';
  const isEs = lang === 'es';
  const isJa = lang === 'ja';

  const [topic, setTopic] = useState('SaaS Micro-Business Launch');
  const [theme, setTheme] = useState<'ocean' | 'forest' | 'sunset' | 'crimson' | 'slate'>('ocean');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'checklist'>('canvas');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('1');

  // Interactive Zooming and Panning State
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 20, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Node editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Node adding state
  const [addingToNodeId, setAddingToNodeId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Default high-fidelity mindmap nodes
  const [nodes, setNodes] = useState<MindMapNode[]>([
    { id: '1', label: 'Matcha Retail Shop Launch', parentId: null, description: 'Establish an organic, premium matcha physical and digital brand in the metro area.', type: 'root', collapsed: false },
    { id: '2', label: '1. Brand & Sourcing', parentId: '1', description: 'Form direct Kyoto farm partnerships and finalize tin packaging design.', type: 'branch', collapsed: false },
    { id: '3', label: '2. Shopify Storefront', parentId: '1', description: 'Design a lightning-fast responsive storefront with high-resolution visual assets.', type: 'branch', collapsed: false },
    { id: '4', label: '3. Digital Marketing', parentId: '1', description: 'Execute organic wellness micro-influencer outreach and SEO blogs.', type: 'branch', collapsed: false },
    { id: '5', label: 'Partner Kyoto Growers', parentId: '2', description: 'Secure direct single-origin organic ceremonial grade supply chains.', type: 'leaf', collapsed: false },
    { id: '6', label: 'Biodegradable Tins', parentId: '2', description: 'Source sleek airtight double-sealed green minimalist paper tin containers.', type: 'leaf', collapsed: false },
    { id: '7', label: 'Tailwind Commerce Hub', parentId: '3', description: 'Write fast interactive cart drawers and localized pricing models.', type: 'leaf', collapsed: false },
    { id: '8', label: 'Aesthetic Brewing Videos', parentId: '4', description: 'Record high-production-value traditional whisking tutorials for socials.', type: 'leaf', collapsed: false }
  ]);

  // Compute Layout coordinates dynamically
  const nodeWidth = 190;
  const nodeHeight = 64;
  const xSpacing = 250;

  const { coords, totalHeight } = React.useMemo(() => {
    const rootNode = nodes.find(n => n.parentId === null || n.type === 'root');
    if (!rootNode) return { coords: {} as Record<string, { x: number, y: number, visible: boolean }>, totalHeight: 500 };

    const computed: Record<string, { x: number, y: number, visible: boolean }> = {};
    const branches = nodes.filter(n => n.parentId === rootNode.id);
    const rootX = 40;
    let currentY = 30;

    branches.forEach((branch) => {
      const leaves = nodes.filter(n => n.parentId === branch.id);
      const visibleLeaves = branch.collapsed ? [] : leaves;

      const groupLeafCount = Math.max(1, visibleLeaves.length);
      const groupHeight = groupLeafCount * 80;

      // Layout leaves
      visibleLeaves.forEach((leaf, leafIndex) => {
        const leafY = currentY + leafIndex * 80;
        computed[leaf.id] = {
          x: rootX + xSpacing * 2,
          y: leafY,
          visible: !branch.collapsed
        };
      });

      // Layout branch centered vertically next to its leaves
      const branchY = currentY + (groupHeight - 80) / 2;
      computed[branch.id] = {
        x: rootX + xSpacing,
        y: branchY,
        visible: true
      };

      currentY += groupHeight + 20;
    });

    const calculatedHeight = Math.max(500, currentY);

    // Layout root vertically centered relative to all coordinates
    computed[rootNode.id] = {
      x: rootX,
      y: (calculatedHeight - nodeHeight) / 2,
      visible: true
    };

    return { coords: computed, totalHeight: calculatedHeight };
  }, [nodes]);

  // Handle Drag-to-Pan Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mindmap-card') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom helpers
  const handleZoomIn = () => setScale(prev => Math.min(2, prev + 0.15));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.15));
  const handleZoomReset = () => {
    setScale(1);
    setTranslate({ x: 20, y: 10 });
  };

  // Generate with AI
  const handleGenerateMindMap = async () => {
    if (!topic.trim() || loading) return;
    if (!onUseCredit()) return;

    setLoading(true);
    try {
      const sysInstruction = `You are an expert strategic business planner and mind-map architect.
Generate a structured concept mind map in JSON format for the requested topic.
Your output must be ONLY a valid, parsable JSON object, with no markdown code block formatting (no \`\`\`json, no trailing comments).

The JSON schema MUST exactly match:
{
  "nodes": [
    { "id": "1", "label": "Main Topic", "parentId": null, "description": "Core idea summarized", "type": "root" },
    { "id": "2", "label": "Subtopic A", "parentId": "1", "description": "Subtopic description", "type": "branch" },
    { "id": "3", "label": "Sub-subtopic A1", "parentId": "2", "description": "Detailed step", "type": "leaf" }
  ]
}

Create exactly 1 root node, 3 to 4 branches (parentId is root node id), and for each branch, 2 to 3 leaf nodes (parentId is the branch node id). This will create a balanced tree of 10 to 12 nodes.
Ensure the descriptions are action-oriented, clear, and highly practical. Make the labels short (under 4 words). Output strictly valid JSON.`;

      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: topic, systemInstruction: sysInstruction }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      let cleanOutput = data.output.trim();
      if (cleanOutput.startsWith('```')) {
        cleanOutput = cleanOutput.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanOutput);
      if (parsed && Array.isArray(parsed.nodes)) {
        const formattedNodes: MindMapNode[] = parsed.nodes.map((n: any) => ({
          id: String(n.id),
          label: String(n.label),
          parentId: n.parentId ? String(n.parentId) : null,
          description: String(n.description || ''),
          type: n.type === 'root' || n.type === 'branch' || n.type === 'leaf' ? n.type : 'leaf',
          collapsed: false
        }));
        setNodes(formattedNodes);
        
        // Auto-select root node
        const rootNode = formattedNodes.find(n => n.parentId === null);
        if (rootNode) setSelectedNodeId(rootNode.id);
        
        onAddHistory({ topic }, JSON.stringify(formattedNodes, null, 2));
      } else {
        throw new Error('Invalid JSON format received from AI model');
      }
    } catch (err: any) {
      alert(isGu 
        ? `નકશો બનાવવામાં સમસ્યા આવી: ${err.message}. સેન્ડબોક્સ મોડમાં કસ્ટમ ડેમો લોડ કરેલ છે.`
        : `AI Generation error: ${err.message || 'Failed to generate map'}. Loading safe template layout instead.`);
      
      // Fallback beautiful template dynamically styled based on user input
      const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
      const fallbackNodes: MindMapNode[] = [
        { id: '1', label: capitalizedTopic, parentId: null, description: `Comprehensive interactive guide for ${capitalizedTopic}.`, type: 'root', collapsed: false },
        { id: '2', label: '1. Phase One: Strategy', parentId: '1', description: 'Analyze requirements, outline scope, and perform feasibility testing.', type: 'branch', collapsed: false },
        { id: '3', label: '2. Phase Two: Execution', parentId: '1', description: 'Assemble team, design wireframes, and launch beta environment.', type: 'branch', collapsed: false },
        { id: '4', label: '3. Phase Three: Growth', parentId: '1', description: 'Launch outreach campaigns, monitor KPIs, and gather customer reviews.', type: 'branch', collapsed: false },
        { id: '5', label: 'Requirement Audit', parentId: '2', description: 'List core software needs and budget limits.', type: 'leaf', collapsed: false },
        { id: '6', label: 'Target Audience Research', parentId: '2', description: 'Identify active user personas and key pain-points.', type: 'leaf', collapsed: false },
        { id: '7', label: 'UI/UX Mockups', parentId: '3', description: 'Build responsive design grids and interactive canvas elements.', type: 'leaf', collapsed: false },
        { id: '8', label: 'Beta Release Launch', parentId: '3', description: 'Publish initial features to 50 early testers.', type: 'leaf', collapsed: false },
        { id: '9', label: 'Referral Engine Setup', parentId: '4', description: 'Provide incentive loops for users sharing links.', type: 'leaf', collapsed: false }
      ];
      setNodes(fallbackNodes);
      setSelectedNodeId('1');
    } finally {
      setLoading(false);
    }
  };

  // Node operations
  const handleToggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n));
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setEditingNodeId(null);
    setAddingToNodeId(null);
  };

  const handleStartEdit = (node: MindMapNode) => {
    setEditingNodeId(node.id);
    setEditLabel(node.label);
    setEditDesc(node.description);
    setAddingToNodeId(null);
  };

  const handleSaveEdit = () => {
    if (!editLabel.trim()) return;
    setNodes(prev => prev.map(n => n.id === editingNodeId ? { ...n, label: editLabel, description: editDesc } : n));
    setEditingNodeId(null);
  };

  const handleStartAddChild = (parentNodeId: string) => {
    setAddingToNodeId(parentNodeId);
    setNewLabel('');
    setNewDesc('');
    setEditingNodeId(null);
  };

  const handleSaveAddChild = () => {
    if (!newLabel.trim()) return;
    const parentNode = nodes.find(n => n.id === addingToNodeId);
    if (!parentNode) return;

    // determine child type: if parent is root -> child is branch, else leaf
    const childType = parentNode.type === 'root' ? 'branch' : 'leaf';
    const newId = 'node-' + Date.now();
    const childNode: MindMapNode = {
      id: newId,
      label: newLabel,
      parentId: addingToNodeId,
      description: newDesc,
      type: childType,
      collapsed: false
    };

    setNodes(prev => [...prev, childNode]);
    setSelectedNodeId(newId);
    setAddingToNodeId(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    const getChildrenIds = (id: string): string[] => {
      const children = nodes.filter(n => n.parentId === id);
      return [id, ...children.flatMap(c => getChildrenIds(c.id))];
    };
    const idsToRemove = getChildrenIds(nodeId);
    
    // Prevent removing root completely if it is the only node
    if (nodes.find(n => n.id === nodeId)?.parentId === null && nodes.length <= 1) {
      alert(isGu ? 'મુખ્ય વિષયને ડિલીટ કરી શકાતો નથી!' : 'Cannot delete the root node!');
      return;
    }

    setNodes(prev => prev.filter(n => !idsToRemove.includes(n.id)));
    if (selectedNodeId && idsToRemove.includes(selectedNodeId)) {
      const remaining = nodes.find(n => !idsToRemove.includes(n.id));
      setSelectedNodeId(remaining ? remaining.id : null);
    }
  };

  // Convert map to Markdown checklist
  const handleCopyMarkdown = () => {
    const rootNode = nodes.find(n => n.parentId === null);
    if (!rootNode) return;

    let md = `# Mind Map: ${rootNode.label}\n\n`;
    md += `Description: ${rootNode.description}\n\n`;

    const branches = nodes.filter(n => n.parentId === rootNode.id);
    branches.forEach(b => {
      md += `## - [ ] ${b.label}\n`;
      if (b.description) md += `   _${b.description}_\n`;
      const leaves = nodes.filter(n => n.parentId === b.id);
      leaves.forEach(l => {
        md += `   - [ ] ${l.label}\n`;
        if (l.description) md += `     _${l.description}_\n`;
      });
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    alert(isGu ? 'ચેકલિસ્ટ માર્કડાઉન કોપી થઈ ગયું!' : 'Markdown Checklist copied to clipboard!');
  };

  // Download raw JSON
  const handleDownloadJSON = () => {
    const rootNode = nodes.find(n => n.parentId === null);
    const filename = `${rootNode ? rootNode.label.toLowerCase().replace(/\s+/g, '-') : 'mindmap'}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Theme styling helpers
  const themeColors = {
    ocean: { line: '#0ea5e9', root: 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 text-white', branchBorder: 'border-cyan-500/30', branchBg: 'bg-cyan-500/10 hover:bg-cyan-500/15', leafBorder: 'border-slate-800', leafBg: 'bg-slate-900/60 hover:bg-slate-900/80' },
    forest: { line: '#10b981', root: 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 text-white', branchBorder: 'border-emerald-500/30', branchBg: 'bg-emerald-500/10 hover:bg-emerald-500/15', leafBorder: 'border-slate-800', leafBg: 'bg-slate-900/60 hover:bg-slate-900/80' },
    sunset: { line: '#f59e0b', root: 'bg-gradient-to-r from-orange-600 to-amber-500 shadow-lg shadow-orange-500/20 text-white', branchBorder: 'border-amber-500/30', branchBg: 'bg-amber-500/10 hover:bg-amber-500/15', leafBorder: 'border-slate-800', leafBg: 'bg-slate-900/60 hover:bg-slate-900/80' },
    crimson: { line: '#f43f5e', root: 'bg-gradient-to-r from-rose-600 to-pink-500 shadow-lg shadow-rose-500/20 text-white', branchBorder: 'border-rose-500/30', branchBg: 'bg-rose-500/10 hover:bg-rose-500/15', leafBorder: 'border-slate-800', leafBg: 'bg-slate-900/60 hover:bg-slate-900/80' },
    slate: { line: '#64748b', root: 'bg-gradient-to-r from-slate-700 to-slate-500 shadow-lg shadow-slate-500/20 text-white', branchBorder: 'border-slate-500/30', branchBg: 'bg-slate-500/10 hover:bg-slate-500/15', leafBorder: 'border-slate-800', leafBg: 'bg-slate-900/60 hover:bg-slate-900/80' },
  }[theme];

  const activeNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div id="ai-mindmap-widget" className="space-y-6">
      {/* Search and control dashboard top bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-left space-y-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
          {isGu ? "એઆઇ માઇન્ડ મેપ સેટઅપ" : isHi ? "एआई माइंड मैप सेटअप" : "AI Concept Sandbox configuration"}
        </span>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-6 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isGu ? "નકશાનો વિષય / નવો બિઝનેસ આઈડિયા" : "Core Topic / Business Concept"}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Master React and TypeScript in 30 Days"
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isGu ? "થીમ પસંદ કરો" : "Visual Theme Style"}
            </label>
            <select
              value={theme}
              onChange={(e: any) => setTheme(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-3 focus:outline-none font-semibold"
            >
              <option value="ocean">🌊 {isGu ? "મહાસાગર બ્લુ" : "Cool Ocean Blue"}</option>
              <option value="forest">🌿 {isGu ? "જંગલ લીલો" : "Emerald Forest"}</option>
              <option value="sunset">🌅 {isGu ? "સૂર્યાસ્ત કેસરી" : "Sunset Warmth"}</option>
              <option value="crimson">🌸 {isGu ? "રોઝ ગુલાબી" : "Neon Crimson"}</option>
              <option value="slate">⚙️ {isGu ? "મેટા ગ્રે" : "Modern Dark Slate"}</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              onClick={handleGenerateMindMap}
              disabled={loading || !topic.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 text-white font-black text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 uppercase tracking-wide shadow-md shadow-blue-500/10 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />}
              <span>{loading ? (isGu ? 'નકશો બનાવી રહ્યું છે...' : 'Architecting Map...') : (isGu ? 'નકશો બનાવો' : 'Build Mind Map')}</span>
            </button>
          </div>
        </div>

        {/* Action presets */}
        <div className="flex gap-2 items-center flex-wrap pt-1 text-xs">
          <span className="text-slate-500 font-bold">{isGu ? "આઈડિયા નમૂના:" : "Try Topics:"}</span>
          {[
            'Launch an AI Chrome Extension',
            'Succeed in a Tech Job Interview',
            'Write a 3-Course Dinner Cookbook',
            'Design a Smart Home Office Grid'
          ].map((preset, i) => (
            <button
              key={i}
              onClick={() => setTopic(preset)}
              className="text-[10px] text-slate-400 hover:text-blue-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-750 px-2.5 py-1 rounded-lg transition"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Sidebar Controls Panel (left 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5 text-left">
          
          {/* View Mode Select Toggles */}
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex gap-2">
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                viewMode === 'canvas' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{isGu ? "નકશો જુઓ" : "Visual Canvas"}</span>
            </button>
            <button
              onClick={() => setViewMode('checklist')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                viewMode === 'checklist' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isGu ? "ચેકલિસ્ટ" : "Task Checklist"}</span>
            </button>
          </div>

          {/* Active Node Detail Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>{isGu ? "પસંદ કરેલ મુદ્દાની વિગત" : "Node Properties & Controls"}</span>
              </span>

              {activeNode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      activeNode.type === 'root' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/10' :
                      activeNode.type === 'branch' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/10' :
                      'bg-slate-800 text-slate-400 border border-slate-750'
                    }`}>
                      {activeNode.type}
                    </span>
                    {activeNode.type === 'branch' && (
                      <button 
                        onClick={(e) => handleToggleCollapse(activeNode.id, e)}
                        className="text-[9px] font-bold text-blue-400 hover:underline"
                      >
                        {activeNode.collapsed ? (isGu ? 'ખોલો' : 'Expand children') : (isGu ? 'બંધ કરો' : 'Collapse children')}
                      </button>
                    )}
                  </div>

                  {editingNodeId === activeNode.id ? (
                    <div className="space-y-3 pt-1 border-t border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Label</label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Description</label>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 resize-none font-medium"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingNodeId(null)}
                          className="flex-1 bg-slate-800 text-slate-300 font-bold py-1.5 rounded-lg text-xs hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 bg-blue-600 text-white font-bold py-1.5 rounded-lg text-xs hover:bg-blue-500"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-white">{activeNode.label}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-semibold">{activeNode.description || (isGu ? 'કોઈ વર્ણન નથી.' : 'No description provided.')}</p>
                    </div>
                  )}

                  {/* Inline subtopic adding panel */}
                  {addingToNodeId === activeNode.id && (
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block">
                        {isGu ? "નવો પેટા-મુદ્દો ઉમેરો" : "Append New Sub-concept Node"}
                      </span>
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder={isGu ? "મુદ્દાનું નામ" : "e.g., Marketing Budget"}
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder={isGu ? "તેના વિશે ટૂંકમાં વિગત" : "e.g., Define monthly limit and ad bids"}
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 font-medium"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAddingToNodeId(null)}
                          className="flex-1 bg-slate-800 text-slate-300 font-bold py-1 rounded-lg text-xs hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAddChild}
                          className="flex-1 bg-emerald-600 text-white font-bold py-1 rounded-lg text-xs hover:bg-emerald-500"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">{isGu ? "મુદ્દો પસંદ કરો." : "Click any node on the right canvas to inspect properties or edit."}</p>
              )}
            </div>

            {/* Quick Action buttons at bottom */}
            {activeNode && editingNodeId !== activeNode.id && addingToNodeId !== activeNode.id && (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleStartAddChild(activeNode.id)}
                  className="bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-400 py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isGu ? "નવું" : "Add Child"}</span>
                </button>
                <button
                  onClick={() => handleStartEdit(activeNode)}
                  className="bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>{isGu ? "સુધારો" : "Edit Node"}</span>
                </button>
                <button
                  onClick={() => handleDeleteNode(activeNode.id)}
                  className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isGu ? "ડીલીટ" : "Delete"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Display Canvas / Checklist viewport (right 8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          {viewMode === 'canvas' ? (
            <div className="flex flex-col flex-1 bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden min-h-[500px] h-[580px] relative shadow-inner select-none">
              
              {/* Canvas controls overlays */}
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-3 shadow-md backdrop-blur-sm text-xs font-mono font-bold text-slate-400">
                  <span>Zoom: {Math.round(scale * 100)}%</span>
                  <div className="flex gap-1 border-l border-slate-800 pl-2">
                    <button onClick={handleZoomIn} className="p-1 hover:text-white hover:bg-slate-800 rounded transition"><ZoomIn className="w-3.5 h-3.5" /></button>
                    <button onClick={handleZoomOut} className="p-1 hover:text-white hover:bg-slate-800 rounded transition"><ZoomOut className="w-3.5 h-3.5" /></button>
                    <button onClick={handleZoomReset} className="p-1 text-[10px] hover:text-white hover:bg-slate-800 rounded transition font-black uppercase tracking-wider px-1">Reset</button>
                  </div>
                </div>
              </div>

              {/* Canvas top-right download options */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                  onClick={handleDownloadJSON}
                  className="bg-slate-900/90 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 text-xs px-3 py-1.5 rounded-xl shadow-md backdrop-blur-sm font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className="bg-slate-900/90 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 text-xs px-3 py-1.5 rounded-xl shadow-md backdrop-blur-sm font-semibold flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Checklist</span>
                </button>
              </div>

              {/* Interactive Draggable Canvas Area */}
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative"
                style={{
                  backgroundSize: '24px 24px',
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)'
                }}
              >
                {/* Transformable elements wrapper */}
                <div
                  style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                    transformOrigin: 'top left',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                  }}
                  className="absolute inset-0"
                >
                  {/* SVG connectors layer */}
                  <svg 
                    className="absolute inset-0 pointer-events-none overflow-visible" 
                    style={{ width: xSpacing * 2.5 + nodeWidth + 100, height: totalHeight + 100 }}
                  >
                    {nodes.map((node) => {
                      if (!node.parentId) return null;
                      const parentCoord = coords[node.parentId];
                      const childCoord = coords[node.id];
                      
                      if (!parentCoord || !childCoord || !parentCoord.visible || !childCoord.visible) return null;

                      const fromX = parentCoord.x + nodeWidth;
                      const fromY = parentCoord.y + nodeHeight / 2;
                      const toX = childCoord.x;
                      const toY = childCoord.y + nodeHeight / 2;

                      // Symmetrical horizontal cubic-bezier connection curve
                      const controlPointX = (fromX + toX) / 2;

                      return (
                        <path
                          key={`line-${node.id}`}
                          d={`M ${fromX} ${fromY} C ${controlPointX} ${fromY}, ${controlPointX} ${toY}, ${toX} ${toY}`}
                          fill="none"
                          stroke={themeColors.line}
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="opacity-60 transition-all duration-300"
                        />
                      );
                    })}
                  </svg>

                  {/* HTML Cards Node layers */}
                  <div className="absolute inset-0 pointer-events-none" style={{ width: xSpacing * 2.5 + nodeWidth + 100, height: totalHeight + 100 }}>
                    {nodes.map((node) => {
                      const coord = coords[node.id];
                      if (!coord || !coord.visible) return null;

                      const isSelected = selectedNodeId === node.id;
                      const hasChildren = nodes.some(n => n.parentId === node.id);

                      // Card styling based on hierarchy type and themes
                      let cardStyle = '';
                      if (node.type === 'root') {
                        cardStyle = themeColors.root;
                      } else if (node.type === 'branch') {
                        cardStyle = `${themeColors.branchBg} border ${themeColors.branchBorder} ${
                          isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 border-white' : ''
                        } text-slate-100`;
                      } else {
                        cardStyle = `${themeColors.leafBg} border ${themeColors.leafBorder} ${
                          isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 border-white' : ''
                        } text-slate-300`;
                      }

                      return (
                        <div
                          key={node.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectNode(node.id);
                          }}
                          style={{
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                            width: `${nodeWidth}px`,
                            height: `${nodeHeight}px`
                          }}
                          className={`mindmap-card absolute pointer-events-auto rounded-xl p-3 flex flex-col justify-between text-left transition-all duration-300 cursor-pointer shadow-md select-none ${cardStyle}`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className={`text-[11px] font-black tracking-wide leading-snug truncate ${
                              node.type === 'root' ? 'text-white' : isSelected ? 'text-blue-400' : 'text-slate-100'
                            }`}>
                              {node.label}
                            </span>
                            {node.type === 'branch' && hasChildren && (
                              <button
                                onClick={(e) => handleToggleCollapse(node.id, e)}
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                                  node.collapsed 
                                    ? 'bg-slate-800 text-cyan-400 border-cyan-500/30' 
                                    : 'bg-slate-900 text-slate-400 border-slate-700'
                                }`}
                              >
                                {node.collapsed ? '+' : '−'}
                              </button>
                            )}
                          </div>
                          
                          <p className={`text-[9px] truncate font-medium ${
                            node.type === 'root' ? 'text-blue-100' : 'text-slate-400'
                          }`}>
                            {node.description || 'View details'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* Instructions overlay at bottom */}
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-center">
                <span className="bg-slate-900/90 border border-slate-800 text-[10px] font-bold text-slate-500 tracking-wider uppercase px-4 py-1.5 rounded-full shadow backdrop-blur-sm">
                  🖱️ Drag background to pan • Use buttons to zoom • Double click nodes to expand
                </span>
              </div>

            </div>
          ) : (
            
            // Checklist view mode
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex-1 text-left space-y-5 min-h-[500px]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">{isGu ? "તમારું ચેકલિસ્ટ લિસ્ટ" : "Generated Structured Tasks"}</h3>
                  <p className="text-xs text-slate-400 mt-1">{isGu ? "તમારા નકશાનું સુંદર ચેકલિસ્ટ ફોર્મેટ" : "A copyable, highly structured layout of your strategy maps."}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{isGu ? "કોપી લિસ્ટ" : "Copy Markdown"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6 max-h-[420px] overflow-y-auto pr-2">
                {(() => {
                  const rootNode = nodes.find(n => n.parentId === null);
                  if (!rootNode) return <p className="text-xs text-slate-500 italic">No nodes found.</p>;
                  const branches = nodes.filter(n => n.parentId === rootNode.id);

                  return (
                    <div className="space-y-5">
                      <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <Check className="w-4.5 h-4.5 text-blue-500" />
                          <span className="text-sm font-black text-white">{rootNode.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 ml-7 font-medium">{rootNode.description}</p>
                      </div>

                      <div className="space-y-4 pl-4 border-l-2 border-slate-800">
                        {branches.map(branch => {
                          const leaves = nodes.filter(n => n.parentId === branch.id);
                          return (
                            <div key={branch.id} className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <input type="checkbox" className="rounded border-slate-700 bg-slate-850 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4" />
                                <span className="text-xs font-black text-slate-200">{branch.label}</span>
                              </div>
                              {branch.description && (
                                <p className="text-[11px] text-slate-500 ml-6.5 font-medium italic">{branch.description}</p>
                              )}

                              {leaves.length > 0 && (
                                <div className="space-y-2 pl-6">
                                  {leaves.map(leaf => (
                                    <div key={leaf.id} className="space-y-0.5">
                                      <div className="flex items-center gap-2.5">
                                        <input type="checkbox" className="rounded border-slate-700 bg-slate-850 text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold text-slate-400">{leaf.label}</span>
                                      </div>
                                      {leaf.description && (
                                        <p className="text-[10px] text-slate-500 ml-6 font-medium leading-relaxed">{leaf.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}


function AIChatWidget({
  tool,
  lang,
  onAddHistory,
  savedNotes,
  onSaveNotes,
  userTier,
  onUseCredit
}: WidgetProps) {
  const t = TRANSLATIONS[lang];
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState('');

  // Handle clipboard copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
      { role: 'assistant', content: 'Hello! I am your AI Chat companion. Ask me anything, or let me help you analyze code, write copy, or brainstorm strategies.' }
    ]);
    const [inputVal, setInputVal] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendChat = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!inputVal.trim() || loading) return;

      if (!onUseCredit()) return;

      const userMsg = inputVal;
      setInputVal('');
      const newMessages = [...messages, { role: 'user', content: userMsg }];
      setMessages(newMessages as any);
      setLoading(true);

      try {
        const response = await fetch('/api/tools/chat-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (response.status === 429) {
          const errData = await response.json();
          throw new Error(errData.message || "Rate Limit Reached");
        }

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        if (!reader) {
          throw new Error("Could not initialize stream reader");
        }

        let streamContent = '';
        setMessages([...newMessages, { role: 'assistant', content: '' }] as any);

        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          const lines = accumulated.split('\n');
          accumulated = lines.pop() || ''; // Keep the incomplete line inside the buffer

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(cleanLine.slice(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.text) {
                  streamContent += data.text;
                  setMessages((prev) => {
                    const copy = [...prev];
                    if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
                      copy[copy.length - 1].content = streamContent;
                    }
                    return copy;
                  });
                }
              } catch (parseErr) {
                // Ignore incomplete JSON chunks gracefully inside buffer
              }
            }
          }
        }

        onAddHistory({ chat: userMsg }, streamContent);
      } catch (err: any) {
        setMessages([...newMessages, { role: 'assistant', content: `⚠️ Error: ${err.message || 'Failed to fetch AI response'}` }] as any);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div id="ai-chat-widget" className="flex flex-col h-[520px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, index) => (
            <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-3.5 text-sm leading-relaxed shadow-md ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none font-medium whitespace-pre-wrap' 
                  : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
              }`}>
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <CodeHighlightedText text={m.content} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-xl rounded-tl-none p-3 text-sm animate-pulse flex items-center space-x-2">
                <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
                <span>AI is typing...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {[
            'Write an intro email to an investor',
            'Explain quantum physics simply',
            'Debug a React fetch handler',
            'Suggest 3 ideas for a newsletter'
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => setInputVal(promptText)}
              className="text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-full transition"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendChat} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type your message to AI companion..."
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-lg transition shadow-lg"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    );
  }

  // ================= 2. INTERACTIVE WEB SANDBOX =================
  function WebsiteGeneratorWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const isGu = lang === 'gu';
    const isHi = lang === 'hi';
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadHTML = () => {
      try {
        const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `index.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        alert(isGu ? 'ફાઇલ ડાઉનલોડ કરવામાં અસમર્થ. કોડ મેન્યુઅલી કોપી કરો.' : 'Could not download file automatically. Please copy the source code manually.');
      }
    };

    const [prompt, setPrompt] = useState(isGu ? 'ઝેનિથ એઆઈ - એક સુંદર લક્ઝરી અને મોર્ડન ટેકનોલોજી લેન્ડિંગ પેજ' : 'A sleek modern product landing page for a Matcha Tea Shop with a high-contrast dark green theme and card items');
    const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zenith AI - Elevate Your Operations</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .font-serif {
      font-family: 'Playfair Display', serif;
    }
  </style>
</head>
<body class="bg-[#0b0f19] text-slate-100 min-h-screen selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
  <!-- Decorative background elements -->
  <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="absolute top-[400px] right-10 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"></div>

  <!-- Header -->
  <header class="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-[#0b0f19]/80">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <svg class="w-5.5 h-5.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Zenith<span class="text-emerald-400">AI</span></span>
      </div>
      <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
        <a href="#features" class="hover:text-emerald-400 transition-colors">Features</a>
        <a href="#solution" class="hover:text-emerald-400 transition-colors">Solution</a>
        <a href="#testimonials" class="hover:text-emerald-400 transition-colors">Testimonials</a>
        <a href="#pricing" class="hover:text-emerald-400 transition-colors">Pricing</a>
      </nav>
      <div class="flex items-center gap-4">
        <button class="hidden sm:inline-flex text-sm font-bold text-slate-300 hover:text-white transition">Sign In</button>
        <button class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/10">Start Free Trial</button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative pt-12 pb-24 px-6">
    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
      <div class="lg:col-span-7 space-y-8 text-left">
        <div class="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-bold text-slate-300 tracking-wide">v2.4 Platform Update Live</span>
        </div>
        <h1 class="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
          Architect the Future of <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Intelligent Workflow</span>
        </h1>
        <p class="text-lg text-slate-400 font-medium leading-relaxed max-w-2xl">
          Deploy autonomously optimized machine-learning agents to handle high-volume database routing, contextual content classification, and customer interactions at record scale.
        </p>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          <button class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-8 py-4 rounded-xl transition shadow-xl shadow-emerald-500/15 text-center">
            Deploy Free Agent
          </button>
          <button class="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold px-8 py-4 rounded-xl transition text-center flex items-center justify-center gap-2">
            <span>Watch Live Demo</span>
            <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      </div>
      
      <!-- Visual Interactive Mockup Widget -->
      <div class="lg:col-span-5 relative">
        <div class="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-3xl blur-2xl opacity-20"></div>
        <div class="relative bg-slate-900/90 border border-slate-850 rounded-3xl p-6 shadow-2xl backdrop-blur-sm space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>
            <span class="text-[11px] font-mono font-bold text-slate-500">zenith-agent-terminal</span>
          </div>
          
          <div class="space-y-4">
            <div class="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="text-left">
                  <h4 class="text-xs font-bold text-white">Sentiment Classifier</h4>
                  <p class="text-[10px] text-slate-500">Running continuously</p>
                </div>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-400">99.8% Acc</span>
            </div>

            <div class="flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div class="text-left">
                  <h4 class="text-xs font-bold text-white">Database Routing Agent</h4>
                  <p class="text-[10px] text-slate-500">Query distribution</p>
                </div>
              </div>
              <span class="text-xs font-mono font-bold text-blue-400">0.4ms Latency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section id="features" class="border-t border-slate-850 py-24 px-6 bg-slate-950/30">
    <div class="max-w-7xl mx-auto space-y-16">
      <div class="text-center max-w-xl mx-auto space-y-4">
        <h2 class="text-3xl font-extrabold text-white">Engineered for absolute scale</h2>
        <p class="text-sm text-slate-400 font-medium">Powering businesses with highly specialized neural automation grids.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl hover:border-slate-750 transition duration-300 text-left space-y-4">
          <div class="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-white">Enterprise Cryptography</h3>
          <p class="text-xs text-slate-400 leading-relaxed font-semibold">Keep sensitive customer transactions entirely isolated with full end-to-end sandbox key rotations.</p>
        </div>

        <div class="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl hover:border-slate-750 transition duration-300 text-left space-y-4">
          <div class="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-white">Hyper-converged Speeds</h3>
          <p class="text-xs text-slate-400 leading-relaxed font-semibold">Minimize routing times globally using server-side smart cached responses and instant local models.</p>
        </div>

        <div class="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl hover:border-slate-750 transition duration-300 text-left space-y-4">
          <div class="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-white">Dynamic Analytics</h3>
          <p class="text-xs text-slate-400 leading-relaxed font-semibold">Analyze user cohorts, processing latency, and cost effectiveness instantly with deep visual feedback loops.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-slate-850 py-12 px-6">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
      <span class="text-xs text-slate-500 font-semibold">© 2026 Zenith AI Corporation. All rights reserved.</span>
      <div class="flex gap-6 text-xs text-slate-400 font-semibold">
        <a href="#" class="hover:text-emerald-400 transition">Privacy Policy</a>
        <a href="#" class="hover:text-emerald-400 transition">Terms of Service</a>
        <a href="#" class="hover:text-emerald-400 transition">Contact</a>
      </div>
    </div>
  </footer>
</body>
</html>`);
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

    const handleBuildWebsite = async () => {
      if (!prompt.trim() || loading) return;
      if (!onUseCredit()) return;

      setLoading(true);
      try {
        const sysInstruction = 'You are an elite frontend engineer and lead UI/UX designer. Write a complete, standalone, single-file HTML layout styled strictly with Tailwind CDN and custom modern SVG assets. Do not write any explanations, do not use markdown blocks. Output ONLY raw HTML from <!DOCTYPE html> to </html>. Design the webpage to look highly professional, luxury, with ultra-premium typography, polished spacing, micro-animations, clean interactive states, and fully populated sections including a header, premium hero section with high-quality styled mockups, beautiful feature rows, testimonials, and a custom interactive form or FAQ accordion.';
        const res = await fetch('/api/tools/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, systemInstruction: sysInstruction }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        let cleanCode = data.output.trim();
        // Strip markdown codeblocks if AI included them
        if (cleanCode.startsWith('```html')) {
          cleanCode = cleanCode.substring(7);
        }
        if (cleanCode.endsWith('```')) {
          cleanCode = cleanCode.substring(0, cleanCode.length - 3);
        }
        setHtmlCode(cleanCode.trim());
        onAddHistory({ prompt }, cleanCode);
        setActiveTab('preview');
      } catch (err: any) {
        alert(`Error: ${err.message || 'Failed to compile website'}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div id="website-generator-widget" className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {isGu ? "તમારી વેબસાઇટ આઇડિયા અથવા વિષય લખો" : "Describe Your Web Design Concept"}
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isGu ? "ઉદા. મોર્ડન ટેકનોલોજી સ્ટાર્ટઅપ લેન્ડિંગ પેજ..." : "e.g. Modern developer portfolio page with carbon cards and cool gradient borders..."}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
            <button
              onClick={handleBuildWebsite}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>{loading ? (isGu ? 'વેબસાઇટ બની રહી છે...' : 'Compiling Sandbox...') : (isGu ? 'વેબસાઇટ બનાવો' : 'Compile Website')}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[460px]">
          {/* Tabs bar */}
          <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 border-b border-slate-800">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isGu ? "વેબસાઇટ પ્રિવ્યૂ" : "Sandbox Preview"}
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'code' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isGu ? "કોડ જુઓ" : "View Source Code"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(htmlCode)}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isGu ? 'કોપી થઈ ગયું' : 'Copied') : (isGu ? 'કોડ કોપી કરો' : 'Copy HTML')}</span>
              </button>

              <button
                onClick={handleDownloadHTML}
                className="text-slate-200 hover:text-white text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded transition font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGu ? 'ડાઉનલોડ HTML' : 'Download HTML'}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 overflow-hidden">
            {activeTab === 'preview' ? (
              <iframe
                title="Sandbox web preview"
                srcDoc={htmlCode}
                className="w-full h-full bg-[#0b0f19]"
                sandbox="allow-scripts"
              />
            ) : (
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="w-full h-full p-4 bg-slate-950 font-mono text-xs text-blue-300 focus:outline-none resize-none overflow-y-auto"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. DOCUMENT OCR TEXT READER =================
  function OCRReaderWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState('image/png');
    const [rawBase64, setRawBase64] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setMimeType(file.type);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          // extract base64 raw string
          const base64Str = (reader.result as string).split(',')[1];
          setRawBase64(base64Str);
        };
        reader.readAsDataURL(file);
      }
    };

    const runOCR = async () => {
      if (!rawBase64) return;
      if (!onUseCredit()) return;

      setLoading(true);
      setOutput('');
      try {
        const response = await fetch('/api/tools/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image: rawBase64, mimeType }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setOutput(data.output);
        onAddHistory({ ocrImage: 'DocumentUploaded' }, data.output);
      } catch (err: any) {
        setOutput(`OCR error: ${err.message || 'Failed to transcribe image. Ensure image is clear and under 10MB.'}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div id="ocr-reader-widget" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Upload Document, Receipt, or Note Photo</span>
            <p className="text-xs text-slate-400 mb-4">Gemini will decode layout, tables, formatting, and handwritten texts directly on our servers.</p>
            
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-6 text-center cursor-pointer relative bg-slate-950/40 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {imagePreview ? (
                <img src={imagePreview} alt="OCR upload preview" className="max-h-48 mx-auto rounded object-contain shadow" />
              ) : (
                <div className="space-y-2">
                  <CameraIcon className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-200">Drag & drop or Click to Browse</p>
                  <p className="text-xs text-slate-500">Supports PNG, JPEG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={runOCR}
            disabled={!rawBase64 || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5" />}
            <span>{loading ? 'Transcribing Document...' : 'Perform AI OCR extraction'}</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OCR Extracted Text</span>
            {output && (
              <button
                onClick={() => handleCopy(output)}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 min-h-[220px] bg-slate-950 border border-slate-800 rounded-lg p-4 font-sans text-sm text-slate-300 overflow-y-auto whitespace-pre-wrap max-h-[350px]">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                <div className="h-3 bg-slate-800 rounded w-4/5"></div>
              </div>
            ) : output ? (
              output
            ) : (
              <p className="text-slate-500 text-xs italic text-center mt-12">Upload an image and run OCR to see transcriptions here.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 4. DOWNLOADABLE QR GENERATOR =================
  function QRGeneratorWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [qrText, setQrText] = useState('https://ai.studio/build');
    const [fgColor, setFgColor] = useState('#2563eb');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
      // Build Google Chart API or QR Server API URL
      const encoded = encodeURIComponent(qrText);
      const hexFg = fgColor.replace('#', '');
      const hexBg = bgColor.replace('#', '');
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}&color=${hexFg}&bgcolor=${hexBg}`;
      setQrUrl(url);
    }, [qrText, fgColor, bgColor]);

    const handleDownloadQR = async () => {
      // Download by fetching and converting to canvas blob to bypass CORS/iframe download limitations
      try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `qr-code-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        // Fallback open in new tab
        window.open(qrUrl, '_blank');
      }
    };

    return (
      <div id="qr-generator-widget" className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Input Text or URL</label>
            <input
              type="text"
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Foreground Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs text-center rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs text-center rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadQR}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>
        </div>

        <div className="flex flex-col justify-center items-center bg-slate-950 rounded-lg p-6 border border-slate-800">
          {qrUrl ? (
            <div className="p-4 bg-white rounded-lg shadow-2xl border border-slate-200">
              <img src={qrUrl} alt="Generated QR Code" referrerPolicy="no-referrer" className="w-44 h-44 object-contain" />
            </div>
          ) : (
            <div className="w-44 h-44 bg-slate-850 animate-pulse rounded" />
          )}
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-4">Scan QR to follow link</span>
        </div>
      </div>
    );
  }

  // ================= QR SCANNER & DECODER =================
  function QRScannerWidget({
    tool,
    lang,
    onAddHistory,
    onUseCredit,
    theme
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('upload');
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Camera states
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const requestRef = useRef<number | null>(null);

    // Stop the camera stream
    const stopCamera = () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    };

    // Clean up on unmount
    useEffect(() => {
      return () => {
        stopCamera();
      };
    }, []);

    // Start the camera stream
    const startCamera = async () => {
      setErrorMsg(null);
      setScannedResult(null);
      setLoading(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
          videoRef.current.play();
          setCameraActive(true);
          setLoading(false);
          // Start the decode loop
          requestRef.current = requestAnimationFrame(tickCamera);
        }
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(
          lang === 'gu' 
            ? 'કેમેરા એક્સેસ નામંજૂર થયો અથવા કેમેરા ઉપલબ્ધ નથી.' 
            : 'Camera access denied or no camera device found. Please make sure the app is running in a secure context (https) or try uploading an image instead.'
        );
      }
    };

    // Frame-by-frame loop for camera decoding
    const tickCamera = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            setScannedResult(code.data);
            onAddHistory({ scannedAt: new Date().toLocaleTimeString() }, code.data);
            stopCamera();
            return;
          }
        }
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        requestRef.current = requestAnimationFrame(tickCamera);
      }
    };

    // Handle Image Upload File Decode
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setErrorMsg(null);
      setScannedResult(null);
      setLoading(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            setLoading(false);
            if (code && code.data) {
              setScannedResult(code.data);
              onAddHistory({ source: 'Uploaded Image File' }, code.data);
            } else {
              setErrorMsg(
                lang === 'gu'
                  ? 'ચિત્રમાં કોઈ QR કોડ મળ્યો નથી. કૃપા કરીને સ્પષ્ટ ચિત્ર પસંદ કરો.'
                  : 'No QR Code detected in this image. Please make sure the QR is clear, well-lit, and not cropped.'
              );
            }
          } else {
            setLoading(false);
            setErrorMsg('Failed to process image canvas context.');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };

    const handleCopy = () => {
      if (!scannedResult) return;
      navigator.clipboard.writeText(scannedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const isLink = scannedResult && /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(scannedResult);

    return (
      <div id="qr-scanner-widget" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200">{lang === 'gu' ? 'QR કોડ સ્કેનર અને ડીકોડર' : 'AI QR Scanner & Decoder'}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'gu' ? 'તમારા કેમેરાથી લાઇવ સ્કેન કરો અથવા QR ઇમેજ અપલોડ કરો.' : 'Scan QR code instantly from live camera or decode uploaded files.'}
            </p>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto">
            <button
              onClick={() => { stopCamera(); setScanMethod('upload'); setScannedResult(null); setErrorMsg(null); }}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                scanMethod === 'upload' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? 'ઇમેજ અપલોડ' : 'Upload Image'}</span>
            </button>
            <button
              onClick={() => { setScanMethod('camera'); setScannedResult(null); setErrorMsg(null); }}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                scanMethod === 'camera' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? 'લાઇવ કેમેરા' : 'Live Camera'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Active scan frame */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-center items-center min-h-[300px] relative overflow-hidden">
            {scanMethod === 'camera' ? (
              <div className="w-full flex flex-col items-center justify-center space-y-4">
                {cameraActive ? (
                  <div className="w-64 h-64 rounded-xl border-2 border-blue-600 overflow-hidden relative shadow-lg">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    
                    {/* Glowing corner brackets */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    
                    {/* Scanning animated red laser bar */}
                    <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] top-0 animate-scan-laser" />
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Camera className="w-7 h-7" />
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs leading-normal">
                      {lang === 'gu' ? 'કેમેરા શરૂ કરવા માટે નીચે આપેલા બટન પર ક્લિક કરો.' : 'Grant camera permission and scan QR codes in real-time.'}
                    </p>
                    <button
                      onClick={startCamera}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 flex items-center gap-2 mx-auto transition active:scale-95"
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{lang === 'gu' ? 'કેમેરા શરૂ કરો' : 'Start Live Stream'}</span>
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <button
                    onClick={stopCamera}
                    className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>{lang === 'gu' ? 'બંધ કરો' : 'Stop Stream'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center text-center space-y-4">
                <label className="w-full max-w-sm border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-blue-600/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition duration-200">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 mb-3 group-hover:text-blue-400 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {lang === 'gu' ? 'QR કોડ ધરાવતી ઇમેજ પસંદ કરો' : 'Choose an Image File'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                    PNG, JPG, JPEG (Drag & Drop support)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Hidden decoding helper canvas */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Results frame */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between min-h-[300px]">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">
                {lang === 'gu' ? 'સ્કેન કરેલ પરિણામ' : 'Decoded Scan Results'}
              </span>

              {scannedResult ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                    <span className="text-xs font-bold">{lang === 'gu' ? 'સફળતાપૂર્વક ડીકોડ થયું!' : 'Successfully Decoded!'}</span>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 overflow-y-auto max-h-40 font-mono text-xs text-slate-100 break-all select-all leading-relaxed shadow-inner">
                    {scannedResult}
                  </div>
                </div>
              ) : errorMsg ? (
                <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-in fade-in duration-200">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div className="text-xs leading-normal font-semibold">
                    {errorMsg}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-slate-500 text-xs italic">
                    {lang === 'gu' ? 'કોઈ ડેટા ઉપલબ્ધ નથી. કૃપા કરીને QR કોડ સ્કેન કરો.' : 'Waiting for scanned QR code data...'}
                  </p>
                </div>
              )}
            </div>

            {scannedResult && (
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.copied : t.copyBtn}</span>
                </button>
                {isLink && (
                  <a
                    href={scannedResult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{lang === 'gu' ? 'લિંક ખોલો' : 'Open Link'}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 5. ULTRA-SECURE PASSWORD GENERATOR =================
  function PasswordGeneratorWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [length, setLength] = useState(16);
    const [includeUpper, setIncludeUpper] = useState(true);
    const [includeLower, setIncludeLower] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [password, setPassword] = useState('');
    const [strength, setStrength] = useState({ label: 'Safe', color: 'text-green-400 bg-green-500/10 border-green-500/20' });

    const generatePassword = () => {
      let chars = '';
      if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (includeNumbers) chars += '0123456780';
      if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

      if (!chars) {
        setPassword('Select at least one set of characters');
        return;
      }

      let generated = '';
      const bytes = new Uint32Array(length);
      window.crypto.getRandomValues(bytes);
      for (let i = 0; i < length; i++) {
        generated += chars[bytes[i] % chars.length];
      }
      setPassword(generated);

      // Evaluate strength
      let poolSize = 0;
      if (includeUpper) poolSize += 26;
      if (includeLower) poolSize += 26;
      if (includeNumbers) poolSize += 10;
      if (includeSymbols) poolSize += 26;

      const entropy = Math.log2(Math.pow(poolSize, length));
      if (entropy < 45) {
        setStrength({ label: 'Weak', color: 'text-red-400 bg-red-500/10 border-red-500/20' });
      } else if (entropy < 65) {
        setStrength({ label: 'Moderate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' });
      } else if (entropy < 85) {
        setStrength({ label: 'Strong', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' });
      } else {
        setStrength({ label: 'Mathematically Immune', color: 'text-green-400 bg-green-500/10 border-green-500/20' });
      }
    };

    useEffect(() => {
      generatePassword();
    }, [length, includeUpper, includeLower, includeNumbers, includeSymbols]);

    return (
      <div id="password-generator-widget" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
        <div className="flex gap-2 items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
          <input
            type="text"
            readOnly
            value={password}
            className="flex-1 bg-transparent font-mono text-base font-bold text-slate-100 focus:outline-none overflow-x-auto truncate"
          />
          <button
            onClick={() => handleCopy(password)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded transition"
            title="Copy Password"
          >
            {copied ? <Check className="w-4.5 h-4.5 text-green-400" /> : <Copy className="w-4.5 h-4.5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-850">
          <div className="text-center">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Entropy Metric</span>
            <span className="font-mono text-sm font-bold text-slate-300">
              {Math.round(Math.log2(Math.pow((includeUpper ? 26 : 0) + (includeLower ? 26 : 0) + (includeNumbers ? 10 : 0) + (includeSymbols ? 26 : 0) || 1, length)))} bits
            </span>
          </div>
          <div className="text-center border-l border-slate-800">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pool Size</span>
            <span className="font-mono text-sm font-bold text-slate-300">
              {(includeUpper ? 26 : 0) + (includeLower ? 26 : 0) + (includeNumbers ? 10 : 0) + (includeSymbols ? 26 : 0)} chars
            </span>
          </div>
          <div className="text-center border-l border-slate-800 col-span-2">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Strength Profile</span>
            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${strength.color}`}>
              {strength.label}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span className="uppercase tracking-wider">Length Constraints</span>
              <span className="font-mono font-bold text-blue-400">{length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            {[
              { id: 'upper', label: 'Uppercase Letters (A-Z)', value: includeUpper, setter: setIncludeUpper },
              { id: 'lower', label: 'Lowercase Letters (a-z)', value: includeLower, setter: setIncludeLower },
              { id: 'numbers', label: 'Numbers (0-9)', value: includeNumbers, setter: setIncludeNumbers },
              { id: 'symbols', label: 'Special Symbols (@#$)', value: includeSymbols, setter: setIncludeSymbols }
            ].map((opt) => (
              <label key={opt.id} className="flex items-center space-x-3 cursor-pointer bg-slate-950 p-2.5 rounded-lg border border-slate-850 hover:border-slate-800 transition">
                <input
                  type="checkbox"
                  checked={opt.value}
                  onChange={(e) => opt.setter(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300 font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={generatePassword}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Regenerate Secure Password</span>
        </button>
      </div>
    );
  }

  // ================= 6. AI RICH NOTES ASSISTANT =================
  function RichNotesWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [noteTitle, setNoteTitle] = useState('New Note Draft');
    const [noteBody, setNoteBody] = useState('Write your rich thoughts here. Click the "AI Assistant Commands" below to automatically polish, outline, translate, or expand your note using the server-side Gemini intelligence!');
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [autoSaving, setAutoSaving] = useState(false);

    // Auto-save effect with debounce and optimization
    useEffect(() => {
      const existing = savedNotes.find(n => n.id === activeNoteId);
      const isUnchanged = existing && existing.title === noteTitle && existing.content === noteBody;
      const isDefault = !activeNoteId && noteTitle === 'New Note Draft' && noteBody.startsWith('Write your rich thoughts here.');
      
      if (isUnchanged || isDefault) {
        setAutoSaving(false);
        return;
      }

      setAutoSaving(true);
      const timer = setTimeout(() => {
        const id = activeNoteId || `note-${Date.now()}`;
        const newNote: Note = {
          id,
          title: noteTitle || 'Untitled Note',
          content: noteBody,
          updatedAt: Date.now()
        };

        const updated = savedNotes.filter(n => n.id !== id);
        onSaveNotes([newNote, ...updated]);
        
        if (!activeNoteId) {
          setActiveNoteId(id);
        }
        setAutoSaving(false);
      }, 1200);

      return () => {
        clearTimeout(timer);
      };
    }, [noteTitle, noteBody, activeNoteId, onSaveNotes]);

    const saveCurrentNote = () => {
      const id = activeNoteId || `note-${Date.now()}`;
      const newNote: Note = {
        id,
        title: noteTitle,
        content: noteBody,
        updatedAt: Date.now()
      };

      const updated = savedNotes.filter(n => n.id !== id);
      const list = [newNote, ...updated];
      onSaveNotes(list);
      setActiveNoteId(id);
    };

    const handleNewNote = () => {
      setNoteTitle('New Note Draft');
      setNoteBody('');
      setActiveNoteId(null);
    };

    const loadNote = (n: Note) => {
      setActiveNoteId(n.id);
      setNoteTitle(n.title);
      setNoteBody(n.content);
    };

    const deleteNote = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = savedNotes.filter(n => n.id !== id);
      onSaveNotes(updated);
      if (activeNoteId === id) {
        handleNewNote();
      }
    };

    const runNoteAI = async (command: string, instruction: string) => {
      if (!noteBody.trim() || loading) return;
      if (!onUseCredit()) return;

      setLoading(true);
      setNoteBody(''); // Clear the note body first to show live rewriting
      try {
        const response = await fetch('/api/tools/generate-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: noteBody, systemInstruction: instruction }),
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        if (!reader) {
          throw new Error("Could not initialize stream reader");
        }

        let accumulated = '';
        let fullOutput = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          const lines = accumulated.split('\n');
          accumulated = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(cleanLine.slice(6));
                if (data.error) throw new Error(data.error);
                if (data.text) {
                  fullOutput += data.text;
                  setNoteBody(fullOutput);
                }
              } catch (e) {
                // Ignore incomplete JSON chunks gracefully
              }
            }
          }
        }

        onAddHistory({ noteAction: command }, fullOutput);
      } catch (err: any) {
        alert(`AI command failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div id="rich-notes-widget" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Notes sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between h-[450px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Notebook</span>
              <button
                onClick={handleNewNote}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[350px]">
              {savedNotes.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center mt-8">No saved notes yet. Start writing on the scratchpad!</p>
              ) : (
                savedNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => loadNote(n)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex justify-between items-center ${
                      activeNoteId === n.id 
                        ? 'bg-blue-600/10 border-blue-600 text-blue-200' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <span className="block text-xs font-semibold truncate">{n.title || 'Untitled note'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(n.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => deleteNote(n.id, e)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={saveCurrentNote}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fully Synchronized</span>
          </button>
        </div>

        {/* Scratchpad editor */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col space-y-4 h-[450px]">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note Title..."
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 font-bold text-sm rounded-lg px-3 py-2 focus:outline-none"
            />
            {autoSaving ? (
              <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 animate-pulse shrink-0 select-none bg-slate-950/80 px-2 py-1.5 border border-slate-800 rounded-lg">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                <span>Auto-saving...</span>
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 shrink-0 select-none bg-slate-950/80 px-2 py-1.5 border border-slate-800 rounded-lg">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Saved</span>
              </span>
            )}
          </div>

          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Start typing your rich notes..."
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg p-3 focus:outline-none resize-none overflow-y-auto font-sans leading-relaxed"
          />

          {/* AI Tools block */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>AI ASSISTANT WRITING COMMANDS</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { 
                  name: 'Polish Grammar', 
                  cmd: 'polish', 
                  instruction: 'Proofread and polish the provided text. Fix grammar errors, optimize spelling, and enhance sentence pacing. Return only the polished version.' 
                },
                { 
                  name: 'Summarize Note', 
                  cmd: 'summarize', 
                  instruction: 'Summarize the provided notes. Create a highly scannable, bulleted digest emphasizing core arguments and details. Return only the summary.' 
                },
                { 
                  name: 'Translate Gujarati', 
                  cmd: 'trans_gu', 
                  instruction: 'Translate the provided text into fluent, grammatically perfect Gujarati. Keep formatting structures identical. Return only the translation.' 
                },
                { 
                  name: 'Extend Writing', 
                  cmd: 'extend', 
                  instruction: 'Elaborate and extend the provided notes. Add cohesive paragraphs, contextual ideas, and analytical conclusions while maintaining the original tone. Return only the extended text.' 
                }
              ].map((aiOption) => (
                <button
                  key={aiOption.cmd}
                  onClick={() => runNoteAI(aiOption.name, aiOption.instruction)}
                  disabled={loading || !noteBody.trim()}
                  className="bg-slate-950 hover:bg-slate-850 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 px-2.5 py-1.5 rounded text-[11px] font-medium transition"
                >
                  {aiOption.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 7. FULL-SCALE UNIT CONVERTER =================
  function UnitConverterWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [category, setCategory] = useState<'length' | 'weight' | 'temp' | 'data'>('length');
    const [inputValue, setInputValue] = useState(1);
    const [fromUnit, setFromUnit] = useState('m');
    const [toUnit, setToUnit] = useState('km');
    const [converted, setConverted] = useState(0.001);

    const categories = {
      length: {
        units: ['m', 'km', 'ft', 'inch'],
        labels: { m: 'Meter (m)', km: 'Kilometer (km)', ft: 'Feet (ft)', inch: 'Inches (inch)' },
        convert: (val: number, from: string, to: string) => {
          // base is meters
          let meters = val;
          if (from === 'km') meters = val * 1000;
          if (from === 'ft') meters = val * 0.3048;
          if (from === 'inch') meters = val * 0.0254;

          if (to === 'm') return meters;
          if (to === 'km') return meters / 1000;
          if (to === 'ft') return meters / 0.3048;
          if (to === 'inch') return meters / 0.0254;
          return val;
        }
      },
      weight: {
        units: ['kg', 'g', 'lbs', 'oz'],
        labels: { kg: 'Kilogram (kg)', g: 'Gram (g)', lbs: 'Pound (lbs)', oz: 'Ounce (oz)' },
        convert: (val: number, from: string, to: string) => {
          // base is grams
          let grams = val;
          if (from === 'kg') grams = val * 1000;
          if (from === 'lbs') grams = val * 453.592;
          if (from === 'oz') grams = val * 28.3495;

          if (to === 'g') return grams;
          if (to === 'kg') return grams / 1000;
          if (to === 'lbs') return grams / 453.592;
          if (to === 'oz') return grams / 28.3495;
          return val;
        }
      },
      temp: {
        units: ['C', 'F', 'K'],
        labels: { C: 'Celsius (°C)', F: 'Fahrenheit (°F)', K: 'Kelvin (K)' },
        convert: (val: number, from: string, to: string) => {
          if (from === to) return val;
          let c = val;
          if (from === 'F') c = (val - 32) * 5/9;
          if (from === 'K') c = val - 273.15;

          if (to === 'C') return c;
          if (to === 'F') return (c * 9/5) + 32;
          if (to === 'K') return c + 273.15;
          return val;
        }
      },
      data: {
        units: ['KB', 'MB', 'GB', 'TB'],
        labels: { KB: 'Kilobytes (KB)', MB: 'Megabytes (MB)', GB: 'Gigabytes (GB)', TB: 'Terabytes (TB)' },
        convert: (val: number, from: string, to: string) => {
          // base is MB
          let mb = val;
          if (from === 'KB') mb = val / 1024;
          if (from === 'GB') mb = val * 1024;
          if (from === 'TB') mb = val * 1024 * 1024;

          if (to === 'MB') return mb;
          if (to === 'KB') return mb * 1024;
          if (to === 'GB') return mb / 1024;
          if (to === 'TB') return mb / (1024 * 1024);
          return val;
        }
      }
    };

    useEffect(() => {
      const active = categories[category];
      setFromUnit(active.units[0]);
      setToUnit(active.units[1]);
    }, [category]);

    useEffect(() => {
      const val = categories[category].convert(inputValue, fromUnit, toUnit);
      setConverted(val);
    }, [inputValue, fromUnit, toUnit, category]);

    return (
      <div id="unit-converter-widget" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat as any)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition ${
                category === cat ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* From input */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-850">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">From Value</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(Number(e.target.value))}
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 font-mono text-sm rounded-lg px-3 py-2 focus:outline-none"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
              >
                {categories[category].units.map((u) => (
                  <option key={u} value={u}>
                    {((categories[category].labels) as any)[u]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* To input */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-850">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Converted Result</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={converted.toFixed(6).replace(/\.?0+$/, '')}
                className="flex-1 bg-slate-900 border border-slate-700 text-blue-300 font-mono text-sm font-semibold rounded-lg px-3 py-2 focus:outline-none"
              />
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
              >
                {categories[category].units.map((u) => (
                  <option key={u} value={u}>
                    {((categories[category].labels) as any)[u]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 8. VISUAL COLOR PICKER =================
  function ColorPickerWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [hex, setHex] = useState('#2563eb');
    const [presetColors, setPresetColors] = useState([
      '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ffffff', '#000000'
    ]);

    // Parse HEX to RGB
    const getRGB = (hexVal: string) => {
      let r = 0, g = 0, b = 0;
      if (hexVal.length === 7) {
        r = parseInt(hexVal.substring(1, 3), 16);
        g = parseInt(hexVal.substring(3, 5), 16);
        b = parseInt(hexVal.substring(5, 7), 16);
      }
      return { r, g, b };
    };

    const rgb = getRGB(hex);

    // WCAG contrast calculation (luminance)
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    const contrastRatioWithWhite = (luminance + 0.05) / (1.0 + 0.05); // white is 1
    const contrastRatioWithBlack = (0.0 + 0.05) / (luminance + 0.05); // black is 0
    const bestTextColor = luminance > 0.179 ? 'text-black' : 'text-white';

    return (
      <div id="color-picker-widget" className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pick Visual Shade</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="w-14 h-14 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden"
              />
              <div className="flex-1 space-y-1">
                <span className="block text-xs font-semibold text-slate-300">Active HEX Code</span>
                <input
                  type="text"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 font-mono text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preset Web Palette Swatches</label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setHex(color)}
                  className={`w-7 h-7 rounded-full border border-slate-700 focus:outline-none transition transform hover:scale-110 ${
                    hex === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium font-mono">RGB Code</span>
              <span className="text-slate-200 font-bold font-mono">rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium font-mono">Luminance</span>
              <span className="text-slate-200 font-bold font-mono">{luminance.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2.5">
              <span className="text-slate-400 font-medium">Text Accessibility (White)</span>
              <span className={`font-bold ${Math.abs(contrastRatioWithWhite) > 4.5 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(contrastRatioWithWhite).toFixed(1)}:1 {Math.abs(contrastRatioWithWhite) > 4.5 ? '✓ Pass' : '✗ Fail'}
              </span>
            </div>
          </div>

          <div
            className={`w-full py-4 rounded-lg text-center font-bold text-sm transition-colors border shadow-inner flex items-center justify-center`}
            style={{ backgroundColor: hex, color: luminance > 0.179 ? '#111827' : '#f9fafb', borderColor: hex }}
          >
            AA Readable Visual Frame
          </div>
        </div>
      </div>
    );
  }

  // ================= 9. SEO TAGS & TITLE OPTIMIZER =================
  function SEOTagsWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [title, setTitle] = useState('AI Super Tools Hub - Best Productivity Portal');
    const [desc, setDesc] = useState('Explore over 100 high-performance AI tools including multi-turn AI Chat, Resume outlines, PDF summaries, Speech recognizers, and QR utilities.');
    const [slug, setSlug] = useState('ai-super-tools-hub');

    const metaTags = `<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">`;

    return (
      <div id="seo-tags-widget" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                <span>SEO Meta Title</span>
                <span className={`${title.length >= 50 && title.length <= 60 ? 'text-green-400' : 'text-amber-400'}`}>
                  {title.length} / 60 chars
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                <span>SEO Meta Description</span>
                <span className={`${desc.length >= 120 && desc.length <= 160 ? 'text-green-400' : 'text-amber-400'}`}>
                  {desc.length} / 160 chars
                </span>
              </div>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 focus:outline-none resize-none font-sans"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Google Search Result (SERP) Preview</span>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-left">
                <span className="text-[11px] text-[#202124] block truncate font-sans">
                  https://www.aisupertoolshub.com <span className="text-slate-400">› {slug}</span>
                </span>
                <span className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-sans leading-tight font-medium mt-1 block truncate">
                  {title}
                </span>
                <p className="text-xs text-[#4d5156] font-sans leading-relaxed mt-1 line-clamp-2">
                  {desc}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopy(metaTags)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'HTML Tags Copied!' : 'Copy Head Meta HTML Tags'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 10. CALCULATOR SUITE =================
  function CalculatorSuiteWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [calcType, setCalcType] = useState<'scientific' | 'financial' | 'health'>(
      tool.id === 'scientific-calc' ? 'scientific' : tool.id === 'financial-calc' ? 'financial' : 'health'
    );

    // scientific state
    const [calcExpression, setCalcExpression] = useState('');
    const [calcResult, setCalcResult] = useState('');

    const handlePressCalc = (char: string) => {
      if (char === 'C') {
        setCalcExpression('');
        setCalcResult('');
      } else if (char === '⌫') {
        setCalcExpression(calcExpression.slice(0, -1));
      } else if (char === '=') {
        try {
          // simple clean safety replacement
          let sanitized = calcExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/π/g, 'Math.PI')
            .replace(/log\(/g, 'Math.log10(');
          const evalResult = eval(sanitized);
          setCalcResult(String(evalResult));
        } catch (err) {
          setCalcResult('Eval Error');
        }
      } else {
        setCalcExpression(calcExpression + char);
      }
    };

    // financial state
    const [principal, setPrincipal] = useState(10000);
    const [monthly, setMonthly] = useState(200);
    const [annualRate, setAnnualRate] = useState(8);
    const [years, setYears] = useState(10);
    const [totalValue, setTotalValue] = useState(0);
    const [totalContribution, setTotalContribution] = useState(0);

    useEffect(() => {
      let accumulated = principal;
      const ratePerMonth = (annualRate / 100) / 12;
      const months = years * 12;
      for (let i = 0; i < months; i++) {
        accumulated = (accumulated + monthly) * (1 + ratePerMonth);
      }
      setTotalValue(accumulated);
      setTotalContribution(principal + (monthly * months));
    }, [principal, monthly, annualRate, years]);

    // health state
    const [height, setHeight] = useState(175); // cm
    const [weight, setWeight] = useState(70); // kg
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [bmi, setBmi] = useState(22.9);
    const [bmiCategory, setBmiCategory] = useState('Normal weight');

    useEffect(() => {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi);

      if (calculatedBmi < 18.5) {
        setBmiCategory('Underweight');
      } else if (calculatedBmi < 25) {
        setBmiCategory('Normal weight');
      } else if (calculatedBmi < 30) {
        setBmiCategory('Overweight');
      } else {
        setBmiCategory('Obese');
      }
    }, [height, weight]);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
        {/* Toggle bar */}
        <div className="flex gap-2 border-b border-slate-850 pb-3 justify-center">
          {[
            { id: 'scientific', label: 'Scientific Math', icon: Calculator },
            { id: 'financial', label: 'Financial Compounder', icon: DollarSign },
            { id: 'health', label: 'Health & BMI Caloric', icon: Heart }
          ].map((mode) => {
            const IconComponent = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setCalcType(mode.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  calcType === mode.id ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. SCIENTIFIC CALCULATOR */}
        {calcType === 'scientific' && (
          <div className="max-w-xs mx-auto space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="bg-slate-900 p-3 rounded text-right font-mono space-y-1.5 border border-slate-800">
              <div className="text-xs text-slate-500 overflow-x-auto truncate">{calcExpression || '0'}</div>
              <div className="text-lg font-bold text-blue-400 overflow-x-auto truncate">{calcResult || '0'}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {['sin(', 'cos(', 'tan(', '⌫', 'C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'π', '='].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handlePressCalc(btn)}
                  className={`py-2 text-xs font-bold rounded transition ${
                    btn === '=' 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white col-span-1' 
                      : btn === 'C' || btn === '⌫' 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. FINANCIAL COMPOUNDER */}
        {calcType === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3.5 bg-slate-950 p-4 rounded-lg border border-slate-850">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Starting Principal ($)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono rounded-lg p-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Deposit ($)</label>
                <input
                  type="number"
                  value={monthly}
                  onChange={(e) => setMonthly(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono rounded-lg p-2 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Annual Rate (%)</label>
                  <input
                    type="number"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-4 flex flex-col justify-center">
              <div className="text-center">
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-semibold">Total Accumulated Future Value</span>
                <span className="text-2xl font-black text-green-400 font-mono">${Math.round(totalValue).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center border-t border-slate-900 pt-3">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Your Contributions</span>
                  <span className="font-mono text-xs font-bold text-slate-300">${Math.round(totalContribution).toLocaleString()}</span>
                </div>
                <div className="border-l border-slate-900">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Accrued Interest Gain</span>
                  <span className="font-mono text-xs font-bold text-blue-400">${Math.round(totalValue - totalContribution).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-10 flex items-end gap-1 px-4">
                {/* SVG-based mini indicator blocks for visual hierarchy */}
                <div className="flex-1 bg-blue-500/20 rounded-t h-[40%]" title="Contributions" />
                <div className="flex-1 bg-green-500/20 rounded-t h-[100%]" title="Total Accumulated" />
              </div>
            </div>
          </div>
        )}

        {/* 3. HEALTH & BMI */}
        {calcType === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3.5 bg-slate-950 p-4 rounded-lg border border-slate-850">
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={gender === 'male'}
                    onChange={() => setGender('male')}
                    className="text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-800"
                  />
                  <span>Male</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={gender === 'female'}
                    onChange={() => setGender('female')}
                    className="text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-800"
                  />
                  <span>Female</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-4 text-center flex flex-col justify-center">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Your Calculated BMI</span>
                <span className="text-3xl font-black text-blue-400 font-mono">{bmi.toFixed(1)}</span>
                <span className="block text-xs text-slate-400 mt-1">Status: <span className="text-slate-200 font-bold">{bmiCategory}</span></span>
              </div>
              <div className="border-t border-slate-900 pt-3">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Daily Maintenance Energy (TDEE Est.)</span>
                <span className="font-mono text-sm font-bold text-green-400">
                  {gender === 'male' ? Math.round(10 * weight + 6.25 * height - 5 * 25 + 5) : Math.round(10 * weight + 6.25 * height - 5 * 25 - 161)} kcal / day
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 11. TEXT-TO-SPEECH SYNTHESIZER =================
  // ================= 11. TEXT-TO-SPEECH SYNTHESIZER =================
  function TextToSpeechWidget(props: WidgetProps) {
    const { lang, onAddHistory, theme = 'dark' } = props;
    const t = TRANSLATIONS[lang];
    const [ttsText, setTtsText] = useState('Welcome to the AI Super Tools Hub. Over 100 high-performance tools are at your disposal.');
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [volume, setVolume] = useState(1);
    const [speaking, setSpeaking] = useState(false);
    const [paused, setPaused] = useState(false);
    
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

    // Fetch Speech Synthesis Voices
    useEffect(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const updateVoices = () => {
          const allVoices = window.speechSynthesis.getVoices();
          setVoices(allVoices);
          if (allVoices.length > 0) {
            // Pick a matching voice for current app language if possible, else English
            const matching = allVoices.find(v => v.lang.startsWith(lang)) || 
                             allVoices.find(v => v.lang.startsWith('en')) || 
                             allVoices[0];
            setSelectedVoiceName(matching.name);
          }
        };
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
        return () => {
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    }, [lang]);

    const handleSpeak = () => {
      if (!window.speechSynthesis) {
        alert('Speech Synthesis API is not supported in this browser.');
        return;
      }
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      const selectedVoice = voices.find(v => v.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
      };
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        onAddHistory(
          { text: ttsText, voice: selectedVoiceName, rate, pitch, volume }, 
          `Spoke Text: "${ttsText}" | Voice: ${selectedVoiceName || 'Default'}`
        );
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
      };
      
      window.speechSynthesis.speak(utterance);
    };

    const handlePause = () => {
      if (window.speechSynthesis && speaking && !paused) {
        window.speechSynthesis.pause();
        setPaused(true);
      }
    };

    const handleResume = () => {
      if (window.speechSynthesis && paused) {
        window.speechSynthesis.resume();
        setPaused(false);
      }
    };

    const handleStop = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        setPaused(false);
      }
    };

    const presetTemplates = [
      { 
        label: lang === 'gu' ? 'આવકાર સંદેશ (ગુજરાતી)' : 'Welcome Greeting', 
        text: lang === 'gu' 
          ? 'એ આઈ સુપર ટુલ્સ હબમાં તમારું હાર્દિક સ્વાગત છે. તમારા માટે ઉત્કૃષ્ટ સાધનો હાજર છે.' 
          : 'Welcome to the AI Super Tools Hub. Your supreme multi-threaded AI processing utilities are fully active.'
      },
      { 
        label: lang === 'gu' ? 'સિસ્ટમ ટેલીમેટ્રી ડેટા' : 'System Telemetry', 
        text: 'Telemetry check: Core node clusters successfully bound. Latency 14 milliseconds. All 100 cognitive operations are fully operational.'
      },
      { 
        label: lang === 'gu' ? 'પ્રેરણાત્મક વાક્યો' : 'Daily Affirmation', 
        text: lang === 'gu'
          ? 'આજનો દિવસ શ્રેષ્ઠ છે અને સફળતા તમારી રાહ જોઈ રહી છે. તમારા કાર્યો પૂરા ઉત્સાહથી શરૂ કરો.'
          : 'Focus fully on your creative targets today. Precision, clarity, and consistency will build outstanding results.'
      }
    ];

    const isDark = theme === 'dark';

    return (
      <div id="tts-widget" className={`border rounded-2xl p-5 shadow-xl space-y-5 text-left transition-colors duration-300 ${
        isDark ? 'bg-[#090d16] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Title or Header */}
        <div className="flex items-center gap-2 border-b pb-3 border-slate-900/40">
          <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {lang === 'gu' ? 'સ્પીચ રીડર અને વોઈસ સિંથેસાઇઝર' : 'Speech Reader & Voice Synthesizer'}
          </span>
        </div>

        {/* Text Input area */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {lang === 'gu' ? 'વાંચવા માટેનું લખાણ લખો:' : 'Input Text for Reader:'}
          </label>
          <textarea
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            rows={4}
            className={`w-full text-sm rounded-xl p-3.5 focus:outline-none resize-none font-sans border transition ${
              isDark 
                ? 'bg-[#030712] border-slate-800 text-slate-200 focus:border-blue-500/50' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500/50'
            }`}
          />
        </div>

        {/* Preset Templates Row */}
        <div className="space-y-2">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {lang === 'gu' ? 'ઝડપી નમૂનાઓ લોડ કરો:' : 'Quick templates:'}
          </span>
          <div className="flex flex-wrap gap-2">
            {presetTemplates.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => setTtsText(tmpl.text)}
                className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg border transition ${
                  isDark 
                    ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-850 text-slate-300 hover:text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4 border-slate-900/40">
          
          {/* Voice Selector dropdown */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'gu' ? 'પસંદ કરેલ અવાજ (Voice):' : 'Speech Synthesis Voice:'}
            </label>
            <select
              value={selectedVoiceName}
              onChange={(e) => setSelectedVoiceName(e.target.value)}
              className={`w-full text-xs rounded-xl p-2.5 focus:outline-none border font-semibold ${
                isDark 
                  ? 'bg-[#030712] border-slate-800 text-slate-300' 
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {voices.length === 0 ? (
                <option value="">{lang === 'gu' ? 'સિસ્ટમ ડિફોલ્ટ અવાજ' : 'Default System Voice'}</option>
              ) : (
                voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang}) {voice.localService ? '[Local]' : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Speed slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
              <span>{lang === 'gu' ? 'ઝડપ દર' : 'Speed Rate'}</span>
              <span className="text-blue-500 font-mono font-black">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Pitch slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
              <span>{lang === 'gu' ? 'અવાજનો સૂર' : 'Pitch'}</span>
              <span className="text-blue-500 font-mono font-black">{pitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Volume slider */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">
              <span>{lang === 'gu' ? 'અવાજનું પ્રમાણ' : 'Volume'}</span>
              <span className="text-blue-500 font-mono font-black">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Action Controls panel */}
        <div className="flex flex-wrap gap-2.5">
          {/* Main Play or Resume Button */}
          {!speaking && !paused ? (
            <button
              onClick={handleSpeak}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/10 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{lang === 'gu' ? 'લખાણ સાંભળો' : 'Speak Text'}</span>
            </button>
          ) : paused ? (
            <button
              onClick={handleResume}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{lang === 'gu' ? 'ફરી શરૂ કરો' : 'Resume Speech'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95 animate-pulse"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>{lang === 'gu' ? 'અટકાવો (Pause)' : 'Pause Speech'}</span>
            </button>
          )}

          {/* Stop Button */}
          {(speaking || paused) && (
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-500 text-white border border-transparent px-5 rounded-xl flex items-center justify-center transition-all duration-150 shadow-md active:scale-95"
              title="Stop Speech"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ================= 12. SPEECH-TO-TEXT TRANSCRIBER =================
  function SpeechToTextWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState('Spoken words transcribing live in real-time here. Speak clearly into the microphone.');
    const recognitionRef = useRef<any>(null);

    const handleRecord = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported natively in this frame sandbox. Ensure mic permissions are granted.');
        return;
      }

      if (recording) {
        recognitionRef.current?.stop();
        setRecording(false);
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setRecording(true);
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      rec.onerror = (err: any) => {
        console.error(err);
        setRecording(false);
      };

      rec.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    };

    return (
      <div id="stt-widget" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Voice Transcription</span>
          <button
            onClick={handleRecord}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
              recording 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{recording ? 'Recording: Click to Stop' : 'Start Microphone Recognition'}</span>
          </button>
        </div>

        <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg min-h-[140px] text-sm text-slate-300 font-sans leading-relaxed">
          {transcript}
        </div>
      </div>
    );
  }

  // ================= 13. SMART IMAGE COMPRESSOR =================
  function ImageCompressorWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const [rawFile, setRawFile] = useState<File | null>(null);
    const [originalSize, setOriginalSize] = useState(0);
    const [compressedSize, setCompressedSize] = useState(0);
    const [quality, setQuality] = useState(0.7); // 70% quality
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    const [compressedPreview, setCompressedPreview] = useState<string | null>(null);

    const handleUploadImg = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setRawFile(file);
        setOriginalSize(file.size);
        const url = URL.createObjectURL(file);
        setOriginalPreview(url);
      }
    };

    const handleCompress = () => {
      if (!originalPreview) return;
      setLoading(true);

      const img = new Image();
      img.src = originalPreview;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Maintain dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Compress
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCompressedSize(blob.size);
              const compressedUrl = URL.createObjectURL(blob);
              setCompressedPreview(compressedUrl);
            }
            setLoading(false);
          },
          'image/jpeg',
          quality
        );
      };
    };

    useEffect(() => {
      if (originalPreview) {
        handleCompress();
      }
    }, [quality, originalPreview]);

    const downloadCompressed = () => {
      if (!compressedPreview) return;
      const link = document.createElement('a');
      link.href = compressedPreview;
      link.download = `compressed-${rawFile?.name || 'image.jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div id="image-compressor-widget" className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="space-y-4">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Upload Visual Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadImg}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Target Quality Compression</span>
              <span className="font-mono text-blue-400">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {compressedPreview && (
            <button
              onClick={downloadCompressed}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Download Compressed JPEG ({Math.round(compressedSize / 1024)} KB)</span>
            </button>
          )}
        </div>

        <div className="bg-slate-950 rounded-lg p-4 border border-slate-850 flex flex-col justify-center items-center text-center space-y-4">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Original Size</span>
              <span className="font-mono text-xs font-bold text-slate-300">
                {originalSize ? `${Math.round(originalSize / 1024)} KB` : 'No file'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Compressed Size</span>
              <span className="font-mono text-xs font-bold text-green-400">
                {compressedSize ? `${Math.round(compressedSize / 1024)} KB` : 'No file'}
              </span>
            </div>
          </div>

          {compressedPreview ? (
            <img src={compressedPreview} alt="Compressed preview" className="max-h-44 object-contain rounded border border-slate-800" />
          ) : (
            <div className="w-full py-12 text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-lg">
              Compress preview loads here
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= GENERAL / AI GENERATOR FALLBACK =================
  // Used for any other tool - automatically generates inputs dynamically based on tool properties
  function GenericAIWidget({
    tool,
    lang,
    onAddHistory,
    savedNotes,
    onSaveNotes,
    userTier,
    onUseCredit
  }: WidgetProps) {
    const t = TRANSLATIONS[lang];
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [output, setOutput] = useState('');

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const [genericInputs, setGenericInputs] = useState<Record<string, any>>({});

  const handleRunGenericAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!onUseCredit()) return;

    setLoading(true);
    setOutput('');

    // Construct prompt string from inputs
    let promptString = `Generate optimized ${tool.name}.\n`;
    Object.entries(genericInputs).forEach(([key, value]) => {
      const inputMeta = tool.inputs?.find(inp => inp.key === key);
      promptString += `- ${inputMeta?.label || key}: ${value}\n`;
    });

    try {
      const response = await fetch('/api/tools/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptString, 
          systemInstruction: tool.systemInstruction || `You are an expert ${tool.name}. Produce excellent, professional results. Format results beautifully using clear Markdown, lists, and spacing.` 
        }),
      });

      if (response.status === 429) {
        const errData = await response.json();
        throw new Error(errData.message || "Rate Limit Reached");
      }

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) {
        throw new Error("Could not initialize stream reader");
      }

      let accumulated = '';
      let fullOutputText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() || ''; // Keep the incomplete line in the buffer

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                fullOutputText += data.text;
                setOutput(fullOutputText);
              }
            } catch (parseErr) {
              // Ignore incomplete JSON chunks gracefully
            }
          }
        }
      }

      onAddHistory(genericInputs, fullOutputText);
    } catch (err: any) {
      setOutput(`AI generator error: ${err.message || 'Failed to complete generation. Please retry.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="generic-ai-widget" className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Inputs panel */}
      <form onSubmit={handleRunGenericAI} className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">{tool.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{tool.description}</p>
          </div>

          <div className="space-y-3 pt-2">
            {tool.inputs?.map((input) => (
              <div key={input.key}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {input.label}
                </label>
                {input.type === 'textarea' ? (
                  <textarea
                    required
                    rows={4}
                    value={genericInputs[input.key] || ''}
                    onChange={(e) => setGenericInputs({ ...genericInputs, [input.key]: e.target.value })}
                    placeholder={input.placeholder || 'Provide details here...'}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none"
                  />
                ) : input.type === 'select' ? (
                  <select
                    value={genericInputs[input.key] || input.defaultValue || ''}
                    onChange={(e) => setGenericInputs({ ...genericInputs, [input.key]: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none"
                  >
                    {input.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type={input.type}
                    value={genericInputs[input.key] || ''}
                    onChange={(e) => setGenericInputs({ ...genericInputs, [input.key]: e.target.value })}
                    placeholder={input.placeholder || ''}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none"
                  />
                )}
              </div>
            )) || (
              <div className="bg-slate-950 p-3 rounded text-center border border-slate-850">
                <span className="text-xs text-slate-400 italic">No variables required. Ready to launch with standard configurations.</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-45 text-white font-semibold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? t.generating : t.runTool}</span>
        </button>
      </form>

      {/* Output Panel */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between h-[450px]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.outputLabel}</span>
          {output && (
            <button
              onClick={() => handleCopy(output)}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copied : t.copyBtn}</span>
            </button>
          )}
        </div>

        <div className="flex-1 bg-slate-950 border border-slate-805 rounded-lg p-4 font-sans text-sm text-slate-300 overflow-y-auto">
          {loading ? (
            <div className="space-y-3.5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-1/4"></div>
              <div className="h-3.5 bg-slate-800 rounded w-full"></div>
              <div className="h-3.5 bg-slate-800 rounded w-5/6"></div>
              <div className="h-3.5 bg-slate-800 rounded w-11/12"></div>
              <div className="h-3.5 bg-slate-800 rounded w-4/5"></div>
            </div>
          ) : output ? (
            <CodeHighlightedText text={output} />
          ) : (
            <p className="text-slate-500 text-xs italic text-center mt-20">Fill variables and launch generation to see AI response details.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Customized camera icon replacement for OCR widget
function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

// ================= 14. UPI INVOICE & BUDGET TRACKER =================
function UPIInvoiceWidget({
  tool,
  lang,
  onAddHistory,
  savedNotes,
  onSaveNotes,
  userTier,
  onUseCredit
}: WidgetProps) {
  const isGu = lang === 'gu';
  const isHi = lang === 'hi';

  const [budget, setBudget] = useState<number>(() => {
    return Number(localStorage.getItem('hub_daily_budget')) || 1000;
  });
  const [expenses, setExpenses] = useState<{ id: string; category: string; amount: number; desc: string }[]>(() => {
    const saved = localStorage.getItem('hub_expenses');
    return saved ? JSON.parse(saved) : [
      { id: '1', category: 'Food', amount: 120, desc: 'Lunch at office' },
      { id: '2', category: 'Fuel', amount: 250, desc: 'Petrol' },
      { id: '3', category: 'Entertainment', amount: 80, desc: 'Evening snacks' }
    ];
  });
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Food');

  const [upiId, setUpiId] = useState<string>(() => {
    return localStorage.getItem('hub_upi_id') || '9328951054@fam';
  });
  const [payeeName, setPayeeName] = useState<string>('Arvind Bhai');
  const [requestAmount, setRequestAmount] = useState<string>('250');
  const [paymentNote, setPaymentNote] = useState<string>('Shared Expenses');

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('hub_daily_budget', budget.toString());
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('hub_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget - totalSpent;
  const spentPercent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0 || !expenseDesc.trim()) return;
    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      category: expenseCategory,
      amount: amt,
      desc: expenseDesc.trim()
    }]);
    setExpenseAmount('');
    setExpenseDesc('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleGetAIAdvice = async () => {
    if (!onUseCredit()) return;
    setAiLoading(true);
    setAiAdvice('');
    try {
      const expSummary = expenses.map(e => `${e.category}: ₹${e.amount} (${e.desc})`).join(', ');
      const systemPrompt = "You are an intelligent, witty personal finance manager in India. Analyze the user's spending habits against their budget. Offer 3 direct, practical, and punchy suggestions using Indian rupee figures and micro-saving hacks. Keep the output strictly in the language requested.";
      const userPrompt = `Language: ${lang}. Daily Budget: ₹${budget}. Total Spent: ₹${totalSpent}. Remaining: ₹${remaining}. Spending Items: ${expSummary}. Give me an expert micro audit.`;

      const response = await fetch('/api/tools/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          systemInstruction: systemPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) {
        throw new Error("Could not initialize stream reader");
      }

      let accumulated = '';
      let fullOutput = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.text) {
                fullOutput += data.text;
                setAiAdvice(fullOutput);
              }
            } catch (e) {
              // Ignore incomplete JSON chunks gracefully
            }
          }
        }
      }

      onAddHistory({ budget, totalSpent, remaining, expenses: expSummary }, fullOutput);
    } catch (err: any) {
      setAiAdvice(`Error fetching advice: ${err.message || 'Please try again.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${requestAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  const copyUPILink = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850 text-left">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            {isGu ? "દૈનિક બજેટ" : isHi ? "दैनिक बजट" : "Daily Budget Limit"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-black text-white">₹{budget}</span>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            {isGu ? "કુલ ખર્ચ" : isHi ? "कुल खर्च" : "Total Expended"}
          </span>
          <p className="text-xl font-mono font-black text-rose-400">₹{totalSpent}</p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            {isGu ? "બાકી રકમ" : isHi ? "शेष राशि" : "Remaining Balance"}
          </span>
          <p className={`text-xl font-mono font-black ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            ₹{remaining}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-left">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>{isGu ? "બજેટ વપરાશ ટકાવારી" : isHi ? "बजट उपयोग" : "Budget Usage Tracker"}</span>
          <span>{spentPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-850 p-0.5">
          <div
            style={{ width: `${spentPercent}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              spentPercent > 90 ? 'bg-rose-500' : spentPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <Sliders className="w-4 h-4 text-rose-400" />
            <span>{isGu ? "દૈનિક ખર્ચ નોંધણી" : isHi ? "खर्च प्रविष्टि" : "Record Daily Expense"}</span>
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isGu ? "રકમ (₹)" : "Amount"}</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2 text-white font-mono focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isGu ? "કેટેગરી" : "Category"}</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2 text-white focus:border-rose-500 focus:outline-none"
                >
                  <option value="Food">{isGu ? "ખોરાક" : "Food"}</option>
                  <option value="Fuel">{isGu ? "ઇંધણ" : "Fuel"}</option>
                  <option value="Bills">{isGu ? "બિલ" : "Bills"}</option>
                  <option value="Entertainment">{isGu ? "મનોરંજન" : "Entertainment"}</option>
                  <option value="Rent">{isGu ? "ભાડું" : "Rent"}</option>
                  <option value="Others">{isGu ? "અન્ય" : "Others"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{isGu ? "વિગત / વર્ણન" : "Description"}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isGu ? "દા.ત. ટી અને નાસ્તો" : "e.g. Tea and snacks"}
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg text-xs p-2 text-white focus:border-rose-500 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 rounded-lg transition"
                >
                  {isGu ? "ઉમેરો" : "Add"}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase text-left">{isGu ? "આજના ખર્ચની યાદી" : "Recorded Items"}</span>
            {expenses.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-4 text-center">{isGu ? "હજુ સુધી કોઈ ખર્ચ ઉમેરાયો નથી." : "No expenses recorded yet."}</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center bg-slate-900/80 border border-slate-850 p-2.5 rounded-lg text-xs">
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                        {exp.category}
                      </span>
                      <span className="font-semibold text-white">{exp.desc}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-rose-400">₹{exp.amount}</span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-4 text-left">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span>{isGu ? "કસ્ટમ UPI ઇનવોઇસ અને QR મેકર" : isHi ? "UPI चालान और QR" : "UPI Request Invoice & QR Maker"}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isGu ? "વેપારી UPI ID" : "Payee UPI ID"}</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    localStorage.setItem('hub_upi_id', e.target.value);
                  }}
                  placeholder="9328951054@fam"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isGu ? "પ્રાપ્તકર્તાનું નામ" : "Payee Name"}</label>
                <input
                  type="text"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="Arvind Bhai"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isGu ? "ચુકવણીની રકમ (₹)" : "Requested Amount (₹)"}</label>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="250"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{isGu ? "ચુકવણીની નોંધ" : "Payment Memo"}</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Dinner Split"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="relative bg-white p-2.5 rounded-lg shadow-inner overflow-hidden max-w-[140px] aspect-square flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code"
                  referrerPolicy="no-referrer"
                  className="w-full h-full select-none"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-black font-mono text-emerald-400 tracking-wider">
                  DYNAMIC UPI QR GENERATED
                </span>
                <span className="block text-[11px] font-bold text-white font-mono">
                  ₹{requestAmount || '0'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <button
                  onClick={copyUPILink}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-2 rounded-lg text-[10px] font-black border border-slate-750 flex items-center justify-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied Link!" : "Copy Payment URI"}</span>
                </button>

                <a
                  href={upiUrl}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-2 rounded-lg text-[10px] font-black text-center flex items-center justify-center gap-1 border border-blue-550 shadow-md shadow-blue-500/10 font-sans"
                >
                  <Send className="w-3 h-3" />
                  <span>{isGu ? "મોબાઈલથી ચુકવો" : "Pay via UPI App"}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isGu ? "એઆઈ કસ્ટમ બજેટ ઓડિટ અને સલાહ" : isHi ? "एआई व्यक्तिगत वित्तीय लेखापरीक्षा" : "AI Smart Budget Audit & Financial Health"}</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              {isGu 
                ? "જેમિની તમારા આજના કુલ ખર્ચ અને બાકી બજેટનું પૃથ્થકરણ કરી બચત કરવાની આઈડિયા અને રિવ્યુ આપશે."
                : "Get real-time insights, alert patterns, and personalized Indian savings tips based on your spending logs."}
            </p>
          </div>

          <button
            onClick={handleGetAIAdvice}
            disabled={aiLoading}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black text-xs py-2 px-4 rounded-xl transition shadow shadow-amber-500/10 shrink-0 flex items-center gap-1.5"
          >
            {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" /> : <Sparkles className="w-3.5 h-3.5 text-slate-950" />}
            <span>{isGu ? "ક્રેડિટ વાપરી ઓડિટ કરો" : isHi ? "वित्तीय ऑडिट प्राप्त करें" : "Audit Spending Patterns"}</span>
          </button>
        </div>

        {aiAdvice && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest pl-2">
              Gemini Financial Audit & Analysis
            </span>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line pl-2">
              {aiAdvice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ================= PREMIUM AI IMAGE PROMPT & CONCEPT MOCKUP STUDIO =================
function ImagePrompterWidget({
  tool,
  lang,
  onAddHistory,
  savedNotes,
  onSaveNotes,
  userTier,
  onUseCredit
}: WidgetProps) {
  const isGu = lang === 'gu';

  // State
  const [subject, setSubject] = useState(isGu ? 'સોનેરી પાંખોવાળો સફેદ ઘોડો આકાશમાં ઊડી રહ્યો છે' : 'Premium organic ceremonial matcha bowl resting on a wet dark slate stone, high end tea shop aesthetic');
  const [engine, setEngine] = useState<'midjourney' | 'dalle' | 'stablediffusion'>('midjourney');
  const [artStyle, setArtStyle] = useState('Photorealistic Cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [lighting, setLighting] = useState('Golden Hour Sunbeams');
  const [camera, setCamera] = useState('85mm Portrait DSLR, f/1.4');
  const [mood, setMood] = useState('Ethereal Epic Detail');
  const [negativePrompt, setNegativePrompt] = useState('text, blurry, crop, lowres, disfigured faces, duplicate, logo');
  const [loading, setLoading] = useState(false);
  const [aiEnhancedFeedback, setAiEnhancedFeedback] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);

  // Dynamic image generation grid
  const [generatedImages, setGeneratedImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
  ]);

  // Compile final engineered prompt dynamically
  useEffect(() => {
    let prefix = '';
    let suffix = '';

    if (engine === 'midjourney') {
      suffix = ` --ar ${aspectRatio} --v 6.0 --style raw --stylize 350`;
    } else if (engine === 'stablediffusion') {
      suffix = `, photorealistic 8k resolution, masterwork, masterpiece quality, volumetric rays, high details`;
      if (aspectRatio === '16:9') suffix += `, landscape orientation 16:9`;
      if (aspectRatio === '9:16') suffix += `, mobile format 9:16`;
    } else { // dalle
      prefix = `A premium, award-winning detailed photographic masterpiece depicting: `;
      suffix = `, perfect composition, 4k texture, unreal engine 5 render look, soft commercial lighting design, aspect ratio ${aspectRatio}.`;
    }

    const compiled = `${prefix}${subject}. Style: ${artStyle}, lit with ${lighting}, captured via ${camera}, conveying a ${mood} atmosphere. [Negative prompt filters: avoid ${negativePrompt}]${suffix}`;
    setOutputPrompt(compiled);
  }, [subject, engine, artStyle, aspectRatio, lighting, camera, mood, negativePrompt]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(outputPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: isGu ? `એઆઈ ઇમેજ પ્રોમ્પ્ટ: ${subject.slice(0, 20)}...` : `AI Prompt: ${subject.slice(0, 25)}...`,
      content: `Target Model: ${engine.toUpperCase()}\nEngineered Prompt:\n${outputPrompt}\n\nEnhanced tips: ${aiEnhancedFeedback || 'None'}`,
      updatedAt: Date.now()
    };
    onSaveNotes([newNote, ...savedNotes]);
  };

  const handleSynthesizeMockup = async () => {
    if (!subject.trim() || loading) return;
    if (!onUseCredit()) return;

    setLoading(true);
    setAiEnhancedFeedback('');

    try {
      // Call Gemini for prompt expansion details
      const response = await fetch('/api/tools/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Expand the following visual concept into an extremely descriptive, premium art piece explanation. Topic: "${subject}". Target engine: ${engine}. Style: ${artStyle}.\nWrite 2 short paragraphs outlining visual elements, camera settings, and composition structure to elevate this design.`,
          systemInstruction: 'You are a master digital artist, creative director, and elite AI prompt architect. Write exquisite, brief, highly cinematic detail expansions.'
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) {
        throw new Error("Could not initialize stream reader");
      }

      let accumulated = '';
      let fullOutput = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.text) {
                fullOutput += data.text;
                setAiEnhancedFeedback(fullOutput);
              }
            } catch (e) {
              // Ignore incomplete JSON chunks gracefully
            }
          }
        }
      }

      // Customize 4 beautiful Unsplash templates based on the subject's theme
      const normalizedSubject = subject.toLowerCase();
      let themeImages = [
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
      ];

      if (normalizedSubject.includes('matcha') || normalizedSubject.includes('tea') || normalizedSubject.includes('green') || normalizedSubject.includes('cup')) {
        themeImages = [
          'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=800&q=80'
        ];
      } else if (normalizedSubject.includes('horse') || normalizedSubject.includes('animal') || normalizedSubject.includes('sky') || normalizedSubject.includes('flying')) {
        themeImages = [
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80'
        ];
      } else if (normalizedSubject.includes('city') || normalizedSubject.includes('future') || normalizedSubject.includes('neon') || normalizedSubject.includes('cyberpunk')) {
        themeImages = [
          'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80'
        ];
      } else if (normalizedSubject.includes('room') || normalizedSubject.includes('interior') || normalizedSubject.includes('house') || normalizedSubject.includes('bed')) {
        themeImages = [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'
        ];
      }

      setGeneratedImages(themeImages);
      onAddHistory({ subject, engine, artStyle }, `[Engineered Prompt Compiled] Model: ${engine.toUpperCase()}. Concept: ${subject}`);
    } catch (err: any) {
      alert(err.message || 'Error executing AI Prompt model.');
    } finally {
      setLoading(false);
    }
  };

  const stylesPresets = [
    { name: 'Photorealistic Cinematic', label: isGu ? 'સિનેમેટિક ફોટોગ્રાફી' : 'Cinematic Photo', icon: '📸' },
    { name: '3D Isometric clay render', label: isGu ? '૩D ક્લે આર્ટ' : '3D Isometric clay', icon: '🧊' },
    { name: 'Watercolor Dreamscape', label: isGu ? 'વોટરકલર આર્ટ' : 'Watercolor dream', icon: '🎨' },
    { name: 'Cyberpunk Retro Neon', label: isGu ? 'રેટ્રો સાયબરપંક' : 'Cyberpunk neon', icon: '⚡' },
    { name: 'Minimalist Line Vector', label: isGu ? 'મિનિમલિસ્ટ વેક્ટર' : 'Minimalist vector', icon: '✒️' },
    { name: 'Surrealist Oil Painting', label: isGu ? 'ઓઇલ પેઇન્ટિંગ' : 'Oil Painting', icon: '🖌️' }
  ];

  const aspectPresets = [
    { ratio: '1:1', label: '1:1 Square' },
    { ratio: '16:9', label: '16:9 Landscape' },
    { ratio: '9:16', label: '9:16 Portrait' },
    { ratio: '4:3', label: '4:3 Standard' }
  ];

  const lightingPresets = [
    { name: 'Golden Hour Sunbeams', label: isGu ? 'ગોલ્ડન અવર સનલાઈટ' : 'Golden Hour sunbeams' },
    { name: 'Volumetric Studio Neon', label: isGu ? 'નિયોન સ્ટુડિયો લાઇટિંગ' : 'Volumetric neon' },
    { name: 'Warm Candlelight', label: isGu ? 'મીણબત્તીનો નરમ પ્રકાશ' : 'Warm Candlelight' },
    { name: 'Soft Diffuse Overcast', label: isGu ? 'ડિફ્યુઝ સોફ્ટ લાઇટ' : 'Soft Overcast' }
  ];

  return (
    <div className="space-y-6">
      {/* Upper Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
        
        {/* Left Interactive Builder controls - 3 columns span */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Target Engine Tab Capsule */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
              {isGu ? "૧. ટાર્ગેટ એઆઈ મોડેલ" : "1. Choose Target Image Engine"}
            </label>
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-900 flex gap-1">
              {(['midjourney', 'dalle', 'stablediffusion'] as const).map((eng) => (
                <button
                  key={eng}
                  onClick={() => setEngine(eng)}
                  className={`flex-1 text-center py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
                    engine === eng
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {eng === 'midjourney' ? 'Midjourney v6' : eng === 'dalle' ? 'DALL-E 3' : 'Stable Diffusion 3'}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Prompt input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
              {isGu ? "૨. વિષય અને કલ્પના દાખલ કરો" : "2. Visual Subject & Scene Concept"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isGu ? "દા.ત. આકાશમાં તરતું આધુનિક શહેર..." : "e.g. A futuristic glass tea flask sitting on mossy stones..."}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 pr-10 font-medium"
              />
              <button
                onClick={() => setSubject('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 font-bold text-xs"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Visual Presets Grid (Cards) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
              {isGu ? "૩. આર્ટ શૈલી પસંદ કરો" : "3. Artistic Style Preset"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {stylesPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setArtStyle(preset.name)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-20 ${
                    artStyle === preset.name
                      ? 'bg-blue-950/40 border-blue-500/80 shadow shadow-blue-500/10'
                      : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <span className="text-xl">{preset.icon}</span>
                  <span className="text-[10px] font-bold text-slate-200 tracking-tight block mt-1.5 leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Double controls: Aspect ratio & Lighting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                {isGu ? "૪. આસ્પેક્ટ રેશિયો" : "4. Aspect Ratio"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {aspectPresets.map((asp) => (
                  <button
                    key={asp.ratio}
                    onClick={() => setAspectRatio(asp.ratio)}
                    className={`py-2 text-[10px] font-bold uppercase border rounded-lg text-center transition ${
                      aspectRatio === asp.ratio
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {asp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                {isGu ? "૫. લાઇટિંગ અને પ્રભામંડળ" : "5. Ambient Lighting"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {lightingPresets.map((light) => (
                  <button
                    key={light.name}
                    onClick={() => setLighting(light.name)}
                    className={`py-2 px-1 text-[9px] font-bold border rounded-lg text-center truncate transition ${
                      lighting === light.name
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {light.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced prompt configurations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">{isGu ? "કેમેરા સેટિંગ્સ" : "DSLR Camera Configuration"}</label>
              <select
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg text-xs p-2 text-slate-300 focus:outline-none"
              >
                <option value="85mm Portrait DSLR, f/1.4">85mm Prime DSLR (f/1.4 Portrait)</option>
                <option value="24mm Wide-Angle Cine Lens, f/4">24mm Wide Angle Cinema Lens</option>
                <option value="Hasselblad Medium Format Macro">Hasselblad Macro (Extreme Texture)</option>
                <option value="Retro 35mm Analog Film Grain">Retro 35mm Analog Camera</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">{isGu ? "વાતાવરણ મૂડ" : "Aesthetic Atmosphere"}</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg text-xs p-2 text-slate-300 focus:outline-none"
              >
                <option value="Ethereal Epic Detail">Ethereal & Epic Details</option>
                <option value="Moody Somber Shadows">Moody & Mysterious Shadows</option>
                <option value="Crisp Corporate Tech Minimalist">Crisp Commercial Minimalist</option>
                <option value="Vibrant Retro Synthwave Glow">Vibrant High-Contrast Retro Synth</option>
              </select>
            </div>
          </div>

          {/* Negative Prompt Inputs */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">{isGu ? "નકારાત્મક ફિલ્ટર્સ (કઈ વસ્તુઓ ટાળવી)" : "Negative Prompt Filters (Items to avoid)"}</label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-lg text-xs p-2.5 text-slate-300 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Live Code Compiler Output Display - 2 columns span */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/80 border border-slate-900 p-5 rounded-2xl shadow-inner text-left space-y-4">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>{isGu ? "લાઇવ પ્રોમ્પ્ટ એન્જિનિયરિંગ" : "Live Prompt Compiler"}</span>
              </span>
              <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-850">
                ACTIVE
              </span>
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
              <div className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
                {outputPrompt}
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/5 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex gap-2">
              <button
                onClick={handleCopyPrompt}
                className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Prompt"}</span>
              </button>

              <button
                onClick={handleSaveToNotes}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                title="Save Prompt recipe to notes"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] uppercase font-black px-1">Notes</span>
              </button>
            </div>

            <button
              onClick={handleSynthesizeMockup}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-lg active:scale-95 shadow-blue-500/15"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{isGu ? "મોકઅપ જનરેટ થઈ રહ્યું છે..." : "Generating Premium Mockups..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  <span>{isGu ? "પ્રોમ્પ્ટ તૈયાર કરી એસેટ બનાવો" : "Architect Prompt & Synthesize"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Synthesis Output Mockup Image Grid Section */}
      <div className="bg-slate-950/60 border border-slate-900 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-left gap-2 border-b border-slate-900 pb-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>{isGu ? "મોકઅપ અને ડિઝાઇન એસેટ સ્ટુડિયો" : "Premium Generated Design Assets & Mockups"}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isGu ? "તમારા પ્રોમ્પ્ટ પર આધારિત ૪ હાઇ-રિઝોલ્યુશન એસેટ્સ મોકઅપ. ક્લિક કરી વિગતો મેળવો." : "Simulated ultra-quality outputs. Click any card to expand full description details and lightbox preview."}
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider">
            4-GRID TEMPLATES ACTIVE
          </span>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {generatedImages.map((imgSrc, idx) => (
            <div
              key={idx}
              onClick={() => setActiveImageIdx(idx)}
              className="group relative rounded-xl overflow-hidden aspect-square border border-slate-900 cursor-pointer hover:border-blue-500/80 transition-all duration-300"
            >
              <img
                src={imgSrc}
                alt={`Premium Asset Mockup ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 text-left">
                <span className="text-[9px] text-blue-400 font-mono font-bold">ASSET #{idx + 1}</span>
                <span className="text-[10px] text-white font-extrabold truncate">{subject}</span>
                <span className="text-[8px] text-slate-400 mt-1 uppercase font-black flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  View Lightbox
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Optional Gemini Assistant feedback text */}
        {aiEnhancedFeedback && (
          <div className="bg-slate-900/60 border border-slate-900 p-4 rounded-xl text-left space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full" />
            <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase block pl-1">
              Gemini Design Insights & Prompt Expansion
            </span>
            <div className="text-[11px] text-slate-300 leading-relaxed space-y-2 font-medium pl-1">
              {aiEnhancedFeedback}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {activeImageIdx !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#090d16] border border-slate-900 rounded-2xl max-w-2xl w-full relative overflow-hidden text-left flex flex-col md:flex-row h-[420px] md:h-[350px]">
            {/* Left side preview */}
            <div className="w-full md:w-1/2 h-48 md:h-full relative bg-black shrink-0">
              <img
                src={generatedImages[activeImageIdx]}
                alt="Expanded Asset Template"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveImageIdx(null)}
                className="absolute top-4 left-4 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 border border-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Right side information details */}
            <div className="w-full md:w-1/2 p-5 flex flex-col justify-between overflow-y-auto space-y-3.5">
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    Asset Analysis Spec
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">
                    ASSET #{activeImageIdx + 1}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white leading-snug">
                  {subject}
                </h4>
                
                <div className="space-y-1.5 text-[10px] font-semibold text-slate-400">
                  <p>• <span className="text-slate-300 font-bold">Style template:</span> {artStyle}</p>
                  <p>• <span className="text-slate-300 font-bold">Ambient Lighting:</span> {lighting}</p>
                  <p>• <span className="text-slate-300 font-bold">Dimensions:</span> {aspectRatio}</p>
                  <p>• <span className="text-slate-300 font-bold">Engine Preset:</span> {engine.toUpperCase()}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900/60 flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(outputPrompt);
                    alert('Copied specific prompt blueprint!');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-lg text-[10px] uppercase tracking-wide transition flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt Recipe</span>
                </button>
                <button
                  onClick={() => setActiveImageIdx(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-lg text-[10px] uppercase transition text-center"
                >
                  Close Specification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= CUSTOM CODE HIGHLIGHTING & MARKDOWN RENDERER =================
export function CodeHighlightedText({ text }: { text: string }) {
  if (!text) return null;
  // Split the text by ``` to identify code blocks and normal text blocks
  const parts = text.split(/```/g);
  
  return (
    <div className="space-y-3.5 w-full">
      {parts.map((part, index) => {
        const isCodeBlock = index % 2 === 1;
        if (isCodeBlock) {
          // The first line might specify the language (e.g. javascript, html, py)
          const lines = part.split('\n');
          let language = '';
          let codeLines = lines;
          if (lines[0] && /^[a-zA-Z0-9+#-]+$/.test(lines[0].trim())) {
            language = lines[0].trim();
            codeLines = lines.slice(1);
          }
          const codeContent = codeLines.join('\n');
          
          return (
            <div key={index} className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs text-slate-200 shadow-xl max-w-full">
              <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2 text-[10px] uppercase font-black text-slate-400 tracking-widest flex justify-between items-center select-none">
                <span>{language || 'code block'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeContent.trim())}
                  className="hover:text-blue-400 transition p-1 rounded hover:bg-slate-850 flex items-center gap-1 cursor-pointer"
                  title="Copy code"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="font-sans font-bold text-[9px] tracking-normal">Copy</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed select-all max-w-full font-mono text-slate-300 scrollbar-thin">
                {highlightCode(codeContent.trim(), language)}
              </pre>
            </div>
          );
        } else {
          // Render plain text or markdown-like headers, lists, etc.
          return <div key={index}>{renderMarkdownLines(part)}</div>;
        }
      })}
    </div>
  );
}

function highlightCode(code: string, language: string) {
  const tokenSpecs = [
    { type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/ },
    { type: 'string', regex: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/ },
    { type: 'number', regex: /\b(\d+(?:\.\d+)?)\b/ },
    { type: 'keyword', regex: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|import|export|from|class|extends|new|this|typeof|instanceof|try|catch|finally|throw|async|await|public|private|protected|static|readonly|interface|type|enum|as|def|fn|impl|struct|let|mut|pub|use|import|from|as|select|from|where|insert|into|update|set|delete|create|table|alter|index|and|or|not|in|is|lambda|pass|yield)\b/ },
    { type: 'builtin', regex: /\b(console|log|error|warn|info|window|document|process|global|require|module|exports|self|print|len|range|str|int|float|dict|list|set|tuple)\b/ },
    { type: 'function', regex: /\b([a-zA-Z0-9_$]+)(?=\s*\()/ },
    { type: 'punctuation', regex: /([{}()\[\];,.:])/ },
    { type: 'operator', regex: /([+\-*/%&|^!=<>~?]+)/ },
  ];

  // Combine specs into one regex
  const masterRegex = new RegExp(
    tokenSpecs.map(spec => `(${spec.regex.source})`).join('|'),
    'g'
  );

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = masterRegex.exec(code)) !== null) {
    // Add text preceding the match
    const prefix = code.slice(lastIndex, match.index);
    if (prefix) {
      elements.push(prefix);
    }

    // Determine which token group matched
    let found = false;
    for (let i = 0; i < tokenSpecs.length; i++) {
      const matchVal = match[i + 1];
      if (matchVal !== undefined) {
        const type = tokenSpecs[i].type;
        let className = '';
        if (type === 'comment') className = 'text-slate-500 italic';
        else if (type === 'string') className = 'text-emerald-400';
        else if (type === 'number') className = 'text-amber-400';
        else if (type === 'keyword') className = 'text-pink-400 font-semibold';
        else if (type === 'builtin') className = 'text-cyan-400 font-medium';
        else if (type === 'function') className = 'text-blue-400 font-medium';
        else if (type === 'punctuation') className = 'text-slate-400';
        else if (type === 'operator') className = 'text-amber-500/80';

        elements.push(<span key={match.index + '-' + i} className={className}>{matchVal}</span>);
        found = true;
        break;
      }
    }

    if (!found) {
      elements.push(match[0]);
    }
    lastIndex = masterRegex.lastIndex;
  }

  // Add remaining text
  const suffix = code.slice(lastIndex);
  if (suffix) {
    elements.push(suffix);
  }

  return <>{elements}</>;
}

function renderMarkdownLines(text: string) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-black text-slate-100 mt-4 mb-2 tracking-wide">{renderInlineStyles(line.slice(4))}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-black text-slate-50 mt-5 mb-2.5 tracking-wide border-b border-slate-800 pb-1">{renderInlineStyles(line.slice(3))}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-black text-slate-50 mt-6 mb-3 tracking-wide border-b border-slate-850 pb-1.5">{renderInlineStyles(line.slice(2))}</h2>;
        }
        // Bullet list
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const content = line.trim().substring(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
              <span className="text-blue-500 select-none mt-1.5 text-[6px] shrink-0">●</span>
              <span className="text-slate-300 leading-relaxed text-xs sm:text-sm font-semibold">{renderInlineStyles(content)}</span>
            </div>
          );
        }
        // Numbered list (e.g., "1. ")
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
              <span className="text-blue-500 select-none font-mono text-xs shrink-0">{numMatch[1]}.</span>
              <span className="text-slate-300 leading-relaxed text-xs sm:text-sm font-semibold">{renderInlineStyles(numMatch[2])}</span>
            </div>
          );
        }
        // Empty line
        if (!line.trim()) {
          return <div key={idx} className="h-1.5" />;
        }
        // Normal paragraph
        return <p key={idx} className="text-slate-300 leading-relaxed text-xs sm:text-sm font-semibold">{renderInlineStyles(line)}</p>;
      })}
    </div>
  );
}

function renderInlineStyles(text: string) {
  const parts: React.ReactNode[] = [];
  
  const codeSplit = text.split(/`/g);
  codeSplit.forEach((segment, i) => {
    const isInlineCode = i % 2 === 1;
    if (isInlineCode) {
      parts.push(
        <code key={'inline-code-' + i} className="bg-slate-950 px-1.5 py-0.5 rounded text-xs font-mono text-pink-400 border border-slate-800 font-bold">
          {segment}
        </code>
      );
    } else {
      // Parse bold elements inside this segment
      const boldSplit = segment.split(/\*\*/g);
      boldSplit.forEach((subSeg, j) => {
        const isBold = j % 2 === 1;
        if (isBold) {
          parts.push(<strong key={'bold-' + i + '-' + j} className="font-extrabold text-white">{subSeg}</strong>);
        } else {
          parts.push(subSeg);
        }
      });
    }
  });
  
  return <>{parts}</>;
}

