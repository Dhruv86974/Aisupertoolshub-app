import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { 
  Sparkles, Search, Bookmark, History, CreditCard, ChevronRight, 
  ArrowLeft, Check, RefreshCw, X, HelpCircle, Award, Volume2, Globe, Shield,
  Mail, ExternalLink, Settings, Star, Download, Mic, VolumeX, Printer, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TOOLS_DATA } from './data/tools';
import { Tool, ToolCategory, UserState, HistoryItem, Note, LanguageCode, TRANSLATIONS } from './types';
import InteractiveWidgets from './components/InteractiveWidgets';
import AuthScreen from './components/AuthScreen';
import ProfileModal from './components/ProfileModal';
import GlobalOperationsHub from './components/GlobalOperationsHub';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, executeResilientDbOp } from './firebase';

// --- Global Procedural Synthesizer for Immersive Micro-Sounds ---
const playSynthSound = (type: 'click' | 'success' | 'rate' | 'chime' | 'laser' | 'toggle') => {
  if (typeof window === 'undefined') return;
  const soundMuted = localStorage.getItem('hub_sound_muted') === 'true';
  if (soundMuted) return;

  const rawVol = localStorage.getItem('hub_sound_volume');
  const volumeMultiplier = rawVol !== null ? parseFloat(rawVol) : 0.6;

  const rawPitch = localStorage.getItem('hub_sound_pitch');
  const pitchMultiplier = rawPitch !== null ? parseFloat(rawPitch) : 1.0;

  const soundScheme = localStorage.getItem('hub_sound_scheme') || 'retro'; // 'retro' | 'ambient' | 'scifi' | 'minimal'

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const createOscAndGain = (t: OscillatorType, startFreq: number, endFreq: number, duration: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = t;
      osc.frequency.setValueAtTime(startFreq * pitchMultiplier, now);
      if (endFreq !== startFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq * pitchMultiplier, now + duration);
      }
      gain.gain.setValueAtTime(gainVal * volumeMultiplier, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    };

    if (soundScheme === 'scifi') {
      if (type === 'click') {
        createOscAndGain('sawtooth', 800, 300, 0.08, 0.05);
      } else if (type === 'success') {
        createOscAndGain('sine', 400, 1200, 0.3, 0.06);
        createOscAndGain('triangle', 600, 1800, 0.35, 0.04);
      } else if (type === 'rate') {
        createOscAndGain('sawtooth', 300, 900, 0.25, 0.04);
      } else if (type === 'toggle') {
        createOscAndGain('sine', 150, 600, 0.15, 0.06);
      } else if (type === 'chime') {
        createOscAndGain('sine', 880, 440, 0.4, 0.06);
      } else if (type === 'laser') {
        createOscAndGain('sawtooth', 2000, 80, 0.3, 0.06);
      }
    } else if (soundScheme === 'ambient') {
      if (type === 'click') {
        createOscAndGain('sine', 300, 200, 0.12, 0.08);
      } else if (type === 'success') {
        [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(f * pitchMultiplier, now + i * 0.08);
          g.gain.setValueAtTime(0, now + i * 0.08);
          g.gain.linearRampToValueAtTime(0.06 * volumeMultiplier, now + i * 0.08 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.4);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.55);
        });
      } else if (type === 'rate') {
        createOscAndGain('sine', 440, 554.37, 0.3, 0.07);
      } else if (type === 'toggle') {
        createOscAndGain('sine', 330, 440, 0.2, 0.07);
      } else if (type === 'chime') {
        createOscAndGain('sine', 523.25, 523.25, 0.6, 0.08);
      } else if (type === 'laser') {
        createOscAndGain('sine', 600, 400, 0.2, 0.05);
      }
    } else if (soundScheme === 'minimal') {
      if (type === 'click') {
        createOscAndGain('triangle', 600, 550, 0.03, 0.06);
      } else if (type === 'success') {
        createOscAndGain('triangle', 600, 800, 0.1, 0.08);
      } else if (type === 'rate') {
        createOscAndGain('sine', 440, 480, 0.08, 0.06);
      } else if (type === 'toggle') {
        createOscAndGain('triangle', 250, 300, 0.05, 0.08);
      } else if (type === 'chime') {
        createOscAndGain('sine', 600, 600, 0.15, 0.06);
      } else if (type === 'laser') {
        createOscAndGain('sine', 1000, 800, 0.08, 0.04);
      }
    } else {
      // Default 'retro'
      if (type === 'click') {
        createOscAndGain('sine', 580, 140, 0.08, 0.06);
      } else if (type === 'success') {
        const freqs = [329.63, 392.00, 523.25, 659.25];
        freqs.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(f * pitchMultiplier, now + i * 0.06);
          g.gain.setValueAtTime(0, now + i * 0.06);
          g.gain.linearRampToValueAtTime(0.04 * volumeMultiplier, now + i * 0.06 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.3);
          o.start(now + i * 0.06);
          o.stop(now + i * 0.06 + 0.35);
        });
      } else if (type === 'rate') {
        createOscAndGain('triangle', 440, 880, 0.2, 0.05);
      } else if (type === 'toggle') {
        createOscAndGain('sine', 350, 500, 0.12, 0.05);
      } else if (type === 'chime') {
        createOscAndGain('sine', 659.25, 659.25, 0.4, 0.05);
      } else if (type === 'laser') {
        createOscAndGain('sawtooth', 1000, 150, 0.25, 0.03);
      }
    }
  } catch (err) {
    // Web audio contextual errors
  }
};

// Dynamic Icon Renderer
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name] || HelpCircle;
  return <IconComponent className={className} />;
};

// Sound Presets List definition
const SOUND_PRESETS = [
  { id: 'arcade', nameEn: 'Arcade Retro', nameGu: 'આર્કેડ રેટ્રો', scheme: 'retro' as const, volume: 0.6, pitch: 1.0 },
  { id: 'dream', nameEn: 'Ambient Dream', nameGu: 'એમ્બિયન્ટ ડ્રીમ', scheme: 'ambient' as const, volume: 0.5, pitch: 0.8 },
  { id: 'laser', nameEn: 'Cyber Laser', nameGu: 'સાય-ફાય લેઝર', scheme: 'scifi' as const, volume: 0.6, pitch: 1.4 },
  { id: 'minimal', nameEn: 'Minimal Click', nameGu: 'મિનિમલ ક્લિક', scheme: 'minimal' as const, volume: 0.4, pitch: 0.9 },
  { id: 'cosmic', nameEn: 'Cosmic Shift', nameGu: 'કોસ્મિક શિફ્ટ', scheme: 'scifi' as const, volume: 0.6, pitch: 1.8 }
];

export interface AdsConfig {
  activeMode: 'google' | 'custom' | 'script' | 'none';
  customTitleEn: string;
  customTitleGu: string;
  customDescriptionEn: string;
  customDescriptionGu: string;
  customImageUrl: string;
  customRedirectUrl: string;
  googleAdsenseClientId: string;
  googleAdsenseSlotId: string;
  customScriptCode: string; // Dynamic HTML/JS Ad code (Adsterra, PropellerAds, etc.)
}

const CustomScriptAd = ({ scriptCode }: { scriptCode: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      try {
        const range = document.createRange();
        const documentFragment = range.createContextualFragment(scriptCode || '');
        containerRef.current.appendChild(documentFragment);
      } catch (err) {
        console.warn('[CustomAdScript] Failed to inject dynamic script:', err);
      }
    }
  }, [scriptCode]);

  return <div ref={containerRef} className="w-full flex justify-center items-center overflow-hidden min-h-[90px]" />;
};

const GoogleAdSenseAd = ({ clientId, slotId }: { clientId: string; slotId: string }) => {
  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e) {
      console.warn('[AdSense] Individual ad block delayed/failed initialization:', e);
    }
  }, [clientId, slotId]);

  return (
    <ins className="adsbygoogle"
         style={{ display: 'block', width: '100%', minHeight: '90px' }}
         data-ad-client={clientId}
         data-ad-slot={slotId}
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
};

const AdBanner = ({ config, theme, lang }: { config: AdsConfig; theme: 'dark' | 'light'; lang: 'en' | 'gu' }) => {
  if (config.activeMode === 'none') return null;

  const isGu = lang === 'gu';
  const title = isGu ? config.customTitleGu : config.customTitleEn;
  const description = isGu ? config.customDescriptionGu : config.customDescriptionEn;

  if (config.activeMode === 'google') {
    return (
      <div className={`my-6 p-4.5 rounded-3xl border ${theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-slate-50 border-slate-200'} text-center overflow-hidden relative shadow-sm`}>
        <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase block mb-2">{isGu ? "પ્રાયોજિત જાહેરાત (GOOGLE ADSENSE)" : "SPONSORED ADVERTISEMENT (GOOGLE ADSENSE)"}</span>
        <div className="flex flex-col items-center justify-center min-h-[120px] bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 p-4">
          <GoogleAdSenseAd clientId={config.googleAdsenseClientId} slotId={config.googleAdsenseSlotId} />
          <div className="text-center mt-3 pt-2.5 border-t border-slate-800/25 w-full">
            <span className="text-[10px] font-mono text-slate-500 block">Publisher ID: {config.googleAdsenseClientId} • Ad Slot: {config.googleAdsenseSlotId}</span>
          </div>
        </div>
      </div>
    );
  }

  if (config.activeMode === 'script') {
    return (
      <div className={`my-6 p-4.5 rounded-3xl border ${theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-slate-50 border-slate-200'} text-center overflow-hidden relative shadow-sm`}>
        <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase block mb-2">{isGu ? "પ્રાયોજિત સ્ક્રિપ્ટ એડ (ADSTERRA / ALTERNATIVE)" : "SPONSORED AD (ADSTERRA / SCRIPT)"}</span>
        <div className="flex flex-col items-center justify-center min-h-[120px] bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 p-4">
          <CustomScriptAd scriptCode={config.customScriptCode} />
          <div className="text-center mt-3 pt-2.5 border-t border-slate-800/25 w-full">
            <span className="text-[10px] font-mono text-slate-500 block">{isGu ? "બાહ્ય સ્ક્રિપ્ટ લોડ થઈ ગઈ છે" : "External ad script rendered dynamically"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <a 
      href={config.customRedirectUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block my-6 group active:scale-[0.99] transition-transform duration-100"
    >
      <div className={`relative rounded-3xl border p-5 md:p-6 overflow-hidden flex flex-col md:flex-row items-center gap-5 justify-between transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-indigo-950/20 via-[#090d16] to-slate-950 border-slate-900 hover:border-indigo-500/40' 
          : 'bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border-slate-200 hover:border-indigo-500/30 shadow-md'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
        
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          {config.customImageUrl && (
            <img 
              src={config.customImageUrl} 
              alt="Sponsor Banner" 
              className="w-20 h-20 rounded-2xl object-cover border border-slate-800/20 shadow-lg shrink-0" 
              referrerPolicy="no-referrer"
            />
          )}
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400 font-extrabold tracking-widest uppercase">
              <span>{isGu ? "પ્રાયોજિત જાહેરાત" : "SPONSORED AD"}</span>
            </div>
            <h4 className={`text-sm md:text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-indigo-400 transition-colors`}>
              {title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-semibold">
              {description}
            </p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
          theme === 'dark' 
            ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-505 group-hover:text-slate-950' 
            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 group-hover:bg-indigo-500'
        }`}>
          {isGu ? "વધુ જાણઓ ➔" : "Learn More ➔"}
        </div>
      </div>
    </a>
  );
};

export default function App() {
  // --- Persistent States ---
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('hub_lang');
    return (saved as LanguageCode) || 'en';
  });

  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('hub_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...parsed,
            isLoggedIn: parsed.isLoggedIn ?? false
          };
        }
      } catch (e) {
        // Fallback
      }
    }
    return {
      id: 'usr-sutex-bca',
      email: 'dhruvtarsariya3@gmail.com',
      name: 'Dhruv Tarsariya',
      username: 'dhruvtarsariya',
      tier: 'elite',
      credits: 999999,
      favorites: ['ai-chat', 'website-generator', 'rich-notes', 'sutex-bca-assistant', 'pitch-deck-generator'],
      history: [],
      savedNotes: [],
      isLoggedIn: true
    };
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem('hub_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('hub_user', JSON.stringify(userState));
  }, [userState]);

  // --- Firebase Firestore Bi-directional Real-Time Synchronizer ---
  useEffect(() => {
    if (!userState.isLoggedIn || !userState.id) return;

    executeResilientDbOp(async (currentDb) => {
      const userDocRef = doc(currentDb, 'users', userState.id);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        setUserState(prev => ({
          ...prev,
          credits: typeof cloudData.credits === 'number' ? cloudData.credits : prev.credits,
          tier: cloudData.tier || prev.tier,
          favorites: Array.isArray(cloudData.favorites) ? cloudData.favorites : prev.favorites,
          savedNotes: Array.isArray(cloudData.savedNotes) ? cloudData.savedNotes : prev.savedNotes,
          history: Array.isArray(cloudData.history) ? cloudData.history : prev.history,
          college: cloudData.college || prev.college || '',
          semester: cloudData.semester || prev.semester || '',
        }));
      } else {
        await setDoc(userDocRef, {
          email: userState.email || '',
          name: userState.name || '',
          username: userState.username || '',
          tier: userState.tier || 'free',
          credits: typeof userState.credits === 'number' ? userState.credits : 30,
          favorites: userState.favorites || [],
          savedNotes: userState.savedNotes || [],
          history: userState.history || [],
          college: userState.college || '',
          semester: userState.semester || '',
          updatedAt: new Date().toISOString()
        });
      }
    }).catch(err => {
      console.warn("Firestore resilient sync failed:", err);
    });
  }, [userState.isLoggedIn, userState.id]);

  useEffect(() => {
    if (!userState.isLoggedIn || !userState.id) return;
    
    const timeoutId = setTimeout(() => {
      executeResilientDbOp(async (currentDb) => {
        const userDocRef = doc(currentDb, 'users', userState.id);
        await setDoc(userDocRef, {
          email: userState.email || '',
          name: userState.name || '',
          username: userState.username || '',
          tier: userState.tier || 'free',
          credits: typeof userState.credits === 'number' ? userState.credits : 30,
          favorites: userState.favorites || [],
          savedNotes: userState.savedNotes || [],
          history: userState.history || [],
          college: userState.college || '',
          semester: userState.semester || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }).catch(err => console.warn("Firestore sync update failed:", err));
    }, 1200); // Debounce to keep writes optimal

    return () => clearTimeout(timeoutId);
  }, [
    userState.credits, 
    userState.tier, 
    JSON.stringify(userState.favorites), 
    JSON.stringify(userState.savedNotes), 
    JSON.stringify(userState.history),
    userState.college,
    userState.semester
  ]);

  const [adsConfig, setAdsConfig] = useState<AdsConfig>(() => {
    const saved = localStorage.getItem('hub_ads_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically migrate placeholder ID to your real verified AdSense ID!
        if (parsed.googleAdsenseClientId === 'ca-pub-1234567890123456' || !parsed.googleAdsenseClientId) {
          parsed.googleAdsenseClientId = 'ca-pub-7594598332182178';
        }
        return parsed;
      } catch (e) {}
    }
    return {
      activeMode: 'custom',
      customTitleEn: 'Promote your products or services here!',
      customTitleGu: 'અહીં તમારી બ્રાન્ડ અથવા પ્રોડક્ટ્સ પ્રમોટ કરો!',
      customDescriptionEn: 'Get exposure to thousands of local students, designers, and developers. Click to sponsor!',
      customDescriptionGu: 'ગુજરાતી યુઝર્સ અને ડેવલપર્સ સુધી ડાયરેક્ટ પહોંચો. તમારી લિંક સેટ કરવા માટે ક્લિક કરો!',
      customImageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?q=80&w=600&auto=format&fit=crop',
      customRedirectUrl: 'mailto:dhruvtarsariya3@gmail.com?subject=Advertise on AI Super Tools Hub',
      googleAdsenseClientId: 'ca-pub-7594598332182178',
      googleAdsenseSlotId: '1234567890',
      customScriptCode: '<!-- Paste Adsterra banner or native script here -->'
    };
  });

  useEffect(() => {
    localStorage.setItem('hub_ads_config', JSON.stringify(adsConfig));
  }, [adsConfig]);

  // Dynamically load Google AdSense script into document head when enabled
  useEffect(() => {
    if (adsConfig.activeMode === 'google' && adsConfig.googleAdsenseClientId) {
      const cleanClientId = adsConfig.googleAdsenseClientId.trim();
      const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
      if (existingScript) {
        // Remove old script to allow update if ID changed
        if (!existingScript.getAttribute('src')?.includes(cleanClientId)) {
          existingScript.remove();
        } else {
          return;
        }
      }
      
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cleanClientId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      console.log('[AdSense] Dynamic script successfully injected for client:', cleanClientId);
    }
  }, [adsConfig.activeMode, adsConfig.googleAdsenseClientId]);

  // --- UPI Merchant Configuration State ---
  const [upiId, setUpiId] = useState<string>(() => {
    return localStorage.getItem('hub_upi_id') || '9328951054@fam';
  });

  useEffect(() => {
    localStorage.setItem('hub_upi_id', upiId);
  }, [upiId]);

  // --- Theme State (Dark / Light) ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('hub_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('hub_theme', theme);
  }, [theme]);

  // --- Click-to-Open Language Dropdown State ---
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // --- UPI Verification & Live Merchant Queue State ---
  const [userPendingTx, setUserPendingTx] = useState<any | null>(() => {
    const saved = localStorage.getItem('hub_user_pending_tx');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (userPendingTx) {
      localStorage.setItem('hub_user_pending_tx', JSON.stringify(userPendingTx));
    } else {
      localStorage.removeItem('hub_user_pending_tx');
    }
  }, [userPendingTx]);

  const [pendingTransactions, setPendingTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('hub_pending_txs');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'tx-101', email: 'guest_user42@gmail.com', senderName: 'Rahul Patel', utr: '620194857361', plan: 'pro', amount: '149', timestamp: Date.now() - 3600000 },
      { id: 'tx-102', email: 'pro_designer@live.com', senderName: 'Aarav Shah', utr: '620194883472', plan: 'elite', amount: '1999', timestamp: Date.now() - 1200000 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('hub_pending_txs', JSON.stringify(pendingTransactions));
  }, [pendingTransactions]);

  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [senderNameInput, setSenderNameInput] = useState('');
  const [utrInput, setUtrInput] = useState('');

  // --- Global Notification System (Toasts Stack) ---
  const toastCounterRef = React.useRef(0);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'info' | 'error' }>>([]);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    toastCounterRef.current += 1;
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${toastCounterRef.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // --- Tool Onboarding Tour Step ---
  const [tourStep, setTourStep] = useState<number | null>(null);

  // --- Tool Specific Interactive Tutorial Drawer ---
  const [showToolTutorial, setShowToolTutorial] = useState(false);

  // --- Favorite Categories & Folder State ---
  const [activeFavCategoryFilter, setActiveFavCategoryFilter] = useState<'all' | 'work' | 'personal' | 'study'>('all');
  const [favoritesCategories, setFavoritesCategories] = useState<Record<string, 'work' | 'personal' | 'study'>>(() => {
    const saved = localStorage.getItem('hub_favorites_categories');
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem('hub_favorites_categories', JSON.stringify(favoritesCategories));
  }, [favoritesCategories]);
  const [showMoveMenuForToolId, setShowMoveMenuForToolId] = useState<string | null>(null);

  // --- Selected History IDs for Bulk Actions ---
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);

  // --- Multi-language Localization Helper Map ---
  const LOCALIZED_TEXT: Record<LanguageCode, Record<string, string>> = {
    en: {
      startTour: "Start Tutorial Tour",
      tourNext: "Next",
      tourPrev: "Back",
      tourFinish: "Finish Tour",
      tourWelcomeTitle: "Welcome to AI Super Tools Hub! 🚀",
      tourWelcomeDesc: "Let's take a 1-minute quick guided tour of your powerful new tools platform.",
      tourSearchTitle: "Smarter Filters & Search 🔍",
      tourSearchDesc: "Filter by Access Tier (Free or Pro), custom tags (Popular, Favorites), and Sort alphabetical/ratings/usage.",
      tourGridTitle: "Launch & Compare Tools 🛠️",
      tourGridDesc: "Toggle Comparison Mode to place any two tools side-by-side to compare cost, rating, and features before running.",
      tourGoalsTitle: "Daily Goals & Audio 🎯",
      tourGoalsDesc: "Track interactive goals, gain rewards, and customize the procedural retro synth sound engine's scheme, volume, and pitch.",
      tourFavsTitle: "Organized Favorites & History 📂",
      tourFavsDesc: "Categorize your favorites into Work, Personal, and Study folders, and use bulk action delete to manage history.",
      favCatAll: "All Favorites",
      favCatWork: "💼 Work",
      favCatPersonal: "🏠 Personal",
      favCatStudy: "📚 Study",
      favMoveTo: "Move to",
      bulkDelete: "Bulk Delete Selected",
      clearAllHistory: "Clear All History",
      historySelected: "items selected",
      dailyGoalTitle: "Daily Goal Tracker",
      dailyGoalSub: "Complete targets daily to maintain active productivity",
      goalsCompletedToast: "Goal Completed!",
      goalUseTools: "Run 2 different tools",
      goalFavOrRate: "Favorite or rate any tool",
      goalSmartReco: "Visit suggested smart tool",
      soundTitle: "Sound Customization",
      soundSub: "Tune procedural synthesizers & micro-audio theme",
      soundSchemeLabel: "Sound Scheme:",
      volumeLabel: "Volume Level",
      pitchLabel: "Frequency Pitch"
    },
    gu: {
      startTour: "માર્ગદર્શિકા શરૂ કરો",
      tourNext: "આગળ",
      tourPrev: "પાછળ",
      tourFinish: "પૂર્ણ",
      tourWelcomeTitle: "એઆઈ સુપર ટૂલ્સ હબમાં આપનું સ્વાગત છે! 🚀",
      tourWelcomeDesc: "તમારા શક્તિશાળી નવા સાધનોના પ્લેટફોર્મની ૧ મિનિટની ઝડપી માર્ગદર્શિત સફર લઈએ.",
      tourSearchTitle: "સ્માર્ટ ફિલ્ટર્સ અને શોધ 🔍",
      tourSearchDesc: "ઍક્સેસ ટિયર (ફ્રી અથવા પ્રો), કસ્ટમ ટૅગ્સ અને સોર્ટિંગ વડે સાધનો ઝડપથી શોધો.",
      tourGridTitle: "ટૂલ્સ ચલાવો અને સરખામણી કરો 🛠️",
      tourGridDesc: "કોઈપણ ૨ સાધનોની કિંમત, રેટિંગ અને સુવિધાઓની સમાંતર સરખામણી કરવા માટે કમ્પેર મોડ ચાલુ કરો.",
      tourGoalsTitle: "દૈનિક લક્ષ્યો અને ઓડિયો 🎯",
      tourGoalsDesc: "ઇન્ટરેક્ટિવ લક્ષ્યોને ટ્રૅક કરો, પુરસ્કારો મેળવો અને અવાજની થીમ, વોલ્યુમ અને પીચ બદલો.",
      tourFavsTitle: "સંગઠિત મનપસંદ અને ઇતિહાસ 📂",
      tourFavsDesc: "તમારા મનપસંદ સાધનોને કામ, વ્યક્તિગત અને અભ્યાસ ફોલ્ડર્સમાં વર્ગીકૃત કરો, અને હિસ્ટ્રી એકસાથે સાફ કરો.",
      favCatAll: "બધા ફેવરિટ",
      favCatWork: "💼 કામ",
      favCatPersonal: "🏠 વ્યક્તિગત",
      favCatStudy: "📚 અભ્યાસ",
      favMoveTo: "અહીં ખસેડો",
      bulkDelete: "પસંદ કરેલ ડિલીટ કરો",
      clearAllHistory: "બધો ઇતિહાસ સાફ કરો",
      historySelected: "આઇટમ્સ પસંદ કરેલ છે",
      dailyGoalTitle: "દૈનિક લક્ષ્ય ટ્રેકર",
      dailyGoalSub: "દરરોજ સાધનો ચલાવીને અને રેટિંગ આપીને તમારા ધ્યેયો પૂરા કરો",
      goalsCompletedToast: "ધ્યેય પૂર્ણ થયો!",
      goalUseTools: "૨ અલગ અલગ ટૂલ્સ ચલાવો",
      goalFavOrRate: "ટૂલને ફેવરિટ અથવા રેટ કરો",
      goalSmartReco: "ભલામણ કરેલ ટૂલ ખોલો",
      soundTitle: "ધ્વનિ કસ્ટમાઇઝેશન",
      soundSub: "સિસ્ટમ સાઉન્ડ સ્કીમ અને ઓડિયો પીચ બદલો",
      soundSchemeLabel: "ધ્વનિ થીમ:",
      volumeLabel: "વોલ્યુમ સ્તર",
      pitchLabel: "આવર્તન પીચ"
    },
    es: {
      startTour: "Iniciar Tutorial",
      tourNext: "Siguiente",
      tourPrev: "Atrás",
      tourFinish: "Terminar",
      tourWelcomeTitle: "¡Bienvenido a AI Super Tools Hub! 🚀",
      tourWelcomeDesc: "Hagamos un recorrido rápido guiado de 1 minuto por su nueva plataforma.",
      tourSearchTitle: "Filtros inteligentes y búsqueda 🔍",
      tourSearchDesc: "Filtre por nivel de acceso (gratuito o Pro), etiquetas personalizadas y ordenación.",
      tourGridTitle: "Iniciar y comparar herramientas 🛠️",
      tourGridDesc: "Active el modo de comparación para colocar dos herramientas juntas y comparar costo, calificación y funciones.",
      tourGoalsTitle: "Metas diarias y audio 🎯",
      tourGoalsDesc: "Realice un seguimiento de metas, obtenga recompensas y personalice el volumen, tono y esquema del sintetizador.",
      tourFavsTitle: "Favoritos organizados e historial 📂",
      tourFavsDesc: "Organice sus favoritos en carpetas de Trabajo, Personal y Estudio, y elimine el historial en masa.",
      favCatAll: "Todos los favoritos",
      favCatWork: "💼 Trabajo",
      favCatPersonal: "🏠 Personal",
      favCatStudy: "📚 Estudio",
      favMoveTo: "Mover a",
      bulkDelete: "Eliminar seleccionados",
      clearAllHistory: "Borrar todo el historial",
      historySelected: "elementos seleccionados",
      dailyGoalTitle: "Seguimiento de metas diarias",
      dailyGoalSub: "Complete objetivos diariamente para mantener la productividad activa",
      goalsCompletedToast: "¡Objetivo completado!",
      goalUseTools: "Ejecutar 2 herramientas diferentes",
      goalFavOrRate: "Marcar como favorito o calificar",
      goalSmartReco: "Visitar herramienta recomendada",
      soundTitle: "Personalización de sonido",
      soundSub: "Ajuste el sintetizador procedural y el volumen",
      soundSchemeLabel: "Esquema de sonido:",
      volumeLabel: "Nivel de volumen",
      pitchLabel: "Tono de frecuencia"
    },
    hi: {
      startTour: "ट्यूटोरियल शुरू करें",
      tourNext: "अगला",
      tourPrev: "पीछे",
      tourFinish: "समाप्त",
      tourWelcomeTitle: "AI Super Tools Hub में आपका स्वागत है! 🚀",
      tourWelcomeDesc: "आइए आपके शक्तिशाली नए टूल प्लेटफ़ॉर्म का 1 मिनट का त्वरित निर्देशित दौरा करें।",
      tourSearchTitle: "स्मार्ट फिल्टर और खोज 🔍",
      tourSearchDesc: "एक्सेस स्तर (फ्री या प्रो), कस्टम टैग और सॉर्टिंग द्वारा टूल फ़िल्टर करें।",
      tourGridTitle: "टूल चलाएं और तुलना करें 🛠️",
      tourGridDesc: "लागत, रेटिंग और सुविधाओं की तुलना करने के लिए तुलना मोड चालू करें।",
      tourGoalsTitle: "दैनिक लक्ष्य और ऑडियो 🎯",
      tourGoalsDesc: "दैनिक लक्ष्यों को ट्रैक करें, पुरस्कार अर्जित करें और सिंथ ध्वनि योजना, वॉल्यूम और पिच को अनुकूलित करें।",
      tourFavsTitle: "पसंदीदा और इतिहास 📂",
      tourFavsDesc: "अपने पसंदीदा टूल को कार्य, व्यक्तिगत और अध्ययन श्रेणियों में विभाजित करें और इतिहास थोक में हटाएं।",
      favCatAll: "सभी पसंदीदा",
      favCatWork: "💼 कार्य",
      favCatPersonal: "🏠 व्यक्तिगत",
      favCatStudy: "📚 अध्ययन",
      favMoveTo: "यहाँ ले जाएँ",
      bulkDelete: "चयनित हटाएं",
      clearAllHistory: "इतिहास साफ़ करें",
      historySelected: "आइटम चयनित हैं",
      dailyGoalTitle: "दैनिक लक्ष्य ट्रैकर",
      dailyGoalSub: "उत्पादकता बनाए रखने के लिए दैनिक लक्ष्यों को पूरा करें",
      goalsCompletedToast: "लक्ष्य पूरा हुआ!",
      goalUseTools: "2 अलग-अलग टूल चलाएं",
      goalFavOrRate: "किसी भी टूल को पसंदीदा या रेट करें",
      goalSmartReco: "अनुशंसित स्मार्ट टूल खोलें",
      soundTitle: "ध्वनि अनुकूलन",
      soundSub: "सिंथेटिक ध्वनियों और ऑडियो पिच को बदलें",
      soundSchemeLabel: "ध्वनि थीम:",
      volumeLabel: "वॉल्यूम स्तर",
      pitchLabel: "आवृत्ति पिच"
    },
    ja: {
      startTour: "チュートリアルを開始",
      tourNext: "次へ",
      tourPrev: "戻る",
      tourFinish: "ツアーを終了",
      tourWelcomeTitle: "AI Super Tools Hubへようこそ！ 🚀",
      tourWelcomeDesc: "この高機能ツールプラットフォームの使い方を1分間でツアーしましょう。",
      tourSearchTitle: "スマートフィルター＆検索 🔍",
      tourSearchDesc: "アクセスレベル（無料/プロ）、カスタムタグ、アルファベット順・評価順・使用頻度順でフィルターします。",
      tourGridTitle: "ツールの起動と比較 🛠️",
      tourGridDesc: "比較モードを有効にすると、2つのツールのコストや評価、機能を左右に並べて比較できます。",
      tourGoalsTitle: "デイリー目標＆オーディオ設定 🎯",
      tourGoalsDesc: "デイリー目標をクリアして報酬を得ましょう。また、シンセサイザーの音色や音量、ピッチを調整できます。",
      tourFavsTitle: "整理されたお気に入りと履歴 📂",
      tourFavsDesc: "お気に入りを仕事、個人、学習フォルダに整理し、履歴を一括削除できます。",
      favCatAll: "すべてのお気に入り",
      favCatWork: "💼 仕事",
      favCatPersonal: "🏠 個人用",
      favCatStudy: "📚 学習",
      favMoveTo: "フォルダに移動",
      bulkDelete: "選択した履歴を削除",
      clearAllHistory: "すべての履歴をクリア",
      historySelected: "個選択中",
      dailyGoalTitle: "デイリー目標トラッカー",
      dailyGoalSub: "毎日目標を達成してアクティブな生産性を維持しましょう",
      goalsCompletedToast: "目標を達成しました！",
      goalUseTools: "2つの異なるツールを実行する",
      goalFavOrRate: "お気に入り登録または評価を行う",
      goalSmartReco: "おすすめのツールを開く",
      soundTitle: "サウンドカスタマイズ",
      soundSub: "シンセサイザーの音色と音響テーマを調整します",
      soundSchemeLabel: "サウンドテーマ:",
      volumeLabel: "音量レベル",
      pitchLabel: "周波数ピッチ"
    }
  };

  // --- Tool Search History ---
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('hub_search_history');
    return saved ? JSON.parse(saved) : ['AI Chat', 'Website Generator', 'OCR Reader', 'Rich Notes'];
  });
  const addToSearchHistory = (term: string) => {
    if (!term || term.trim() === '') return;
    setSearchHistory(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      const updated = [term.trim(), ...filtered].slice(0, 6);
      localStorage.setItem('hub_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  // --- Keyboard Shortcuts ---
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // --- Tool Ratings State ---
  const [toolRatings, setToolRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('hub_tool_ratings');
    return saved ? JSON.parse(saved) : {};
  });

  const handleRateTool = (toolId: string, rating: number) => {
    playSynthSound('rate');
    setToolRatings(prev => {
      const updated = { ...prev, [toolId]: rating };
      localStorage.setItem('hub_tool_ratings', JSON.stringify(updated));
      return updated;
    });
    updateGoalProgress('favorite_or_rate');
    showToast(lang === 'gu' ? `સફળતાપૂર્વક ${rating} સ્ટાર રેટિંગ આપ્યું!` : `Successfully rated ${rating} stars!`, 'success');
  };

  // --- Dynamic AI Tool Suggestions Engine ---
  const suggestedTools = useMemo(() => {
    // 1. Get IDs of tools the user has historically run or added to favorites
    const interactedIds = new Set([
      ...userState.history.map(h => h.toolId),
      ...userState.favorites
    ]);

    // 2. Filter down to tools that have NOT been actively utilized or added to favorites yet
    let pool = TOOLS_DATA.filter(t => !interactedIds.has(t.id));

    // Fallback if they have used everything (which is unlikely), just use all tools
    if (pool.length === 0) {
      pool = TOOLS_DATA;
    }

    // 3. Score tools: Prioritize those with high system ratings, 'Popular' tags, or from categories matching their last used tool
    const lastUsedToolId = userState.history[0]?.toolId;
    const lastUsedTool = lastUsedToolId ? TOOLS_DATA.find(t => t.id === lastUsedToolId) : null;
    const lastCategory = lastUsedTool?.category;

    const scored = pool.map(tool => {
      let score = 0;
      if (tool.tags?.includes('Popular')) score += 3;
      if (tool.tags?.includes('New')) score += 2;
      if (lastCategory && tool.category === lastCategory) score += 5; // highly match their preferred category
      
      const avgRating = toolRatings[tool.id] || 4.5;
      score += avgRating;

      return { tool, score };
    });

    // Sort by descending score and pick top 3 recommendations
    return scored
      .sort((a, b) => b.score - a.score)
      .map(item => item.tool)
      .slice(0, 3);
  }, [userState.history, userState.favorites, toolRatings]);

  // --- Search Filters states ---
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [tagFilter, setTagFilter] = useState<'all' | 'Popular' | 'New' | 'Favorites'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'name-desc' | 'rating' | 'rating-asc' | 'usage' | 'usage-asc' | 'popular'>('name');
  const [gridAnimStyle, setGridAnimStyle] = useState<'fade-slide' | 'zoom-pop' | 'stagger' | 'flip'>(() => {
    return (localStorage.getItem('hub_grid_anim') as any) || 'fade-slide';
  });

  useEffect(() => {
    localStorage.setItem('hub_grid_anim', gridAnimStyle);
  }, [gridAnimStyle]);

  // --- Daily Goal Tracker State & Logic ---
  const [dailyGoals, setDailyGoals] = useState<Array<{ id: string; textEn: string; textGu: string; current: number; target: number; completed: boolean }>>(() => {
    const saved = localStorage.getItem('hub_daily_goals');
    const savedDate = localStorage.getItem('hub_daily_goals_date');
    const today = new Date().toDateString();

    if (saved && savedDate === today) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }

    return [
      { id: 'use_tools', textEn: 'Run 2 different tools', textGu: '૨ અલગ અલગ ટૂલ્સ ચલાવો', current: 0, target: 2, completed: false },
      { id: 'favorite_or_rate', textEn: 'Favorite or rate any tool', textGu: 'ટૂલને ફેવરિટ અથવા રેટ કરો', current: 0, target: 1, completed: false },
      { id: 'smart_reco', textEn: 'Visit suggested smart tool', textGu: 'ભલામણ કરેલ ટૂલ ખોલો', current: 0, target: 1, completed: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('hub_daily_goals', JSON.stringify(dailyGoals));
    localStorage.setItem('hub_daily_goals_date', new Date().toDateString());
  }, [dailyGoals]);

  const updateGoalProgress = (goalId: string, increment = 1) => {
    setDailyGoals(prev => prev.map(g => {
      if (g.id === goalId && !g.completed) {
        const nextVal = Math.min(g.target, g.current + increment);
        const completed = nextVal >= g.target;
        if (completed) {
          setTimeout(() => playSynthSound('success'), 100);
          const goalKey = g.id === 'use_tools' ? 'goalUseTools' : g.id === 'favorite_or_rate' ? 'goalFavOrRate' : 'goalSmartReco';
          const titleText = LOCALIZED_TEXT[lang]?.goalsCompletedToast || 'Goal Completed!';
          const descText = LOCALIZED_TEXT[lang]?.[goalKey] || g.textEn;
          showToast(`${titleText} ${descText}`, 'success');
        }
        return { ...g, current: nextVal, completed };
      }
      return g;
    }));
  };

  // --- Tool Comparison Mode ---
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparedToolIds, setComparedToolIds] = useState<string[]>([]);

  const toggleCompareTool = (toolId: string) => {
    setComparedToolIds(prev => {
      if (prev.includes(toolId)) {
        playSynthSound('click');
        return prev.filter(id => id !== toolId);
      }
      if (prev.length >= 2) {
        showToast(lang === 'gu' ? 'મહત્તમ ૨ ટૂલ્સ સરખાવી શકાય!' : 'Max 2 tools can be compared!', 'info');
        playSynthSound('click');
        return prev;
      }
      playSynthSound('success');
      return [...prev, toolId];
    });
  };

  // --- Sound Customization States ---
  const [soundScheme, setSoundSchemeState] = useState<'retro' | 'ambient' | 'scifi' | 'minimal'>(() => {
    return (localStorage.getItem('hub_sound_scheme') as any) || 'retro';
  });
  const [soundVolume, setSoundVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('hub_sound_volume');
    return saved !== null ? parseFloat(saved) : 0.6;
  });
  const [soundPitch, setSoundPitchState] = useState<number>(() => {
    const saved = localStorage.getItem('hub_sound_pitch');
    return saved !== null ? parseFloat(saved) : 1.0;
  });

  const updateSoundScheme = (scheme: 'retro' | 'ambient' | 'scifi' | 'minimal') => {
    setSoundSchemeState(scheme);
    localStorage.setItem('hub_sound_scheme', scheme);
    setTimeout(() => playSynthSound('toggle'), 50);
  };

  const updateSoundVolume = (vol: number) => {
    setSoundVolumeState(vol);
    localStorage.setItem('hub_sound_volume', String(vol));
    setTimeout(() => playSynthSound('click'), 50);
  };

  const updateSoundPitch = (pitch: number) => {
    setSoundPitchState(pitch);
    localStorage.setItem('hub_sound_pitch', String(pitch));
    setTimeout(() => playSynthSound('toggle'), 50);
  };

  const applySoundPreset = (preset: typeof SOUND_PRESETS[0]) => {
    setSoundSchemeState(preset.scheme);
    localStorage.setItem('hub_sound_scheme', preset.scheme);
    setSoundVolumeState(preset.volume);
    localStorage.setItem('hub_sound_volume', String(preset.volume));
    setSoundPitchState(preset.pitch);
    localStorage.setItem('hub_sound_pitch', String(preset.pitch));
    setTimeout(() => playSynthSound('success'), 80);
    showToast(
      lang === 'gu' 
        ? `સાઉન્ડ પ્રીસેટ લાગુ થયો: ${preset.nameGu}` 
        : `Sound Preset applied: ${preset.nameEn}`, 
      'success'
    );
  };

  // --- Daily Streak State & Logic ---
  const [dailyStreak, setDailyStreak] = useState<number>(() => {
    const saved = localStorage.getItem('hub_daily_streak');
    return saved ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    const lastActiveDateStr = localStorage.getItem('hub_last_active_date');
    const todayStr = new Date().toDateString();
    
    if (lastActiveDateStr) {
      if (lastActiveDateStr !== todayStr) {
        const lastActiveDate = new Date(lastActiveDateStr);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let newStreak = dailyStreak;
        if (diffDays === 1) {
          newStreak = dailyStreak + 1;
          setTimeout(() => playSynthSound('success'), 1500); // Celebratory sound!
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        setDailyStreak(newStreak);
        localStorage.setItem('hub_daily_streak', newStreak.toString());
        localStorage.setItem('hub_last_active_date', todayStr);
      }
    } else {
      localStorage.setItem('hub_last_active_date', todayStr);
      localStorage.setItem('hub_daily_streak', '1');
    }
  }, [dailyStreak]);

  // --- Sound Effects State & Toggle ---
  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    return localStorage.getItem('hub_sound_muted') === 'true';
  });

  const toggleSoundMute = () => {
    const nextMute = !soundMuted;
    setSoundMuted(nextMute);
    localStorage.setItem('hub_sound_muted', String(nextMute));
    
    if (!nextMute) {
      // Play brief test sound on unmute
      setTimeout(() => playSynthSound('toggle'), 50);
      showToast(lang === 'gu' ? 'અવાજ ચાલુ કર્યો!' : 'Sound effects enabled!', 'success');
    } else {
      showToast(lang === 'gu' ? 'અવાજ બંધ કર્યો!' : 'Sound effects muted!', 'info');
    }
  };

  // --- Voice Commands / Speech Recognition States & Trigger ---
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState('');

  const startVoiceCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(lang === 'gu' ? 'તમારું બ્રાઉઝર વૉઇસ કમાન્ડ સપોર્ટ કરતું નથી!' : 'Your browser does not support Speech Recognition!', 'error');
      return;
    }

    try {
      playSynthSound('click');
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'gu' ? 'gu-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceCommandFeedback('');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error, event);
        setIsListening(false);
        
        let errorMsg = lang === 'gu' ? 'વૉઇસ રેકોર્ડિંગમાં ભૂલ આવી!' : 'Speech recognition error occurred!';
        if (event.error === 'not-allowed') {
          errorMsg = lang === 'gu' 
            ? 'માઇક્રોફોન પરમિશન નથી મળી! લાઈવ સાઈટ અથવા નવી ટેબમાં ઓપન કરી માઈક ચાલુ કરો.' 
            : 'Microphone permission denied! Try opening in a new tab or allowing microphone access.';
        } else if (event.error === 'no-speech') {
          errorMsg = lang === 'gu'
            ? 'કોઈ અવાજ ડિટેક્ટ ન થયો. ફરીથી બોલો!'
            : 'No speech detected. Please speak clearly!';
        } else if (event.error === 'audio-capture') {
          errorMsg = lang === 'gu'
            ? 'કોઈ માઇક્રોફોન મળ્યો નથી!'
            : 'No microphone found! Please connect one.';
        } else if (event.error === 'service-not-allowed') {
          errorMsg = lang === 'gu'
            ? 'બ્રાઉઝર દ્વારા વૉઇસ સર્વિસ માન્ય નથી!'
            : 'Speech recognition service is blocked by your browser!';
        }
        
        showToast(errorMsg, 'error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const text: string = event.results[0][0].transcript.toLowerCase().trim();
        setVoiceTranscript(text);
        
        let matched = false;
        let feedback = '';

        if (text.includes('theme') || text.includes('dark') || text.includes('light') || text.includes('થીમ') || text.includes('ડાર્ક') || text.includes('લાઇટ')) {
          setTheme(prev => prev === 'dark' ? 'light' : 'dark');
          feedback = lang === 'gu' ? 'થીમ બદલવામાં આવી!' : 'Theme toggled successfully!';
          playSynthSound('toggle');
          matched = true;
        } else if (text.includes('clear') || text.includes('reset') || text.includes('સાફ') || text.includes('રીસેટ')) {
          setSearchQuery('');
          feedback = lang === 'gu' ? 'શોધ સાફ કરી!' : 'Search filter cleared!';
          playSynthSound('click');
          matched = true;
        } else if (text.includes('back') || text.includes('home') || text.includes('exit') || text.includes('પાછા') || text.includes('હોમ') || text.includes('બંધ') || text.includes('ડેશેબોર્ડ')) {
          setSelectedToolId(null);
          feedback = lang === 'gu' ? 'હોમ પેજ પર પાછા ફર્યા!' : 'Returned to Home Dashboard!';
          playSynthSound('click');
          matched = true;
        } else if (text.includes('print') || text.includes('પ્રિન્ટ')) {
          feedback = lang === 'gu' ? 'પ્રિન્ટ લેઆઉટ ખુલી રહ્યું છે...' : 'Opening print layout...';
          playSynthSound('success');
          matched = true;
          setTimeout(() => {
            window.print();
          }, 600);
        } else if (text.includes('gujarati') || text.includes('ગુજરાતી')) {
          setLang('gu');
          feedback = 'ગુજરાતી ભાષા સેટ થઈ!';
          playSynthSound('success');
          matched = true;
        } else if (text.includes('english') || text.includes('અંગ્રેજી')) {
          setLang('en');
          feedback = 'Language set to English!';
          playSynthSound('success');
          matched = true;
        } else if (text.startsWith('search ') || text.startsWith('show ') || text.startsWith('શોધો ')) {
          let term = '';
          if (text.startsWith('search ')) term = text.replace('search ', '');
          else if (text.startsWith('show ')) term = text.replace('show ', '');
          else if (text.startsWith('શોધો ')) term = text.replace('શોધો ', '');
          
          if (term.trim()) {
            setSearchQuery(term.trim());
            addToSearchHistory(term.trim());
            feedback = lang === 'gu' ? `પરિણામ શોધાયું: "${term.trim()}"` : `Searching for: "${term.trim()}"`;
            playSynthSound('click');
            matched = true;
          }
        }

        if (!matched) {
          setSearchQuery(text);
          addToSearchHistory(text);
          feedback = lang === 'gu' ? `પરિણામ શોધાયું: "${text}"` : `Searched for: "${text}"`;
          playSynthSound('click');
        }

        setVoiceCommandFeedback(feedback);
        showToast(feedback || text, 'success');
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // --- Export Action/Transaction History ---
  const handleExportHistory = (format: 'json' | 'csv') => {
    if (userState.history.length === 0) {
      showToast(lang === 'gu' ? 'નિકાસ કરવા માટે કોઈ ઇતિહાસ નથી!' : 'No history to export!', 'error');
      return;
    }

    let fileContent = '';
    let mimeType = 'text/plain';
    let fileName = `ai_tools_history_${Date.now()}`;

    if (format === 'json') {
      fileContent = JSON.stringify(userState.history, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      // Generate CSV
      const headers = ['ID', 'Tool ID', 'Tool Name', 'Timestamp', 'Inputs', 'Output'];
      const rows = userState.history.map(item => [
        item.id,
        item.toolId,
        item.toolName,
        new Date(item.timestamp).toISOString(),
        JSON.stringify(item.inputs).replace(/"/g, '""'),
        item.output.replace(/"/g, '""')
      ]);
      
      fileContent = [
        headers.join(','),
        ...rows.map(r => r.map(val => `"${val}"`).join(','))
      ].join('\n');
      mimeType = 'text/csv;charset=utf-8;';
      fileName += '.csv';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'gu' ? 'ઇતિહાસ સફળતાપૂર્વક ડાઉનલોડ થયો!' : 'History exported successfully!', 'success');
  };

  // --- Performance Monitoring Chart States (Live fluctuating telemetry) ---
  const [performanceData, setPerformanceData] = useState<number[]>([14, 16, 12, 18, 15, 21, 14, 13, 17, 15, 19, 14, 16, 15, 18]);
  const [cpuUsage, setCpuUsage] = useState(33);
  const [activeThreads, setActiveThreads] = useState(6);

  useEffect(() => {
    const timer = setInterval(() => {
      setPerformanceData(prev => {
        const nextVal = Math.max(8, Math.min(45, Math.round(prev[prev.length - 1] + (Math.random() * 8 - 4))));
        return [...prev.slice(1), nextVal];
      });
      setCpuUsage(Math.max(20, Math.min(95, Math.round(33 + (Math.random() * 20 - 10)))));
      setActiveThreads(Math.max(2, Math.min(12, Math.round(6 + (Math.random() * 4 - 2)))));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // --- UI States ---
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [academicCourse, setAcademicCourse] = useState<'School' | 'BCA' | 'BCom' | 'BBA' | 'BA' | 'BSc'>(() => {
    return (localStorage.getItem('hub_academic_course') as any) || 'BCA';
  });
  const [academicSemester, setAcademicSemester] = useState<number>(() => {
    const saved = localStorage.getItem('hub_academic_semester');
    return saved ? parseInt(saved, 10) : 3;
  });

  useEffect(() => {
    localStorage.setItem('hub_academic_course', academicCourse);
  }, [academicCourse]);

  useEffect(() => {
    localStorage.setItem('hub_academic_semester', String(academicSemester));
  }, [academicSemester]);

  // --- Dynamic Academic Solver Local Workspace States ---
  const [academicQuestion, setAcademicQuestion] = useState('');
  const [academicImagePreview, setAcademicImagePreview] = useState<string | null>(null);
  const [academicRawBase64, setAcademicRawBase64] = useState<string | null>(null);
  const [academicMimeType, setAcademicMimeType] = useState<string | null>(null);
  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicResponse, setAcademicResponse] = useState<string | null>(null);
  const [isSpeakingAcademic, setIsSpeakingAcademic] = useState(false);

  const handleAcademicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAcademicMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAcademicImagePreview(reader.result as string);
        const base64Str = (reader.result as string).split(',')[1];
        setAcademicRawBase64(base64Str);
      };
      reader.readAsDataURL(file);
      playSynthSound('click');
    }
  };

  const removeAcademicFile = () => {
    setAcademicImagePreview(null);
    setAcademicRawBase64(null);
    setAcademicMimeType(null);
    playSynthSound('toggle');
  };

  const speakAcademicResponse = () => {
    if (!academicResponse) return;
    if (isSpeakingAcademic) {
      window.speechSynthesis.cancel();
      setIsSpeakingAcademic(false);
      return;
    }
    const cleanText = academicResponse.replace(/[*#`_-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (lang === 'gu' || /[અ-હ]/.test(academicResponse)) {
      utterance.lang = 'gu-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    utterance.onend = () => setIsSpeakingAcademic(false);
    utterance.onerror = () => setIsSpeakingAcademic(false);
    setIsSpeakingAcademic(true);
    window.speechSynthesis.speak(utterance);
    playSynthSound('click');
  };

  const solveAcademicQuestion = async () => {
    if (!academicQuestion.trim() && !academicRawBase64) {
      showToast(lang === 'gu' ? 'કૃપા કરીને પ્રશ્ન લખો અથવા હોમવર્કનો ફોટો અપલોડ કરો!' : 'Please type a question or upload a photo of the homework!', 'error');
      return;
    }
    setAcademicLoading(true);
    setAcademicResponse(null);
    playSynthSound('chime');
    
    try {
      const response = await fetch('/api/tools/academic-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: academicCourse,
          semester: academicSemester,
          question: academicQuestion,
          base64Image: academicRawBase64,
          mimeType: academicMimeType,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAcademicResponse(data.output);
      showToast(lang === 'gu' ? 'AI સોલ્યુશન સફળતાપૂર્વક તૈયાર છે! 🧠' : 'AI Solution Generated Successfully! 🧠', 'success');
      playSynthSound('success');
    } catch (err: any) {
      console.error('Academic solve error:', err);
      showToast(err.message || 'Error generating academic solution', 'error');
    } finally {
      setAcademicLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'elite' | 'ultimate' | 'business' | 'agency' | 'custom'>('pro');
  const [planTypeTab, setPlanTypeTab] = useState<'preset' | 'custom'>('preset');
  
  // Custom Plan Constructor Interactive State
  const [customUnlimited, setCustomUnlimited] = useState(true);
  const [customAPI, setCustomAPI] = useState(false);
  const [customSupport, setCustomSupport] = useState(false);
  const [customWhiteLabel, setCustomWhiteLabel] = useState(false);
  const [customTasks, setCustomTasks] = useState(3);
  const [showAd, setShowAd] = useState(true);
  const [showTouchAssist, setShowTouchAssist] = useState(false);

  // Mobile Gestures for Category Swiping
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    
    // Strict threshold: Must be mostly horizontal (diffY < 40px) and have sufficient horizontal sweep (diffX > 75px)
    if (Math.abs(diffX) > 75 && Math.abs(diffY) < 40) {
      const categoriesList = Object.keys(TRANSLATIONS[lang].categories) as ToolCategory[];
      const currentIndex = categoriesList.indexOf(activeCategory);
      
      if (diffX > 0) {
        // Swiped Left -> Next Category
        const nextIndex = (currentIndex + 1) % categoriesList.length;
        setActiveCategory(categoriesList[nextIndex]);
        playSynthSound('click');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(15); } catch (vErr) {}
        }
      } else {
        // Swiped Right -> Previous Category
        const prevIndex = (currentIndex - 1 + categoriesList.length) % categoriesList.length;
        setActiveCategory(categoriesList[prevIndex]);
        playSynthSound('click');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(15); } catch (vErr) {}
        }
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // --- Sound Transitions Effects Trigger ---
  useEffect(() => {
    // Avoid playing sound on first load, check if userState has finished initial setup
    if (selectedToolId !== undefined) {
      playSynthSound(selectedToolId ? 'success' : 'click');
    }
  }, [selectedToolId]);

  useEffect(() => {
    if (activeCategory !== 'all') {
      playSynthSound('chime');
    }
  }, [activeCategory]);

  // Keyboard Shortcuts Keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
      
      if (e.key === 'Escape') {
        if (selectedToolId) {
          setSelectedToolId(null);
          showToast(lang === 'gu' ? 'ડેશબોર્ડ પર પાછા ફર્યા' : 'Returned to Dashboard', 'info');
        }
        if (showAdminPortal) setShowAdminPortal(false);
        if (showShortcutsModal) setShowShortcutsModal(false);
        if (showLangDropdown) setShowLangDropdown(false);
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            if (selectedToolId) setSelectedToolId(null);
            setTimeout(() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            }, 50);
            showToast(lang === 'gu' ? 'શોધ બાર સક્રિય થયો' : 'Search focused', 'info');
            break;
          case 'b':
            e.preventDefault();
            setSelectedToolId(null);
            showToast(lang === 'gu' ? 'ડેશબોર્ડ પર પાછા ફર્યા' : 'Returned to Dashboard', 'info');
            break;
          case 't':
            e.preventDefault();
            setTheme(prev => {
              const next = prev === 'dark' ? 'light' : 'dark';
              showToast(lang === 'gu' ? `થીમ બદલી: ${next === 'dark' ? 'ડાર્ક' : 'લાઈટ'}` : `Theme changed to ${next}`, 'success');
              return next;
            });
            break;
          case 'l':
            e.preventDefault();
            setLang(prev => {
              const next = prev === 'en' ? 'gu' : 'en';
              showToast(TRANSLATIONS[next].brand, 'success');
              return next;
            });
            break;
          case 'a':
            e.preventDefault();
            setShowAdminPortal(prev => !prev);
            showToast(lang === 'gu' ? 'એડમિન પોર્ટલ સક્રિય' : 'Admin Portal toggled', 'info');
            break;
          case 'k':
            e.preventDefault();
            setShowShortcutsModal(prev => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedToolId, showAdminPortal, showShortcutsModal, showLangDropdown, lang]);

  // Active Tool selection helper
  const activeTool = useMemo(() => {
    if (!selectedToolId) return null;
    const found = TOOLS_DATA.find(t => t.id === selectedToolId);
    if (found && found.id === 'sutex-bca-assistant') {
      const isGu = lang === 'gu';
      
      let courseDetails = '';
      let subjects = '';
      let labelType = isGu ? 'સેમેસ્ટર' : 'Sem';
      if (academicCourse === 'School') {
        courseDetails = isGu ? `ધોરણ ${academicSemester} (શાળા)` : `School Standard ${academicSemester} (Class 1-12)`;
        subjects = isGu 
          ? 'ગણિત, વિજ્ઞાન, સામાજિક વિજ્ઞાન, અંગ્રેજી, ગુજરાતી, કોમ્પ્યુટર પરિચય અને હોમવર્ક આસાઈનમેન્ટ'
          : 'Mathematics, Science, Social Studies, English, regional language (Gujarati/Hindi), Computer Literacy, and homework assignment answers';
        labelType = isGu ? 'ધોરણ' : 'Std';
      } else if (academicCourse === 'BCA') {
        courseDetails = 'Bachelor of Computer Applications (BCA)';
        subjects = 'Programming, Data Structures, DBMS, Web Tech, Software Engineering, AI, and Cloud Computing';
      } else if (academicCourse === 'BCom') {
        courseDetails = 'Bachelor of Commerce (B.Com)';
        subjects = 'Financial Accounting, Economics, Business Law, Auditing, Corporate Taxation, and Statistics';
      } else if (academicCourse === 'BBA') {
        courseDetails = 'Bachelor of Business Administration (BBA)';
        subjects = 'Principles of Management, Marketing, HR Management, Financial Strategy, and Entrepreneurship';
      } else if (academicCourse === 'BA') {
        courseDetails = 'Bachelor of Arts (BA)';
        subjects = 'History, Sociology, Political Science, Economics, Psychology, and Languages/Literature';
      } else if (academicCourse === 'BSc') {
        courseDetails = 'Bachelor of Science (B.Sc)';
        subjects = 'Physics, Chemistry, Mathematics, Botany, Zoology, and Computer Science';
      }

      const toolName = isGu 
        ? `યુનિવર્સલ ${academicCourse === 'School' ? 'શાળા' : academicCourse} ${labelType}-${academicSemester} અભ્યાસ અને આસાઈનમેન્ટ પ્રો` 
        : `Universal ${academicCourse} ${labelType}-${academicSemester} AI Assignment Solver & Study Partner`;

      const toolDescription = isGu
        ? `${courseDetails} ના સંપૂર્ણ અભ્યાસક્રમ માટે ખાસ તૈયાર કરેલ અદ્યતન AI ટ્યુટર. ${subjects} વિષયોના આસાઈનમેન્ટ સોલ્યુશન્સ, પ્રશ્નોત્તરી, નોટ્સ અને સ્વાધ્યાય માટે.`
        : `Bespoke AI Tutor & Assignment Solver fine-tuned for ${courseDetails}. Instantly formulates step-by-step textbook solutions, curated exam notes, custom homework scripts, and syllabus-tuned guidelines for ${subjects}.`;

      return {
        ...found,
        name: toolName,
        description: toolDescription,
        systemInstruction: `You are the ultimate academic assistant, assignment solver, and expert senior professor for student Dhruv Tarsariya, studying ${courseDetails}. Help him perfectly answer academic questions, assignments, homework exercises, and curriculum practicals step-by-step. Focus specifically on ${subjects} relevant to this level. Provide rich details, formatted math/code blocks where appropriate, keep the tone highly encouraging, clear, academic, precise, and professional, and address him by name (Dhruv) to celebrate his dedication.`
      };
    }
    return found || null;
  }, [selectedToolId, academicCourse, academicSemester, lang]);

  useEffect(() => {
    setShowToolTutorial(false);
  }, [selectedToolId]);

  // Translate helpers
  const t = TRANSLATIONS[lang];

  // --- Filtering & Searching logic ---
  const filteredTools = useMemo(() => {
    let result = TOOLS_DATA.filter(tool => {
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;

      const isToolPremium = tool.tags?.includes('Popular') || tool.id === 'ai-chat' || tool.id === 'website-generator' || tool.id === 'ocr-reader';
      const matchesTier = 
        tierFilter === 'all' || 
        (tierFilter === 'pro' && isToolPremium) ||
        (tierFilter === 'free' && !isToolPremium);

      const matchesTag = 
        tagFilter === 'all' || 
        (tagFilter === 'Favorites' && userState.favorites.includes(tool.id)) ||
        (tool.tags && tool.tags.includes(tagFilter));
      
      return matchesSearch && matchesCategory && matchesTier && matchesTag;
    });

    // Apply sorting
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => {
        const ratingA = toolRatings[a.id] || 4.5;
        const ratingB = toolRatings[b.id] || 4.5;
        return ratingB - ratingA;
      });
    } else if (sortBy === 'rating-asc') {
      result = [...result].sort((a, b) => {
        const ratingA = toolRatings[a.id] || 4.5;
        const ratingB = toolRatings[b.id] || 4.5;
        return ratingA - ratingB;
      });
    } else if (sortBy === 'usage') {
      const usageCounts = userState.history.reduce((acc, h) => {
        acc[h.toolId] = (acc[h.toolId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      result = [...result].sort((a, b) => {
        const countA = usageCounts[a.id] || 0;
        const countB = usageCounts[b.id] || 0;
        return countB - countA;
      });
    } else if (sortBy === 'usage-asc') {
      const usageCounts = userState.history.reduce((acc, h) => {
        acc[h.toolId] = (acc[h.toolId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      result = [...result].sort((a, b) => {
        const countA = usageCounts[a.id] || 0;
        const countB = usageCounts[b.id] || 0;
        return countA - countB;
      });
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'popular') {
      result = [...result].sort((a, b) => {
        const aPop = (a.tags?.includes('Popular') ? 3 : 0) + (a.tags?.includes('New') ? 1 : 0);
        const bPop = (b.tags?.includes('Popular') ? 3 : 0) + (b.tags?.includes('New') ? 1 : 0);
        return bPop - aPop;
      });
    } else {
      // Sort alphabetically (name-asc)
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [searchQuery, activeCategory, tierFilter, tagFilter, sortBy, userState.favorites, userState.history, toolRatings]);

  // --- Bookmark / Favorite toggler ---
  const toggleFavorite = (toolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserState(prev => {
      const exists = prev.favorites.includes(toolId);
      const updated = exists 
        ? prev.favorites.filter(id => id !== toolId)
        : [...prev.favorites, toolId];
      
      if (!exists) {
        updateGoalProgress('favorite_or_rate');
      }
      return { ...prev, favorites: updated };
    });
  };

  // --- History appender ---
  const handleAddHistory = (inputs: Record<string, any>, output: string) => {
    if (!selectedToolId || !activeTool) return;
    const newItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      toolId: selectedToolId,
      toolName: activeTool.name,
      timestamp: Date.now(),
      inputs,
      output
    };

    updateGoalProgress('use_tools');

    setUserState(prev => ({
      ...prev,
      history: [newItem, ...prev.history].slice(0, 30) // cap at 30 history items
    }));
  };

  // --- Notes state bridge ---
  const handleSaveNotes = (notes: Note[]) => {
    setUserState(prev => ({
      ...prev,
      savedNotes: notes
    }));
  };

  // --- Simulated Subscription handler ---
  const handleActivatePro = (activatedTier: 'pro' | 'elite') => {
    setUserState(prev => ({
      ...prev,
      tier: activatedTier,
      credits: 999999
    }));
    setShowBillingModal(false);
  };

  // --- Credit controller ---
  const useCredit = (): boolean => {
    if (userState.tier === 'pro' || userState.tier === 'elite') return true;
    if (userState.credits <= 0) {
      setShowBillingModal(true);
      return false;
    }
    setUserState(prev => ({
      ...prev,
      credits: prev.credits - 1
    }));
    return true;
  };

  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!userState.isLoggedIn) {
    return (
      <AuthScreen
        lang={lang}
        theme={theme}
        playSynthSound={playSynthSound}
        showToast={showToast}
        onAuthSuccess={(user) => {
          setUserState(prev => ({
            ...prev,
            isLoggedIn: true,
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            tier: user.tier || 'free',
            credits: user.credits ?? 30
          }));
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased relative overflow-x-hidden transition-colors duration-300`}>
      {/* Ambient soft glowing backgrounds */}
      {theme === 'dark' ? (
        <>
          <div className="absolute top-0 left-1/4 right-1/4 h-[500px] bg-gradient-to-b from-indigo-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-[20%] left-[-100px] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[10%] right-[-100px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-0 left-1/4 right-1/4 h-[400px] bg-gradient-to-b from-indigo-500/5 to-transparent rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-[10%] left-[-100px] w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        </>
      )}

      {/* ================= GLOBAL HEADER ================= */}
      <header className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-[#030712]/80 border-slate-900 text-white' : 'bg-white/80 border-slate-200 text-slate-900'} backdrop-blur-xl border-b px-4 lg:px-8 py-3.5 flex items-center justify-between transition-colors duration-300`}>
        <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setSelectedToolId(null)}>
          <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/10 group-hover:scale-105 group-hover:shadow-blue-500/20 transition-all duration-300">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className={`text-sm lg:text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5 uppercase font-sans`}>
              <span>{t.brand}</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] tracking-widest font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">PRO</span>
            </h1>
            <span className="text-[9px] text-slate-500 block font-bold font-mono tracking-wider">ENTERPRISE GATEWAY v3.6</span>
          </div>
        </div>

        {/* Dynamic Search (Hidden when in tool view) */}
        {!selectedToolId && (
          <div className={`hidden md:flex items-center ${theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-slate-100 border-slate-200/80'} border rounded-xl px-3.5 py-1.5 w-1/3 max-w-md focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all duration-300`}>
            <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  addToSearchHistory(searchQuery);
                  showToast(lang === 'gu' ? `શોધ સાચવી: ${searchQuery}` : `Search saved: ${searchQuery}`, 'success');
                }
              }}
              placeholder={t.searchPlaceholder}
              className={`bg-transparent text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'} placeholder-slate-500 focus:outline-none w-full font-semibold mr-2`}
            />
            {/* Voice Command Mic Trigger inside Search Bar */}
            <button
              onClick={startVoiceCommand}
              className={`p-1.5 rounded-lg hover:bg-blue-500/15 text-slate-400 hover:text-blue-500 transition-all duration-150 shrink-0 ${
                isListening ? 'text-blue-500 bg-blue-500/10 animate-pulse' : ''
              }`}
              title={lang === 'gu' ? 'વૉઇસ કમાન્ડ' : 'Voice Command'}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User badge, language selector and subscription info */}
        <div className="flex items-center gap-3">
          {/* Merchant Admin Portal Button */}
          {userState.email === 'dhruvtarsariya3@gmail.com' && (
            <button
              onClick={() => setShowAdminPortal(true)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200"
              title="Merchant Control & Settlement Panel"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-bold">{lang === 'gu' ? 'એડમિન પોર્ટલ' : 'Admin Portal'}</span>
            </button>
          )}

          {/* Standalone Voice Command Trigger when in tool view */}
          {selectedToolId && (
            <button
              onClick={startVoiceCommand}
              className={`${theme === 'dark' ? 'bg-[#090d16] hover:bg-slate-900 text-slate-300 border-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'} border text-xs p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 ${
                isListening ? 'animate-pulse text-red-500 border-red-500/30' : ''
              }`}
              title={lang === 'gu' ? 'વૉઇસ કમાન્ડ' : 'Voice Command'}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          {/* Sound Effects Toggle (Mute/Unmute) */}
          {/* Onboarding Interactive Tour Guide trigger */}
          <button
            onClick={() => {
              playSynthSound('click');
              setTourStep(0);
            }}
            className={`${theme === 'dark' ? 'bg-[#090d16] hover:bg-slate-900 text-blue-400 border-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-200'} border text-xs px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 shadow-sm active:scale-95`}
            title={LOCALIZED_TEXT[lang]?.startTour || "Start Tutorial Tour"}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden lg:inline font-bold text-[11px]">{LOCALIZED_TEXT[lang]?.startTour || "Tutorial"}</span>
          </button>

          {/* Live QR Scanner Header Quick-Access Shortcut */}
          <button
            onClick={() => {
              playSynthSound('click');
              setSelectedToolId('qr-scanner');
              setTimeout(() => {
                const el = document.getElementById('qr-scanner-widget');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  const mainEl = document.getElementById('active-tool-viewport');
                  if (mainEl) mainEl.scrollIntoView({ behavior: 'smooth' });
                }
              }, 150);
            }}
            className={`${selectedToolId === 'qr-scanner' ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/20' : theme === 'dark' ? 'bg-[#090d16] hover:bg-slate-900 text-slate-300 border-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'} border text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer`}
            title={lang === 'gu' ? 'QR કોડ સ્કેનર ખોલો' : 'Open QR Scanner & Decoder'}
          >
            <Icons.Scan className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline font-bold text-[11px]">{lang === 'gu' ? "સ્કેનર" : "QR Scanner"}</span>
          </button>

          {/* Procedural micro audio mute toggle button */}
          <button
            onClick={toggleSoundMute}
            className={`${theme === 'dark' ? 'bg-[#090d16] hover:bg-slate-900 text-slate-300 border-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'} border text-xs p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95`}
            title={soundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-500" />
            )}
          </button>
 
          {/* Theme switcher toggle with dynamic rotation and scale layout animations */}
          <button
            onClick={() => {
              playSynthSound('toggle');
              setTheme(prev => prev === 'dark' ? 'light' : 'dark');
            }}
            className={`${theme === 'dark' ? 'bg-[#090d16] hover:bg-slate-900 text-amber-400 border-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200'} border text-xs p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 overflow-hidden`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -120, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 120, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                {theme === 'dark' ? (
                  <Icons.Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Icons.Moon className="w-4 h-4 text-indigo-600" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>

          {/* Language selector dropdown with robust click behavior */}
          <div className="relative">
            <button 
              onClick={() => setShowLangDropdown(prev => !prev)}
              className={`${theme === 'dark' ? 'bg-[#090d16] hover:bg-[#111827] border-slate-900 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'} border text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 shadow-sm font-bold`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{t.languages[lang]}</span>
              <Icons.ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangDropdown(false)} />
                <div className={`absolute right-0 top-full mt-2 ${theme === 'dark' ? 'bg-[#090d16] border-slate-900 text-slate-300' : 'bg-white border-slate-200 text-slate-700'} border rounded-xl p-1.5 shadow-2xl whitespace-nowrap min-w-[140px] z-50 animate-in fade-in slide-in-from-top-1 duration-150`}>
                  {(Object.keys(TRANSLATIONS) as LanguageCode[]).map((lCode) => (
                    <button
                      key={lCode}
                      onClick={() => {
                        setLang(lCode);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-150 flex items-center justify-between ${
                        lang === lCode 
                          ? 'text-blue-500 font-extrabold bg-blue-500/10' 
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-[#111827] font-semibold'
                      }`}
                    >
                      <span>{TRANSLATIONS[lCode].languages[lCode]}</span>
                      {lang === lCode && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Daily Streak Flame Badge */}
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 select-none animate-pulse hover:border-orange-500/50 transition-all duration-300"
            title={lang === 'gu' ? `તમારો દૈનિક લૉગિન દોર: ${dailyStreak} દિવસ` : `Your Daily Active Streak: ${dailyStreak} days`}
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
            <span className="text-[11px] font-black text-orange-500 font-mono tracking-wide">
              {dailyStreak} {lang === 'gu' ? 'દિવસ' : 'DAYS'}
            </span>
          </div>

          {/* Credits Counter badge */}
          <div className={`${theme === 'dark' ? 'bg-[#090d16]/80 border-slate-900' : 'bg-white border-slate-200 shadow-sm'} border px-3 py-1.5 rounded-xl flex items-center gap-2`}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`text-[11px] font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} font-mono tracking-wide uppercase`}>
              {userState.tier === 'elite' ? 'ULTRA ELITE' : userState.tier === 'pro' ? 'UNLIMITED PRO' : `${userState.credits} CREDITS`}
            </span>
          </div>

          {/* User Tier and billing trigger */}
          {userState.tier === 'free' ? (
            <button
              onClick={() => {
                setSelectedPlan('pro');
                setShowBillingModal(true);
              }}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-95 transition-all duration-150 flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 animate-bounce" />
              <span className="tracking-wide uppercase">Go Premium</span>
            </button>
          ) : userState.tier === 'elite' ? (
            <button
              onClick={() => {
                setSelectedPlan('elite');
                setShowBillingModal(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-xl shadow-lg shadow-amber-500/10 flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>ELITE VIP</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedPlan('pro');
                setShowBillingModal(true);
              }}
              className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-xl transition-all duration-150 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>PRO MEMBER</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= CORE VIEWPORT ================= */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1500px] w-full mx-auto p-4 lg:p-8 gap-8 overflow-hidden z-10">
        
        {/* ================= SIDEBAR (KPIs & FAVS) ================= */}
        <aside id="favorites-history" className="w-full lg:w-72 flex flex-col gap-6 shrink-0">
          
          {/* User profile Summary card */}
          <div className={`${theme === 'dark' ? 'bg-[#090d16] border-slate-900/80' : 'bg-white border-slate-200/80 shadow-lg'} rounded-2xl p-5 relative overflow-hidden group hover:border-slate-800/60 transition-all duration-300 border`}>
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300" />
            <div className={`flex items-center justify-between gap-2.5 mb-4 border-b ${theme === 'dark' ? 'border-slate-900' : 'border-slate-100'} pb-4`}>
              <div 
                onClick={() => {
                  playSynthSound('click');
                  setShowProfileModal(true);
                }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-all group/user"
                title={lang === 'gu' ? "પ્રોફાઇલ અને સેટિંગ્સ" : "Edit Profile & Settings"}
              >
                <div className={`w-11 h-11 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-800 group-hover/user:border-blue-500/50' : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200 group-hover/user:border-blue-500/50'} flex items-center justify-center border font-black text-blue-500 text-sm shadow-inner shrink-0 transition-all`}>
                  {userState.name ? userState.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'DT'}
                </div>
                <div className="truncate text-left max-w-[130px]">
                  <span className={`block text-xs font-extrabold ${theme === 'dark' ? 'text-slate-100 group-hover/user:text-blue-400' : 'text-slate-800 group-hover/user:text-blue-600'} truncate tracking-wide transition-all flex items-center gap-1`}>
                    <span>{userState.name || userState.email}</span>
                    <span className="text-[9px] opacity-65">⚙️</span>
                  </span>
                  <span className="block text-[9px] text-slate-500 truncate">
                    {userState.username ? `@${userState.username}` : userState.email}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded ${
                      userState.tier === 'elite' 
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/10' 
                        : userState.tier === 'pro' 
                        ? 'bg-blue-500/15 text-blue-500 border border-blue-500/10' 
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {userState.tier === 'elite' ? 'ULTRA ELITE' : userState.tier === 'pro' ? 'PRO MEMBER' : t.freeBadge}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setUserState(prev => ({
                    ...prev,
                    isLoggedIn: false
                  }));
                  playSynthSound('laser');
                  showToast(lang === 'gu' ? 'સફળતાપૂર્વક લોગઆઉટ થયા!' : 'Logged out successfully!', 'success');
                }}
                className={`px-2 py-1.5 rounded-lg border text-[9px] font-black transition-all ${
                  theme === 'dark' 
                    ? 'border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10' 
                    : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                {lang === 'gu' ? 'લોગઆઉટ' : 'Log Out'}
              </button>
            </div>

            {/* Performance Analytics Sparklines (SVG metrics) */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Interactive Calls</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-black ${theme === 'dark' ? 'text-slate-200 bg-slate-950 border-slate-900' : 'text-slate-700 bg-slate-50 border-slate-200'} border px-1.5 py-0.5 rounded`}>{userState.history.length}</span>
                  {userState.history.length > 0 && (
                    <button
                      onClick={() => handleExportHistory('json')}
                      className="text-[9px] text-blue-500 hover:text-blue-600 dark:text-blue-400 font-bold tracking-tight bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5 hover:scale-105 transition"
                      title="Export History (JSON)"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>EXP</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Bookmarked Tools</span>
                <span className={`font-black ${theme === 'dark' ? 'text-slate-200 bg-slate-950 border-slate-900' : 'text-slate-700 bg-slate-50 border-slate-200'} border px-1.5 py-0.5 rounded`}>{userState.favorites.length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Saved Notes Count</span>
                <span className={`font-black ${theme === 'dark' ? 'text-slate-200 bg-slate-950 border-slate-900' : 'text-slate-700 bg-slate-50 border-slate-200'} border px-1.5 py-0.5 rounded`}>{userState.savedNotes.length}</span>
              </div>
              
              {/* Dynamic decorative server status */}
              <div className={`pt-3 border-t ${theme === 'dark' ? 'border-slate-900/80' : 'border-slate-100'} flex items-center justify-between`}>
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-extrabold">Active Nodes</span>
                <div className="flex gap-1">
                  <div className="w-3 h-1 rounded bg-blue-500" />
                  <div className="w-3 h-1 rounded bg-blue-500 animate-pulse" />
                  <div className="w-3 h-1 rounded bg-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Bookmarks Quick Drawer */}
          <div className={`${theme === 'dark' ? 'bg-[#090d16] border-slate-900/80' : 'bg-white border-slate-200/80 shadow-lg'} rounded-2xl p-5 flex-1 flex flex-col min-h-[220px] transition-all duration-300 border`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-500" />
                <span>{t.favoritesTitle}</span>
              </span>
            </div>

            {/* Folder Tabs bar */}
            <div className="flex gap-1 overflow-x-auto pb-2.5 mb-2.5 border-b border-slate-500/10 scrollbar-none">
              {(['all', 'work', 'personal', 'study'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveFavCategoryFilter(cat);
                    playSynthSound('click');
                  }}
                  className={`text-[9px] font-black px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all duration-150 ${
                    activeFavCategoryFilter === cat
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : theme === 'dark'
                      ? 'bg-slate-950 border-slate-900 text-slate-400 hover:text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' && (LOCALIZED_TEXT[lang]?.favCatAll || 'All')}
                  {cat === 'work' && (LOCALIZED_TEXT[lang]?.favCatWork || '💼 Work')}
                  {cat === 'personal' && (LOCALIZED_TEXT[lang]?.favCatPersonal || '🏠 Personal')}
                  {cat === 'study' && (LOCALIZED_TEXT[lang]?.favCatStudy || '📚 Study')}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px] pr-1">
              {(() => {
                const uniqueFavorites = Array.from(new Set(userState.favorites || [])) as string[];
                const filteredFavorites = uniqueFavorites.filter((favId) => {
                  if (activeFavCategoryFilter === 'all') return true;
                  return favoritesCategories[favId] === activeFavCategoryFilter;
                });

                if (filteredFavorites.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <Icons.Folder className="w-5 h-5 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-[11px] text-slate-500 italic px-2">
                        {lang === 'gu' ? 'આ ફોલ્ડરમાં કોઈ ટૂલ્સ નથી.' : 'No favorited tools in this category folder.'}
                      </p>
                    </div>
                  );
                }

                return filteredFavorites.map((favId) => {
                  const toolObj = TOOLS_DATA.find(t => t.id === favId);
                  if (!toolObj) return null;
                  const currentCat = favoritesCategories[favId];

                  return (
                    <div
                      key={favId}
                      className={`p-2.5 ${theme === 'dark' ? 'bg-[#030712] border-slate-900' : 'bg-slate-50 border-slate-200'} rounded-xl flex items-center justify-between text-left transition-all duration-200 border relative group`}
                    >
                      {/* Left click handles tool activation */}
                      <div
                        onClick={() => {
                          setSelectedToolId(favId);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-2.5 truncate cursor-pointer flex-1"
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-blue-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'} border group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200`}>
                          <DynamicIcon name={toolObj.icon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex flex-col">
                          <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} truncate group-hover:text-blue-600`}>{toolObj.name}</span>
                          {currentCat && (
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5">
                              {currentCat}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Folder moving controller popup overlay */}
                      <div className="relative shrink-0 flex items-center gap-1.5 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSynthSound('click');
                            setShowMoveMenuForToolId(showMoveMenuForToolId === favId ? null : favId);
                          }}
                          className={`p-1 rounded-lg border transition ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                          }`}
                          title="Change Folder"
                        >
                          <Icons.FolderInput className="w-3.5 h-3.5" />
                        </button>

                        {showMoveMenuForToolId === favId && (
                          <>
                            <div className="fixed inset-0 z-35" onClick={() => setShowMoveMenuForToolId(null)} />
                            <div className={`absolute right-0 bottom-full mb-1.5 p-1 rounded-xl border shadow-xl flex flex-col gap-1 min-w-[110px] z-40 ${
                              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                            }`}>
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2 py-0.5 border-b border-slate-500/10">
                                {LOCALIZED_TEXT[lang]?.favMoveTo || "Move to"}
                              </span>
                              {(['work', 'personal', 'study'] as const).map(targetCat => (
                                <button
                                  key={targetCat}
                                  onClick={() => {
                                    setFavoritesCategories(prev => ({ ...prev, [favId]: targetCat }));
                                    setShowMoveMenuForToolId(null);
                                    playSynthSound('success');
                                    showToast(lang === 'gu' ? `ખસેડાયું: ${toolObj.name}` : `Moved: ${toolObj.name}`, 'success');
                                  }}
                                  className={`text-[9px] font-bold text-left px-2.5 py-1 rounded-lg transition-all ${
                                    currentCat === targetCat
                                      ? 'bg-blue-600/15 text-blue-500 font-extrabold'
                                      : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-100'
                                  }`}
                                >
                                  {targetCat === 'work' ? '💼 Work' : targetCat === 'personal' ? '🏠 Personal' : '📚 Study'}
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  setFavoritesCategories(prev => {
                                    const updated = { ...prev };
                                    delete updated[favId];
                                    return updated;
                                  });
                                  setShowMoveMenuForToolId(null);
                                  playSynthSound('success');
                                  showToast(lang === 'gu' ? `શ્રેણીમાંથી દૂર કર્યું: ${toolObj.name}` : `Uncategorized: ${toolObj.name}`, 'success');
                                }}
                                className="text-[9px] font-bold text-left px-2.5 py-1 rounded-lg transition-all hover:bg-red-500/10 text-red-400 hover:text-red-300"
                              >
                                ❌ {lang === 'gu' ? 'અવર્ગીકૃત' : 'Uncategorized'}
                              </button>
                            </div>
                          </>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Live Performance Monitoring Chart */}
          <div className={`${theme === 'dark' ? 'bg-[#090d16] border-slate-900/80' : 'bg-white border-slate-200/80 shadow-lg'} rounded-2xl p-5 transition-all duration-300 text-left space-y-4 border`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block flex items-center gap-2 select-none">
                <Icons.Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>{lang === 'gu' ? 'લાઇવ પર્ફોર્મન્સ મોનિટર' : 'Live Performance Monitor'}</span>
              </span>
              <button
                onClick={() => {
                  showToast(lang === 'gu' ? 'સર્વર કનેક્શન ઓપ્ટિમાઇઝ થયું!' : 'Server allocation optimized!', 'success');
                }}
                className="text-[9px] font-black text-blue-500 hover:underline uppercase"
              >
                {lang === 'gu' ? 'ઑપ્ટિમાઇઝ' : 'Optimize'}
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Actual Live SVG Chart */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-black uppercase">
                  <span>{lang === 'gu' ? 'સર્વર લેટન્સી ગ્રાફ' : 'Ingress Latency Stream'}</span>
                  <span className={`${performanceData[performanceData.length - 1] > 25 ? 'text-amber-500' : 'text-emerald-500'} font-bold`}>
                    {performanceData[performanceData.length - 1]} ms
                  </span>
                </div>
                
                <div className={`p-1.5 rounded-xl ${theme === 'dark' ? 'bg-slate-950/60' : 'bg-slate-50'} border ${theme === 'dark' ? 'border-slate-900' : 'border-slate-200'} overflow-hidden relative h-16 flex items-center justify-center`}>
                  <svg className="w-full h-full" viewBox="0 0 240 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Shading Area */}
                    <path
                      d={`M 0,40 L ${performanceData.map((val, idx) => {
                        const x = (idx / (performanceData.length - 1)) * 240;
                        const y = 40 - (val / 50) * 40;
                        return `${x},${y}`;
                      }).join(' ')} L 240,40 Z`}
                      fill="url(#chartGradient)"
                    />
                    {/* Glowing Stroke line */}
                    <path
                      d={performanceData.map((val, idx) => {
                        const x = (idx / (performanceData.length - 1)) * 240;
                        const y = 40 - (val / 50) * 40;
                        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* CPU load */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase font-black">
                  <span>{lang === 'gu' ? 'સીપીયુ લોડ' : 'CPU Thread Allocation'}</span>
                  <span className="text-blue-500 font-bold">{cpuUsage}%</span>
                </div>
                <div className={`h-1.5 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'} rounded-full overflow-hidden flex`}>
                  <div className="bg-blue-500 h-full rounded-l-full transition-all duration-500" style={{ width: `${cpuUsage}%` }} />
                </div>
              </div>

              {/* Concurrency Threads */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-500 font-mono uppercase font-black">
                  <span>{lang === 'gu' ? 'સક્રિય થ્રેડ્સ' : 'Active Parallel Tasks'}</span>
                  <span className="text-purple-500 font-bold">{activeThreads} Nodes</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-sm transition-all duration-300 ${
                        i < activeThreads
                          ? 'bg-purple-500 animate-pulse'
                          : theme === 'dark'
                          ? 'bg-slate-900'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= PRIMARY WORKSPACE VIEW ================= */}
        <main className="flex-1 flex flex-col gap-6">

          {/* TOOL PLAYGROUND VIEW */}
          {activeTool ? (
            <div className="space-y-4">
              {/* Breadcrumb & Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedToolId(null)}
                  className={`${theme === 'dark' ? 'bg-[#090d16] hover:bg-[#111827] border-slate-900 text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'} text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 hover:text-blue-500 transition-all duration-200 shadow-sm border`}
                >
                  <ArrowLeft className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">Dashboard Home</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500 bg-slate-950 border-slate-900' : 'text-slate-600 bg-slate-100 border-slate-200'} font-bold tracking-widest uppercase font-mono px-2 py-1 rounded border`}>
                    {activeTool.category.replace('-', ' ')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-black text-blue-500">{activeTool.name}</span>
                </div>
              </div>

              {/* Responsive Active Widget Card wrapper */}
              <div className={`${theme === 'dark' ? 'bg-[#090d16]/80 border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-xl'} rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden border`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className={`flex items-center justify-between mb-6 border-b ${theme === 'dark' ? 'border-slate-900' : 'border-slate-100'} pb-5 text-left flex-wrap gap-4`}>
                  <div className="flex items-center gap-3.5">
                    <div className="bg-blue-600/10 p-2.5 rounded-2xl border border-blue-500/20 text-blue-500">
                      <DynamicIcon name={activeTool.icon} className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-none tracking-tight`}>{activeTool.name}</h2>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-1.5 leading-relaxed font-semibold`}>{activeTool.description}</p>
                    </div>
                  </div>

                  {/* Print & Star rating panel */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Interactive Tool-Specific Tutorial Trigger */}
                    <button
                      onClick={() => {
                        playSynthSound('click');
                        setShowToolTutorial(prev => !prev);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black transition duration-200 active:scale-95 ${
                        showToolTutorial
                          ? 'bg-blue-600 text-white border-blue-500 shadow shadow-blue-500/20'
                          : theme === 'dark'
                          ? 'bg-slate-950/60 border-slate-900 text-blue-400 hover:text-blue-350 hover:border-blue-900/80'
                          : 'bg-blue-50 border-blue-100 text-blue-600 hover:text-blue-700 hover:bg-blue-100/80'
                      }`}
                      title={lang === 'gu' ? 'ટૂલ માર્ગદર્શિકા જુઓ' : 'Open Tool Tutorial'}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'gu' ? 'માર્ગદર્શિકા' : 'Tutorial'}</span>
                    </button>

                    {/* Hardcopy PDF/Print layout trigger */}
                    <button
                      onClick={() => {
                        playSynthSound('success');
                        window.print();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black transition duration-200 active:scale-95 ${
                        theme === 'dark' 
                          ? 'bg-slate-950/60 border-slate-900 text-slate-300 hover:text-white hover:border-slate-850' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={lang === 'gu' ? 'આ ટૂલ લેઆઉટ પ્રિન્ટ કરો' : 'Print this tool layout'}
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-500" />
                      <span>{lang === 'gu' ? 'પ્રિન્ટ' : 'Print'}</span>
                    </button>

                    {/* Interactive Star Rating */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/60 border-slate-900 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'gu' ? 'રેટિંગ:' : 'Rate:'}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const currentRating = toolRatings[activeTool.id] || 0;
                          const isFilled = starValue <= currentRating;
                          return (
                            <button
                              key={starValue}
                              onClick={() => handleRateTool(activeTool.id, starValue)}
                              className="focus:outline-none transition transform hover:scale-125"
                              title={`Rate ${starValue} stars`}
                            >
                              <Star 
                                className={`w-4 h-4 ${
                                  isFilled ? 'text-amber-400 fill-current' : 'text-slate-600 hover:text-amber-300'
                                }`} 
                              />
                            </button>
                          );
                        })}
                      </div>
                      {toolRatings[activeTool.id] && (
                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          SAVED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tool Specific Interactive Tutorial Drawer */}
                {showToolTutorial && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-5 rounded-2xl border mb-4 text-left relative overflow-hidden transition-all duration-300 ${
                      theme === 'dark' ? 'bg-[#040813] border-blue-500/20 text-slate-200' : 'bg-blue-50/40 border-blue-200 text-slate-800'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-blue-500 animate-pulse" />
                        <h3 className="font-black text-sm uppercase tracking-wide">
                          {lang === 'gu' ? `${activeTool.name} માર્ગદર્શિકા` : `${activeTool.name} Step-by-Step Tutorial`}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setShowToolTutorial(false)}
                        className={`p-1 rounded-lg hover:bg-slate-500/10 ${theme === 'dark' ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                      <div className={`space-y-1.5 p-3.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900/60' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block">Step 1: Input Setup 📝</span>
                        <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                          {lang === 'gu' 
                            ? "જરૂરી વિગતો ભરો અથવા આપેલા વિકલ્પોમાંથી પસંદ કરો. આ પરિમાણો એઆઈ માટે સચોટ પરિણામ બનાવવામાં મદદ કરશે."
                            : "Configure the options and fill in the text fields. These parameters serve as constraints for generating high-quality outcomes."}
                        </p>
                      </div>
                      <div className={`space-y-1.5 p-3.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900/60' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Step 2: AI Execution ⚡</span>
                        <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                          {lang === 'gu'
                            ? "બટન પર ક્લિક કરો. અમારું હાઇ-સ્પીડ મોડલ પૃષ્ઠભૂમિમાં વિશ્લેષણ કરશે અને ક્રેડિટનો ઉપયોગ કરીને સચોટ પરિણામ આપશે."
                            : "Click the trigger button. Our high-speed language model processes the context instantly using secure API endpoints."}
                        </p>
                      </div>
                      <div className={`space-y-1.5 p-3.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900/60' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Step 3: Export & Copy 📂</span>
                        <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                          {lang === 'gu'
                            ? "પરિણામો તૈયાર થયા પછી, તમે તેને કૉપિ કરી શકો છો, તેને તમારા પીડીએફ તરીકે સેવ કરી શકો છો અથવા ઇતિહાસમાં સેવ કરી શકો છો."
                            : "Once complete, copy the output to your clipboard, download it as text, or save it as a note for later edits."}
                        </p>
                      </div>
                    </div>

                    {/* Standard usage case guidelines loaded successfully. */}
                    <div className="mt-4 pt-4 border-t border-slate-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{lang === 'gu' ? "પ્રમાણભૂત ઉપયોગ કેસ માર્ગદર્શિકા" : "Automated demo walkthrough is fully loaded and ready."}</span>
                      </span>
                      <button
                        onClick={() => {
                          playSynthSound('chime');
                          const samples: Record<string, string> = {
                            'ai-chat': "User: How do I build a secure API route?\nAI: Always run API requests server-side, configure rate limiting, and check headers.",
                            'resume-builder': "# Professional Resume\n- Aarav Shah (Fullstack Engineer)\n- Tech: React, Node, Cloud Run",
                            'email-writer': "Subject: Partnership Inquiry\n\nDear team, I am writing to propose an integration between our workflow modules...",
                            'pdf-summarizer': "### Summary Report\n- Core takeaway: 82% productivity improvement via modular pipelines.\n- Next steps: Audit schema integrity.",
                            'grammar-checker': "Corrected Sentence: I have completed the task successfully. (Improved flow and active voice tone)."
                          };
                          const output = samples[activeTool.id] || `This is a sample generated output for ${activeTool.name} explaining its core utility. Enjoy!`;
                          alert(`${activeTool.name} Sample Output Preview:\n\n${output}`);
                        }}
                        className="text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-black uppercase tracking-wider py-1.5 px-3.5 rounded-xl transition-all duration-150 active:scale-95 shrink-0"
                      >
                        {lang === 'gu' ? "નમૂના આઉટપુટનું પૂર્વાવલોકન" : "Preview Sample Outcome"}
                      </button>
                    </div>
                  </motion.div>
                )}

                <InteractiveWidgets
                  tool={activeTool}
                  lang={lang}
                  onAddHistory={handleAddHistory}
                  savedNotes={userState.savedNotes}
                  onSaveNotes={handleSaveNotes}
                  userTier={userState.tier}
                  onUseCredit={useCredit}
                  theme={theme}
                />

                {/* ADVERTISEMENT HUB SLOT INSIDE SELECTED UTILITY */}
                <AdBanner config={adsConfig} theme={theme} lang={lang} />
              </div>

              {/* Interactive Sandbox/Outputs History for this tool */}
              {userState.history.filter(h => h.toolId === activeTool.id).length > 0 && (
                <div className={`${theme === 'dark' ? 'bg-[#090d16] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-lg'} border rounded-2xl p-5 shadow-xl space-y-4 text-left`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-500/10 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-500" />
                        <span>{lang === 'gu' ? 'તાજેતરના જનરેટ કરેલા આઉટપુટ્સ' : 'Your Previous Generated Outputs'}</span>
                      </span>
                      
                      {/* Selected info & bulk delete button */}
                      {selectedHistoryIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-150">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {selectedHistoryIds.length} {LOCALIZED_TEXT[lang]?.historySelected || "items selected"}
                          </span>
                          <button
                            onClick={() => {
                              setUserState(prev => ({
                                ...prev,
                                history: prev.history.filter(h => !selectedHistoryIds.includes(h.id))
                              }));
                              setSelectedHistoryIds([]);
                              playSynthSound('success');
                              showToast(lang === 'gu' ? 'પસંદ કરેલ ઇતિહાસ કાઢી નાખ્યો!' : 'Selected history items deleted!', 'success');
                            }}
                            className="text-[10px] font-black text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg transition active:scale-95 flex items-center gap-1 shadow-md shadow-red-500/15"
                          >
                            <Icons.Trash className="w-3.5 h-3.5" />
                            <span>{LOCALIZED_TEXT[lang]?.bulkDelete || "Delete Selected"}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedHistoryIds([]);
                              playSynthSound('click');
                            }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                      {/* Select All / Deselect All button */}
                      <button
                        onClick={() => {
                          const activeHistories = userState.history.filter(h => h.toolId === activeTool.id).map(h => h.id);
                          const allSelected = activeHistories.every(id => selectedHistoryIds.includes(id));
                          if (allSelected) {
                            setSelectedHistoryIds(prev => prev.filter(id => !activeHistories.includes(id)));
                          } else {
                            setSelectedHistoryIds(prev => Array.from(new Set([...prev, ...activeHistories])));
                          }
                          playSynthSound('click');
                        }}
                        className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                          theme === 'dark' ? 'bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400 hover:text-white' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Icons.CheckSquare className="w-3 h-3 text-blue-500" />
                        <span>
                          {userState.history.filter(h => h.toolId === activeTool.id).every(h => selectedHistoryIds.includes(h.id))
                            ? (lang === 'gu' ? 'બધા નાપસંદ' : 'Deselect All')
                            : (lang === 'gu' ? 'બધા પસંદ' : 'Select All')}
                        </span>
                      </button>

                      {/* Clear All history button for this tool */}
                      <button
                        onClick={() => {
                          setUserState(prev => ({
                            ...prev,
                            history: prev.history.filter(h => h.toolId !== activeTool.id)
                          }));
                          setSelectedHistoryIds([]);
                          playSynthSound('success');
                          showToast(lang === 'gu' ? 'આ ટૂલનો ઇતિહાસ સાફ કરાયો!' : 'Cleared history for this tool!', 'info');
                        }}
                        className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                          theme === 'dark' ? 'bg-red-950/20 hover:bg-red-950/40 border-red-950 text-red-400' : 'bg-red-50 hover:bg-red-100 border-red-100 text-red-600'
                        }`}
                      >
                        <Icons.Trash2 className="w-3 h-3" />
                        <span>{LOCALIZED_TEXT[lang]?.clearAllHistory || "Clear All"}</span>
                      </button>

                      <button
                        onClick={() => handleExportHistory('json')}
                        className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                          theme === 'dark' ? 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icons.Download className="w-3 h-3 text-blue-500" />
                        <span>Export JSON</span>
                      </button>

                      <button
                        onClick={() => handleExportHistory('csv')}
                        className={`text-[9px] font-black px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                          theme === 'dark' ? 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icons.Download className="w-3 h-3 text-emerald-500" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {userState.history
                      .filter(h => h.toolId === activeTool.id)
                      .slice(0, 6)
                      .map((hItem) => {
                        const isChecked = selectedHistoryIds.includes(hItem.id);
                        return (
                          <div key={hItem.id} className={`p-4 ${theme === 'dark' ? 'bg-[#030712] border-slate-900' : 'bg-slate-50 border-slate-200'} border rounded-xl hover:border-slate-800 transition-all duration-200 relative`}>
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    playSynthSound('click');
                                    setSelectedHistoryIds(prev => 
                                      prev.includes(hItem.id) 
                                        ? prev.filter(id => id !== hItem.id) 
                                        : [...prev, hItem.id]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 dark:border-slate-800 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-[10px] text-slate-500 font-mono font-bold">
                                  {new Date(hItem.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(hItem.output);
                                  showToast('Output copied to clipboard', 'success');
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                              >
                                <span>Copy</span>
                              </button>
                            </div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400 bg-[#090d16] border-slate-900/60' : 'text-slate-600 bg-white border-slate-150'} font-mono line-clamp-3 p-2.5 rounded border overflow-x-auto`}>
                              {hItem.output}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            
            // ================= DASHBOARD HOME VIEW =================
            <div className="space-y-6">
              
              {/* Premium Welcome Hero Panel (Elegant, functional, zero generic slop) */}
              <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-[#0c1222] via-[#090d16] to-[#04060c] border-slate-900/80' : 'from-blue-50/70 via-indigo-50/50 to-white border-slate-200 shadow-md'} border rounded-3xl p-6 lg:p-8 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-slate-800/80 transition-all duration-300`}>
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="space-y-3.5 max-w-xl text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[9px] text-blue-500 dark:text-blue-300 font-extrabold tracking-widest uppercase">
                      SECURE MULTITHREADED FRAMEWORK
                    </span>
                  </div>
                  <h2 className={`text-xl lg:text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-tight tracking-tight`}>
                    {lang === 'gu' ? '૧૦૦+ AI અને સ્માર્ટ સાધનો' : lang === 'hi' ? '100+ सुपर एआई टूलकिट' : '100+ High-Performance AI Hub'}
                  </h2>
                  <p className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-semibold`}>
                    {t.tagline} Instantly invoke advanced micro-processing tools, dynamic document OCR extractions, secure sandbox compilers, color matrices, and fast financial invoice splitters.
                  </p>
                </div>

                {/* Micro KPI blocks */}
                <div className="grid grid-cols-3 gap-3.5 w-full lg:w-auto shrink-0">
                  <div className={`${theme === 'dark' ? 'bg-[#04060c]/80 border-slate-900' : 'bg-white border-slate-200 shadow-sm'} border p-4 rounded-2xl text-center min-w-[90px]`}>
                    <span className="block text-lg font-black text-blue-500 font-mono tracking-tight">100+</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold mt-0.5 block">Utilities</span>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-[#04060c]/80 border-slate-900' : 'bg-white border-slate-200 shadow-sm'} border p-4 rounded-2xl text-center min-w-[90px]`}>
                    <span className="block text-lg font-black text-emerald-500 font-mono tracking-tight">100%</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold mt-0.5 block">Secure</span>
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-[#04060c]/80 border-slate-900' : 'bg-white border-slate-200 shadow-sm'} border p-4 rounded-2xl text-center min-w-[90px]`}>
                    <span className="block text-lg font-black text-amber-500 font-mono tracking-tight">14ms</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold mt-0.5 block">Latency</span>
                  </div>
                </div>
              </div>

              {/* LIVE DYNAMIC ADVERTISEMENT HUB SLOT */}
              <AdBanner config={adsConfig} theme={theme} lang={lang} />

              {/* UNIVERSAL ACADEMIC AI HUB WORKSPACE (SCHOOL STD 1-12, BCA, BCOM, BBA, BA, BSC) */}
              <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-[#0b1021] via-[#0e1630] to-[#0b1021] border-indigo-900/40' : 'from-indigo-50/80 via-blue-50/70 to-indigo-50/80 border-indigo-200 shadow-sm'} border rounded-3xl p-5 lg:p-6 space-y-5 text-left relative overflow-hidden transition-all duration-300 hover:shadow-indigo-500/5 hover:border-indigo-500/30`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-indigo-500/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 p-3 rounded-2xl shrink-0 shadow-inner">
                      <Icons.GraduationCap className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h3 className={`text-sm lg:text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                        {lang === 'gu' ? 'યુનિવર્સલ એકેડેમિક અને આસાઈનમેન્ટ AI હબ' : 'Universal Academic & Assignment AI Hub'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {lang === 'gu' ? 'તમારો વર્ગ અથવા ડિગ્રી કોર્સ પસંદ કરો' : 'Select Class 1-12 or Degree course for precise syllabus-tuned answers'}
                      </p>
                    </div>
                  </div>

                  {/* Course Selection Tabs */}
                  <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-indigo-500/5 border border-indigo-500/10 self-start xl:self-auto">
                    {([ 'School', 'BCA', 'BCom', 'BBA', 'BA', 'BSc' ] as const).map(course => (
                      <button
                        key={course}
                        onClick={() => {
                          setAcademicCourse(course);
                          // Set default values appropriate to category
                          if (course === 'School') {
                            setAcademicSemester(10); // Default to Std 10
                          } else {
                            setAcademicSemester(3);  // Default to Sem 3
                          }
                          playSynthSound('click');
                        }}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                          academicCourse === course
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-indigo-500/10'
                        }`}
                      >
                        {course === 'School' ? (lang === 'gu' ? 'શાળા (ધોરણ ૧-૧૨)' : 'School (Class 1-12)') : course}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Semester or Standard selection pills */}
                <div className="space-y-2">
                  <span className="text-[8px] uppercase tracking-widest font-black text-indigo-400 block">
                    {academicCourse === 'School'
                      ? (lang === 'gu' ? 'ધોરણ પસંદ કરો (૧ થી ૧૨)' : 'Select Standard (Class 1 to 12)')
                      : (lang === 'gu' ? 'સેમેસ્ટર પસંદ કરો (૧ થી ૬)' : 'Select Semester (Sem 1 to 6)')
                    }
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(academicCourse === 'School' 
                      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] 
                      : [1, 2, 3, 4, 5, 6]
                    ).map(num => {
                      const isActive = academicSemester === num;
                      let label = '';
                      if (academicCourse === 'School') {
                        label = lang === 'gu' ? `ધોરણ-${num}` : `Std-${num}`;
                      } else {
                        label = lang === 'gu' ? `સેમ-${num}` : `Sem-${num}`;
                      }
                      return (
                        <button
                          key={num}
                          onClick={() => {
                            setAcademicSemester(num);
                            playSynthSound('click');
                          }}
                          className={`px-3 py-1.5 text-[9px] font-black rounded-xl border transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-lg shadow-blue-500/10 scale-105'
                              : theme === 'dark'
                                ? 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-indigo-500/30 hover:text-slate-200'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-500/30 hover:text-indigo-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom dynamic action bar with live text + photo inputs */}
                <div className="space-y-4 pt-4 border-t border-indigo-500/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest font-mono animate-pulse">
                        {academicCourse === 'School' 
                          ? (lang === 'gu' ? `ધોરણ-${academicSemester} આસાઈનમેન્ટ રેડી` : `Std-${academicSemester} Ready`)
                          : `${academicCourse} Sem-${academicSemester} Ready`
                        }
                      </span>
                      <span className="text-[8px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest font-mono">
                        {lang === 'gu' ? '૧૦૦% સચોટ જવાબો' : '100% Accurate Answers'}
                      </span>
                    </div>
                    <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed font-semibold`}>
                      {lang === 'gu' 
                        ? (academicCourse === 'School'
                            ? `નમસ્તે ધ્રુવ! ધોરણ-${academicSemester} ના ગણિત, વિજ્ઞાન, અંગ્રેજી, સામાજિક વિજ્ઞાન અને તમામ હોમવર્ક આસાઈનમેન્ટ ના સાચા જવાબો મેળવો. તમે પ્રશ્ન લખી શકો છો અથવા તેનો ફોટો પણ અપલોડ કરી શકો છો.`
                            : `નમસ્તે ધ્રુવ! આ પ્લેટફોર્મ સેમેસ્ટર-${academicSemester} ના ${academicCourse} ના સંપૂર્ણ અભ્યાસક્રમ માટે ઓપ્ટિમાઇઝ કરેલ છે. ટેક્સ્ટબુકના જવાબો, આસાઈનમેન્ટ અને નોટ્સ મેળવો.`)
                        : (academicCourse === 'School'
                            ? `Welcome, Dhruv! Get step-by-step textbook solutions and verified assignment answers for Standard ${academicSemester} (Class 1-12) subjects. You can type your question or send a photo of it.`
                            : `Welcome, Dhruv! Your AI Companion is auto-tuned for ${academicCourse} Semester-${academicSemester} syllabus. Get textbook proofs, customized assignments, and code/finance solvers.`)
                      }
                    </p>
                  </div>

                  {/* Input form section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Text Input area */}
                    <div className="lg:col-span-8 space-y-1">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
                        {lang === 'gu' ? 'તમારો પ્રશ્ન / હોમવર્ક અહીં લખો' : 'Type your Question / Homework'}
                      </label>
                      <textarea
                        value={academicQuestion}
                        onChange={(e) => setAcademicQuestion(e.target.value)}
                        placeholder={
                          lang === 'gu' 
                            ? `ધોરણ-${academicSemester} નો કોઈપણ હોમવર્કનો પ્રશ્ન અહીં લખો... (દા.ત. "ગણિત પ્રકરણ ૨ દાખલો ૫" અથવા "પ્રકાશનું પરાવર્તન સમજાવો")`
                            : `Type any homework problem for ${academicCourse === 'School' ? `Std-${academicSemester}` : `${academicCourse} Sem-${academicSemester}`}...`
                        }
                        className={`w-full h-24 p-3 text-xs font-semibold rounded-xl border outline-none resize-none transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20'
                            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10'
                        }`}
                      />
                    </div>

                    {/* Multimodal Photo Attachment Area */}
                    <div className="lg:col-span-4 space-y-1">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
                        {lang === 'gu' ? 'હોમવર્કનો ફોટો જોડો 📸' : 'Attach Homework Photo 📸'}
                      </label>
                      <div className="relative h-24 rounded-xl border border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] border-indigo-500/20">
                        {academicImagePreview ? (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950/80">
                            <img 
                              src={academicImagePreview} 
                              alt="Homework Photo Preview" 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={removeAcademicFile}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-red-600/90 hover:bg-red-700 text-white transition-all shadow-md"
                              title="Remove Photo"
                            >
                              <Icons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAcademicFileChange}
                              className="hidden"
                            />
                            <Icons.Camera className="w-5 h-5 text-indigo-400 mb-1 animate-pulse" />
                            <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                              {lang === 'gu' ? '📷 ફોટો અપલોડ કરો' : '📷 Upload Photo'}
                            </span>
                            <span className="text-[8px] text-slate-500 block mt-0.5">
                              {lang === 'gu' ? '(દાખલો કે લખાણનો ફોટો મોકલો)' : '(JPEG, PNG up to 10MB)'}
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-[9px] text-slate-400 font-bold">
                      {academicImagePreview && (
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Icons.Check className="w-3.5 h-3.5" />
                          {lang === 'gu' ? 'ફોટો સફળતાપૂર્વક જોડાયેલ છે!' : 'Homework image attached successfully!'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {academicResponse && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(academicResponse);
                            showToast(lang === 'gu' ? 'જવાબ કોપી થઈ ગયો છે! 📋' : 'Answer copied to clipboard! 📋', 'success');
                            playSynthSound('success');
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-xl border transition-all ${
                            theme === 'dark' 
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                              : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200'
                          }`}
                        >
                          <Icons.Copy className="w-3.5 h-3.5" />
                          {lang === 'gu' ? 'જવાબ કોપી કરો' : 'Copy Solution'}
                        </button>
                      )}

                      <button
                        onClick={solveAcademicQuestion}
                        disabled={academicLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all duration-150 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                      >
                        {academicLoading ? (
                          <>
                            <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            {lang === 'gu' ? 'AI સોલ્યુશન શોધી રહ્યું છે...' : 'AI Solving step-by-step...'}
                          </>
                        ) : (
                          <>
                            <Icons.Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            {lang === 'gu' ? 'AI સોલ્યુશન મેળવો 🧠' : 'Solve & Explain with AI 🧠'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Solution Output Area */}
                  {academicResponse && (
                    <div className={`mt-4 rounded-2xl border p-4 space-y-3 animate-fadeIn text-left ${
                      theme === 'dark' 
                        ? 'bg-slate-950/80 border-indigo-950/50' 
                        : 'bg-indigo-50/30 border-indigo-100'
                    }`}>
                      <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                          <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            {lang === 'gu' ? '🧠 AI એજ્યુકેશનલ સોલ્યુશન' : '🧠 AI Verified Solution'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={speakAcademicResponse}
                            className={`p-1.5 rounded-lg border transition-all ${
                              theme === 'dark'
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600'
                            }`}
                            title={isSpeakingAcademic ? "Stop Reading" : "Read Aloud"}
                          >
                            {isSpeakingAcademic ? (
                              <Icons.Square className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                            ) : (
                              <Icons.Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className={`text-[12px] leading-relaxed font-semibold font-sans whitespace-pre-wrap ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {academicResponse}
                      </div>

                      <div className="text-[9px] text-slate-500 font-bold border-t border-indigo-500/10 pt-2.5">
                        {lang === 'gu' 
                          ? '* આ સોલ્યુશન સત્તાવાર પાઠ્યપુસ્તકના અભ્યાસક્રમને સુસંગત ગુગલ AI દ્વારા બનાવવામાં આવ્યું છે.'
                          : '* This solution was generated by Google AI tuned specifically for academic syllabi proofs.'
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Featured Flags Highlights Carousel */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Featured Platform Flagships</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Flagship 1: AI Chat */}
                  <div 
                    onClick={() => setSelectedToolId('ai-chat')}
                    className={`group bg-gradient-to-br ${theme === 'dark' ? 'from-[#080d1a] to-[#030612] border-blue-900/30 hover:border-blue-500/50' : 'from-blue-50/20 to-white border-slate-200 hover:border-blue-500/40'} p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden border`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-300" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <DynamicIcon name="MessageSquare" className="w-4.5 h-4.5" />
                      </div>
                      <span className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-blue-500 transition-colors`}>AI COMPANION</span>
                    </div>
                    <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} font-semibold leading-relaxed mb-2.5`}>Instant multi-turn chat powered by server-side Gemini 3.6 Flash. Super fast response rates.</p>
                    <span className="text-[9px] text-blue-500 font-bold tracking-wider flex items-center gap-1">
                      <span>Launch Companion</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>

                  {/* Flagship 2: Web Sandbox */}
                  <div 
                    onClick={() => setSelectedToolId('website-generator')}
                    className={`group bg-gradient-to-br ${theme === 'dark' ? 'from-[#080d1a] to-[#030612] border-blue-900/30 hover:border-blue-500/50' : 'from-emerald-50/20 to-white border-slate-200 hover:border-emerald-500/40'} p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden border`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-300" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <DynamicIcon name="Layers" className="w-4.5 h-4.5" />
                      </div>
                      <span className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-emerald-500 transition-colors`}>CODE SANDBOX</span>
                    </div>
                    <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} font-semibold leading-relaxed mb-2.5`}>Compile raw responsive Tailwind mockups inside a fully sandboxed client iframe instantly.</p>
                    <span className="text-[9px] text-emerald-500 font-bold tracking-wider flex items-center gap-1">
                      <span>Launch Sandbox</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>

                  {/* Flagship 3: OCR Reader */}
                  <div 
                    onClick={() => setSelectedToolId('ocr-reader')}
                    className={`group bg-gradient-to-br ${theme === 'dark' ? 'from-[#080d1a] to-[#030612] border-blue-900/30 hover:border-blue-500/50' : 'from-amber-50/20 to-white border-slate-200 hover:border-amber-500/40'} p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden border`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-300" />
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <DynamicIcon name="Camera" className="w-4.5 h-4.5" />
                      </div>
                      <span className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-amber-500 transition-colors`}>AI DOCUMENT OCR</span>
                    </div>
                    <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} font-semibold leading-relaxed mb-2.5`}>Transcribe documents, notes, receipt photos, or screenshots with highest character accuracy.</p>
                    <span className="text-[9px] text-amber-500 font-bold tracking-wider flex items-center gap-1">
                      <span>Launch OCR Engine</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>

              {/* World-Class Live Operations Node & Latency map component */}
              <GlobalOperationsHub lang={lang as any} theme={theme} playSynthSound={playSynthSound as any} />

              {/* Keyboard Shortcuts Reminder & Search History Tags */}
              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between text-left">
                {/* Search history stream */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1 shrink-0">
                    <Icons.History className="w-3.5 h-3.5 text-blue-500" />
                    <span>{lang === 'gu' ? 'તાજેતરની શોધો:' : 'Recent Searches:'}</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {searchHistory.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">{lang === 'gu' ? 'કોઈ શોધ ઇતિહાસ નથી' : 'No search history'}</span>
                    ) : (
                      searchHistory.map((term, i) => (
                        <button
                          key={term + i}
                          onClick={() => {
                            setSearchQuery(term);
                            showToast(lang === 'gu' ? `શોધ ભરેલી: ${term}` : `Loaded search: ${term}`, 'info');
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all duration-150 ${
                            theme === 'dark'
                              ? 'bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {term}
                        </button>
                      ))
                    )}
                    
                    {searchHistory.length > 0 && (
                      <button
                        onClick={() => {
                          setSearchHistory([]);
                          localStorage.removeItem('hub_search_history');
                          showToast(lang === 'gu' ? 'શોધ ઇતિહાસ ભૂંસી નાખ્યો' : 'Search history cleared', 'info');
                        }}
                        className="text-[9px] font-black text-red-500 hover:underline uppercase pl-1.5 shrink-0"
                      >
                        {lang === 'gu' ? 'સાફ કરો' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Keyboard cheat-sheet pill */}
                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className={`text-[10px] px-3 py-1.5 rounded-xl border font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-[#090d16] border-slate-900 text-slate-400 hover:text-white hover:border-slate-850'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icons.Keyboard className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'gu' ? 'શોર્ટકટ્સ (Alt + K)' : 'Shortcuts (Alt + K)'}</span>
                </button>
              </div>

              {/* Categorization & Filter Navigation Tabs (Capsule-style controller) */}
              <div className={`${theme === 'dark' ? 'bg-[#04060c]/60 border-slate-900' : 'bg-slate-100 border-slate-200'} border p-1.5 rounded-2xl flex gap-1.5 items-center max-w-full overflow-x-auto scrollbar-none shadow-inner`}>
                {(Object.keys(t.categories) as ToolCategory[]).map((catKey) => (
                  <button
                    key={catKey}
                    onClick={() => setActiveCategory(catKey)}
                    className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-200 whitespace-nowrap flex items-center gap-2 leading-none ${
                      activeCategory === catKey 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                        : `${theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`
                    }`}
                  >
                    <span>{t.categories[catKey]}</span>
                  </button>
                ))}
              </div>

              {/* INTERACTIVE DASHBOARD PANELS (Goals & Sounds) */}
              <div id="interactive-panels" className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
                {/* Daily Goal Tracker Card */}
                <div className={`p-5 rounded-3xl border ${
                  theme === 'dark' ? 'bg-[#090d16] border-slate-900/60 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                } flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 shrink-0">
                          <Award className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wide">
                            {lang === 'gu' ? 'દૈનિક લક્ષ્ય ટ્રેકર' : 'Daily Goal Tracker'}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold leading-normal">
                            {lang === 'gu' ? 'દરરોજ સાધનો ચલાવીને અને રેટિંગ આપીને તમારા ધ્યેયો પૂરા કરો' : 'Complete targets daily to maintain active productivity'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg shrink-0">
                        {dailyGoals.filter(g => g.completed).length} / {dailyGoals.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {dailyGoals.map(goal => {
                        const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                        return (
                          <div key={goal.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold leading-none">
                              <span className={goal.completed ? 'text-emerald-500 line-through' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                                {lang === 'gu' ? goal.textGu : goal.textEn}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {goal.current} / {goal.target}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-500/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  goal.completed ? 'bg-emerald-500' : 'bg-orange-500'
                                }`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sound Customizer Card */}
                <div className={`p-5 rounded-3xl border ${
                  theme === 'dark' ? 'bg-[#090d16] border-slate-900/60 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide">
                        {lang === 'gu' ? 'ધ્વનિ કસ્ટમાઇઝેશન' : 'Sound Customization'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-normal">
                        {lang === 'gu' ? 'સિસ્ટમ સાઉન્ડ સ્કીમ અને ઓડિયો પીચ બદલો' : 'Tune procedural synthesizers & micro-audio theme'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Theme selector */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">{lang === 'gu' ? 'ધ્વનિ થીમ:' : 'Sound Scheme:'}</span>
                      <div className="flex gap-1">
                        {(['retro', 'ambient', 'scifi', 'minimal'] as const).map(scheme => (
                          <button
                            key={scheme}
                            onClick={() => updateSoundScheme(scheme)}
                            className={`text-[9px] px-2 py-1 rounded-lg border font-black capitalize transition ${
                              soundScheme === scheme
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : theme === 'dark'
                                  ? 'bg-slate-950/80 border-slate-900 text-slate-400 hover:text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {scheme}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Presets selector */}
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-500/10">
                      <span className="text-[10px] font-bold text-slate-500">{lang === 'gu' ? 'સાઉન્ડ પ્રીસેટ્સ:' : 'Sound Presets:'}</span>
                      <div className="flex flex-wrap gap-1">
                        {SOUND_PRESETS.map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => applySoundPreset(preset)}
                            className={`text-[9px] px-2 py-1 rounded-lg border font-bold capitalize transition hover:scale-[1.03] active:scale-95 ${
                              soundScheme === preset.scheme && Math.abs(soundVolume - preset.volume) < 0.15 && Math.abs(soundPitch - preset.pitch) < 0.15
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 dark:text-amber-400 font-extrabold'
                                : theme === 'dark'
                                  ? 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                            title={lang === 'gu' ? preset.nameGu : preset.nameEn}
                          >
                            {lang === 'gu' ? preset.nameGu : preset.nameEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>{lang === 'gu' ? 'વોલ્યુમ સ્તર' : 'Volume Level'}</span>
                        <span className="font-mono">{Math.round(soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={soundVolume}
                        disabled={soundMuted}
                        onChange={(e) => updateSoundVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-500/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Pitch Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>{lang === 'gu' ? 'આવર્તન પીચ' : 'Frequency Pitch'}</span>
                        <span className="font-mono">{soundPitch.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={soundPitch}
                        disabled={soundMuted}
                        onChange={(e) => updateSoundPitch(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-500/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ADVANCED TOOL FILTERS & COMPARISON BAR */}
              <div id="advanced-filters" className={`p-4 rounded-3xl border ${
                theme === 'dark' ? 'bg-[#090d16] border-slate-900/60' : 'bg-white border-slate-200/80 shadow-sm'
              } flex flex-col md:flex-row gap-4 items-center justify-between print:hidden`}>
                
                {/* Search, Tag, Tier filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  
                  {/* Tier filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {lang === 'gu' ? 'સ્તર:' : 'Tier:'}
                    </span>
                    <div className="flex rounded-xl p-0.5 bg-slate-500/5 border border-slate-500/10">
                      {(['all', 'free', 'pro'] as const).map(tier => (
                        <button
                          key={tier}
                          onClick={() => {
                            setTierFilter(tier);
                            playSynthSound('click');
                          }}
                          className={`text-[10px] px-3 py-1 rounded-lg font-black capitalize transition-all ${
                            tierFilter === tier
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {tier === 'all' ? (lang === 'gu' ? 'બધા' : 'All') : tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System/User Tags Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {lang === 'gu' ? 'ટેગ:' : 'Tag:'}
                    </span>
                    <div className="flex rounded-xl p-0.5 bg-slate-500/5 border border-slate-500/10">
                      {(['all', 'Popular', 'New', 'Favorites'] as const).map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setTagFilter(tag);
                            playSynthSound('click');
                          }}
                          className={`text-[10px] px-3 py-1 rounded-lg font-black transition-all ${
                            tagFilter === tag
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {tag === 'all' ? (lang === 'gu' ? 'બધા' : 'All') : lang === 'gu' && tag === 'Favorites' ? 'ફેવરિટ્સ' : tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sorting criteria */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {lang === 'gu' ? 'ક્રમ:' : 'Sort By:'}
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as any);
                        playSynthSound('click');
                      }}
                      className={`text-xs font-bold rounded-xl border p-1.5 outline-none ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-900 text-slate-300 focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'
                      }`}
                    >
                      <option value="name">{lang === 'gu' ? 'નામ (A-Z)' : 'Name (A-Z)'}</option>
                      <option value="name-desc">{lang === 'gu' ? 'નામ (Z-A)' : 'Name (Z-A)'}</option>
                      <option value="rating">{lang === 'gu' ? 'ઉચ્ચ રેટિંગ' : 'Highest Rated'}</option>
                      <option value="rating-asc">{lang === 'gu' ? 'નીચું રેટિંગ' : 'Lowest Rated'}</option>
                      <option value="usage">{lang === 'gu' ? 'મોટો વપરાશ' : 'Usage (High to Low)'}</option>
                      <option value="usage-asc">{lang === 'gu' ? 'નાનો વપરાશ' : 'Usage (Low to High)'}</option>
                      <option value="popular">{lang === 'gu' ? 'લોકપ્રિયતા' : 'Popularity & Pro'}</option>
                    </select>
                  </div>

                  {/* Grid Animation criteria */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {lang === 'gu' ? 'એનિમેશન:' : 'Animation:'}
                    </span>
                    <select
                      value={gridAnimStyle}
                      onChange={(e) => {
                        setGridAnimStyle(e.target.value as any);
                        playSynthSound('toggle');
                      }}
                      className={`text-xs font-bold rounded-xl border p-1.5 outline-none ${
                        theme === 'dark' 
                          ? 'bg-slate-950 border-slate-900 text-slate-300 focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500'
                      }`}
                    >
                      <option value="fade-slide">{lang === 'gu' ? 'ફેડ સ્લાઇડ' : 'Fade Slide'}</option>
                      <option value="zoom-pop">{lang === 'gu' ? 'ઝૂમ પોપ' : 'Zoom Pop'}</option>
                      <option value="stagger">{lang === 'gu' ? 'કેસ્કેડ સ્ટેગર' : 'Cascade Stagger'}</option>
                      <option value="flip">{lang === 'gu' ? '૩D ફ્લિપ રીવીલ' : '3D Flip Reveal'}</option>
                    </select>
                  </div>

                </div>

                {/* Tool Comparison Toggler */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-500/10 shrink-0">
                  <button
                    onClick={() => {
                      setIsCompareMode(!isCompareMode);
                      if (!isCompareMode) {
                        setComparedToolIds([]);
                      }
                      playSynthSound('toggle');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black transition-all duration-200 ${
                      isCompareMode
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-md'
                        : theme === 'dark'
                          ? 'bg-[#090d16] hover:bg-slate-900 border-slate-900 text-slate-300'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${isCompareMode ? 'animate-spin' : ''}`} />
                    <span>
                      {isCompareMode 
                        ? (lang === 'gu' ? `સરખામણી ચાલુ (${comparedToolIds.length}/૨)` : `Compare Mode Active (${comparedToolIds.length}/2)`) 
                        : (lang === 'gu' ? 'સરખામણી કરો' : 'Tool Comparison Mode')}
                    </span>
                  </button>
                </div>

              </div>

              {/* COMPARED TOOLS PANEL */}
              {isCompareMode && (
                <div className={`p-6 rounded-3xl border ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-200'
                } space-y-4 print:hidden`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                        <span>{lang === 'gu' ? 'સાધનોની સમાંતર સરખામણી' : 'Side-by-Side Tool Comparison'}</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-normal">
                        {lang === 'gu' ? 'સરખામણી કરવા માટે નીચેની ગ્રીડમાંથી ૨ સાધનો પસંદ કરો' : 'Select any 2 tools from the grid below to compare features and specs'}
                      </p>
                    </div>
                    {comparedToolIds.length > 0 && (
                      <button
                        onClick={() => {
                          setComparedToolIds([]);
                          playSynthSound('click');
                        }}
                        className="text-[10px] font-black text-red-500 hover:underline uppercase"
                      >
                        {lang === 'gu' ? 'બધું સાફ કરો' : 'Reset Comparison'}
                      </button>
                    )}
                  </div>

                  {comparedToolIds.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl border border-dashed border-slate-500/10 text-slate-500 text-xs font-bold italic">
                      {lang === 'gu' ? 'સરખામણી શરૂ કરવા માટે નીચે આપેલા કોઈ પણ ટૂલ પર ક્લિક કરો!' : 'Click on any tool in the list below to add it to comparison!'}
                    </div>
                  ) : comparedToolIds.length === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const tool = TOOLS_DATA.find(t => t.id === comparedToolIds[0]);
                        if (!tool) return null;
                        const isToolPremium = tool.tags?.includes('Popular') || tool.id === 'ai-chat' || tool.id === 'website-generator' || tool.id === 'ocr-reader';
                        return (
                          <div className={`p-5 rounded-2xl border ${
                            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
                          } space-y-3`}>
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                                <DynamicIcon name={tool.icon} className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black">{tool.name}</h5>
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{tool.category.replace('-', ' ')}</span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 leading-relaxed">
                              {tool.description}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-center p-6 rounded-2xl border border-dashed border-slate-500/15 text-slate-500 text-xs font-black italic">
                        {lang === 'gu' ? 'સરખામણી કરવા માટે બીજું સાધન પસંદ કરો...' : 'Select a second tool to compare side-by-side...'}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from(new Set(comparedToolIds || [])).map(id => {
                        const tool = TOOLS_DATA.find(t => t.id === id);
                        if (!tool) return null;
                        const isToolPremium = tool.tags?.includes('Popular') || tool.id === 'ai-chat' || tool.id === 'website-generator' || tool.id === 'ocr-reader';
                        const rating = toolRatings[tool.id] || 4.5;
                        return (
                          <div key={`compare-card-${tool.id}`} className={`p-5 rounded-2xl border ${
                            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
                          } flex flex-col justify-between space-y-4 relative`}>
                            <button
                              onClick={() => toggleCompareTool(tool.id)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="space-y-3 text-left">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                                  <DynamicIcon name={tool.icon} className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-black">{tool.name}</h5>
                                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{tool.category.replace('-', ' ')}</span>
                                </div>
                              </div>

                              <div className="text-xs text-slate-500 leading-relaxed h-12 overflow-y-auto font-medium">
                                {tool.description}
                              </div>

                              <div className="border-t border-slate-500/10 pt-3 space-y-2 text-[11px] font-bold">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{lang === 'gu' ? 'ટૂલ સ્તર:' : 'Access Tier:'}</span>
                                  <span className={isToolPremium ? 'text-amber-500' : 'text-emerald-500'}>
                                    {isToolPremium ? 'Premium (Pro)' : 'Free Tier'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{lang === 'gu' ? 'જરૂરી ક્રેડિટ્સ:' : 'Credits Cost:'}</span>
                                  <span className="font-mono text-slate-500">
                                    {isToolPremium ? '5 credits' : '1 credit'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{lang === 'gu' ? 'સરેરાશ રેટિંગ:' : 'Average Rating:'}</span>
                                  <span className="text-amber-400 flex items-center gap-1 font-mono">
                                    ★ {rating.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{lang === 'gu' ? 'વિશેષ ટેગ્સ:' : 'Featured Tags:'}</span>
                                  <span className="text-blue-500 capitalize">
                                    {tool.tags?.join(', ') || 'Standard'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setIsCompareMode(false);
                                setSelectedToolId(tool.id);
                                playSynthSound('success');
                              }}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <span>{lang === 'gu' ? 'આ સાધન ચલાવો' : 'Launch This Tool'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Search block */}
              <div className={`md:hidden flex items-center ${theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200'} rounded-2xl px-3.5 py-2.5 border`}>
                <Search className="w-4.5 h-4.5 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className={`bg-transparent text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'} focus:outline-none w-full`}
                />
              </div>

              {/* SMART AI RECOMMENDATIONS CAROUSEL */}
              {!searchQuery && activeCategory === 'all' && (
                <div className={`p-5 rounded-3xl border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-blue-950/10 via-[#090d16] to-indigo-950/10 border-slate-900/60' 
                    : 'bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/40 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/10 p-1.5 rounded-xl text-blue-500 shrink-0">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                          {lang === 'gu' ? 'તમારા માટે ખાસ સૂચવેલા ટૂલ્સ' : 'AI Smart Recommendations For You'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                          {lang === 'gu' ? 'તમારી ઉપયોગ હિસ્ટ્રી અને શ્રેણીઓ આધારિત ખાસ ભલામણો' : 'Tailored suggestions based on your category history and high-tier ratings'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {suggestedTools.map((tool) => {
                      const isToolPremium = tool.tags?.includes('Popular') || tool.id === 'ai-chat' || tool.id === 'website-generator' || tool.id === 'ocr-reader';
                      return (
                        <div
                          key={`suggested-${tool.id}`}
                          onClick={() => {
                            updateGoalProgress('smart_reco');
                            setSelectedToolId(tool.id);
                          }}
                          className={`group p-4 rounded-2xl cursor-pointer border transition-all duration-300 flex items-center gap-3.5 ${
                            theme === 'dark' 
                              ? 'bg-[#04060c] hover:bg-[#0c1222] border-slate-900 hover:border-slate-800' 
                              : 'bg-white hover:bg-slate-50 border-slate-200/60 hover:border-slate-300'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#0c1222]' : 'bg-slate-100'} group-hover:scale-110 transition-all duration-300 shrink-0`}>
                            <DynamicIcon name={tool.icon} className="w-4.5 h-4.5 text-blue-500" />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h5 className={`text-xs font-black truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                {lang === 'gu' && tool.nameGu ? tool.nameGu : tool.name}
                              </h5>
                              {isToolPremium && (
                                <span className="text-[7px] font-mono font-black px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md shrink-0 uppercase">
                                  Pro
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-normal font-semibold">
                              {lang === 'gu' && tool.descGu ? tool.descGu : tool.desc}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TOOLS GRID */}
              <div 
                id="tools-grid" 
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {filteredTools.map((tool, idx) => {
                  const isFav = userState.favorites.includes(tool.id);
                  const isToolPremium = tool.tags?.includes('Popular') || tool.id === 'ai-chat' || tool.id === 'website-generator' || tool.id === 'ocr-reader' || tool.id === 'upi-invoice';

                  return (
                    <motion.div
                      key={tool.id}
                      initial={
                        gridAnimStyle === 'zoom-pop'
                          ? { opacity: 0, scale: 0.85 }
                          : gridAnimStyle === 'stagger'
                            ? { opacity: 0, x: -15 }
                            : gridAnimStyle === 'flip'
                              ? { opacity: 0, rotateY: 90 }
                              : { opacity: 0, y: 15 }
                      }
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        x: 0, 
                        rotateY: 0,
                        y: 0 
                      }}
                      transition={{ 
                        type: gridAnimStyle === 'zoom-pop' ? 'spring' : 'tween',
                        stiffness: 220,
                        damping: 16,
                        duration: gridAnimStyle === 'stagger' ? 0.35 : 0.3,
                        delay: Math.min(1.0, idx * 0.03)
                      }}
                      whileHover={{ scale: 1.015, y: -4 }}
                      onClick={() => {
                        if (isCompareMode) {
                          toggleCompareTool(tool.id);
                        } else {
                          setSelectedToolId(tool.id);
                          if (suggestedTools.some(t => t.id === tool.id)) {
                            updateGoalProgress('smart_reco');
                          }
                        }
                      }}
                      className={`group ${
                        isCompareMode && comparedToolIds.includes(tool.id)
                          ? 'ring-4 ring-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500'
                          : ''
                      } ${theme === 'dark' ? 'bg-[#090d16] hover:bg-[#0c1222] border-slate-900 hover:border-slate-800 text-slate-100' : 'bg-white hover:bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-md hover:shadow-lg'} p-5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 text-left relative overflow-hidden border`}
                    >
                      {/* Premium Accent line */}
                      {isToolPremium && (
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500" />
                      )}

                      {/* Favorite star toggle */}
                      <button
                        onClick={(e) => toggleFavorite(tool.id, e)}
                        className={`absolute top-4 right-4 p-2 rounded-xl border transition-all duration-200 ${
                          isFav 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 scale-105' 
                            : `${theme === 'dark' ? 'bg-slate-950/40 border-slate-900 text-slate-600' : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'}`
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <div className="space-y-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                          isToolPremium 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950' 
                            : 'bg-blue-600/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white'
                        }`}>
                          <DynamicIcon name={tool.icon} className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        
                        <div>
                          <h3 className={`text-sm font-extrabold ${theme === 'dark' ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-blue-600'} truncate tracking-wide flex items-center gap-1.5`}>
                            <span>{tool.name}</span>
                            {isToolPremium && (
                              <span className="bg-amber-500/15 text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider border border-amber-500/10 flex items-center gap-0.5 uppercase">
                                <Award className="w-2.5 h-2.5 shrink-0" />
                                <span>PRO</span>
                              </span>
                            )}
                          </h3>
                          <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} leading-normal line-clamp-2 mt-1.5 font-semibold`}>
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      {/* Tool Star Ratings */}
                      <div className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const currentRating = toolRatings[tool.id] || 0;
                          const isFilled = starValue <= currentRating;
                          return (
                            <button
                              key={starValue}
                              onClick={() => handleRateTool(tool.id, starValue)}
                              className="focus:outline-none transition transform hover:scale-125"
                              title={`Rate ${tool.name} ${starValue} stars`}
                            >
                              <Star 
                                className={`w-3.5 h-3.5 ${
                                  isFilled ? 'text-amber-400 fill-current' : 'text-slate-600 hover:text-amber-400'
                                }`} 
                              />
                            </button>
                          );
                        })}
                        {toolRatings[tool.id] ? (
                          <span className="text-[9px] text-emerald-400 font-extrabold ml-1">
                            ({toolRatings[tool.id]}/5)
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-bold ml-1">
                            (4.8)
                          </span>
                        )}
                      </div>

                      {/* Tags & Action Row */}
                      <div className={`flex items-center justify-between pt-3 border-t ${theme === 'dark' ? 'border-slate-900' : 'border-slate-100'} text-[10px] font-bold`}>
                        <div className="flex gap-1.5">
                          {tool.isInteractive ? (
                            <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                              WIDGET
                            </span>
                          ) : (
                            <span className="bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/10">
                              AI UTILITY
                            </span>
                          )}
                          {tool.tags?.slice(0, 1).map((tg) => (
                            <span key={tg} className={`px-2 py-0.5 rounded-lg border ${theme === 'dark' ? 'bg-slate-950 text-slate-500 border-slate-900/60' : 'bg-slate-100 text-slate-500 border-slate-200'} uppercase`}>
                              {tg}
                            </span>
                          ))}
                        </div>
                        <span className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1.5 transition-all duration-300 flex items-center gap-0.5 uppercase tracking-wider text-[9px] font-black">
                          <span>Launch</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* No search results fallback */}
              {filteredTools.length === 0 && (
                <div className={`py-16 text-center ${theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'} border rounded-3xl space-y-3`}>
                  <Search className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-extrabold">No tools match your active filter parameters.</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">Try modifying your search query or choosing another Category above.</p>
                </div>
              )}

              {/* Google AdSense-ready Placeholder (Premium responsive box styled perfectly) */}
              {showAd && (
                <div className="bg-[#090d16] border border-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-600" />
                  <div className="flex gap-3.5 items-center pl-1.5">
                    <div className="bg-slate-950 border border-slate-900 px-2 py-1 text-[8px] text-slate-500 tracking-widest font-mono uppercase font-black rounded shrink-0">
                      Sponsor Node
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-200 tracking-wide">Scale high-performance fullstack serverless apps instantly with Google Cloud Run</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">Auto-scale from zero, support global nodes, and enjoy secure TLS gateways. (Verified Sponsor Placement)</p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedPlan('pro');
                        setShowBillingModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-lg shadow-blue-500/10 transition-all duration-150 active:scale-95"
                    >
                      {t.adClose}
                    </button>
                    <button
                      onClick={() => setShowAd(false)}
                      className="text-slate-500 hover:text-slate-300 p-2 border border-slate-900 hover:border-slate-800 rounded-xl bg-slate-950/50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ================= BILLING & PREMIUM SUBSCRIPTIONS MODAL ================= */}
      {showBillingModal && (() => {
        // Dynamic Pricing details based on billing period AND selected 5-Tier Plan
        // 1. FREE (Starter) 2. PRO (Creator) 3. ELITE (Developer) 4. ULTIMATE (Supreme) 5. BUSINESS (Enterprise) 6. CUSTOM (Tailored)
        const isGu = lang === 'gu';
        const isHi = lang === 'hi';

        // Custom interactive pricing calculations
        const customMonthlyPrice = 60 + 
          (customUnlimited ? 80 : 0) + 
          (customAPI ? 100 : 0) + 
          (customSupport ? 50 : 0) + 
          (customWhiteLabel ? 150 : 0) + 
          (customTasks - 1) * 15;
          
        const customYearlyPrice = Math.round(customMonthlyPrice * 7.5);

        // Pricing Matrix
        const plans: Record<string, { monthly: string; yearly: string; name: string; memo: string }> = {
          pro: {
            monthly: '149',
            yearly: '999',
            name: isGu ? 'હબ પ્રો ક્રિએટર' : 'Hub Pro Creator',
            memo: 'Hub Pro Plan'
          },
          elite: {
            monthly: '299',
            yearly: '1999',
            name: isGu ? 'એલિટ ડેવલપર વીઆઈપી' : 'Elite Developer VIP',
            memo: 'Hub Ultra Elite'
          },
          ultimate: {
            monthly: '499',
            yearly: '2999',
            name: isGu ? 'અલ્ટીમેટ સુપ્રીમ એઆઈ' : 'Ultimate Supreme AI',
            memo: 'Hub Ultimate Supreme'
          },
          business: {
            monthly: '999',
            yearly: '5999',
            name: isGu ? 'એન્ટરપ્રાઇઝ ક્લાઉડ પ્રો' : 'Enterprise Cloud Pro',
            memo: 'Hub Enterprise Cloud'
          },
          agency: {
            monthly: '1499',
            yearly: '9999',
            name: isGu ? 'ટાઈટન એજન્સી ક્લાઉડ' : 'Titan Agency Cloud',
            memo: 'Hub Titan Agency'
          },
          acquisition: {
            monthly: '10000000',
            yearly: '500000000',
            name: isGu ? '૧૦૦% પ્લેટફોર્મ માલિકી અને આઇપી અધિગ્રહણ' : '100% Platform IP Buyout & Takeover',
            memo: 'Hub Valuation Takeover Buyout'
          },
          custom: {
            monthly: customMonthlyPrice.toString(),
            yearly: customYearlyPrice.toString(),
            name: isGu ? 'કસ્ટમાઇઝ્ડ પર્સનલ પ્લાન' : 'Custom Tailored Plan',
            memo: 'Hub Custom Plan'
          }
        };

        const activeAmount = plans[selectedPlan][billingCycle];
        const activePlanName = plans[selectedPlan].name;
        const upiPayUrl = `upi://pay?pa=${upiId}&pn=AI_Super_Tools_Hub&am=${activeAmount}&cu=INR&tn=${encodeURIComponent(activePlanName + ' ' + (billingCycle === 'monthly' ? 'Monthly' : 'Yearly'))}`;
        const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayUrl)}`;

        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className={`${theme === 'dark' ? 'bg-[#090d16] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'} border rounded-3xl max-w-7xl w-full p-6 lg:p-8 relative text-left space-y-6 my-8 max-h-[90vh] overflow-y-auto`}>
              <button
                onClick={() => setShowBillingModal(false)}
                className={`absolute top-5 right-5 p-2 rounded-xl border transition-all duration-150 ${theme === 'dark' ? 'text-slate-500 hover:text-slate-200 bg-slate-950/80 border-slate-900 hover:border-slate-800' : 'text-slate-400 hover:text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className={`text-xl lg:text-2xl font-black tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {isGu ? "પ્રીમિયમ સબ્સ્ક્રિપ્શન પ્લાન્સ (UPI પેમેન્ટ)" : "Premium Subscription Plans (UPI)"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto font-medium">
                  {isGu 
                    ? "અમર્યાદિત ક્રેડિટ્સ, સંપૂર્ણ AI ઍક્સેસ, અલ્ટ્રા-સ્પીડ પ્રોસેસિંગ અને બધા જ પ્રીમિયમ સાધનો અનલૉક કરો."
                    : "Supercharge your workflow with 100+ fully-unlocked AI models, faster speed, and raw OCR exports."}
                </p>
              </div>

              {/* User Pending approval status banner */}
              {userPendingTx && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-left space-y-1.5">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <Icons.Clock className="w-3.5 h-3.5" />
                    <span>{isGu ? "ચુકવણી પ્રક્રિયા ચાલુ છે (પેન્ડિંગ)" : "Pending Manual Verification"}</span>
                  </span>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    {isGu 
                      ? `તમારું વેરિફિકેશન બાકી છે (UTR: ${userPendingTx.utr}). વેપારી પોર્ટલ દ્વારા તમારા વ્યવહારની પુષ્ટિ કરવામાં આવી રહી છે. કૃપા કરીને થોડી રાહ જુઓ.`
                      : `Your subscription request for ${userPendingTx.plan.toUpperCase()} plan is pending approval (UTR: ${userPendingTx.utr}). The merchant is confirming the UPI credit on their end.`}
                  </p>
                </div>
              )}

              {/* Billing Cycle Interval Toggle */}
              <div className={`flex justify-center p-1.5 rounded-2xl max-w-xs mx-auto border ${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 text-center py-2 text-xs font-black rounded-xl transition-all duration-150 ${
                    billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : `${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`
                  }`}
                >
                  {isGu ? "માસિક બિલિંગ" : "Monthly Billing"}
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 text-center py-2 text-xs font-black rounded-xl transition-all duration-150 flex items-center justify-center gap-1 ${
                    billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : `${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`
                  }`}
                >
                  <span>{isGu ? "વાર્ષિક" : "Yearly"}</span>
                  <span className="bg-emerald-500 text-slate-950 text-[8px] font-black px-1 rounded uppercase tracking-wider scale-90">SAVE 40%</span>
                </button>
              </div>

              {/* Plan Type Mode Selector Tab */}
              <div className={`flex justify-center p-1 rounded-xl max-w-sm mx-auto border ${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => {
                    setPlanTypeTab('preset');
                    setSelectedPlan('pro');
                    playSynthSound('click');
                  }}
                  className={`flex-1 text-center py-2 text-[10px] font-black rounded-lg transition-all duration-150 uppercase tracking-wider ${
                    planTypeTab === 'preset' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                      : `${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`
                  }`}
                >
                  {isGu ? "ક્યુરેટેડ પ્લાન્સ (૫ શ્રેષ્ઠ પ્લાન)" : "Curated Preset Bundles"}
                </button>
                <button
                  onClick={() => {
                    setPlanTypeTab('custom');
                    setSelectedPlan('custom');
                    playSynthSound('chime');
                  }}
                  className={`flex-1 text-center py-2 text-[10px] font-black rounded-lg transition-all duration-150 uppercase tracking-wider flex items-center justify-center gap-1 ${
                    planTypeTab === 'custom' 
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10' 
                      : `${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`
                  }`}
                >
                  <Icons.Sparkles className="w-3 h-3 text-current animate-pulse" />
                  <span>{isGu ? "કસ્ટમ પ્લાન બનાવો" : "Custom Constructor"}</span>
                </button>
              </div>

              {planTypeTab === 'preset' ? (
                /* SEVEN PRESET PLANS CARDS - MODERN DETAILED GRID */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3.5">
                  {/* 1. FREE PLAN */}
                  <div className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900/60' : 'bg-slate-50/50 border-slate-200'} opacity-75 hover:opacity-90 text-left`}>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">Starter</span>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} truncate`}>Basic Free</h4>
                      <p className="text-[9px] text-slate-500 leading-normal">Perfect for simple daily trials.</p>
                    </div>
                    <div>
                      <span className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>₹0</span>
                      <span className="text-[8px] text-slate-500 font-bold block">Free Lifetime Access</span>
                    </div>
                    <div className="border-t border-slate-500/10 pt-2 space-y-1.5 text-[9px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1 text-emerald-500">
                        <Check className="w-3 h-3" />
                        <span>30 Free Credits Limit</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Check className="w-3 h-3 text-slate-500" />
                        <span>Basic speed AI models</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. PRO CREATOR */}
                  <div 
                    onClick={() => {
                      setSelectedPlan('pro');
                      playSynthSound('click');
                    }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-200 text-left relative ${
                      selectedPlan === 'pro' 
                        ? 'border-blue-500 bg-blue-500/5 shadow-xl shadow-blue-500/5' 
                        : `${theme === 'dark' ? 'bg-[#0c1222]/30 border-slate-900 hover:border-slate-800' : 'bg-slate-50/20 border-slate-200 hover:border-slate-300'}`
                    }`}
                  >
                    <span className="absolute -top-2 left-3 bg-blue-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                      POPULAR
                    </span>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black tracking-widest text-blue-400 uppercase">Pro</span>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>Hub Pro</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">For advanced creator workflows.</p>
                    </div>
                    <div>
                      <span className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        ₹{plans.pro[billingCycle]}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block">
                        {billingCycle === 'monthly' ? '/Month' : '/Year'}
                      </span>
                    </div>
                    <div className="border-t border-slate-500/10 pt-2 space-y-1.5 text-[9px] font-medium">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" />
                        <span>Unlimited Generations</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>Website Exporter Tool</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>High-Speed OCR</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. ELITE DEVELOPER */}
                  <div 
                    onClick={() => {
                      setSelectedPlan('elite');
                      playSynthSound('click');
                    }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-200 text-left relative ${
                      selectedPlan === 'elite' 
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-xl shadow-emerald-500/5' 
                        : `${theme === 'dark' ? 'bg-[#091515]/30 border-slate-900 hover:border-slate-800' : 'bg-slate-50/20 border-slate-200 hover:border-slate-300'}`
                    }`}
                  >
                    <span className="absolute -top-2 left-3 bg-emerald-600 text-slate-950 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                      POWER
                    </span>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">VIP</span>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>Elite Dev</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">For developers & database admins.</p>
                    </div>
                    <div>
                      <span className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        ₹{plans.elite[billingCycle]}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block">
                        {billingCycle === 'monthly' ? '/Month' : '/Year'}
                      </span>
                    </div>
                    <div className="border-t border-slate-500/10 pt-2 space-y-1.5 text-[9px] font-medium">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" />
                        <span>Unlimited Generations</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>Developer API Access</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>SQL Query Exporters</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. ULTIMATE SUPREME AI */}
                  <div 
                    onClick={() => {
                      setSelectedPlan('ultimate');
                      playSynthSound('click');
                    }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-200 text-left relative ${
                      selectedPlan === 'ultimate' 
                        ? 'border-purple-500 bg-purple-500/5 shadow-xl shadow-purple-500/5' 
                        : `${theme === 'dark' ? 'bg-[#1a0e28]/20 border-slate-900 hover:border-slate-800' : 'bg-slate-50/20 border-slate-200 hover:border-slate-300'}`
                    }`}
                  >
                    <span className="absolute -top-2 left-3 bg-purple-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                      SUPREME
                    </span>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black tracking-widest text-purple-400 uppercase">AI Plus</span>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>Supreme AI</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">Premium dual-models with infinite memory.</p>
                    </div>
                    <div>
                      <span className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        ₹{plans.ultimate[billingCycle]}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block">
                        {billingCycle === 'monthly' ? '/Month' : '/Year'}
                      </span>
                    </div>
                    <div className="border-t border-slate-500/10 pt-2 space-y-1.5 text-[9px] font-medium">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" />
                        <span>Everything in Elite + Pro</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>Custom model training</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>Dual AI routing models</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. ENTERPRISE CLOUD PRO */}
                  <div 
                    onClick={() => {
                      setSelectedPlan('business');
                      playSynthSound('click');
                    }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-200 text-left relative ${
                      selectedPlan === 'business' 
                        ? 'border-amber-500 bg-amber-500/5 shadow-xl shadow-amber-500/5' 
                        : `${theme === 'dark' ? 'bg-[#1b1509]/20 border-slate-900 hover:border-slate-800' : 'bg-slate-50/20 border-slate-200 hover:border-slate-300'}`
                    }`}
                  >
                    <span className="absolute -top-2 left-3 bg-amber-500 text-slate-950 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                      ENTERPRISE
                    </span>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase">Enterprise</span>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>Cloud Pro</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">White-label brand hosting with VIP support.</p>
                    </div>
                    <div>
                      <span className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        ₹{plans.business[billingCycle]}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block">
                        {billingCycle === 'monthly' ? '/Month' : '/Year'}
                      </span>
                    </div>
                    <div className="border-t border-slate-500/10 pt-2 space-y-1.5 text-[9px] font-medium">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" />
                        <span>Infinite API integrations</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>White-label hosting</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3" />
                        <span>1-on-1 VIP support line</span>
                      </div>
                    </div>
                  </div>

                  {/* 6. TITAN AGENCY CLOUD */}
                  <div 
                    onClick={() => {
                      setSelectedPlan('agency');
                      playSynthSound('chime');
                    }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-200 text-left relative ${
                      selectedPlan === 'agency' 
                        ? 'border-purple-500 bg-purple-500/5 shadow-xl shadow-purple-500/5' 
                        : `${theme === 'dark' ? 'bg-[#180a2b]/20 border-slate-900 hover:border-slate-800' : 'bg-slate-50/20 border-slate-200 hover:border-slate-300'}`
                    }`}
                  >
                    <span className="absolute -top-2 left-3 bg-purple-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                      AGENCY SUPREME
                    </span>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black tracking-widest text-purple-400 uppercase">TITAN VIP</span>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>Agency Cloud</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">Full-scale continuous AI pipelines for teams.</p>
                    </div>
                    <div>
                      <span className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        ₹{plans.agency[billingCycle]}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block">
                        {billingCycle === 'monthly' ? '/Month' : '/Year'}
                      </span>
                    </div>
                    <div className="border-t border-slate-500/10 pt-2 space-y-1.5 text-[9px] font-medium">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Continuous Gemini Ultra models</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-400">
                        <Check className="w-3 h-3 text-purple-500" />
                        <span>Concurrent multi-user login</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3 text-slate-400" />
                        <span>Dedicated server node</span>
                      </div>
                    </div>
                  </div>

                  {/* 7. PLATFORM TAKEOVER & IP BUYOUT */}
                  <div 
                    onClick={() => {
                      setSelectedPlan('acquisition');
                      playSynthSound('laser');
                    }}
                    className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition duration-200 text-left relative ${
                      selectedPlan === 'acquisition' 
                        ? 'border-amber-500 bg-amber-500/5 shadow-2xl shadow-amber-500/10' 
                        : `${theme === 'dark' ? 'bg-[#291807]/20 border-slate-900 hover:border-slate-800' : 'bg-amber-50/20 border-slate-200 hover:border-amber-300'}`
                    }`}
                  >
                    <span className="absolute -top-2 left-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[6px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                      VALUATION BUYOUT
                    </span>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black tracking-widest text-amber-500 uppercase">TITAN TAKEOVER</span>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'} truncate`}>IP Acquisition</h4>
                      <p className="text-[9px] text-slate-400 leading-normal">Complete buyout & full ownership transfer.</p>
                    </div>
                    <div>
                      <span className={`text-sm font-black font-mono ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} block`}>
                        {billingCycle === 'monthly' ? '₹1 Crore' : '₹50 Crore'}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold block">
                        Acquisition Fee
                      </span>
                    </div>
                    <div className="border-t border-slate-500/10 pt-2 space-y-1.5 text-[9px] font-medium">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Check className="w-3 h-3 text-amber-500" />
                        <span>100% Legal IP & Code Buyout</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3 text-slate-400" />
                        <span>Physical Database Migration</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Check className="w-3 h-3 text-slate-400" />
                        <span>Sutex College Local Servers</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* INTERACTIVE CUSTOM PLAN CONSTRUCTOR PANEL */
                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/60 border-slate-900' : 'bg-slate-50 border-slate-200'} grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden`}>
                  <div className="space-y-4">
                    <h4 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'} text-left`}>
                      {isGu ? "તમારી ક્ષમતા અને એડ-ઓન્સ પસંદ કરો" : "Customize Your Capacity & Features"}
                    </h4>
                    
                    {/* Range slider for Concurrent Tasks capacity */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">{isGu ? "સમવર્તી કાર્યોની ક્ષમતા" : "Concurrent Tasks Workers"}</span>
                        <span className="text-amber-500 font-mono font-black">{customTasks} Workers</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={customTasks}
                        onChange={(e) => {
                          setCustomTasks(parseInt(e.target.value));
                          playSynthSound('click');
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-[9px] text-slate-500 block leading-tight font-medium">
                        {isGu 
                          ? `દરરોજ એક જ સમયે રન કરી શકાતા કાર્યો. (દરેક કાર્ય માટે +₹૧૫ પ્રતિ મહિનો ઉમેરાશે)`
                          : `Number of calculations you can run simultaneously. (+₹15 monthly per additional task)`}
                      </span>
                    </div>

                    {/* Interactive Toggles for specific features */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block text-left">{isGu ? "પ્રીમિયમ ફીચર્સ એડ-ઓન્સ" : "Premium Feature Modules"}</span>
                      
                      {/* Checkbox 1 */}
                      <label className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${customUnlimited ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-500/10 hover:border-slate-800 text-slate-400 hover:text-white'}`}>
                        <input 
                          type="checkbox" 
                          checked={customUnlimited}
                          onChange={(e) => {
                            setCustomUnlimited(e.target.checked);
                            playSynthSound('click');
                          }}
                          className="mt-0.5 w-4 h-4 text-amber-500 border-slate-800 rounded focus:ring-amber-500 bg-transparent cursor-pointer"
                        />
                        <div className="text-left leading-snug">
                          <span className={`text-[11px] font-black block ${customUnlimited ? 'text-amber-400 font-extrabold' : 'text-slate-300 font-bold'}`}>
                            {isGu ? "અમર્યાદિત જનરેશન્સ (₹૮૦)" : "Unlimited Generations (+₹80)"}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold leading-normal block">Remove all credits and speed throttling limits completely.</span>
                        </div>
                      </label>

                      {/* Checkbox 2 */}
                      <label className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${customAPI ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-500/10 hover:border-slate-800 text-slate-400 hover:text-white'}`}>
                        <input 
                          type="checkbox" 
                          checked={customAPI}
                          onChange={(e) => {
                            setCustomAPI(e.target.checked);
                            playSynthSound('click');
                          }}
                          className="mt-0.5 w-4 h-4 text-amber-500 border-slate-800 rounded focus:ring-amber-500 bg-transparent cursor-pointer"
                        />
                        <div className="text-left leading-snug">
                          <span className={`text-[11px] font-black block ${customAPI ? 'text-amber-400 font-extrabold' : 'text-slate-300 font-bold'}`}>
                            {isGu ? "REST API નોડ એક્સેસ (₹૧૦૦)" : "REST API Node Access (+₹100)"}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold leading-normal block">Enables webhook callbacks, secure raw HTTP JSON output nodes.</span>
                        </div>
                      </label>

                      {/* Checkbox 3 */}
                      <label className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${customSupport ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-500/10 hover:border-slate-800 text-slate-400 hover:text-white'}`}>
                        <input 
                          type="checkbox" 
                          checked={customSupport}
                          onChange={(e) => {
                            setCustomSupport(e.target.checked);
                            playSynthSound('click');
                          }}
                          className="mt-0.5 w-4 h-4 text-amber-500 border-slate-800 rounded focus:ring-amber-500 bg-transparent cursor-pointer"
                        />
                        <div className="text-left leading-snug">
                          <span className={`text-[11px] font-black block ${customSupport ? 'text-amber-400 font-extrabold' : 'text-slate-300 font-bold'}`}>
                            {isGu ? "૧-ઓન-૧ પ્રાયોરિટી સપોર્ટ (₹૫૦)" : "1-on-1 Priority VIP Support (+₹50)"}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold leading-normal block">Access dedicated direct developer chat via WhatsApp or Slack.</span>
                        </div>
                      </label>

                      {/* Checkbox 4 */}
                      <label className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${customWhiteLabel ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-500/10 hover:border-slate-800 text-slate-400 hover:text-white'}`}>
                        <input 
                          type="checkbox" 
                          checked={customWhiteLabel}
                          onChange={(e) => {
                            setCustomWhiteLabel(e.target.checked);
                            playSynthSound('click');
                          }}
                          className="mt-0.5 w-4 h-4 text-amber-500 border-slate-800 rounded focus:ring-amber-500 bg-transparent cursor-pointer"
                        />
                        <div className="text-left leading-snug">
                          <span className={`text-[11px] font-black block ${customWhiteLabel ? 'text-amber-400 font-extrabold' : 'text-slate-300 font-bold'}`}>
                            {isGu ? "વ્હાઇટ-લેબલ બ્રાન્ડ હોસ્ટિંગ (₹૧૫૦)" : "White-Label Brand Hosting (+₹150)"}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold leading-normal block">Host your generated websites on custom domains without watermarks.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Custom Plan Real-Time Price Outcome Summary Card */}
                  <div className={`p-5 rounded-2xl flex flex-col justify-between space-y-4 border ${theme === 'dark' ? 'bg-[#090d16] border-slate-900/60' : 'bg-white border-slate-200 shadow-sm'} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-2 text-left">
                      <span className="bg-amber-500/15 text-amber-400 text-[8px] font-black px-2 py-0.5 rounded tracking-widest border border-amber-500/10 inline-block uppercase animate-pulse">
                        DESIGN COMPLETED 🌟
                      </span>
                      <h4 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {isGu ? "તમારો કસ્ટમાઇઝ્ડ પ્લાન" : "Your Custom Build Specification"}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        This plan has been customized to fit your specific workflow and parameters with no unnecessary overhead fees.
                      </p>

                      {/* Config summary dots */}
                      <div className="space-y-1 pt-2 border-t border-slate-500/10 text-[10px] font-bold text-slate-500">
                        <div className="flex justify-between">
                          <span>Concurrent Tasks:</span>
                          <span className="text-slate-300 font-extrabold">{customTasks} Workers</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unlimited Generations:</span>
                          <span className={customUnlimited ? 'text-emerald-400 font-extrabold' : 'text-slate-600 font-bold'}>{customUnlimited ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Developer REST API:</span>
                          <span className={customAPI ? 'text-emerald-400 font-extrabold' : 'text-slate-600 font-bold'}>{customAPI ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VIP Support Channel:</span>
                          <span className={customSupport ? 'text-emerald-400 font-extrabold' : 'text-slate-600 font-bold'}>{customSupport ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>White-Label Branding:</span>
                          <span className={customWhiteLabel ? 'text-emerald-400 font-extrabold' : 'text-slate-600 font-bold'}>{customWhiteLabel ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-slate-500/10 flex items-end justify-between">
                      <div className="text-left">
                        <span className="text-[9px] text-slate-500 uppercase font-black block">Tailored Price:</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black font-mono text-amber-400`}>
                            ₹{billingCycle === 'monthly' ? customMonthlyPrice : customYearlyPrice}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">
                            {billingCycle === 'monthly' ? '/Month' : '/Year'}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setSelectedPlan('custom');
                          playSynthSound('success');
                          showToast(isGu ? "કસ્ટમ પ્લાન સફળતાપૂર્વક પસંદ થયો!" : "Custom tailored plan chosen!", "success");
                        }}
                        className={`text-[10px] font-black py-2.5 px-4 rounded-xl border transition-all active:scale-95 ${
                          selectedPlan === 'custom' 
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20' 
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {selectedPlan === 'custom' ? '✓ Selected' : 'Choose Custom'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Merchant Setup block (Defaulting to user's specified UPI ID) */}
              {selectedPlan !== 'acquisition' && (
                <div className={`${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'} border rounded-2xl p-4.5 space-y-3`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-extrabold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Icons.Settings className="w-4.5 h-4.5 text-blue-500 animate-spin-slow" />
                      <span>{isGu ? "વેપારી UPI આઈડી કોન્ફિગરેશન" : "Merchant UPI Gateway Configuration"}</span>
                    </span>
                    <div className="flex items-center gap-1 text-[8px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/10 font-mono uppercase font-black tracking-wider">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span>Auto-Routing Gate</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. 9328951054@fam"
                      className={`${theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} border text-xs px-3.5 py-2.5 rounded-xl placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full font-mono font-bold`}
                    />
                    <button 
                      onClick={() => {
                        alert(isGu ? 'વેપારી UPI ID સફળતાપૂર્વક અપડેટ થયું છે!' : 'UPI ID saved! All user checkout actions will route payments here.');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2.5 rounded-xl font-black tracking-wide transition-all duration-150 active:scale-95 shrink-0"
                    >
                      {isGu ? "સાચવો" : "Save ID"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                    {isGu 
                      ? "ગ્રાહકો દ્વારા કરવામાં આવતી બધી જ ચૂકવણીઓ સીધી તમારા આ UPI સરનામે જમા થશે."
                      : "Every visitor checkout payment will route directly to your personal bank account connected with this UPI."}
                  </p>
                </div>
              )}

              {/* Scan & Pay QR Code Block OR Bank Transfer Details for Acquisition */}
              {selectedPlan === 'acquisition' ? (
                /* HIGH VALUE BANK TRANSFER & PAYPAL DISPATCH GATEWAY */
                <div className={`${theme === 'dark' ? 'bg-[#0f111a] border-amber-900/40 text-slate-100' : 'bg-amber-50/30 border-amber-200 text-slate-800'} border p-6 rounded-2xl space-y-5 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-500/10">
                    <div className="space-y-1.5 text-left">
                      <span className="text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest font-mono">
                        HIGH VALUE TRANSACTION LOCK
                      </span>
                      <h4 className={`text-sm lg:text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {isGu ? "પ્લેટફોર્મ માલિકી અને આઇપી અધિગ્રહણ ચુકવણી પોર્ટલ" : "Platform IP Acquisition Transfer Portal"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        {isGu 
                          ? "₹૧ કરોડથી વધુ રકમ માટે યુપીઆઈ લિમિટ મર્યાદિત હોવાથી, નીચે આપેલા સેન્ટ્રલ બેંક ખાતા અથવા પેપાલ (PayPal) દ્વારા સત્તાવાર ટ્રાન્સફર કરો." 
                          : "Due to strict statutory limits on standard UPI transactions for values exceeding ₹1 Crore, please fulfill this platform takeover wire transfer via RTGS/NEFT Bank Ledger or International PayPal."}
                      </p>
                    </div>
                    <div className="text-left md:text-right shrink-0">
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">{isGu ? "કુલ અધિગ્રહણ ફી" : "BUYOUT PAYLOAD"}</span>
                      <span className={`text-xl lg:text-2xl font-mono font-black ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                        {billingCycle === 'monthly' ? '₹1,00,00,000' : '₹50,00,00,000'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Method 1: State Bank of India Wire Transfer */}
                    <div className={`p-4 rounded-xl border text-left space-y-2.5 ${theme === 'dark' ? 'bg-slate-950 border-slate-900/80' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <Icons.Coins className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">{isGu ? "બીઝનેસ બેંક એકાઉન્ટ (SBI)" : "Bank Transfer (RTGS / NEFT)"}</span>
                      </div>
                      
                      <div className="space-y-1.5 text-[11px] font-semibold">
                        <div className="flex justify-between items-center border-b border-slate-500/5 pb-1.5">
                          <span className="text-slate-500">{isGu ? "બેંક નામ" : "Bank Name"}:</span>
                          <span className="text-slate-300 font-bold">State Bank of India (SBI)</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-500/5 pb-1.5">
                          <span className="text-slate-500">{isGu ? "ખાતા નંબર" : "Account Number"}:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-200 font-mono font-black select-all text-xs">33893723813</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText("33893723813");
                                alert(isGu ? 'ખાતા નંબર કોપી થયો!' : 'Account number copied!');
                              }}
                              className="text-[9px] bg-slate-800 hover:bg-slate-750 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700 cursor-pointer"
                            >Copy</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pb-0.5">
                          <span className="text-slate-500">{isGu ? "IFSC કોડ" : "IFSC Code"}:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-200 font-mono font-black select-all text-xs">SBIN0060274</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText("SBIN0060274");
                                alert(isGu ? 'IFSC કોડ કોપી થયો!' : 'IFSC Code copied!');
                              }}
                              className="text-[9px] bg-slate-800 hover:bg-slate-750 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700 cursor-pointer"
                            >Copy</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Method 2: Global PayPal Wire Transfer */}
                    <div className={`p-4 rounded-xl border text-left space-y-2.5 ${theme === 'dark' ? 'bg-slate-950 border-slate-900/80' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <Icons.DollarSign className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">{isGu ? "આંતરરાષ્ટ્રીય પેપાલ (PayPal)" : "International PayPal Delivery"}</span>
                      </div>

                      <div className="space-y-1.5 text-[11px] font-semibold">
                        <div className="flex justify-between items-center border-b border-slate-500/5 pb-1.5">
                          <span className="text-slate-500">{isGu ? "ચુકવણી ચેનલ" : "Gateway Provider"}:</span>
                          <span className="text-slate-300 font-bold">PayPal Global Business</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-500/5 pb-1.5">
                          <span className="text-slate-500">{isGu ? "પેપાલ આઈડી" : "PayPal Email"}:</span>
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            <span className="text-slate-200 font-mono font-black select-all text-[10px] break-all max-w-[130px] block">arvindbhaitarsariya63@gmail.com</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText("arvindbhaitarsariya63@gmail.com");
                                alert(isGu ? 'પેપાલ ઈમેલ કોપી થયો!' : 'PayPal email copied!');
                              }}
                              className="text-[9px] bg-slate-800 hover:bg-slate-750 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700 cursor-pointer shrink-0"
                            >Copy</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pb-0.5">
                          <span className="text-slate-500">{isGu ? "અધિગ્રહણ રસીદ" : "Acquisition Ledger"}:</span>
                          <span className="text-emerald-400 font-bold">Auto-Generated Receipt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Scan & Pay QR Code Block */
                <div className={`${theme === 'dark' ? 'bg-slate-950/80 border-slate-900' : 'bg-slate-50 border-slate-200'} border p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="bg-white p-2.5 rounded-xl max-w-[140px] aspect-square flex items-center justify-center shrink-0 shadow-lg border border-slate-200">
                    <img
                      src={upiQrCodeUrl}
                      alt="Scan to Pay"
                      referrerPolicy="no-referrer"
                      className="w-full h-full select-none"
                    />
                  </div>
                  <div className="space-y-3.5 text-center sm:text-left w-full">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-extrabold tracking-widest uppercase">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{isGu ? "ચુકવણી કરવા માટે સ્કેન કરો" : "SECURE INSTANT UPI GATEWAY"}</span>
                    </div>
                    <h4 className={`text-sm font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
                      {isGu ? `કિંમત: ₹${activeAmount} (${activePlanName})` : `Payload: ₹${activeAmount} (${activePlanName})`}
                    </h4>
                    <div className={`${theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} border text-xs p-2 rounded-xl font-mono break-all select-all font-bold`}>
                      {upiId}
                    </div>
                    <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start pt-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(upiPayUrl);
                          alert(isGu ? 'પેમેન્ટ લિંક કોપી થઈ ગઈ છે!' : 'UPI payment link copied!');
                        }}
                        className={`text-[10px] font-black py-2 px-4 rounded-xl border transition-all duration-150 active:scale-95 ${theme === 'dark' ? 'bg-[#090d16] hover:bg-slate-900 text-slate-300 border-slate-900' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'}`}
                      >
                        {isGu ? "પેમેન્ટ લિંક કોપી કરો" : "Copy Payment URI"}
                      </button>
                      <a
                        href={upiPayUrl}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all duration-150 active:scale-95 inline-flex items-center gap-1"
                      >
                        <span>{isGu ? "મોબાઈલથી પે કરો" : "Pay via UPI App"}</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Manual Verification Form */}
              <div className={`${theme === 'dark' ? 'bg-[#030712]/90 border-slate-900' : 'bg-slate-50 border-slate-200'} border rounded-2xl p-5 space-y-4 text-left`}>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Icons.Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                  <span>{isGu ? "પગલું ૨: ચુકવણી સબમિટ કરો (UTR વેરિફિકેશન)" : "Step 2: Submit Reference (Manual Verification)"}</span>
                </span>
                
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  {selectedPlan === 'acquisition' ? (
                    isGu 
                      ? "બેંક ટ્રાન્સફર (RTGS/NEFT) અથવા પેપાલ (PayPal) દ્વારા ચુકવણી પૂર્ણ કર્યા પછી, નીચે તમારું નામ અને વ્યવહાર આઈડી / રસીદ સંદર્ભ દાખલ કરો."
                      : "After completing your bank wire transfer or PayPal payout, input your full Sender Name and Bank Reference / PayPal Transaction ID below."
                  ) : (
                    isGu 
                      ? "પેમેન્ટ કર્યા પછી, વેરિફિકેશન માટે નીચે તમારું નામ અને ૧૨-અંકનો UTR/Transaction ID દાખલ કરો. એડમિન તમારા પેમેન્ટની પુષ્ટિ કર્યા પછી તરત જ પ્રીમિયમ ચાલુ કરશે."
                      : "After completing your payment on any UPI app, input your Sender Name and 12-digit UTR/UPI Ref ID below. The Merchant Admin will verify and activate your Premium Access."
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                      {selectedPlan === 'acquisition' 
                        ? (isGu ? "ચૂકવનારનું નામ / સંસ્થા" : "Depositor Name / Company") 
                        : (isGu ? "ચૂકવનારનું નામ" : "Your UPI / Sender Name")}
                    </label>
                    <input
                      type="text"
                      value={senderNameInput}
                      onChange={(e) => setSenderNameInput(e.target.value)}
                      placeholder={isGu ? "દા.ત. અવિન્દભાઈ તારસરીયા" : "e.g. Arvindbhai Tarsariya"}
                      className={`${theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} border text-xs px-3.5 py-2.5 rounded-xl placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full font-bold`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                      {selectedPlan === 'acquisition' 
                        ? (isGu ? "બેંક ટ્રાન્સફર / પેપાલ ટ્રાન્ઝેક્શન આઈડી" : "Transaction Ref ID / Bank Tx ID") 
                        : (isGu ? "UTR નંબર (૧૨ અંક)" : "12-Digit UPI Ref ID / UTR")}
                    </label>
                    <input
                      type="text"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      placeholder={selectedPlan === 'acquisition' ? "e.g. PP-84927 or Bank Ref" : "e.g. 620194857361"}
                      className={`${theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'} border text-xs px-3.5 py-2.5 rounded-xl placeholder-slate-400 focus:outline-none focus:border-blue-500 w-full font-mono font-bold`}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!senderNameInput.trim() || !utrInput.trim()) {
                      alert(isGu ? 'કૃપા કરીને બધી વિગતો ભરો!' : 'Please fill out both your name and UPI transaction ID/UTR!');
                      return;
                    }
                    const newPending = {
                      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
                      email: userState.email,
                      senderName: senderNameInput.trim(),
                      utr: utrInput.trim(),
                      plan: selectedPlan,
                      amount: activeAmount,
                      cycle: billingCycle,
                      timestamp: Date.now()
                    };
                    setPendingTransactions(prev => [newPending, ...prev]);
                    setUserPendingTx(newPending);
                    setSenderNameInput('');
                    setUtrInput('');
                    alert(isGu ? 'વેરિફિકેશન વિનંતી મોકલવામાં આવી છે! એડમિન મંજૂર કરશે ત્યારે તમારું પ્રીમિયમ સક્રિય થઈ જશે.' : 'Verification request submitted successfully! Once the merchant verifies your UTR on their bank statement, your access will be activated.');
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-lg shadow-orange-500/10 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <Icons.Send className="w-4 h-4" />
                  <span>{isGu ? "વેરિફિકેશન વિનંતી સબમિટ કરો" : "Submit Reference for Admin Approval"}</span>
                </button>
              </div>

              {/* Quick Sandbox Override (Visible to let user test immediately) */}
              <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">{isGu ? "વિકાસકર્તા સેન્ડબોક્સ શોર્ટકટ" : "Developer Sandbox Mode"}</span>
                <button
                  onClick={() => handleActivatePro(selectedPlan)}
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[9px] font-black py-1.5 px-3 rounded-lg transition-all duration-150 uppercase tracking-widest"
                >
                  {isGu ? "ઇન્સ્ટન્ટ સેન્ડબોક્સ સક્રિય કરો" : "Simulate Sandbox Purchase (Instant)"}
                </button>
              </div>

              {/* List of perks */}
              <div className={`space-y-2.5 border-t pt-5 ${theme === 'dark' ? 'border-slate-900' : 'border-slate-150'}`}>
                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {isGu ? "બધા જ પ્રીમિયમ સભ્યો મેળવે છે:" : "INCLUDED IN PREMIUM ACTIVE PASS:"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                  {t.proFeatures.map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-400">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MERCHANT CONTROL OPERATIONS PORTAL MODAL ================= */}
      {showAdminPortal && userState.email === 'dhruvtarsariya3@gmail.com' && (() => {
        const isGu = lang === 'gu';
        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className={`${theme === 'dark' ? 'bg-[#090d16] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'} border rounded-3xl max-w-4xl w-full p-6 lg:p-8 relative text-left space-y-6 my-8 max-h-[90vh] overflow-y-auto`}>
              
              <button
                onClick={() => setShowAdminPortal(false)}
                className={`absolute top-5 right-5 p-2 rounded-xl border transition-all duration-150 ${theme === 'dark' ? 'text-slate-500 hover:text-slate-200 bg-slate-950/80 border-slate-900 hover:border-slate-800' : 'text-slate-400 hover:text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/15 border border-blue-500/20 text-[9px] text-blue-400 font-black tracking-widest uppercase">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isGu ? "લાઇવ વેપારી નિયંત્રણ" : "LIVE MERCHANT CONTROL PANEL"}</span>
                  </div>
                  <h3 className={`text-xl lg:text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {isGu ? "યુપીઆઈ પેમેન્ટ સેટલમેન્ટ એન્જિન" : "UPI Payment Settlement Engine"}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isGu 
                      ? "તમારા ગ્રાહકોની વિનંતીઓ સ્વીકારો કે અસ્વીકાર કરો. અહીં બધું જ કન્ફર્મ થયા પછી ઍક્સેસ મળશે."
                      : "Confirm incoming credits from your UPI statement, then approve pending customer verification requests."}
                  </p>
                </div>
                
                {/* Active Routing Address */}
                <div className={`${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'} border p-3 rounded-xl flex items-center gap-3 shrink-0`}>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Icons.CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block">{isGu ? "સક્રિય રીસીવર આઈડી" : "ACTIVE RECEIVER ID"}</span>
                    <span className={`text-xs font-mono font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{upiId}</span>
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className={`text-xs font-black tracking-wider uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isGu ? `બાકી મંજૂરીઓ (${pendingTransactions.length})` : `Pending Settlement queue (${pendingTransactions.length})`}
                  </h4>
                  <button
                    onClick={() => {
                      setPendingTransactions([
                        { id: 'tx-101', email: 'guest_user42@gmail.com', senderName: 'Rahul Patel', utr: '620194857361', plan: 'pro', amount: '149', timestamp: Date.now() - 3600000 },
                        { id: 'tx-102', email: 'pro_designer@live.com', senderName: 'Aarav Shah', utr: '620194883472', plan: 'elite', amount: '1999', timestamp: Date.now() - 1200000 }
                      ]);
                      alert('Settlement queue reloaded with sample transactions.');
                    }}
                    className={`text-[9px] font-black py-1.5 px-3 rounded-lg border transition-all duration-150 ${theme === 'dark' ? 'bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'}`}
                  >
                    {isGu ? "ડેમો ડેટા ફરીથી લોડ કરો" : "Reset Queue Data"}
                  </button>
                </div>

                {pendingTransactions.length === 0 ? (
                  <div className={`py-12 text-center border rounded-2xl space-y-3 ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
                    <Icons.Inbox className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-extrabold">{isGu ? "હાલમાં કોઈ બાકી વિનંતીઓ નથી." : "No pending UPI transactions in queue."}</p>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">{isGu ? "બધી વ્યવહારોની મંજૂરીઓ થઈ ગઈ છે અથવા નવો ગ્રાહક વિનંતી સબમિટ કરે તેની રાહ જોઈ રહ્યા છે." : "Customers who pay on your QR and submit their UTR will appear here immediately for confirmation."}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingTransactions.map((tx) => {
                      const isCurrentUser = tx.email === userState.email;
                      return (
                        <div 
                          key={tx.id}
                          className={`p-4 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 ${
                            isCurrentUser 
                              ? 'border-amber-500/40 bg-amber-500/5' 
                              : `${theme === 'dark' ? 'bg-[#0c1222]/30 border-slate-900 hover:border-slate-850' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`
                          }`}
                        >
                          <div className="space-y-2 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{tx.senderName}</span>
                              <span className="bg-blue-600/10 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-blue-500/15">
                                {tx.plan.toUpperCase()}
                              </span>
                              {isCurrentUser && (
                                <span className="bg-amber-500/15 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-amber-500/20">
                                  {isGu ? "તમારો વ્યવહાર" : "YOUR TRANSACTION"}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-[10px] text-slate-500 font-semibold font-mono">
                              <div>
                                <span className="text-slate-600 block text-[9px] uppercase font-black">{isGu ? "ઈમેલ આઈડી" : "USER EMAIL"}</span>
                                <span className="text-slate-400">{tx.email}</span>
                              </div>
                              <div>
                                <span className="text-slate-600 block text-[9px] uppercase font-black">{isGu ? "યુટીઆર નંબર" : "UTR REF ID"}</span>
                                <span className={`text-blue-500 font-extrabold select-all`}>{tx.utr}</span>
                              </div>
                              <div>
                                <span className="text-slate-600 block text-[9px] uppercase font-black">{isGu ? "સમય" : "DATE SUBMITTED"}</span>
                                <span className="text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-3.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-900">
                            <div className="text-left md:text-right shrink-0">
                              <span className="text-[9px] text-slate-500 font-black block uppercase tracking-wider">{isGu ? "ચુકવણી રકમ" : "SETTLEMENT AMOUNT"}</span>
                              <span className="text-sm font-mono font-black text-emerald-500">₹{tx.amount}</span>
                            </div>

                            <div className="flex gap-2">
                              {/* Reject button */}
                              <button
                                onClick={() => {
                                  if (tx.email === userState.email) {
                                    setUserPendingTx(null);
                                  }
                                  setPendingTransactions(prev => prev.filter(t => t.id !== tx.id));
                                  alert(isGu ? 'પેમેન્ટ અસ્વીકાર કરવામાં આવ્યું!' : 'Transaction rejected and removed from queue.');
                                }}
                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[10px] font-black py-2 px-3.5 rounded-xl transition-all duration-150 uppercase tracking-wider"
                              >
                                {isGu ? "અસ્વીકાર" : "Reject"}
                              </button>

                              {/* Approve button */}
                              <button
                                onClick={() => {
                                  if (tx.email === userState.email) {
                                    setUserState(prev => ({
                                      ...prev,
                                      tier: tx.plan,
                                      credits: 999999
                                    }));
                                    setUserPendingTx(null);
                                  }
                                  setPendingTransactions(prev => prev.filter(t => t.id !== tx.id));
                                  alert(isGu ? 'પેમેન્ટ સફળતાપૂર્વક મંજૂર કરવામાં આવ્યું! પ્રીમિયમ ચાલુ થયું!' : `Approved successfully! Granted ${tx.plan.toUpperCase()} access to ${tx.email}.`);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] py-2 px-4 rounded-xl shadow-lg shadow-emerald-500/10 transition-all duration-150 active:scale-95 uppercase tracking-wider"
                              >
                                {isGu ? "મંજૂર કરો" : "Approve & Activate"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SPONSOR & ADS LIVE MANAGEMENT HUB */}
              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/80 border-slate-900 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'} space-y-4`}>
                <div className="flex items-center gap-2 border-b border-slate-500/10 pb-3">
                  <Icons.Megaphone className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase block text-indigo-400">
                      {isGu ? "લાઇવ જાહેરાત અને પ્રાયોજક નિયંત્રણ" : "SPONSOR & ADS LIVE MANAGEMENT HUB"}
                    </span>
                    <h4 className="text-sm font-black uppercase">
                      {isGu ? "જાહેરાતો સેટ કરો (Google AdSense / Custom Banners)" : "Configure Site Advertisements"}
                    </h4>
                  </div>
                </div>

                {/* Advertisement Mode Select Tab */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 block">
                    {isGu ? "સક્રિય જાહેરાત મોડ" : "Active Ad Mode"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['custom', 'google', 'script', 'none'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAdsConfig(prev => ({ ...prev, activeMode: mode }))}
                        className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                          adsConfig.activeMode === mode
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/15'
                            : theme === 'dark'
                            ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-850 text-slate-400'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 shadow-sm'
                        }`}
                      >
                        {mode === 'custom' 
                          ? (isGu ? 'કસ્ટમ બેનર' : 'Custom Banner') 
                          : mode === 'google' 
                          ? 'Google AdSense' 
                          : mode === 'script' 
                          ? (isGu ? 'કસ્ટમ સ્ક્રિપ્ટ' : 'Script (Adsterra)') 
                          : (isGu ? 'બંધ કરો' : 'No Ads')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Form Inputs */}
                {adsConfig.activeMode === 'script' && (
                  <div className="space-y-1.5 pt-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 block">
                      Custom HTML/Script Code (Paste your Adsterra / PropellerAds script code here)
                    </label>
                    <textarea
                      value={adsConfig.customScriptCode}
                      onChange={(e) => setAdsConfig(prev => ({ ...prev, customScriptCode: e.target.value }))}
                      placeholder="e.g., <script type='text/javascript'>...</script> or <iframe ...></iframe>"
                      rows={5}
                      className={`w-full text-xs font-mono font-semibold p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                        theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                    <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                      This script gets injected directly inside the Ad container slots on your live website. Supports responsive banners, native widgets, or third-party ad tags.
                    </p>
                  </div>
                )}

                {adsConfig.activeMode === 'google' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 block">
                        Google AdSense Client ID (Publisher ID)
                      </label>
                      <input
                        type="text"
                        value={adsConfig.googleAdsenseClientId}
                        onChange={(e) => setAdsConfig(prev => ({ ...prev, googleAdsenseClientId: e.target.value }))}
                        placeholder="e.g., ca-pub-1234567890123456"
                        className={`w-full text-xs font-semibold font-mono p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                          theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 block">
                        Google AdSense Slot ID
                      </label>
                      <input
                        type="text"
                        value={adsConfig.googleAdsenseSlotId}
                        onChange={(e) => setAdsConfig(prev => ({ ...prev, googleAdsenseSlotId: e.target.value }))}
                        placeholder="e.g., 1234567890"
                        className={`w-full text-xs font-semibold font-mono p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                          theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {adsConfig.activeMode === 'custom' && (
                  <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* English Fields */}
                      <div className="space-y-3 p-3 rounded-xl border border-slate-500/10 bg-indigo-500/5">
                        <span className="text-[9px] font-black uppercase text-indigo-400 block tracking-widest">ENGLISH AD DETAIL</span>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black tracking-wider uppercase text-slate-500 block">English Title</label>
                          <input
                            type="text"
                            value={adsConfig.customTitleEn}
                            onChange={(e) => setAdsConfig(prev => ({ ...prev, customTitleEn: e.target.value }))}
                            placeholder="e.g., Advertise your company here!"
                            className={`w-full text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                              theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black tracking-wider uppercase text-slate-500 block">English Description</label>
                          <textarea
                            value={adsConfig.customDescriptionEn}
                            onChange={(e) => setAdsConfig(prev => ({ ...prev, customDescriptionEn: e.target.value }))}
                            placeholder="e.g., Promote your digital products to active developers."
                            rows={2}
                            className={`w-full text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                              theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Gujarati Fields */}
                      <div className="space-y-3 p-3 rounded-xl border border-slate-500/10 bg-emerald-500/5">
                        <span className="text-[9px] font-black uppercase text-emerald-400 block tracking-widest">ગુજરાતી જાહેરાત વિગત</span>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black tracking-wider uppercase text-slate-500 block">ગુજરાતી શીર્ષક (Gujarati Title)</label>
                          <input
                            type="text"
                            value={adsConfig.customTitleGu}
                            onChange={(e) => setAdsConfig(prev => ({ ...prev, customTitleGu: e.target.value }))}
                            placeholder="દા.ત. અહીં તમારી જાહેરાત મૂકો!"
                            className={`w-full text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                              theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black tracking-wider uppercase text-slate-500 block">ગુજરાતી વર્ણન (Gujarati Description)</label>
                          <textarea
                            value={adsConfig.customDescriptionGu}
                            onChange={(e) => setAdsConfig(prev => ({ ...prev, customDescriptionGu: e.target.value }))}
                            placeholder="દા.ત. આજના દિવસમાં હજારો ગુજરાતી સ્ટુડન્ટ્સ સુધી પહોંચો."
                            rows={2}
                            className={`w-full text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                              theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image & Redirect URL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 block">
                          {isGu ? "બેનર છબી લિંક (Banner Image URL)" : "Banner Image URL"}
                        </label>
                        <input
                          type="text"
                          value={adsConfig.customImageUrl}
                          onChange={(e) => setAdsConfig(prev => ({ ...prev, customImageUrl: e.target.value }))}
                          placeholder="e.g., https://images.unsplash.com/photo-..."
                          className={`w-full text-xs font-semibold font-mono p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                            theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black tracking-wider uppercase text-slate-500 block">
                          {isGu ? "લિંક રીડાયરેક્શન લિંક (Click Redirect Link)" : "Click Redirect URL"}
                        </label>
                        <input
                          type="text"
                          value={adsConfig.customRedirectUrl}
                          onChange={(e) => setAdsConfig(prev => ({ ...prev, customRedirectUrl: e.target.value }))}
                          placeholder="e.g., https://wa.me/91..."
                          className={`w-full text-xs font-semibold font-mono p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                            theme === 'dark' ? 'bg-[#04060c] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSynthSound('success');
                      showToast(isGu ? 'જાહેરાતો સેટિંગ્સ સફળતાપૂર્વક અપડેટ થઈ ગઈ!' : 'Advertisements updated successfully!', 'success');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] py-2 px-5 rounded-xl shadow-lg shadow-indigo-500/10 transition-all duration-150 uppercase tracking-widest"
                  >
                    {isGu ? "સેવ કરો 💾" : "Save Changes 💾"}
                  </button>
                </div>
              </div>

              {/* Security advice warning box */}
              <div className={`${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'} border p-4.5 rounded-2xl flex items-start gap-3`}>
                <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className={`text-[10px] font-black tracking-widest uppercase block ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{isGu ? "એડમિન સુરક્ષા સૂચનાઓ" : "MERCHANT COMPLIANCE ADVICE"}</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    {isGu 
                      ? "ચુકવણી મંજૂર કરતા પહેલા, કૃપા કરીને તમારા મોબાઇલ ફોન પર રહેલ બેંક એપ્લિકેશનમાં UTR ID અને મળેલ રકમ સરખાવી જુઓ. ત્યાર પછી જ લીલા રંગનું 'મંજૂર કરો' બટન દબાવો."
                      : "Always cross-reference the 12-digit UTR/Ref ID with your real banking application ledger statement before pressing 'Approve'. Approvals instantly activate full premium limits."}
                  </p>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= VOICE COMMANDS LISTENER MODAL ================= */}
      {isListening && (() => {
        const isGu = lang === 'gu';
        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center">
            <div className={`relative max-w-md w-full p-8 rounded-3xl border ${
              theme === 'dark' 
                ? 'bg-[#090d16] border-slate-900 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
            } space-y-6 animate-in fade-in zoom-in-95 duration-250`}>
              
              {/* Close Button */}
              <button
                onClick={() => setIsListening(false)}
                className={`absolute top-5 right-5 p-2 rounded-xl border transition ${
                  theme === 'dark' 
                    ? 'text-slate-500 hover:text-slate-200 bg-slate-950/80 border-slate-900 hover:border-slate-800' 
                    : 'text-slate-400 hover:text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Pulsing Mic visualizer */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping scale-150 duration-1000" />
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping scale-125 duration-700" />
                  <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 rounded-full shadow-lg relative z-10 animate-bounce">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black uppercase tracking-widest text-blue-500">
                    {isGu ? "સિસ્ટમ વૉઇસ આસિસ્ટન્ટ" : "AI Voice System Active"}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold">
                    {isGu ? "બોલો, સિસ્ટમ સાંભળે છે..." : "Speak a command aloud..."}
                  </p>
                </div>
              </div>

              {/* Live transcript or commands feedback */}
              <div className={`p-4 rounded-2xl border text-sm font-bold min-h-[70px] flex items-center justify-center ${
                theme === 'dark' ? 'bg-[#030712] border-slate-800/80' : 'bg-slate-50 border-slate-100'
              }`}>
                {voiceTranscript ? (
                  <div className="space-y-2 w-full text-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                      {isGu ? "તમે કહ્યું:" : "You said:"}
                    </span>
                    <p className={`text-base font-extrabold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'} italic`}>
                      "{voiceTranscript}"
                    </p>
                    {voiceCommandFeedback && (
                      <p className="text-xs text-emerald-400 font-black tracking-wide mt-1 animate-pulse">
                        ✓ {voiceCommandFeedback}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 font-bold italic animate-pulse">
                    {isGu ? "ઉદાહરણ: 'થીમ' અથવા 'invoice શોધો'" : "Try: 'theme', 'print', or 'search invoice'"}
                  </span>
                )}
              </div>

              {/* Helper list of triggers */}
              <div className="text-left space-y-2 border-t pt-4 border-slate-900/40">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  {isGu ? "સમર્થિત આદેશો:" : "Available commands:"}
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{isGu ? "'થીમ' / Theme Toggle" : "'theme' (Toggle)"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{isGu ? "'પ્રિન્ટ' / Print View" : "'print' (Print layout)"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{isGu ? "'સાફ' / Clear Search" : "'clear' (Reset search)"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{isGu ? "'પાછા' / Return Home" : "'home' / 'back'"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{isGu ? "'ગુજરાતી' / 'English'" : "'gujarati' / 'english'"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{isGu ? "'શોધો [શબ્દ]'" : "'search [text]'"}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= KEYBOARD SHORTCUTS CHEAT SHEET MODAL ================= */}
      {showShortcutsModal && (() => {
        const isGu = lang === 'gu';
        const shortcutsList = [
          { keys: ['Alt', 'K'], desc: isGu ? 'આ કીબોર્ડ શોર્ટકટ્સ લિસ્ટ ખોલો' : 'Toggle Keyboard Shortcuts panel' },
          { keys: ['Alt', 'S'], desc: isGu ? 'શોધ બાર પર જાઓ અને લખો' : 'Focus search input instantly' },
          { keys: ['Alt', 'T'], desc: isGu ? 'લાઇટ અને ડાર્ક થીમ બદલો' : 'Toggle system dark/light theme' },
          { keys: ['Alt', 'L'], desc: isGu ? 'ભાષા બદલો (અંગ્રેજી / ગુજરાતી)' : 'Toggle system language (EN/GU)' },
          { keys: ['Alt', 'B'], desc: isGu ? 'મુખ્ય ડેશબોર્ડ હોમ પર પાછા ફરો' : 'Return to main dashboard home' },
          { keys: ['Alt', 'A'], desc: isGu ? 'એડમિન કંટ્રોલ પેનલ ખોલો / બંધ કરો' : 'Toggle Merchant Admin Control Portal' },
          { keys: ['Esc'], desc: isGu ? 'સક્રિય ટૂલ અથવા ખુલેલા મોડલ બંધ કરો' : 'Close active tool or modal overlay' },
        ];

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-left">
            <div className={`${theme === 'dark' ? 'bg-[#090d16] border-slate-900 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'} border rounded-3xl max-w-md w-full p-6 relative space-y-5`}>
              
              <button
                onClick={() => setShowShortcutsModal(false)}
                className={`absolute top-5 right-5 p-2 rounded-xl border transition-all duration-150 ${theme === 'dark' ? 'text-slate-500 hover:text-slate-200 bg-slate-950/80 border-slate-900 hover:border-slate-800' : 'text-slate-400 hover:text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-1.5 border-b pb-3.5 border-slate-900/60">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Icons.Keyboard className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{isGu ? "કીબોર્ડ શોર્ટકટ્સ" : "Keyboard Shortcuts Panel"}</span>
                </span>
                <h3 className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {isGu ? "પ્રોડક્ટિવિટી હોટકીઝ" : "System Productivity Keys"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  {isGu ? "સમય બચાવવા માટે આ કીબોર્ડ શોર્ટકટ્સનો ઉપયોગ કરો." : "Boost your speed. Leverage system-wide hotkeys anywhere on the portal."}
                </p>
              </div>

              <div className="space-y-2.5">
                {shortcutsList.map((sc, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 text-xs font-semibold">
                    <span className="text-slate-400 shrink-0">{sc.desc}</span>
                    <div className="flex gap-1">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className={`px-2 py-1 rounded text-[10px] font-bold font-mono border ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-850 text-slate-300'
                              : 'bg-slate-100 border-slate-250 text-slate-700'
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-900/60 flex justify-end">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all duration-150 active:scale-95"
                >
                  {isGu ? "સમજી ગયો" : "Understood"}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= PORTABLE MOBILE TOUCH ASSIST PANEL ================= */}
      <div className="fixed bottom-6 left-6 z-40 select-none">
        {/* Expanded floating actions menu */}
        {showTouchAssist && (
          <div className={`absolute bottom-16 left-0 mb-2 ${theme === 'dark' ? 'bg-[#090d16]/95 border-slate-900 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800 shadow-2xl'} border rounded-2xl p-3.5 min-w-[220px] backdrop-blur-xl shadow-2xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200`}>
            <div className="border-b border-slate-900/40 pb-2 flex items-center justify-between">
              <span className="text-[9px] font-black tracking-widest text-blue-500 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500" />
                <span>{lang === 'gu' ? "મોબાઇલ આસિસ્ટન્ટ" : "Touch Assistant"}</span>
              </span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                Active
              </span>
            </div>

            {/* Quick action buttons list */}
            <div className="space-y-1.5 text-left">
              {/* Home / Return to Dashboard */}
              <button
                onClick={() => {
                  setSelectedToolId(null);
                  setSearchQuery('');
                  setShowTouchAssist(false);
                  showToast(lang === 'gu' ? 'મુખ્ય ડેશબોર્ડ' : 'Returned to Home Dashboard', 'info');
                }}
                className={`w-full text-left px-2.5 py-2 text-xs rounded-lg font-bold flex items-center gap-2.5 transition ${
                  theme === 'dark' ? 'hover:bg-slate-900/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Icons.Home className="w-4 h-4 text-blue-500" />
                <span>{lang === 'gu' ? "મુખ્ય હોમ પેજ" : "Dashboard Home"}</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => {
                  setLang(prev => prev === 'en' ? 'gu' : 'en');
                  showToast(lang === 'en' ? 'ભાષા બદલીને ગુજરાતી કરી!' : 'Language updated to English!', 'success');
                }}
                className={`w-full text-left px-2.5 py-2 text-xs rounded-lg font-bold flex items-center gap-2.5 transition ${
                  theme === 'dark' ? 'hover:bg-slate-900/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'gu' ? "English (અંગ્રેજી)" : "ગુજરાતી (Gujarati)"}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  setTheme(prev => prev === 'dark' ? 'light' : 'dark');
                  showToast(theme === 'dark' ? 'Light Theme activated' : 'Dark Theme activated', 'info');
                }}
                className={`w-full text-left px-2.5 py-2 text-xs rounded-lg font-bold flex items-center gap-2.5 transition ${
                  theme === 'dark' ? 'hover:bg-slate-900/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {theme === 'dark' ? (
                  <>
                    <Icons.Sun className="w-4 h-4 text-amber-500" />
                    <span>{lang === 'gu' ? "લાઇટ મોડ ચાલુ કરો" : "Switch to Light"}</span>
                  </>
                ) : (
                  <>
                    <Icons.Moon className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'gu' ? "ડાર્ક મોડ ચાલુ કરો" : "Switch to Dark"}</span>
                  </>
                )}
              </button>

              {/* Shortcuts panel */}
              <button
                onClick={() => {
                  setShowShortcutsModal(true);
                  setShowTouchAssist(false);
                }}
                className={`w-full text-left px-2.5 py-2 text-xs rounded-lg font-bold flex items-center gap-2.5 transition ${
                  theme === 'dark' ? 'hover:bg-slate-900/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Icons.Keyboard className="w-4 h-4 text-purple-500" />
                <span>{lang === 'gu' ? "શોર્ટકટ્સ લિસ્ટ" : "Productivity Info"}</span>
              </button>

              {/* Merchant Portal */}
              <button
                onClick={() => {
                  setShowAdminPortal(true);
                  setShowTouchAssist(false);
                }}
                className={`w-full text-left px-2.5 py-2 text-xs rounded-lg font-bold flex items-center gap-2.5 transition ${
                  theme === 'dark' ? 'hover:bg-slate-900/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-500" />
                <span>{lang === 'gu' ? "એડમિન કંટ્રોલ" : "Merchant Admin"}</span>
              </button>

              {/* Clear search query if active */}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    showToast(lang === 'gu' ? 'શ્રેણીઓ સાફ કરી' : 'Cleared search filters', 'info');
                  }}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-lg font-bold flex items-center gap-2.5 transition ${
                    theme === 'dark' ? 'hover:bg-slate-900/60 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icons.Trash2 className="w-4 h-4 text-red-500" />
                  <span>{lang === 'gu' ? "શોધ સાફ કરો" : "Clear Search"}</span>
                </button>
              )}
            </div>

            <div className="border-t border-slate-900/40 pt-2 flex items-center justify-between text-[9px] font-bold text-slate-500">
              <span>{lang === 'gu' ? "ક્રેડિટ્સ લિમીટ:" : "CREDITS BOUND:"}</span>
              <span className="text-blue-400">
                {userState.tier === 'elite' ? 'ULTRA' : userState.tier === 'pro' ? 'UNLIMITED' : `${userState.credits}`}
              </span>
            </div>
          </div>
        )}

        {/* Floating circular button itself */}
        <button
          onClick={() => setShowTouchAssist(prev => !prev)}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center border transition-all duration-300 transform hover:scale-110 active:scale-95 ${
            showTouchAssist
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/25 rotate-90'
              : theme === 'dark'
              ? 'bg-[#090d16] text-blue-400 border-slate-900 hover:border-slate-800 hover:text-blue-300 shadow-blue-500/10'
              : 'bg-white text-blue-600 border-slate-200 hover:bg-slate-50 shadow-lg'
          }`}
          title={lang === 'gu' ? "ઝડપી શોર્ટકટ્સ આસિસ્ટન્ટ" : "Quick Touch Assistant"}
        >
          {showTouchAssist ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <div className="relative">
              <Icons.Zap className="w-5 h-5 fill-current animate-pulse text-blue-500" />
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-[#030712]" />
            </div>
          )}
        </button>
      </div>
 
      {/* ================= ONBOARDING FLOATING TOUR STEP OVERLAY ================= */}
      <AnimatePresence>
        {tourStep !== null && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', duration: 0.45 }}
              className={`w-full max-w-md p-6 rounded-3xl border ${
                theme === 'dark' ? 'bg-[#090d16] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
              } space-y-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">
                  {lang === 'gu' ? `માર્ગદર્શિકા — પગલું ${tourStep + 1} / 5` : `Tour Guide — Step ${tourStep + 1} / 5`}
                </span>
                <button
                  onClick={() => {
                    setTourStep(null);
                    playSynthSound('click');
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-left">
                <h3 className="text-base font-black leading-tight">
                  {tourStep === 0 && (LOCALIZED_TEXT[lang]?.tourWelcomeTitle || LOCALIZED_TEXT['en']?.tourWelcomeTitle)}
                  {tourStep === 1 && (LOCALIZED_TEXT[lang]?.tourSearchTitle || LOCALIZED_TEXT['en']?.tourSearchTitle)}
                  {tourStep === 2 && (LOCALIZED_TEXT[lang]?.tourGridTitle || LOCALIZED_TEXT['en']?.tourGridTitle)}
                  {tourStep === 3 && (LOCALIZED_TEXT[lang]?.tourGoalsTitle || LOCALIZED_TEXT['en']?.tourGoalsTitle)}
                  {tourStep === 4 && (LOCALIZED_TEXT[lang]?.tourFavsTitle || LOCALIZED_TEXT['en']?.tourFavsTitle)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {tourStep === 0 && (LOCALIZED_TEXT[lang]?.tourWelcomeDesc || LOCALIZED_TEXT['en']?.tourWelcomeDesc)}
                  {tourStep === 1 && (LOCALIZED_TEXT[lang]?.tourSearchDesc || LOCALIZED_TEXT['en']?.tourSearchDesc)}
                  {tourStep === 2 && (LOCALIZED_TEXT[lang]?.tourGridDesc || LOCALIZED_TEXT['en']?.tourGridDesc)}
                  {tourStep === 3 && (LOCALIZED_TEXT[lang]?.tourGoalsDesc || LOCALIZED_TEXT['en']?.tourGoalsDesc)}
                  {tourStep === 4 && (LOCALIZED_TEXT[lang]?.tourFavsDesc || LOCALIZED_TEXT['en']?.tourFavsDesc)}
                </p>
              </div>

              {/* Highlight locator cue (scrolling target into view) */}
              <div className="flex items-center justify-between pt-3.5 border-t border-slate-500/10">
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === tourStep ? 'w-4 bg-blue-500' : 'w-1.5 bg-slate-500/20'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {tourStep > 0 && (
                    <button
                      onClick={() => {
                        setTourStep(prev => prev !== null ? prev - 1 : null);
                        playSynthSound('click');
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {LOCALIZED_TEXT[lang]?.tourPrev || "Back"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (tourStep < 4) {
                        const nextStep = tourStep + 1;
                        setTourStep(nextStep);
                        playSynthSound('click');
                        // Trigger auto scroll to highlight elements on main page
                        const targets = ['', 'search-bar-container', 'tools-grid', 'interactive-panels', 'favorites-history'];
                        const targetId = targets[nextStep];
                        if (targetId) {
                          setTimeout(() => {
                            const el = document.getElementById(targetId);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'dark:ring-offset-[#030712]');
                              setTimeout(() => {
                                el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'dark:ring-offset-[#030712]');
                              }, 2000);
                            }
                          }, 100);
                        }
                      } else {
                        setTourStep(null);
                        playSynthSound('success');
                        showToast(lang === 'gu' ? "માર્ગદર્શિકા પૂર્ણ થઈ! 🌟" : "Tutorial Completed Successfully! 🌟", "success");
                      }
                    }}
                    className="px-4 py-1.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/15 transition active:scale-95"
                  >
                    {tourStep === 4 ? (LOCALIZED_TEXT[lang]?.tourFinish || "Finish Tour") : (LOCALIZED_TEXT[lang]?.tourNext || "Next")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal
            lang={lang}
            theme={theme}
            userState={userState}
            onClose={() => setShowProfileModal(false)}
            onUpdateSuccess={(updatedUser) => {
              setUserState(prev => ({
                ...prev,
                name: updatedUser.name,
                username: updatedUser.username,
                college: updatedUser.college,
                semester: updatedUser.semester
              }));
            }}
            playSynthSound={playSynthSound}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* ================= GLOBAL TOASTS STACK NOTIFICATIONS ================= */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/30 text-red-300'
                : 'bg-blue-950/90 border-blue-500/30 text-blue-300'
            }`}
          >
            {toast.type === 'success' ? (
              <Icons.CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <Icons.AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Icons.Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span className="text-xs font-extrabold tracking-wide text-left">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-white shrink-0 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ================= GLOBAL FOOTER ================= */}
      <footer className={`${theme === 'dark' ? 'bg-[#04060c] border-slate-900/60' : 'bg-slate-50 border-slate-200/80 text-slate-700'} border-t px-4 py-8 text-center text-[10px] space-y-2 font-mono mt-12`}>
        <p className="font-extrabold tracking-wide text-slate-500">AI SUPER TOOLS HUB IS AN ELITE RESPONSIVE PORTAL. POWERED BY HYPER-LATENCY GEMINI 3.6 PRO ENGINE.</p>
        <p>© 2026 AI Super Tools Hub. Production Server Node Gateway. Verified Safe. No client-side API leaks detected.</p>
      </footer>
    </div>
  );
}
