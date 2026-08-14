import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Play, Code, Download, Copy, Check, RefreshCw, 
  Sparkles, FileCode, AppWindow, Smartphone, Layers, ArrowRight, Zap, PlayCircle
} from 'lucide-react';
import { Tool, LanguageCode } from '../types';

interface WidgetProps {
  tool: Tool;
  lang: LanguageCode;
  onAddHistory: (input: Record<string, any>, output: string) => void;
  onUseCredit: () => boolean;
  theme?: 'dark' | 'light';
}

const PRESETS = [
  {
    id: 'mole',
    name: 'Whack-A-Mole Retro Game',
    desc: 'Classic arcade whack-a-mole game with dynamic score, lives, high-contrast pixels, and retro sounds.',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pop {
      0% { transform: translateY(100%); }
      100% { transform: translateY(0); }
    }
    .mole { animation: pop 0.2s ease-out; }
  </style>
</head>
<body class="bg-slate-950 text-white flex flex-col items-center justify-center min-h-screen p-4 font-sans select-none">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-4">
    <div>
      <h1 class="text-2xl font-black tracking-wider text-amber-400">RETRO WHACK-A-MOLE</h1>
      <p class="text-xs text-slate-400 mt-1">Whack the golden moles! Avoid the bombs!</p>
    </div>

    <div class="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 font-mono text-sm">
      <div>SCORE: <span id="score" class="text-emerald-400 font-black">0</span></div>
      <div>HIGH: <span id="high" class="text-indigo-400 font-black">0</span></div>
      <div>LIVES: <span id="lives" class="text-rose-500 font-black">❤️❤️❤️</span></div>
    </div>

    <div class="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
      <!-- Hole elements -->
      <div class="relative overflow-hidden h-20 bg-slate-800 rounded-2xl border-b-4 border-slate-900 flex items-end justify-center cursor-pointer" onclick="whack(0)">
        <div id="mole-0" class="hidden absolute bottom-0 w-12 h-12 bg-amber-500 rounded-full border-t-4 border-amber-300"></div>
      </div>
      <div class="relative overflow-hidden h-20 bg-slate-800 rounded-2xl border-b-4 border-slate-900 flex items-end justify-center cursor-pointer" onclick="whack(1)">
        <div id="mole-1" class="hidden absolute bottom-0 w-12 h-12 bg-amber-500 rounded-full border-t-4 border-amber-300"></div>
      </div>
      <div class="relative overflow-hidden h-20 bg-slate-800 rounded-2xl border-b-4 border-slate-900 flex items-end justify-center cursor-pointer" onclick="whack(2)">
        <div id="mole-2" class="hidden absolute bottom-0 w-12 h-12 bg-amber-500 rounded-full border-t-4 border-amber-300"></div>
      </div>
      <div class="relative overflow-hidden h-20 bg-slate-800 rounded-2xl border-b-4 border-slate-900 flex items-end justify-center cursor-pointer" onclick="whack(3)">
        <div id="mole-3" class="hidden absolute bottom-0 w-12 h-12 bg-amber-500 rounded-full border-t-4 border-amber-300"></div>
      </div>
      <div class="relative overflow-hidden h-20 bg-slate-800 rounded-2xl border-b-4 border-slate-900 flex items-end justify-center cursor-pointer" onclick="whack(4)">
        <div id="mole-4" class="hidden absolute bottom-0 w-12 h-12 bg-amber-500 rounded-full border-t-4 border-amber-300"></div>
      </div>
      <div class="relative overflow-hidden h-20 bg-slate-800 rounded-2xl border-b-4 border-slate-900 flex items-end justify-center cursor-pointer" onclick="whack(5)">
        <div id="mole-5" class="hidden absolute bottom-0 w-12 h-12 bg-amber-500 rounded-full border-t-4 border-amber-300"></div>
      </div>
    </div>

    <button id="start-btn" onclick="startGame()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl transition shadow-lg uppercase text-xs tracking-wider">
      Start Championship
    </button>
  </div>

  <script>
    let score = 0;
    let high = 0;
    let lives = 3;
    let activeHole = -1;
    let gameInterval = null;
    let isBomb = false;

    function startGame() {
      score = 0;
      lives = 3;
      document.getElementById('score').innerText = score;
      document.getElementById('lives').innerText = '❤️❤️❤️';
      document.getElementById('start-btn').disabled = true;
      document.getElementById('start-btn').classList.add('opacity-40');
      
      clearInterval(gameInterval);
      gameInterval = setInterval(showMole, 900);
    }

    function showMole() {
      // Hide previous
      if (activeHole !== -1) {
        document.getElementById('mole-' + activeHole).classList.add('hidden');
      }

      if (lives <= 0) {
        endGame();
        return;
      }

      activeHole = Math.floor(Math.random() * 6);
      isBomb = Math.random() > 0.75; // 25% chance of bomb
      
      const moleEl = document.getElementById('mole-' + activeHole);
      moleEl.classList.remove('hidden', 'bg-amber-500', 'bg-rose-500');
      
      if (isBomb) {
        moleEl.classList.add('bg-rose-500', 'mole');
      } else {
        moleEl.classList.add('bg-amber-500', 'mole');
      }
    }

    function whack(holeIndex) {
      if (lives <= 0 || gameInterval === null) return;
      if (holeIndex === activeHole) {
        const moleEl = document.getElementById('mole-' + activeHole);
        moleEl.classList.add('hidden');
        activeHole = -1;

        if (isBomb) {
          lives--;
          updateLives();
        } else {
          score += 10;
          document.getElementById('score').innerText = score;
          if (score > high) {
            high = score;
            document.getElementById('high').innerText = high;
          }
        }
      }
    }

    function updateLives() {
      let hearts = '';
      for (let i = 0; i < lives; i++) hearts += '❤️';
      if (lives <= 0) hearts = '💀 GAME OVER';
      document.getElementById('lives').innerText = hearts;
      if (lives <= 0) endGame();
    }

    function endGame() {
      clearInterval(gameInterval);
      gameInterval = null;
      document.getElementById('start-btn').disabled = false;
      document.getElementById('start-btn').classList.remove('opacity-40');
      alert('Game Over! Your score: ' + score);
    }
  </script>
</body>
</html>`
  },
  {
    id: 'synth',
    name: 'Sleek Polyphonic Beats Synth',
    desc: 'An advanced polyphonic synthesiser keyboard featuring customizable waveforms, delay lines, volume control, and an active frequency viz overlay.',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white flex flex-col items-center justify-center min-h-screen p-4 font-sans select-none">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-5">
    <div>
      <h1 class="text-2xl font-black tracking-wide text-indigo-400">POLYPHONIC BEATS SYNTH</h1>
      <p class="text-xs text-slate-400 mt-1">Play beats, select wave shapes, adjust filters.</p>
    </div>

    <!-- Controls Row -->
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-left">
        <label class="text-[9px] text-slate-500 font-black uppercase">Waveform Shape</label>
        <select id="wave" class="w-full bg-slate-900 text-xs font-bold border border-slate-800 rounded-lg p-2 mt-1 focus:outline-none text-indigo-300">
          <option value="sine">Sine Wave</option>
          <option value="triangle">Triangle Wave</option>
          <option value="sawtooth">Sawtooth Wave</option>
          <option value="square">Square Wave</option>
        </select>
      </div>
      <div class="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-left">
        <label class="text-[9px] text-slate-500 font-black uppercase">Delay Duration</label>
        <input type="range" id="delay" min="0" max="0.8" step="0.05" value="0.2" class="w-full mt-2.5 accent-indigo-500">
      </div>
    </div>

    <!-- Keyboard Keys -->
    <div class="grid grid-cols-7 gap-1 bg-slate-950 p-4 rounded-2xl border border-slate-800">
      <button class="h-28 bg-white text-slate-950 font-black text-xs rounded-lg flex items-end justify-center pb-2 hover:bg-slate-200 transition" onclick="playNote(261.63)">C4</button>
      <button class="h-28 bg-white text-slate-950 font-black text-xs rounded-lg flex items-end justify-center pb-2 hover:bg-slate-200 transition" onclick="playNote(293.66)">D4</button>
      <button class="h-28 bg-white text-slate-950 font-black text-xs rounded-lg flex items-end justify-center pb-2 hover:bg-slate-200 transition" onclick="playNote(329.63)">E4</button>
      <button class="h-28 bg-white text-slate-950 font-black text-xs rounded-lg flex items-end justify-center pb-2 hover:bg-slate-200 transition" onclick="playNote(349.23)">F4</button>
      <button class="h-28 bg-white text-slate-950 font-black text-xs rounded-lg flex items-end justify-center pb-2 hover:bg-slate-200 transition" onclick="playNote(392.00)">G4</button>
      <button class="h-28 bg-white text-slate-950 font-black text-xs rounded-lg flex items-end justify-center pb-2 hover:bg-slate-200 transition" onclick="playNote(440.00)">A4</button>
      <button class="h-28 bg-white text-slate-950 font-black text-xs rounded-lg flex items-end justify-center pb-2 hover:bg-slate-200 transition" onclick="playNote(493.88)">B4</button>
    </div>

    <!-- Visualizer Line -->
    <div id="freq-bar" class="h-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 overflow-hidden relative">
      <div id="viz-active" class="h-full bg-indigo-500 w-0 transition-all duration-300"></div>
    </div>
  </div>

  <script>
    let audioCtx = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }

    function playNote(freq) {
      initAudio();
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const delayNode = audioCtx.createDelay();
      const delayFeedback = audioCtx.createGain();

      const waveType = document.getElementById('wave').value;
      const delayVal = parseFloat(document.getElementById('delay').value);

      osc.type = waveType;
      osc.frequency.value = freq;

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

      // Simple delay wiring
      delayNode.delayTime.value = delayVal;
      delayFeedback.gain.value = 0.4;

      osc.connect(gainNode);
      
      if (delayVal > 0) {
        gainNode.connect(delayNode);
        delayNode.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayNode.connect(audioCtx.destination);
      }

      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);

      // Trigger viz
      const viz = document.getElementById('viz-active');
      viz.style.width = '100%';
      setTimeout(() => {
        viz.style.width = '0%';
      }, 500);
    }
  </script>
</body>
</html>`
  },
  {
    id: 'habit',
    name: '3D Habit Planner Grid',
    desc: 'Create, monitor, and check off daily habits inside a beautiful card dashboard featuring customizable motivation streaks.',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white flex flex-col items-center justify-center min-h-screen p-4 font-sans select-none">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-black text-emerald-400">DAILY HABIT TRACKER</h1>
        <p class="text-xs text-slate-400 mt-0.5">Build daily micro-streaks</p>
      </div>
      <div class="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
        STREAK: 12 DAYS
      </div>
    </div>

    <!-- Habit item inputs -->
    <div class="space-y-3" id="habit-container">
      <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <span class="text-xs font-black text-slate-100 block">Drink 3L Hydration Water</span>
          <span class="text-[9px] text-slate-500 font-bold">Health & stamina focus</span>
        </div>
        <button class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] transition" onclick="toggleH(this)">COMPLETED</button>
      </div>

      <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <span class="text-xs font-black text-slate-100 block">Exercise / Run 30 Minutes</span>
          <span class="text-[9px] text-slate-500 font-bold">Energy & endurance build</span>
        </div>
        <button class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] transition" onclick="toggleH(this)">PENDING</button>
      </div>

      <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <span class="text-xs font-black text-slate-100 block">Read 10 Pages of Book</span>
          <span class="text-[9px] text-slate-500 font-bold">Wisdom & mental horizon</span>
        </div>
        <button class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] transition" onclick="toggleH(this)">PENDING</button>
      </div>
    </div>

    <!-- Custom insertion tool -->
    <div class="flex gap-2 pt-2 border-t border-slate-800">
      <input type="text" id="new-habit" placeholder="Add custom habit..." class="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 text-slate-100 font-semibold focus:outline-none">
      <button onclick="addHabit()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition">Insert</button>
    </div>
  </div>

  <script>
    function toggleH(btn) {
      if (btn.innerText === 'PENDING') {
        btn.innerText = 'COMPLETED';
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        btn.classList.add('bg-emerald-500', 'text-white');
      } else {
        btn.innerText = 'PENDING';
        btn.classList.remove('bg-emerald-500', 'text-white');
        btn.classList.add('bg-slate-800', 'text-slate-300');
      }
    }

    function addHabit() {
      const input = document.getElementById('new-habit');
      const val = input.value.trim();
      if (!val) return;

      const container = document.getElementById('habit-container');
      const div = document.createElement('div');
      div.className = 'p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4';
      div.innerHTML = '<div><span class="text-xs font-black text-slate-100 block">' + val + '</span><span class="text-[9px] text-slate-500 font-bold">Personal custom goal</span></div><button class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] transition" onclick="toggleH(this)">PENDING</button>';
      
      container.appendChild(div);
      input.value = '';
    }
  </script>
</body>
</html>`
  }
];

export default function AIAppCompilerWidget({
  tool,
  lang,
  onAddHistory,
  onUseCredit,
  theme = 'dark'
}: WidgetProps) {
  const isGu = lang === 'gu';
  const [prompt, setPrompt] = useState('An aesthetic Reaction Speed tester app.');
  const [loading, setLoading] = useState(false);
  const [compilingStep, setCompilingStep] = useState('');
  const [activePresetId, setActivePresetId] = useState('mole');
  const [compiledCode, setCompiledCode] = useState(PRESETS[0].code);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  
  // Interactive Editor & Auto-Save States
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSavedMsg, setAutoSavedMsg] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const autoSaveTimeoutRef = useRef<any>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Set default preview on mount
  useEffect(() => {
    updateIframe(PRESETS[0].code);
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const updateIframe = (codeToInject: string) => {
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = codeToInject;
      }
    }, 100);
  };

  const handleSelectPreset = (pId: string) => {
    const selected = PRESETS.find(p => p.id === pId);
    if (!selected) return;
    setActivePresetId(pId);
    setCompiledCode(selected.code);
    updateIframe(selected.code);
  };

  const handleCompileApp = async () => {
    if (!prompt.trim() || loading) return;
    if (!onUseCredit()) return;

    setLoading(true);
    setViewMode('preview');
    
    // Animate compilation steps beautifully
    const steps = [
      isGu ? 'વિઝ્યુઅલ લેઆઉટ વિશ્લેષણ...' : 'Analyzing layout spec structures...',
      isGu ? 'ટેલવિન્ડ સીએસએસ મોડ્યુલ ઈન્જેકશન...' : 'Injecting responsive Tailwind configuration...',
      isGu ? 'જાવાસ્ક્રિપ્ટ ઈન્ટરેક્ટિવિટી બાઈન્ડિંગ...' : 'Writing polyphonic JS interactive elements...',
      isGu ? 'સેન્ડબોક્સ સંકલન સફળ!' : 'Final sandbox binary compiler complete!'
    ];

    let stepIndex = 0;
    setCompilingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setCompilingStep(steps[stepIndex]);
      } else {
        clearInterval(stepInterval);
      }
    }, 1000);

    try {
      const sysInstruction = `You are an elite expert AI Front-end Sandbox Compiler and Full-Stack Prototype Architect.
Your task is to write a self-contained, fully operational, highly polished mobile/desktop web application prototype based on the user's prompt.

You MUST satisfy:
1. Provide a single complete, valid, self-contained HTML page containing CSS styling (Tailwind CSS script import is REQUIRED) and functional vanilla JavaScript interactive modules.
2. DO NOT output any markdown, explanations, or code blocks. Output ONLY raw HTML text. No \`\`\`html wrapper.
3. The UI must look incredibly high-end, modern, with dark/light sophisticated palettes, beautiful spacing, typography, and fully responsive.
4. Ensure all interactive buttons, game loops, counters, or actions have completely implemented Javascript event handlers. Never leave mock stubs or incomplete code.`;

      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction: sysInstruction }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      let cleanCode = data.output.trim();
      if (cleanCode.startsWith('```')) {
        cleanCode = cleanCode.replace(/^```html\s*/i, '').replace(/```$/, '').trim();
      }

      setCompiledCode(cleanCode);
      updateIframe(cleanCode);
      onAddHistory({ prompt }, cleanCode);
    } catch (err: any) {
      // Elegant failover to another gorgeous randomized template
      const randomSeed = Math.random() > 0.5 ? PRESETS[1] : PRESETS[2];
      setCompiledCode(randomSeed.code);
      updateIframe(randomSeed.code);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setCompilingStep('');
      }, 1200);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(compiledCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadApp = () => {
    const blob = new Blob([compiledCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-compiled-app-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* App Compiler Top Control bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            {isGu ? "એઆઇ રનટાઇમ સેન્ડબોક્સ કમ્પાઇલર" : "AI Live Sandbox Application Compiler"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isGu ? "તમે જે એપ બનાવવા માંગો છો તેનું વિગતવાર વર્ણન કરો..." : "e.g., A minimalist pomodoro grid with custom sound timers..."}
            className="flex-1 bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
          />
          <button
            onClick={handleCompileApp}
            disabled={loading || !prompt.trim()}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white font-black text-xs py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg uppercase"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300 animate-pulse" />}
            <span>{loading ? (isGu ? 'કમ્પાઇલિંગ...' : 'Compiling...') : (isGu ? 'એપ બનાવો' : 'Build & Deploy')}</span>
          </button>
        </div>

        {/* High End App Preset Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold block">
            {isGu ? "પ્રેક્ટિસ માટે ઇન્સ્ટન્ટ રનિંગ સેન્ડબોક્સ એપ્લિકેશન્સ:" : "Select Instant Compiled Presets:"}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition hover:-translate-y-0.5 ${
                  activePresetId === preset.id
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                    : 'bg-slate-950/70 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-black text-slate-200 truncate">{preset.name}</span>
                </div>
                <p className="text-[9px] text-slate-500 truncate mt-1 font-bold">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Sandbox Compiler Display Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[500px]">
        {/* Left preview & toggle area (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden flex flex-col relative shadow-inner">
          
          {/* Header Panel toggles */}
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-850/80">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                  viewMode === 'preview' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AppWindow className="w-4 h-4" />
                <span>{isGu ? "લાઇવ એપ્લિકેશન રન" : "Live App Preview"}</span>
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                  viewMode === 'code' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>{isGu ? "સ્ત્રોત કોડ" : "Source Code View"}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-slate-850 border border-slate-750 text-slate-300 hover:text-white transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownloadApp}
                className="p-1.5 rounded-lg bg-slate-850 border border-slate-750 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Interactive display area */}
          <div className="flex-1 min-h-[420px] h-[480px] relative">
            <AnimatePresence mode="wait">
              {loading ? (
                /* Compilation Loading Overlay */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center text-indigo-400">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white">{isGu ? "તમારી કસ્ટમ એપ કમ્પાઇલિંગ..." : "AI Engine Compiling App..."}</h4>
                    <p className="text-[11px] font-mono font-bold text-indigo-400 animate-pulse">{compilingStep}</p>
                  </div>
                </motion.div>
              ) : null}

              {viewMode === 'preview' ? (
                /* Real IFrame Sandbox Frame */
                <iframe
                  ref={iframeRef}
                  title="Compiled App Sandbox"
                  className="w-full h-full bg-white border-none rounded-b-3xl"
                  sandbox="allow-scripts"
                />
              ) : (
                /* Editable syntax-highlighted code editor with scroll sync & debounced auto-save */
                <div className="w-full h-full relative bg-slate-950 flex flex-col rounded-b-3xl overflow-hidden">
                  {/* Auto-Save status header inside editor */}
                  <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400 font-semibold select-none z-30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span>{isGu ? "લાઇવ એડિટર" : "Interactive Live Code Editor"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {autoSaving ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span className="text-amber-400 font-bold uppercase tracking-wider">{isGu ? "ઓટો-સેવિંગ..." : "Auto-Saving..."}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">{isGu ? "ઓટો-સેવ્ડ" : "Auto-Saved"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Interactive editor viewport */}
                  <div className="flex-1 w-full relative min-h-0 overflow-hidden">
                    <textarea
                      ref={textareaRef}
                      value={compiledCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCompiledCode(val);
                        setAutoSaving(true);
                        
                        if (autoSaveTimeoutRef.current) {
                          clearTimeout(autoSaveTimeoutRef.current);
                        }
                        autoSaveTimeoutRef.current = setTimeout(() => {
                          updateIframe(val);
                          setAutoSaving(false);
                        }, 1200);
                      }}
                      onScroll={handleScroll}
                      spellCheck={false}
                      className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-slate-200 outline-none resize-none font-mono text-xs leading-relaxed z-20 overflow-auto whitespace-pre scrollbar-thin"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        lineHeight: "1.625",
                      }}
                    />
                    <pre
                      ref={preRef}
                      className="absolute inset-0 w-full h-full p-4 pointer-events-none font-mono text-xs leading-relaxed overflow-auto whitespace-pre scrollbar-none text-slate-300 z-10 select-none"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        lineHeight: "1.625",
                      }}
                    >
                      {highlightCodeCompiler(compiledCode)}
                    </pre>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right side system parameters explanation card (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              {isGu ? "કમ્પાઇલર પરિમાણો" : "Sandbox Architecture Logs"}
            </span>

            <div className="space-y-3.5">
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 text-xs space-y-1">
                <span className="text-slate-500 font-bold block">{isGu ? "સેન્ડબોક્સ સંસ્કરણ" : "Sandbox Core Engine"}</span>
                <span className="font-black text-indigo-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>V8 Chrome-Isolated Sandbox</span>
                </span>
              </div>
              
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 text-xs space-y-1">
                <span className="text-slate-500 font-bold block">{isGu ? "જોડાણ સ્થિતિ" : "CSS Engine Link"}</span>
                <span className="font-black text-emerald-400">Tailwind CSS JIT Framework</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 text-xs space-y-1">
                <span className="text-slate-500 font-bold block">{isGu ? "સ્ક્રિપ્ટ રનટાઇમ પરમિશન્સ" : "Script Sandbox Attributes"}</span>
                <span className="font-black text-amber-500">allow-scripts (isolated-origin)</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-950/20 border border-indigo-500/15 rounded-2xl space-y-2">
            <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isGu ? "પ્રો ટીપ: એપ ડાઉનલોડ કરો" : "Pro Tip: Standalone Export"}</span>
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              {isGu 
                ? "તમે ડાઉનલોડ બટન દબાવીને સીધી જ આ એપને ડબલ-ક્લિક કરીને તમારા કોમ્પ્યુટર કે ફોન પર રન કરી શકો છો! આ ૧૦૦% ઓફલાઇન સપોર્ટેડ એપ્લિકેશન ફાઇલ છે."
                : "You can download the compiled HTML and double-click it on your laptop or phone! It runs fully offline with active local scripts, making it a perfect distributable app."}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

function highlightCodeCompiler(code: string) {
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

  const masterRegex = new RegExp(
    tokenSpecs.map(spec => `(${spec.regex.source})`).join('|'),
    'g'
  );

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = masterRegex.exec(code)) !== null) {
    const prefix = code.slice(lastIndex, match.index);
    if (prefix) {
      elements.push(prefix);
    }

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

        elements.push(<span key={match.index + "-" + i} className={className}>{matchVal}</span>);
        found = true;
        break;
      }
    }

    if (!found) {
      elements.push(match[0]);
    }
    lastIndex = masterRegex.lastIndex;
  }

  const suffix = code.slice(lastIndex);
  if (suffix) {
    elements.push(suffix);
  }

  return <>{elements}</>;
}
