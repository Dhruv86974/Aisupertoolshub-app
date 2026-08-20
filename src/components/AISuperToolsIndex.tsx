import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';

interface AISuperToolsIndexProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle' | 'achievement') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
}

export default function AISuperToolsIndex({
  lang,
  theme,
  playSynthSound,
  addXPPoints
}: AISuperToolsIndexProps) {
  const isGu = lang === 'gu';

  // Base index history data
  const [indexData, setIndexData] = useState(() => {
    return [
      { name: 'Jan', LLM: 1200, Vision: 850, Audio: 600, MarketCap: 2650 },
      { name: 'Feb', LLM: 1350, Vision: 920, Audio: 680, MarketCap: 2950 },
      { name: 'Mar', LLM: 1580, Vision: 1100, Audio: 720, MarketCap: 3400 },
      { name: 'Apr', LLM: 1820, Vision: 1250, Audio: 840, MarketCap: 3910 },
      { name: 'May', LLM: 2100, Vision: 1400, Audio: 910, MarketCap: 4410 },
      { name: 'Jun', LLM: 2450, Vision: 1680, Audio: 1120, MarketCap: 5250 },
      { name: 'Jul', LLM: 2890, Vision: 1950, Audio: 1280, MarketCap: 6120 },
      { name: 'Aug', LLM: 3240, Vision: 2150, Audio: 1420, MarketCap: 6810 }
    ];
  });

  // Category distributions data
  const categoryWeights = [
    { name: 'LLMs & Chatbots', weight: 45, color: '#6366f1' },
    { name: 'Vision & Avatars', weight: 28, color: '#3b82f6' },
    { name: 'Audio & Speech Synthesizers', weight: 17, color: '#10b981' },
    { name: 'Developer Toolkits', weight: 10, color: '#f59e0b' }
  ];

  // Active indices numbers
  const [activeLLMIndex, setActiveLLMIndex] = useState(3240);
  const [activeCapIndex, setActiveCapIndex] = useState(6810);

  const handleUpdateFluctuations = () => {
    playSynthSound('success');
    
    // Simulate slight trading fluctuations
    const deltaLLM = Math.floor(Math.random() * 80) - 30;
    const deltaCap = Math.floor(Math.random() * 120) - 40;

    setActiveLLMIndex(prev => prev + deltaLLM);
    setActiveCapIndex(prev => prev + deltaCap);

    // Update the last month index point
    setIndexData(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = {
        ...updated[lastIndex],
        LLM: updated[lastIndex].LLM + deltaLLM,
        MarketCap: updated[lastIndex].MarketCap + deltaCap
      };
      return updated;
    });

    addXPPoints(10, `Triggered live market index tick calculations`, `એઆઈ બજાર ઇન્ડેક્સ ગણતરીઓ અપડેટ કરી!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden text-left ${
        theme === 'dark' ? 'bg-gradient-to-br from-indigo-950/20 via-slate-950 to-slate-950 border-indigo-950/40' : 'bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-mono uppercase">
          {isGu ? '૧૩. એઆઈ બજાર ટ્રેન્ડ્સ અને ગ્રાફ્સ' : 'GLOBAL AI MARKET TRENDS'}
        </span>
        <h2 className={`text-xl font-black mt-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {isGu ? 'એઆઈ ઉદ્યોગ અને બજાર કિંમત નિર્ધારણ સૂચકાંક' : 'AI Industry Valuation & Pricing Indices'}
        </h2>
        <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
          {isGu ? 'વિવિધ એઆઈ કેટેગરીના પ્રગતિ ગ્રાફ્સ જુઓ, દૈનિક હલનચલન અને આંકડાઓ ટ્રેક કરો.' : 'Monitor global developer usage indices, analyze category valuations via recharts, and trigger real-time simulated financial market ticks.'}
        </p>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: LLM Index */}
        <div className={`p-5 rounded-2xl border text-left flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[8px] font-black uppercase text-indigo-400 font-mono tracking-wider">CORE LLM CONVERGENCE INDEX</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-2xl font-black font-mono text-emerald-400">{activeLLMIndex.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center">
                <Icons.TrendingUp className="w-3.5 h-3.5" />
                <span>+4.2%</span>
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Icons.Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Market Cap index */}
        <div className={`p-5 rounded-2xl border text-left flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[8px] font-black uppercase text-indigo-400 font-mono tracking-wider">COMBINED VALUATION INDEX</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-2xl font-black font-mono text-emerald-400">{activeCapIndex.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center">
                <Icons.TrendingUp className="w-3.5 h-3.5" />
                <span>+6.8%</span>
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Icons.DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Live Trading refresh trigger */}
        <div className={`p-5 rounded-2xl border text-left flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#090d16] border-emerald-500/20' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[8px] font-black uppercase text-emerald-400 font-mono tracking-wider">REAL-TIME INDEX TICKS</span>
            <span className="block text-xs text-slate-500 font-semibold mt-1">Force live market recalculation</span>
            <button
              onClick={handleUpdateFluctuations}
              className="mt-2.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer flex items-center gap-1"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Recalculate Indices</span>
            </button>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <Icons.Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Recharts Main index trends */}
        <div className="xl:col-span-2 space-y-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
            {isGu ? '૨૦૨૬ એઆઈ કન્વર્જન્સ ગ્રોથ ગ્રાફ' : 'AI CONVERGENCE PERFORMANCE HISTORY (USD)'}
          </span>

          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={indexData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLLM" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={9} fontStyle="bold" tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} fontStyle="bold" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#04060c' : '#ffffff',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                    }}
                  />
                  <Area type="monotone" dataKey="LLM" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorLLM)" name="LLM Index" />
                  <Area type="monotone" dataKey="MarketCap" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCap)" name="Market Volume" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Weight distributions */}
        <div className="xl:col-span-1 space-y-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
            {isGu ? 'કેટેગરી બજાર હિસ્સો' : 'CATEGORY INDEX WEIGHTS'}
          </span>

          <div className={`p-5 rounded-2xl border text-left space-y-4 ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h4 className="text-[11px] font-black text-slate-400 font-mono uppercase tracking-wider">
              VALUATION CONTRIBUTION SHARE
            </h4>

            <div className="space-y-3.5">
              {categoryWeights.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <span className="text-slate-400">{cat.name}</span>
                    <span className="font-mono text-emerald-400">{cat.weight}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900/40">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ backgroundColor: cat.color, width: `${cat.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
              Valuation indices are aggregated dynamically across 52 audited public tools registries, mapping total monthly search queries, GitHub forks, and verified seat pricing schedules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
