import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';
import { collection, getDocs, addDoc, updateDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { db, executeResilientDbOp } from '../firebase';

interface ToolItem {
  name: string;
  category: string;
  cost: number;
  logo: string;
}

interface StackPreset {
  id: string;
  title: string;
  desc: string;
  descGu: string;
  tools: ToolItem[];
  badge: string;
  upvotes: number;
  hoursSaved?: number;
}

interface BusinessAIStackPanelProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle' | 'achievement') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
}

export default function BusinessAIStackPanel({
  lang,
  theme,
  playSynthSound,
  addXPPoints
}: BusinessAIStackPanelProps) {
  const isGu = lang === 'gu';

  // Preset default stacks
  const defaultPresets: StackPreset[] = [
    {
      id: "startup",
      title: "Startup AI Stack",
      desc: "Supercharge your core business execution and product scaling from day one.",
      descGu: "પ્રારંભિક વ્યવસાયો અને ઉત્પાદન વેગ વધારવા માટેનું બુદ્ધિશાળી સોફ્ટવેર કલેક્શન.",
      badge: "High Growth",
      upvotes: 24,
      tools: [
        { name: "Notion AI", category: "Knowledge Base", cost: 10, logo: "📓" },
        { name: "Slack AI", category: "Collaboration", cost: 15, logo: "💬" },
        { name: "Claude Pro", category: "Thinking Engine", cost: 20, logo: "✍️" },
        { name: "Stripe Billing AI", category: "Revenue", cost: 0, logo: "💳" },
        { name: "Linear PM", category: "Task Track", cost: 12, logo: "⚙️" }
      ]
    },
    {
      id: "marketing",
      title: "Marketing Agency AI Stack",
      desc: "Produce ultra-high converting landing copies, newsletters, and creative ads.",
      descGu: "ઉચ્ચ રૂપાંતરણ ધરાવતી જાહેરાતો અને સુંદર ન્યૂઝલેટર બનાવવા માટેનું સેટઅપ.",
      badge: "Ultra Creative",
      upvotes: 45,
      tools: [
        { name: "Jasper AI", category: "Copywriting", cost: 39, logo: "📝" },
        { name: "Canva Pro", category: "Design Hub", cost: 13, logo: "🎨" },
        { name: "HubSpot AI", category: "CRM Automation", cost: 50, logo: "🤝" },
        { name: "ElevenLabs", category: "Voiceovers", cost: 5, logo: "🎙️" },
        { name: "Loom AI", category: "Video Pitch", cost: 10, logo: "📹" }
      ]
    },
    {
      id: "ecommerce",
      title: "E-Commerce AI Stack",
      desc: "Automate store listings, visual cleanups, product photography, and customer chat.",
      descGu: "પ્રોડક્ટ ફોટોગ્રાફી, લિસ્ટિંગ જનરેશન અને કસ્ટમર સપોર્ટ ઓટોમેશન.",
      badge: "Conversion Boost",
      upvotes: 38,
      tools: [
        { name: "Shopify Sidekick", category: "Store Admin", cost: 29, logo: "🛍️" },
        { name: "Photoroom Premium", category: "Product BG", cost: 9, logo: "🖼️" },
        { name: "Klaviyo AI", category: "Email Marketing", cost: 45, logo: "📧" },
        { name: "ChatGPT Support", category: "Customer Chat", cost: 20, logo: "🤖" },
        { name: "ManyChat", category: "Social Chatbot", cost: 15, logo: "💬" }
      ]
    },
    {
      id: "consulting",
      title: "Elite Consulting AI Stack",
      desc: "Produce premium executive summary slides, automated contracts, and notes logs.",
      descGu: "સુંદર પ્રેઝન્ટેશન, ઓટોમેટિક કોન્ટ્રાક્ટ અને પ્રોફેશનલ મીટિંગ મિનિટ્સ.",
      badge: "Elite Strategy",
      upvotes: 19,
      tools: [
        { name: "Beautiful.ai", category: "Presentation", cost: 12, logo: "📊" },
        { name: "Otter.ai Pro", category: "Meeting Transcriber", cost: 10, logo: "🎙️" },
        { name: "DocuSign AI", category: "Legal Contracts", cost: 25, logo: "📝" },
        { name: "ChatGPT Team", category: "Case Analysis", cost: 25, logo: "🧠" }
      ]
    }
  ];

  // States
  const [activeStackId, setActiveStackId] = useState<string>('startup');
  const [customStacks, setCustomStacks] = useState<StackPreset[]>(defaultPresets);
  const [editingStack, setEditingStack] = useState<StackPreset | null>(null);
  const [newToolName, setNewToolName] = useState('');
  const [newToolCategory, setNewToolCategory] = useState('');
  const [newToolCost, setNewToolCost] = useState('10');
  const [newToolLogo, setNewToolLogo] = useState('🛠️');

  // Blank stack form
  const [creationTitle, setCreationTitle] = useState('');
  const [creationDesc, setCreationDesc] = useState('');
  const [creationBadge, setCreationBadge] = useState('Custom Stack');

  // JSON Import/Export state
  const [showImportArea, setShowImportArea] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Fetch from Firestore
  useEffect(() => {
    async function loadFirestoreStacks() {
      try {
        await executeResilientDbOp(async (currentDb) => {
          const q = query(collection(currentDb, 'business_stacks'), orderBy('upvotes', 'desc'));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const list: StackPreset[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                title: data.title || '',
                desc: data.desc || '',
                descGu: data.descGu || '',
                tools: data.tools || [],
                badge: data.badge || '',
                upvotes: data.upvotes || 0,
                hoursSaved: data.hoursSaved || 0,
              });
            });

            // Combine defaults and loaded firestore ones (deduplicated by ID)
            const combined = [...defaultPresets];
            list.forEach(item => {
              const idx = combined.findIndex(c => c.id === item.id);
              if (idx > -1) {
                combined[idx] = item;
              } else {
                combined.unshift(item);
              }
            });
            setCustomStacks(combined);
          }
        });
      } catch (err) {
        console.warn("[Firestore] Loading business stacks failed, relying on localStorage fallback:", err);
        const saved = localStorage.getItem('hub_business_stacks');
        if (saved) {
          try {
            setCustomStacks(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    loadFirestoreStacks();
  }, []);

  const activeStack = customStacks.find(s => s.id === activeStackId) || customStacks[0];

  // Calculations
  const totalMonthlyCost = activeStack?.tools ? activeStack.tools.reduce((sum, t) => sum + t.cost, 0) : 0;
  
  // High-value productivity parameters based on category types
  const calculateAggregateStats = (preset: StackPreset) => {
    const toolCount = preset?.tools ? preset.tools.length : 0;
    const hrsSaved = preset?.tools ? preset.tools.reduce((sum, t) => {
      const cat = t.category.toLowerCase();
      if (cat.includes('thinking') || cat.includes('llm') || cat.includes('chat')) return sum + 12; // 12 hours saved/week
      if (cat.includes('copywriting') || cat.includes('marketing')) return sum + 10;
      if (cat.includes('design') || cat.includes('video') || cat.includes('audio')) return sum + 8;
      if (cat.includes('collaboration') || cat.includes('meeting')) return sum + 6;
      return sum + 5;
    }, 0) : 0;

    const multiplier = Math.min(5.0, 1.0 + (toolCount * 0.7));
    const automationLevel = Math.min(100, Math.round((toolCount * 18)));

    return {
      hoursSaved: hrsSaved,
      multiplier: multiplier.toFixed(1),
      automationLevel
    };
  };

  const { hoursSaved, multiplier, automationLevel } = calculateAggregateStats(activeStack);

  // Firestore & local persistence save wrapper
  const persistStack = async (updatedList: StackPreset[], itemToSave: StackPreset) => {
    setCustomStacks(updatedList);
    localStorage.setItem('hub_business_stacks', JSON.stringify(updatedList));

    try {
      await executeResilientDbOp(async (currentDb) => {
        const docRef = doc(currentDb, 'business_stacks', itemToSave.id);
        await setDoc(docRef, {
          id: itemToSave.id,
          title: itemToSave.title,
          desc: itemToSave.desc,
          descGu: itemToSave.descGu,
          tools: itemToSave.tools,
          badge: itemToSave.badge,
          upvotes: itemToSave.upvotes,
          hoursSaved: itemToSave.hoursSaved || 0,
          updatedAt: new Date().toISOString()
        });
      });
      console.log("[Firestore] Business Stack saved successfully:", itemToSave.title);
    } catch (e) {
      console.warn("[Firestore] Failed saving to Firestore, using local backup only:", e);
    }
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSynthSound('success');
    
    const updated = customStacks.map(s => {
      if (s.id === id) {
        const item = { ...s, upvotes: s.upvotes + 1 };
        persistStack(customStacks.map(x => x.id === id ? item : x), item);
        return item;
      }
      return s;
    });
    addXPPoints(5, `Upvoted stack!`, `સ્ટેકને અપવોટ કર્યો!`);
  };

  const startEditing = (stack: StackPreset) => {
    playSynthSound('click');
    setEditingStack(JSON.parse(JSON.stringify(stack)));
  };

  const saveEditedStack = () => {
    if (!editingStack) return;
    playSynthSound('achievement');
    const updatedList = customStacks.map(s => s.id === editingStack.id ? editingStack : s);
    persistStack(updatedList, editingStack);
    setEditingStack(null);
    addXPPoints(15, `Customized business stack saved!`, `કસ્ટમ વ્યાવસાયિક સ્ટેક સેવ કર્યો!`);
  };

  const removeToolFromEditing = (index: number) => {
    if (!editingStack) return;
    playSynthSound('toggle');
    const updatedTools = [...editingStack.tools];
    updatedTools.splice(index, 1);
    setEditingStack({ ...editingStack, tools: updatedTools });
  };

  const addToolToEditing = () => {
    if (!editingStack || !newToolName.trim()) return;
    playSynthSound('click');
    const newTool: ToolItem = {
      name: newToolName,
      category: newToolCategory || 'General Tool',
      cost: parseFloat(newToolCost) || 0,
      logo: newToolLogo || '🛠️'
    };
    setEditingStack({
      ...editingStack,
      tools: [...editingStack.tools, newTool]
    });
    setNewToolName('');
    setNewToolCategory('');
    setNewToolCost('10');
    setNewToolLogo('🛠️');
  };

  const createNewCustomStack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationTitle.trim()) return;
    playSynthSound('success');
    const newId = 'custom-' + Date.now();
    const newStack: StackPreset = {
      id: newId,
      title: creationTitle,
      desc: creationDesc || 'Custom tailormade business pipeline.',
      descGu: creationDesc || 'કસ્ટમ બનાવેલ બિઝનેસ સ્ટેક.',
      badge: creationBadge || 'Custom Stack',
      upvotes: 1,
      tools: [
        { name: "ChatGPT Pro", category: "Core AI", cost: 20, logo: "🤖" }
      ]
    };
    const updated = [newStack, ...customStacks];
    persistStack(updated, newStack);
    setActiveStackId(newId);
    setCreationTitle('');
    setCreationDesc('');
    setCreationBadge('Custom Stack');
    addXPPoints(20, `Created custom business stack!`, `નવો વ્યાવસાયિક સ્ટેક બનાવ્યો!`);
  };

  const deleteStack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSynthSound('toggle');
    setCustomStacks(prev => prev.filter(s => s.id !== id));
    localStorage.setItem('hub_business_stacks', JSON.stringify(customStacks.filter(s => s.id !== id)));
    if (activeStackId === id) {
      setActiveStackId('startup');
    }
  };

  // JSON Import & Export handlers
  const handleExportStack = () => {
    playSynthSound('success');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeStack, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeStack.title.toLowerCase().replace(/\s+/g, '_')}_stack.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addXPPoints(10, "Exported custom AI stack schema!", "એઆઈ સ્ટેક સ્કીમા એક્સપોર્ટ કરી!");
  };

  const handleImportStack = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.title || !Array.isArray(parsed.tools)) {
        throw new Error("Invalid structure. Must have a 'title' and 'tools' array.");
      }
      playSynthSound('achievement');
      const importedStack: StackPreset = {
        id: 'custom-imported-' + Date.now(),
        title: parsed.title,
        desc: parsed.desc || 'Imported workflow configuration.',
        descGu: parsed.descGu || parsed.desc || 'આયાત કરેલ સ્ટેક સેટઅપ.',
        badge: parsed.badge || 'Imported',
        tools: parsed.tools,
        upvotes: parsed.upvotes || 1
      };
      const updated = [importedStack, ...customStacks];
      persistStack(updated, importedStack);
      setActiveStackId(importedStack.id);
      setShowImportArea(false);
      setImportJsonText('');
      addXPPoints(15, "Imported external AI Stack structure successfully!", "એઆઈ સ્ટેક સફળતાપૂર્વક ઈમ્પોર્ટ કર્યો!");
    } catch (err: any) {
      playSynthSound('error');
      alert(`Import failed: ${err?.message || "Invalid JSON syntax"}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Intro banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden text-left ${
        theme === 'dark' ? 'bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950 border-emerald-950/40' : 'bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono uppercase">
          {isGu ? '૨. એડવાન્સ વ્યવસાયિક રેડી-મેડ સ્ટેક્સ' : 'B2B ENTERPRISE AI STACK SUITE'}
        </span>
        <h2 className={`text-xl font-black mt-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {isGu ? 'તમારા વ્યવસાય માટે સંપૂર્ણ ઓટોમેશન સ્ટેક્સ' : 'B2B Custom Enterprise AI Stack Builder'}
        </h2>
        <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
          {isGu ? 'ઓટોમેશન ટૂલ્સની ગણતરી કરો, ખર્ચનું સંચાલન કરો અને મનપસંદ સ્ટેક્સ સેવ કરો.' : 'Deploy, customize, calculate and manage specialized multi-step AI stacks designed for real business automation workflows.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Stacks List & Creator Form */}
        <div className="xl:col-span-1 space-y-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
            {isGu ? 'સ્ટેક્સ પસંદ કરો અથવા બનાવો' : 'SELECT OR ASSEMBLE A STACK'}
          </span>

          <div className="space-y-2.5">
            {customStacks.map(s => (
              <div
                key={s.id}
                onClick={() => { playSynthSound('click'); setActiveStackId(s.id); }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  activeStackId === s.id
                    ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                    : theme === 'dark' ? 'bg-[#04060c] border-slate-900 hover:border-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>{s.title}</h4>
                    <span className="inline-block mt-1 text-[8px] font-bold font-mono uppercase bg-slate-500/10 text-slate-400 px-1.5 py-0.5 rounded border border-slate-500/10">
                      {s.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleUpvote(s.id, e)}
                      className="text-[9px] font-bold font-mono px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <span>🚀</span> <span>{s.upvotes}</span>
                    </button>
                    {s.id.startsWith('custom-') && (
                      <button
                        onClick={(e) => deleteStack(s.id, e)}
                        className="p-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 transition-all rounded-lg shrink-0 cursor-pointer"
                      >
                        <Icons.Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 mt-2 leading-relaxed">
                  {isGu ? s.descGu : s.desc}
                </p>
                <div className="flex items-center justify-between text-[9px] font-black font-mono text-slate-500 pt-3 border-t border-slate-500/5 mt-2 uppercase">
                  <span>Tools: {s.tools ? s.tools.length : 0}</span>
                  <span className="text-emerald-400">Est. Cost: ${s.tools ? s.tools.reduce((sum, t) => sum + t.cost, 0) : 0}/mo</span>
                </div>
              </div>
            ))}
          </div>

          {/* Creation Form */}
          <form onSubmit={createNewCustomStack} className={`p-5 rounded-2xl border text-left space-y-3.5 ${
            theme === 'dark' ? 'bg-[#050810]/40 border-slate-900' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-500 flex items-center gap-1">
              <Icons.Plus className="w-4 h-4 text-emerald-400" />
              <span>{isGu ? 'નવો કસ્ટમ સ્ટેક' : 'BUILD A BLANK STACK'}</span>
            </h4>
            <div className="space-y-1">
              <input
                type="text"
                required
                placeholder="e.g. My Agency Suite"
                value={creationTitle}
                onChange={(e) => setCreationTitle(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                }`}
              />
            </div>
            <div className="space-y-1">
              <input
                type="text"
                placeholder="e.g. Scaling organic outreach via AI."
                value={creationDesc}
                onChange={(e) => setCreationDesc(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                }`}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow active:scale-95 cursor-pointer"
            >
              🚀 Initialize Stack
            </button>
          </form>

          {/* Schema JSON Sync Panel */}
          <div className={`p-4 rounded-2xl border text-left space-y-3 ${
            theme === 'dark' ? 'bg-[#090d16]/40 border-slate-900' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-black text-slate-400">SCHEMA SYNC</span>
              <button
                onClick={() => { playSynthSound('click'); setShowImportArea(!showImportArea); }}
                className="text-[9px] font-bold text-indigo-400 hover:underline cursor-pointer"
              >
                {showImportArea ? "Close" : "Import JSON"}
              </button>
            </div>
            
            {showImportArea && (
              <div className="space-y-2.5">
                <textarea
                  rows={4}
                  placeholder='Paste stack JSON schema here...'
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl outline-none border ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                  }`}
                />
                <button
                  onClick={handleImportStack}
                  className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                >
                  Confirm Import Block
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Stack Deep Customizer & Stats */}
        <div className="xl:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl border text-left space-y-5 ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex justify-between items-start gap-4 border-b border-slate-500/5 pb-4">
              <div>
                <span className="text-[9px] font-black uppercase text-emerald-400 font-mono tracking-wider">ACTIVE SYSTEM PREVIEW</span>
                <h3 className={`text-base font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'} mt-1`}>{activeStack?.title}</h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                  {isGu ? activeStack?.descGu : activeStack?.desc}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEditing(activeStack)}
                  className="px-3.5 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-[10px] font-black uppercase tracking-wider text-slate-400 rounded-xl transition-all border border-slate-500/10 flex items-center gap-1 cursor-pointer"
                >
                  <Icons.Edit2 className="w-3.5 h-3.5" />
                  <span>Customize Stack</span>
                </button>
                <button
                  onClick={handleExportStack}
                  className="px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-[10px] font-black uppercase tracking-wider text-indigo-400 rounded-xl transition-all border border-indigo-500/10 flex items-center gap-1 cursor-pointer"
                  title="Download JSON schema file"
                >
                  <Icons.Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* B2B ROI & Productivity Indicator Widgets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-500/5 text-left">
                <span className="block text-[8px] font-black uppercase text-slate-500 font-mono">TIME SAVED</span>
                <span className="block text-base font-black font-mono text-emerald-400 mt-0.5">~{hoursSaved} hrs/week</span>
              </div>
              <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-500/5 text-left">
                <span className="block text-[8px] font-black uppercase text-slate-500 font-mono">PRODUCTIVITY BIAS</span>
                <span className="block text-base font-black font-mono text-indigo-400 mt-0.5">{multiplier}x Output</span>
              </div>
              <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-500/5 text-left">
                <span className="block text-[8px] font-black uppercase text-slate-500 font-mono">AUTOMATION STRENGTH</span>
                <span className="block text-base font-black font-mono text-amber-400 mt-0.5">{automationLevel}% Hands-Free</span>
              </div>
              <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-500/5 text-left">
                <span className="block text-[8px] font-black uppercase text-slate-500 font-mono">EST. COST SUMMARY</span>
                <span className="block text-base font-black font-mono text-emerald-400 mt-0.5">${totalMonthlyCost}/mo</span>
              </div>
            </div>

            {/* Pipeline Stage items */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">AUTOMATED PIPELINE WORKFLOW</span>
              
              <div className="space-y-2">
                {activeStack?.tools && activeStack.tools.map((t, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between ${theme === 'dark' ? 'bg-[#04060c] border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-1.5 bg-slate-500/5 rounded-xl">{t.logo}</span>
                      <div className="text-left">
                        <h5 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.name}</h5>
                        <span className="text-[9px] font-extrabold text-indigo-400 font-mono uppercase tracking-wider">{t.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-xs font-black font-mono text-emerald-400">{t.cost > 0 ? `$${t.cost}/mo` : 'FREE PLAN'}</span>
                      <span className="block text-[8px] font-bold text-slate-500 font-mono uppercase">ESTIMATED LICENSE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: CUSTOMIZE/EDIT BUSINESS STACK ================= */}
      {editingStack && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl border flex flex-col justify-between overflow-hidden text-left relative ${
            theme === 'dark' ? 'bg-[#04060c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
          }`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-500/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest">ACTIVE CUSTOMIZER WIZARD</span>
                <h3 className="text-sm font-black uppercase tracking-wider mt-0.5">Customize "{editingStack.title}"</h3>
              </div>
              <button
                onClick={() => setEditingStack(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 max-h-[60vh]">
              {/* Change descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 font-mono">Stack Name</label>
                  <input
                    type="text"
                    value={editingStack.title}
                    onChange={(e) => setEditingStack({ ...editingStack, title: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-505/50 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 font-mono">Category Tag</label>
                  <input
                    type="text"
                    value={editingStack.badge}
                    onChange={(e) => setEditingStack({ ...editingStack, badge: e.target.value })}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-550/50 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                    }`}
                  />
                </div>
              </div>

              {/* Tools list within stack */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-500 font-mono tracking-wider">TOOLS & INTEGRATIONS IN THIS PIPELINE</span>
                
                {editingStack.tools.length === 0 ? (
                  <p className="text-[10px] text-slate-500 font-bold italic py-3 text-center">No tools inside this stack. Please assemble some below.</p>
                ) : (
                  <div className="space-y-2">
                    {editingStack.tools.map((tool, tIdx) => (
                      <div key={tIdx} className={`p-3 rounded-xl border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{tool.logo}</span>
                          <div className="text-left">
                            <span className="block text-xs font-black">{tool.name}</span>
                            <span className="block text-[8px] font-black text-indigo-400 font-mono uppercase leading-none">{tool.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black font-mono text-emerald-400">${tool.cost}/mo</span>
                          <button
                            onClick={() => removeToolFromEditing(tIdx)}
                            className="p-1 text-red-400 hover:text-red-500 cursor-pointer rounded hover:bg-red-500/10"
                          >
                            <Icons.Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add a new tool block */}
              <div className={`p-4 rounded-xl border space-y-3.5 ${
                theme === 'dark' ? 'bg-[#050810] border-slate-900' : 'bg-slate-50 border-slate-150'
              }`}>
                <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest block">Add New Tool to Stack</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Logo Emoji</label>
                    <input
                      type="text"
                      placeholder="e.g. 🤖"
                      value={newToolLogo}
                      onChange={(e) => setNewToolLogo(e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                      }`}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Tool / Service Name</label>
                    <input
                      type="text"
                      placeholder="e.g. ElevenLabs AI"
                      value={newToolName}
                      onChange={(e) => setNewToolName(e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Monthly Cost ($)</label>
                    <input
                      type="number"
                      placeholder="20"
                      value={newToolCost}
                      onChange={(e) => setNewToolCost(e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Workflow Category (e.g., Audio Generation)"
                    value={newToolCategory}
                    onChange={(e) => setNewToolCategory(e.target.value)}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={addToolToEditing}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow shrink-0"
                  >
                    + Add Tool
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-500/10 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingStack(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer ${
                  theme === 'dark' ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditedStack}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
              >
                Save Stack Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
