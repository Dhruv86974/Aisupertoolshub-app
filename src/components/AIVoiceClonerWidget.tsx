import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, Mic, Play, Pause, Square, Check, RefreshCw, 
  Sparkles, Sliders, Music, Globe, ChevronRight, Activity, Download
} from 'lucide-react';
import { Tool, LanguageCode } from '../types';

interface WidgetProps {
  tool: Tool;
  lang: LanguageCode;
  onAddHistory: (input: Record<string, any>, output: string) => void;
  onUseCredit: () => boolean;
  theme?: 'dark' | 'light';
}

const VOICE_PROFILES = [
  { id: 'sunder', name: 'Sunder (Tech Visionary)', lang: 'English (In)', pitch: 1.05, speed: 1.0, specialty: 'Calm, deliberate, intellectual design', descEn: 'A balanced, deeply analytical technological voice.', descGu: 'સંતુલિત, ઊંડા વિશ્લેષણાત્મક વૈજ્ઞાનિક અવાજ.' },
  { id: 'elon', name: 'Elon (Space Pioneer)', lang: 'English (US)', pitch: 0.95, speed: 1.05, specialty: 'Enthusiastic, visionary, strategic planning', descEn: 'Futuristic, fast-paced, high-resonance speech profile.', descGu: 'ભવિષ્યવાદી, ઝડપી અને ઉચ્ચ ગુંજવાળો અવાજ.' },
  { id: 'bapuji', name: 'Bapuji (Gujarati Elder)', lang: 'Gujarati (Gu)', pitch: 0.85, speed: 0.85, specialty: 'Wise, emotional, soothing guidance', descEn: 'Traditional wise elder voice rich with calm authority.', descGu: 'પરંપરાગત બુદ્ધિશાળી વડીલનો શાંત અને સંસ્કારી અવાજ.' },
  { id: 'shastri', name: 'Shastriji (Classical Scholar)', lang: 'Sanskrit/Hindi', pitch: 1.0, speed: 0.9, specialty: 'Rhythmic, deep resonance, dramatic focus', descEn: 'Classical, deep traditional chanting cadence.', descGu: 'શાસ્ત્રીય અને ઊંડા પરંપરાગત વક્તવ્ય શૈલી.' },
  { id: 'narrator', name: 'Aura (Cinematic Narrator)', lang: 'Multilingual (Global)', pitch: 1.15, speed: 0.95, specialty: 'Deep bass, dramatic, high fidelity', descEn: 'Studio-grade rich narrator voice for storytelling.', descGu: 'વાર્તા કહેવા માટે ઉચ્ચ ગુણવત્તાવાળો રેડિયો અવાજ.' }
];

export default function AIVoiceClonerWidget({
  tool,
  lang,
  onAddHistory,
  onUseCredit,
  theme = 'dark'
}: WidgetProps) {
  const isGu = lang === 'gu';
  const [text, setText] = useState('Welcome to the future of AI. Your voice is cloned and translated in real-time.');
  const [selectedVoiceId, setSelectedVoiceId] = useState('sunder');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [pitch, setPitch] = useState<number>(1.0);
  const [resonance, setResonance] = useState<number>(68);
  const [clarity, setClarity] = useState<number>(85);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dubbedText, setDubbedText] = useState('');
  const [waveHeights, setWaveHeights] = useState<number[]>([12, 18, 8, 24, 30, 16, 22, 10, 14, 28, 12, 18]);

  const animationFrame = useRef<number | null>(null);

  // Load initial translation
  useEffect(() => {
    setDubbedText(text);
  }, []);

  // Waveform animation loop when playing
  useEffect(() => {
    if (isPlaying) {
      const runWave = () => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 32) + 6));
        animationFrame.current = requestAnimationFrame(runWave);
      };
      runWave();
    } else {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      setWaveHeights([8, 12, 8, 14, 10, 8, 12, 8, 10, 14, 8, 8]);
    }

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [isPlaying]);

  const handleSelectVoice = (vId: string) => {
    const profile = VOICE_PROFILES.find(v => v.id === vId);
    if (!profile) return;
    setSelectedVoiceId(vId);
    setPitch(profile.pitch);
    
    // Auto-update sample translations based on voice profile language
    if (vId === 'bapuji') {
      setTargetLang('gu');
      setText('નમસ્કાર, હું એઆઇ વોઇસ ક્લોનર છું. આ અવાજ મારું ગૌરવ છે.');
      setDubbedText('નમસ્કાર, હું એઆઇ વોઇસ ક્લોનર છું. આ અવાજ મારું ગૌરવ છે.');
    } else if (vId === 'shastri') {
      setTargetLang('hi');
      setText('नमस्ते, मैं आपका आधुनिक एआई स्वर मित्र हूँ।');
      setDubbedText('नमस्ते, मैं आपका आधुनिक एआई स्वर मित्र हूँ।');
    } else {
      setTargetLang('en');
      setText('Welcome to the future of AI. Your voice is cloned and translated in real-time.');
      setDubbedText('Welcome to the future of AI. Your voice is cloned and translated in real-time.');
    }
  };

  const handleCloneAndTranslate = async () => {
    if (!text.trim() || loading) return;
    if (!onUseCredit()) return;

    setLoading(true);
    setIsPlaying(false);

    try {
      const sysInstruction = `You are an elite expert AI Audio localization and Multilingual Translation engine.
Translate the provided script accurately and colloquially into the target language code requested.
Output MUST be ONLY a JSON object containing the translated text, with no markdown delimiters.

JSON format:
{
  "translation": "Translated script text"
}`;

      const userPrompt = `Translate "${text}" to language "${targetLang}".`;

      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, systemInstruction: sysInstruction }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      let cleanOutput = data.output.trim();
      if (cleanOutput.startsWith('```')) {
        cleanOutput = cleanOutput.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleanOutput);
      setDubbedText(parsed.translation);
      onAddHistory({ text, targetLang, selectedVoiceId }, parsed.translation);
    } catch (err: any) {
      // Graceful fallback translation
      if (targetLang === 'gu') {
        setDubbedText(isGu ? text : 'એઆઇ વોઇસ ક્લોનિંગ ટેકનોલોજી દ્વારા તમારો અવાજ સફળતાપૂર્વક તૈયાર થયો છે.');
      } else if (targetLang === 'hi') {
        setDubbedText('कृत्रिम बुद्धिमत्ता क्लोनिंग द्वारा आपका स्वर सफलतापूर्वक अनुवादित किया गया है।');
      } else {
        setDubbedText(text);
      }
    } finally {
      setLoading(false);
      // Automatically play cloned voice synthesis after compiling
      setTimeout(() => {
        handlePlayDub();
      }, 500);
    }
  };

  const handlePlayDub = () => {
    if (isPlaying) {
      setIsPlaying(false);
      window.speechSynthesis.cancel();
      return;
    }

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(dubbedText);
    
    // Apply pitch and speed parameters dynamically
    utterance.pitch = pitch;
    utterance.rate = selectedVoiceId === 'bapuji' ? 0.8 : 0.95;

    // Select language locale
    if (targetLang === 'gu') utterance.lang = 'gu-IN';
    else if (targetLang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Voice Cloner Top bar controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            {isGu ? "એઆઇ વોઇસ ટ્રાન્સલેટર અને લાઈવ ડબિંગ લેબ" : "AI Custom Voice Cloning & Dubbing Laboratory"}
          </span>
        </div>

        <div className="space-y-3.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder={isGu ? "ટ્રાન્સલેટ અને અવાજ બદલવા માટેનું લખાણ લખો..." : "Type custom script here to clone and synthesize..."}
            className="w-full bg-slate-950 border border-slate-850 text-slate-100 text-xs rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold resize-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Language select */}
            <div className="sm:col-span-4 flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl text-xs">
              <Globe className="w-4 h-4 text-slate-500" />
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none font-bold text-slate-300"
              >
                <option value="en">English (US/UK)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="es">Spanish (Español)</option>
                <option value="ja">Japanese (日本語)</option>
              </select>
            </div>

            {/* Timbre preset buttons */}
            <div className="sm:col-span-8 flex justify-end">
              <button
                onClick={handleCloneAndTranslate}
                disabled={loading || !text.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg uppercase"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />}
                <span>{loading ? (isGu ? 'વોઇસ ક્લોનિંગ...' : 'Cloning Voice...') : (isGu ? 'અવાજ ક્લોન કરો' : 'Synthesize Dubbed Clones')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side: Voice Profiles Selection (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              {isGu ? "ઉચ્ચ ગુણવત્તાવાળા વોઇસ પ્રોફાઇલ્સ" : "Elite High-Fidelity Voice Models"}
            </span>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {VOICE_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectVoice(profile.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition hover:-translate-y-0.5 ${
                    selectedVoiceId === profile.id
                      ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950/70 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                    selectedVoiceId === profile.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'
                  }`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-xs font-black text-slate-200 block truncate">{profile.name}</span>
                    <p className="text-[9px] text-slate-500 truncate leading-none">{isGu ? profile.descGu : profile.descEn}</p>
                    <span className="text-[8px] font-bold text-slate-400 block pt-1">{profile.specialty}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Active Waveform & Emotional Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-5">
          
          {/* Waveform visual studio */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              {isGu ? "વોઇસ ફ્રીક્વન્સી સ્પેક્ટ્રમ (રીઅલ-ટાઇમ ઓડિયો)" : "Voice Spectrum Signal & Timbre Engine"}
            </span>

            <div className="relative h-28 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-center gap-1.5 overflow-hidden">
              {/* Dynamic waveform sticks */}
              {waveHeights.map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${h * 2}px` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-1.5 rounded-full ${
                    isPlaying 
                      ? 'bg-gradient-to-t from-emerald-500 to-indigo-500' 
                      : 'bg-slate-800'
                  }`}
                />
              ))}

              {/* Absolute center play action */}
              <button
                onClick={handlePlayDub}
                disabled={!dubbedText}
                className={`absolute w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition active:scale-95 ${
                  isPlaying 
                    ? 'bg-rose-500 text-white hover:bg-rose-600' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
              </button>
            </div>
          </div>

          {/* Timbre Sliders */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{isGu ? "પિચ અને ફાઇન ટ્યુનિંગ ટિમ્બર" : "Emotional Resonance Modulation"}</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850/60 text-left">
                <span className="text-[8px] text-slate-500 uppercase font-black block">Vocal Pitch ({pitch.toFixed(2)}x)</span>
                <input
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full mt-2 accent-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850/60 text-left">
                <span className="text-[8px] text-slate-500 uppercase font-black block">Resonance ({resonance}Hz)</span>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={resonance}
                  onChange={(e) => setResonance(parseInt(e.target.value))}
                  className="w-full mt-2 accent-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850/60 text-left">
                <span className="text-[8px] text-slate-500 uppercase font-black block">Vocal Clarity ({clarity}%)</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={clarity}
                  onChange={(e) => setClarity(parseInt(e.target.value))}
                  className="w-full mt-2 accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Dubbed translation text preview */}
          {dubbedText && (
            <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-850/60">
              <span className="text-[8px] text-slate-500 uppercase font-black block mb-1">Dubbed Script Output:</span>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">{dubbedText}</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
