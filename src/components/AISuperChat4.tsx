import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  created: string;
  model: string;
}

interface AISuperChat4Props {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'rate' | 'chime' | 'laser' | 'toggle') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Next-Gen Flagship)', shortName: 'Gemini 3.7', icon: 'Sparkles', desc: 'Google\'s brand-new flagship multi-modal reasoning engine.', badge: 'New Flagship' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Ultra-Intelligence)', shortName: 'Gemini 3.1 Pro', icon: 'BrainCircuit', desc: 'Extreme cognitive power, math proofs, and long-context processing.', badge: 'Pro reasoning' },
  { id: 'deepseek-r1', name: 'DeepSeek-R1 (CoT Thinking Agent)', shortName: 'DeepSeek R1', icon: 'Cpu', desc: 'R1-powered reasoning chain-of-thought with live mental tracing.', badge: 'R1 Thinking' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Enterprise Pro)', shortName: 'Claude 3.5', icon: 'FileText', desc: 'Perfect creative writing, software architectural design, and pristine English.', badge: 'Creative Coder' },
  { id: 'gpt-4o', name: 'GPT-4o (High-Speed Logic)', shortName: 'GPT-4o', icon: 'Activity', desc: 'OpenAI\'s flagship optimized for operational workflows and marketing strategies.', badge: 'Logical' },
  { id: 'quantum-v', name: 'Quantum-V (50-Crore Custom Agent)', shortName: 'Quantum-V', icon: 'Layers', desc: 'Simulated custom model fine-tuned for high-end enterprise scale and wealth.', badge: '50Cr Elite' }
];

const parseThinkingAndResponse = (content: string) => {
  const thinkStart = content.indexOf('<think>');
  const thinkEnd = content.indexOf('</think>');
  
  if (thinkStart !== -1 && thinkEnd !== -1) {
    const thinking = content.substring(thinkStart + 7, thinkEnd).trim();
    const response = content.substring(thinkEnd + 8).trim();
    return { thinking, response, isThinkingInProgress: false };
  } else if (thinkStart !== -1) {
    const thinking = content.substring(thinkStart + 7).trim();
    return { thinking, response: '', isThinkingInProgress: true };
  }
  
  return { thinking: null, response: content, isThinkingInProgress: false };
};

interface ThinkingBlockProps {
  thinking: string;
  isStreaming: boolean;
  theme: 'dark' | 'light';
  isGu: boolean;
}

function ThinkingBlock({ thinking, isStreaming, theme, isGu }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className={`mb-3.5 rounded-2xl border text-xs overflow-hidden transition-all duration-200 shadow-sm ${
      theme === 'dark' 
        ? 'bg-slate-950/50 border-slate-900/80 text-slate-400' 
        : 'bg-indigo-50/10 border-indigo-100/40 text-slate-500'
    }`}>
      {/* Header */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-slate-500/5 hover:bg-slate-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icons.Cpu className={`w-3.5 h-3.5 text-indigo-400 ${isStreaming ? 'animate-spin' : 'animate-pulse'}`} />
          <span className="font-black tracking-wider uppercase text-[10px] text-indigo-400">
            {isStreaming 
              ? (isGu ? 'વિચાર પ્રક્રિયા ચાલુ છે...' : 'THINKING PROCESS IN PROGRESS...') 
              : (isGu ? 'વિચાર પ્રક્રિયા પૂર્ણ' : 'THINKING PROCESS COMPLETED')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
          <span>{expanded ? (isGu ? 'છુપાવો' : 'Hide') : (isGu ? 'બતાવો' : 'Show')}</span>
          {expanded ? <Icons.ChevronUp className="w-3.5 h-3.5" /> : <Icons.ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>
      
      {/* Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-500/5"
          >
            <div className="p-4 font-mono italic whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto custom-scrollbar">
              {thinking}
              {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-indigo-500 animate-pulse ml-1" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PRESET_PROMPTS = {
  en: [
    { title: "💼 Optimize Business Stack", prompt: "Help me design an optimized AI Tool Stack for a digital marketing agency to save 20 hours/week." },
    { title: "🛡️ Scam AI Checker", prompt: "Analyze this hypothetical domain: 'http://free-gpt-discount-gold.cc' and tell me the potential scam indicators." },
    { title: "⚡ Boost App Speed", prompt: "Explain how to configure React dynamic imports and code splitting to optimize Google Lighthouse scores." },
    { title: "💰 Affiliate Strategy", prompt: "Generate a detailed 30-day marketing plan for promoting the AI Super Tools Hub and tracking conversion rates." }
  ],
  gu: [
    { title: "💼 બિઝનેસ સ્ટેક ગોઠવો", prompt: "ડિજિટલ માર્કેટિંગ એજન્સી માટે સાપ્તાહિક ૨૦ કલાક બચાવવા માટે શ્રેષ્ઠ એઆઈ ટૂલ સ્ટેકની ડિઝાઇન બનાવો." },
    { title: "🛡️ સ્કેમ એઆઈ ચેકર", prompt: "આ કાલ્પનિક લિંકનું વિશ્લેષણ કરો: 'http://free-gpt-discount-gold.cc' અને તે સ્કેમ છે કે કેમ તે જણાવો." },
    { title: "⚡ સ્પીડ વધારવાની ટિપ્સ", prompt: "React ડાયનેમિક ઇમ્પોર્ટ્સ અને કોડ સ્પ્લિટિંગનો ઉપયોગ કેવી રીતે કરવો તે વિગતવાર સમજાવો." },
    { title: "💰 સંલગ્ન માર્કેટિંગ પદ્ધતિ", prompt: "એઆઈ સુપર ટૂલ્સ હબને પ્રમોટ કરવા અને કન્વર્ઝન રેટ ટ્રેક કરવા માટે ૩૦ દિવસનો પ્લાન બનાવો." }
  ]
};

const SYSTEM_GREETINGS = {
  en: "Welcome to AI Super Chat 4.0! I am connected to the ultra-fast Gemini and DeepSeek models. Let me help you write code, build business automation, audit website safety, or build affiliate marketing pipelines. Earning XP is enabled for active chat sessions!",
  gu: "એઆઈ સુપર ચેટ ૪.૦ માં તમારું સ્વાગત છે! હું અલ્ટ્રા-ફાસ્ટ ગૂગલ જેમિની અને ડીપસીક મોડલ્સ સાથે કનેક્ટેડ છું. ચાલો સાથે મળીને કોડ લખીએ, બિઝનેસ ઓટોમેશન બનાવીએ અને એક્સપી (XP) પોઈન્ટ્સ કમાઈએ!"
};

export default function AISuperChat4({
  lang,
  theme,
  playSynthSound,
  addXPPoints
}: AISuperChat4Props) {
  const isGu = lang === 'gu';
  const tPresets = isGu ? PRESET_PROMPTS.gu : PRESET_PROMPTS.en;

  // Chats & Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.7-flash');
  const [inputVal, setInputVal] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [speechActive, setSpeechActive] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('super_chat_4_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setSelectedModel(parsed[0].model || 'gemini-3.7-flash');
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load super chat sessions:", e);
    }

    // Default first session if none exists
    const firstSessionId = 'session_' + Math.random().toString(36).substring(2, 9);
    const firstSession: ChatSession = {
      id: firstSessionId,
      title: isGu ? 'નવી ચેટ સત્ર' : 'New Chat Session',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: isGu ? SYSTEM_GREETINGS.gu : SYSTEM_GREETINGS.en,
          timestamp: new Date()
        }
      ],
      created: new Date().toLocaleDateString(),
      model: 'gemini-3.7-flash'
    };
    setSessions([firstSession]);
    setCurrentSessionId(firstSessionId);
  }, [lang]);

  // Save sessions to localStorage when they change
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem('super_chat_4_sessions', JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save chat sessions:", e);
    }
  };

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, loading]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || inputVal;
    if (!rawMsg.trim() || loading || !currentSessionId) return;

    playSynthSound('laser');
    if (!textToSend) setInputVal('');

    const userMsg: Message = {
      id: 'msg_' + Math.random().toString(36).substring(2, 11),
      role: 'user',
      content: rawMsg,
      timestamp: new Date()
    };

    // Update session locally with user message
    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        // If it was default title, rename based on user input
        const newTitle = s.title.startsWith('New Chat') || s.title.startsWith('નવી ચેટ')
          ? rawMsg.slice(0, 24) + (rawMsg.length > 24 ? '...' : '')
          : s.title;

        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMsg],
          model: selectedModel
        };
      }
      return s;
    });

    saveSessions(updatedSessions);
    setLoading(true);

    try {
      // Find full messages for history payload
      const activeSess = updatedSessions.find(s => s.id === currentSessionId);
      const historyPayload = activeSess ? activeSess.messages.map(m => ({
        role: m.role,
        content: m.content
      })) : [{ role: 'user', content: rawMsg }];

      // Fetch from API stream
      const response = await fetch('/api/tools/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyPayload, model: selectedModel })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error("Stream reader initialisation failed");

      let accumulatedText = '';
      const aiMsgId = 'msg_' + Math.random().toString(36).substring(2, 11);

      // Add empty assistant response to state
      const initialAISessions = updatedSessions.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: aiMsgId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              model: selectedModel
            } as Message]
          };
        }
        return s;
      });
      setSessions(initialAISessions);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(cleanLine.slice(6));
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Live update of message content
                setSessions(prev => prev.map(s => {
                  if (s.id === currentSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(m => {
                        if (m.id === aiMsgId) {
                          return { ...m, content: accumulatedText };
                        }
                        return m;
                      })
                    };
                  }
                  return s;
                }));
              }
            } catch (err) {
              // Ignore partial chunks
            }
          }
        }
      }

      // Final save to localStorage
      const finalSessions = localStorage.getItem('super_chat_4_sessions');
      if (finalSessions) {
        const parsed = JSON.parse(finalSessions);
        const updatedWithFinal = parsed.map((s: ChatSession) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => {
                if (m.id === aiMsgId) {
                  return { ...m, content: accumulatedText };
                }
                return m;
              })
            };
          }
          return s;
        });
        localStorage.setItem('super_chat_4_sessions', JSON.stringify(updatedWithFinal));
      }

      // Add reward points for engaging conversation!
      playSynthSound('success');
      addXPPoints(15, 'Engaged in high-performance AI Super Chat 4 session', 'એઆઈ સુપર ચેટ ૪.૦ માં સત્ર પૂર્ણ કર્યું અને ૧૫ XP મેળવ્યા');

    } catch (err: any) {
      console.error(err);
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: 'err_' + Date.now(),
              role: 'assistant',
              content: `⚠️ ${isGu ? "પ્રતિસાદ મેળવવામાં નિષ્ફળતા. કૃપા કરીને ફરી પ્રયાસ કરો." : "Failed to receive stream response. Please try again."}\n\n*Error: ${err.message || "Network Timeout"}*`,
              timestamp: new Date()
            } as Message]
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  // Create new session
  const handleCreateNewSession = () => {
    playSynthSound('toggle');
    const newId = 'session_' + Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: isGu ? `નવું ચેટ સત્ર ${sessions.length + 1}` : `New Chat Session ${sessions.length + 1}`,
      messages: [
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: isGu ? SYSTEM_GREETINGS.gu : SYSTEM_GREETINGS.en,
          timestamp: new Date()
        }
      ],
      created: new Date().toLocaleDateString(),
      model: selectedModel
    };

    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setCurrentSessionId(newId);
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSynthSound('click');
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      const fallbackId = 'session_' + Math.random().toString(36).substring(2, 9);
      const fallback: ChatSession = {
        id: fallbackId,
        title: isGu ? 'નવી ચેટ સત્ર' : 'New Chat Session',
        messages: [{ id: 'welcome', role: 'assistant', content: isGu ? SYSTEM_GREETINGS.gu : SYSTEM_GREETINGS.en, timestamp: new Date() }],
        created: new Date().toLocaleDateString(),
        model: 'gemini-3.7-flash'
      };
      saveSessions([fallback]);
      setCurrentSessionId(fallbackId);
    } else {
      saveSessions(filtered);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
    }
  };

  // Copy message text
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    playSynthSound('click');
    setTimeout(() => setCopiedMessageId(''), 2000);
  };

  // Text-To-Speech
  const handleSpeakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speechActive) {
      window.speechSynthesis.cancel();
      setSpeechActive(false);
      playSynthSound('toggle');
      return;
    }

    playSynthSound('chime');
    const cleaned = text.replace(/[#*`_]/g, ''); // strip markdown syntax
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = isGu ? 'gu-IN' : 'en-US';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeechActive(false);
    utterance.onerror = () => setSpeechActive(false);

    window.speechSynthesis.speak(utterance);
    setSpeechActive(true);
  };

  return (
    <div id="ai-super-chat-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
      {/* Sidebar: Chat History */}
      <div className={`lg:col-span-1 rounded-3xl border p-4 space-y-4 flex flex-col h-[650px] ${
        theme === 'dark' ? 'bg-[#050811]/90 border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-xl'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.MessagesSquare className="w-5 h-5 text-indigo-500" />
            <span className="font-extrabold text-sm uppercase tracking-wider">
              {isGu ? 'ચેટ લિસ્ટ' : 'Chat Sessions'}
            </span>
          </div>
          <button
            onClick={handleCreateNewSession}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all duration-150 active:scale-95"
            title="Create New Session"
          >
            <Icons.Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions Loop */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {sessions.map((s) => {
            const isActive = s.id === currentSessionId;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSessionId(s.id);
                  setSelectedModel(s.model || 'gemini-2.5-flash');
                  playSynthSound('click');
                }}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative group flex items-center justify-between ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border-indigo-500 text-indigo-400'
                    : theme === 'dark' ? 'bg-[#090d16]/50 border-slate-900 text-slate-400 hover:bg-[#0c1222] hover:text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden w-[85%]">
                  <Icons.MessageCircle className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="text-xs font-black truncate leading-tight block">
                    {s.title}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all duration-150 text-slate-500 shrink-0"
                >
                  <Icons.Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Level & XP Box */}
        <div className={`p-3.5 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-950/50 border-slate-900/60' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-xl border border-emerald-500/20">
              <Icons.ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                {isGu ? 'એક્ટિવ સર્વર સુરક્ષા' : 'ACTIVE CHAT SECURE LINK'}
              </span>
              <span className="block text-[9px] font-bold text-emerald-500 leading-none mt-0.5">
                {isGu ? 'ગ્લોબલ ગેટવે ચાલુ છે' : 'TLS End-To-End TLS Key v4'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className={`lg:col-span-3 rounded-3xl border flex flex-col h-[650px] relative overflow-hidden ${
        theme === 'dark' ? 'bg-[#050811]/90 border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-xl'
      }`}>
        {/* Chat Header: Model Selector */}
        <div className="p-4 border-b border-slate-500/10 flex flex-col gap-3.5 bg-slate-950/20 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                {isGu ? 'પસંદ કરેલ મોડલ:' : 'Active LLM Agent:'}
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {AVAILABLE_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      playSynthSound('toggle');
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      selectedModel === m.id
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10 scale-[1.02]'
                        : theme === 'dark' ? 'bg-[#090d16] border-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{m.shortName}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10">{m.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSpeakText(currentSession?.messages[currentSession.messages.length - 1]?.content || '')}
                className={`p-2 rounded-xl transition duration-150 ${
                  speechActive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title="Speak last response"
              >
                {speechActive ? <Icons.VolumeX className="w-4 h-4" /> : <Icons.Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Active Model Description Info Bar */}
          <div className="text-[11px] text-slate-400 flex items-center gap-2 border-t border-slate-500/5 pt-2 animate-fadeIn">
            <Icons.Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-semibold leading-normal">
              <strong className="text-indigo-400">{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}</strong>: {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.desc}
            </span>
          </div>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin custom-scrollbar">
          {currentSession?.messages.map((m) => {
            const isAI = m.role === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-fadeIn`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-md border leading-relaxed relative group ${
                  isAI
                    ? theme === 'dark' ? 'bg-[#080d16] border-slate-900/60 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-800 shadow-sm'
                    : 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/10'
                }`}>
                  {/* Model tag if AI */}
                  {isAI && m.id !== 'welcome' && (
                    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-full mb-2 font-mono">
                      <Icons.Cpu className="w-2.5 h-2.5 animate-pulse" />
                      <span>{selectedModel}</span>
                    </span>
                  )}

                  {/* Message Content */}
                  <div className="text-sm whitespace-pre-wrap font-medium space-y-1">
                    {(() => {
                      const { thinking, response, isThinkingInProgress } = parseThinkingAndResponse(m.content);
                      return (
                        <>
                          {thinking !== null && (
                            <ThinkingBlock 
                              thinking={thinking} 
                              isStreaming={isThinkingInProgress || (loading && m.id === currentSession?.messages[currentSession.messages.length - 1]?.id)} 
                              theme={theme} 
                              isGu={isGu} 
                            />
                          )}
                          <div>{response}</div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Utility overlay buttons on message hover */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={() => handleCopyText(m.id, m.content)}
                      className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-200 transition bg-slate-950/60 border-slate-800`}
                      title="Copy message"
                    >
                      {copiedMessageId === m.id ? <Icons.Check className="w-3.5 h-3.5 text-emerald-400" /> : <Icons.Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
                theme === 'dark' ? 'bg-[#080d16] border-slate-900 text-indigo-400' : 'bg-slate-50 border-slate-100 text-indigo-600'
              }`}>
                <Icons.RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs font-extrabold tracking-wider uppercase">
                  {isGu ? 'એઆઈ વિચારી રહ્યું છે...' : 'Super AI is compiling response...'}
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        {currentSession?.messages.length === 1 && !loading && (
          <div className="px-5 pb-3 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tPresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.prompt)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                  theme === 'dark' ? 'bg-[#090d16] border-slate-900 hover:border-slate-800 hover:bg-[#0c1222]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-black tracking-wide leading-tight text-indigo-400">
                  {p.title}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 font-semibold line-clamp-1">
                  {p.prompt}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Message Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-slate-950/40 backdrop-blur-md border-t border-slate-500/10 flex items-center gap-3"
        >
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={isGu ? "તમારો પ્રશ્ન અથવા કોડ અહીં લખો..." : "Write your query, prompt, or code syntax block here..."}
              disabled={loading}
              className={`w-full text-sm pl-4 pr-12 py-3.5 rounded-2xl border outline-none font-medium transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-[#04060b] border-slate-900 text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10'
                  : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500/50'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                const samples = isGu
                  ? ["બિઝનેસ એઆઈ સ્ટેક બતાવો", "એઆઈ રિસ્ક સ્કેમ ચેકર ચાલુ કરો", "XP પોઈન્ટ્સ રીડીમ કેવી રીતે કરવા?"]
                  : ["Explain Gemini function calling", "Generate high-fidelity ad copies", "Optimize SEO schema with JSON-LD"];
                const pick = samples[Math.floor(Math.random() * samples.length)];
                setInputVal(pick);
                playSynthSound('toggle');
              }}
              className="absolute right-3.5 p-1.5 text-slate-500 hover:text-slate-300 transition-all duration-150"
              title="Generate random prompt"
            >
              <Icons.Sparkles className="w-4 h-4 text-yellow-400" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className={`py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2 ${
              inputVal.trim() && !loading
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-600/15 cursor-pointer hover:shadow-indigo-600/25'
                : 'bg-slate-800 text-slate-500 border border-slate-900/40 cursor-not-allowed shadow-none'
            }`}
          >
            <span>{isGu ? "મોકલો" : "Send"}</span>
            <Icons.SendHorizontal className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
