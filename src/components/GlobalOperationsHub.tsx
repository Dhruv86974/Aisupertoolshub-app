import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';

interface GlobalOperationsHubProps {
  lang: 'en' | 'gu' | 'hi';
  theme: 'light' | 'dark';
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle') => void;
}

interface ServerNode {
  id: string;
  nameEn: string;
  nameGu: string;
  location: string;
  ping: number;
  status: 'online' | 'busy' | 'checking';
  coords: { x: number; y: number }; // Percentage coords on grid
}

interface LiveRequest {
  id: string;
  cityEn: string;
  cityGu: string;
  actionEn: string;
  actionGu: string;
  time: string;
  latency: string;
  badge: string;
}

const INITIAL_NODES: ServerNode[] = [
  { id: 'us-east', nameEn: 'US East Edge (Virginia)', nameGu: 'યુએસ ઇસ્ટ એજ (વર્જિનિયા)', location: 'Virginia, USA', ping: 42, status: 'online', coords: { x: 22, y: 35 } },
  { id: 'eu-west', nameEn: 'EU West Gateway (Frankfurt)', nameGu: 'યુરોપ વેસ્ટ ગેટવે (ફ્રેન્કફર્ટ)', location: 'Frankfurt, Germany', ping: 58, status: 'online', coords: { x: 48, y: 28 } },
  { id: 'asia-east', nameEn: 'APAC Spine Server (Tokyo)', nameGu: 'એશિયા સ્પાઇન સર્વર (ટોક્યો)', location: 'Tokyo, Japan', ping: 84, status: 'online', coords: { x: 82, y: 40 } },
  { id: 'in-west', nameEn: 'India Central Core (Mumbai)', nameGu: 'ઇન્ડિયા સેન્ટ્રલ કોર (મુંબઈ)', location: 'Mumbai, India', ping: 14, status: 'online', coords: { x: 68, y: 55 } },
  { id: 'sa-east', nameEn: 'LatAm Bridge (São Paulo)', nameGu: 'લેટિન બ્રિજ (સાઓ પાઉલો)', location: 'São Paulo, Brazil', ping: 112, status: 'online', coords: { x: 34, y: 78 } },
  { id: 'aus-east', nameEn: 'Oceania Link (Sydney)', nameGu: 'ઓશેનિયા લિંક (સિડની)', location: 'Sydney, Australia', ping: 128, status: 'online', coords: { x: 88, y: 82 } },
];

const MOCK_CITIES = [
  { en: 'Mumbai', gu: 'મુંબઈ' },
  { en: 'New York', gu: 'ન્યૂ યોર્ક' },
  { en: 'London', gu: 'લંડન' },
  { en: 'Tokyo', gu: 'ટોક્યો' },
  { en: 'Paris', gu: 'પેરિસ' },
  { en: 'San Francisco', gu: 'સેન ફ્રાન્સિસ્કો' },
  { en: 'Berlin', gu: 'બર્લિન' },
  { en: 'Singapore', gu: 'સિંગાપોર' },
  { en: 'Sydney', gu: 'સિડની' },
  { en: 'Toronto', gu: 'ટોરોન્ટો' },
];

const MOCK_ACTIONS = [
  { en: 'OCR Document Transcribed', gu: 'OCR દસ્તાવેજ ટ્રાન્સક્રાઇબ કર્યો', badge: 'OCR' },
  { en: 'Gemini Code Synthesis', gu: 'જેમિની કોડ સિન્થેસિસ સફળ', badge: 'AI' },
  { en: 'Tailwind Sandbox Executed', gu: 'ટેલવિન્ડ સેન્ડબોક્સ રન થયું', badge: 'SANDBOX' },
  { en: 'Invoice Ledger Split', gu: 'ઇનવોઇસ ખાતાવહી વિભાજીત કરી', badge: 'FINANCE' },
  { en: 'Color Matrix Rendered', gu: 'કલર મેટ્રિક્સ રેન્ડર કરવામાં આવી', badge: 'COLOR' },
  { en: 'Speech Preset Configured', gu: 'સ્પીચ પ્રીસેટ કોન્ફિગર થઈ', badge: 'AUDIO' },
  { en: 'JSON API Object Parsed', gu: 'JSON API ઓબ્જેક્ટ પાર્સ થયો', badge: 'DEV' },
];

export default function GlobalOperationsHub({ lang, theme, playSynthSound }: GlobalOperationsHubProps) {
  const [nodes, setNodes] = useState<ServerNode[]>(INITIAL_NODES);
  const [requestsCount, setRequestsCount] = useState<number>(() => {
    const saved = localStorage.getItem('hub_global_req_count');
    return saved ? parseInt(saved, 10) : 1248590;
  });
  const [liveRequests, setLiveRequests] = useState<LiveRequest[]>([
    { id: '1', cityEn: 'Mumbai', cityGu: 'મુંબઈ', actionEn: 'Gemini Code Synthesis', actionGu: 'જેમિની કોડ સિન્થેસિસ સફળ', time: 'Just now', latency: '12ms', badge: 'AI' },
    { id: '2', cityEn: 'New York', cityGu: 'ન્યૂ યોર્ક', actionEn: 'OCR Document Transcribed', actionGu: 'OCR દસ્તાવેજ ટ્રાન્સક્રાઇબ કર્યો', time: '1s ago', latency: '45ms', badge: 'OCR' },
    { id: '3', cityEn: 'London', cityGu: 'લંડન', actionEn: 'Tailwind Sandbox Executed', actionGu: 'ટેલવિન્ડ સેન્ડબોક્સ રન થયું', time: '3s ago', latency: '62ms', badge: 'SANDBOX' },
  ]);

  const [activeTab, setActiveTab] = useState<'nodes' | 'speedtest'>('nodes');
  const [selectedNode, setSelectedNode] = useState<ServerNode | null>(INITIAL_NODES[3]); // Default Mumbai
  const [pingingAll, setPingingAll] = useState(false);
  const [testResult, setTestResult] = useState<{
    download: number;
    upload: number;
    jitter: number;
    active: boolean;
    stage: 'idle' | 'pinging' | 'download' | 'upload' | 'complete';
  }>({
    download: 0,
    upload: 0,
    jitter: 0,
    active: false,
    stage: 'idle'
  });

  const speedtestInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto increment global request count realistically
  useEffect(() => {
    const timer = setInterval(() => {
      setRequestsCount(prev => {
        const next = prev + Math.floor(Math.random() * 3) + 1;
        localStorage.setItem('hub_global_req_count', String(next));
        return next;
      });

      // Add fresh live request with 40% probability
      if (Math.random() > 0.4) {
        const city = MOCK_CITIES[Math.floor(Math.random() * MOCK_CITIES.length)];
        const action = MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)];
        const newReq: LiveRequest = {
          id: String(Date.now()),
          cityEn: city.en,
          cityGu: city.gu,
          actionEn: action.en,
          actionGu: action.gu,
          time: 'Just now',
          latency: `${Math.floor(Math.random() * 120) + 8}ms`,
          badge: action.badge
        };

        setLiveRequests(prev => [newReq, ...prev.slice(0, 5)]);
      }
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  const handlePingAll = () => {
    if (pingingAll) return;
    setPingingAll(true);
    playSynthSound('toggle');

    // Simulate pinging every node sequential
    setNodes(prev => prev.map(n => ({ ...n, status: 'checking' })));

    let index = 0;
    const interval = setInterval(() => {
      if (index < INITIAL_NODES.length) {
        const nodeId = INITIAL_NODES[index].id;
        const randomVariation = Math.floor(Math.random() * 16) - 8;
        const currentBase = INITIAL_NODES[index].ping;
        const newPing = Math.max(4, currentBase + randomVariation);

        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'online', ping: newPing } : n));
        playSynthSound('click');
        index++;
      } else {
        clearInterval(interval);
        setPingingAll(false);
        playSynthSound('success');
      }
    }, 350);
  };

  const startSpeedTest = () => {
    if (testResult.active) return;
    playSynthSound('toggle');
    setTestResult({
      download: 0,
      upload: 0,
      jitter: 0,
      active: true,
      stage: 'pinging'
    });

    let currentStage: 'pinging' | 'download' | 'upload' | 'complete' = 'pinging';
    let tick = 0;

    speedtestInterval.current = setInterval(() => {
      tick++;
      if (tick < 6) {
        // Pinging stage
        setTestResult(prev => ({
          ...prev,
          jitter: Math.floor(Math.random() * 4) + 1
        }));
        if (tick === 1) playSynthSound('click');
      } else if (tick < 18) {
        // Download test stage
        currentStage = 'download';
        const targetDownload = 482.4 + Math.random() * 45;
        setTestResult(prev => ({
          ...prev,
          stage: 'download',
          download: parseFloat((prev.download + (targetDownload - prev.download) * 0.35).toFixed(1))
        }));
        if (tick % 3 === 0) playSynthSound('click');
      } else if (tick < 30) {
        // Upload test stage
        currentStage = 'upload';
        const targetUpload = 188.2 + Math.random() * 20;
        setTestResult(prev => ({
          ...prev,
          stage: 'upload',
          upload: parseFloat((prev.upload + (targetUpload - prev.upload) * 0.35).toFixed(1))
        }));
        if (tick % 3 === 0) playSynthSound('click');
      } else {
        // Complete
        if (speedtestInterval.current) clearInterval(speedtestInterval.current);
        setTestResult(prev => ({
          ...prev,
          stage: 'complete',
          active: false
        }));
        playSynthSound('success');
      }
    }, 180);
  };

  return (
    <div className={`border rounded-3xl p-5 lg:p-6 text-left relative overflow-hidden ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-[#090d16] via-[#050810] to-[#020408] border-slate-900/90' 
        : 'bg-white border-slate-200 shadow-md'
    }`}>
      
      {/* Decorative backdrop elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-500/10 mb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-extrabold text-[9px] uppercase tracking-wider">
            <Icons.Globe className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{lang === 'gu' ? 'વિશ્વ કક્ષાની એક્ટિવિટી' : 'World-Class Operations'}</span>
          </div>
          <h3 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            {lang === 'gu' ? 'ગ્લોબલ સર્વર નોડ્સ અને ટ્રાફિક' : 'Global Network Node & Traffic'}
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </h3>
        </div>

        {/* Global Live request counter */}
        <div className={`p-2.5 rounded-2xl border flex items-center gap-3.5 ${
          theme === 'dark' ? 'bg-[#03060c] border-slate-900' : 'bg-slate-50 border-slate-150'
        }`}>
          <div className="text-right space-y-0.5">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold block">
              {lang === 'gu' ? 'કુલ ગ્લોબલ રિક્વેસ્ટ્સ' : 'Total System Pings'}
            </span>
            <span className="text-sm font-black font-mono text-emerald-500 tracking-tight">
              {requestsCount.toLocaleString()}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Icons.Activity className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Selection Tabs */}
      <div className="flex gap-1.5 mb-5 p-1 rounded-xl bg-slate-500/5 max-w-xs">
        <button
          onClick={() => { setActiveTab('nodes'); playSynthSound('click'); }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'nodes'
              ? theme === 'dark' ? 'bg-[#0d1527] text-white shadow' : 'bg-white text-slate-900 shadow'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icons.Server className="w-3.5 h-3.5" />
          <span>{lang === 'gu' ? 'સર્વર નોડ્સ' : 'Server Nodes'}</span>
        </button>
        <button
          onClick={() => { setActiveTab('speedtest'); playSynthSound('click'); }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'speedtest'
              ? theme === 'dark' ? 'bg-[#0d1527] text-white shadow' : 'bg-white text-slate-900 shadow'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icons.Cpu className="w-3.5 h-3.5" />
          <span>{lang === 'gu' ? 'સ્પીડ ટેસ્ટ' : 'Speed Meter'}</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Server Network Map or Speed Test Interface */}
        <div className="lg:col-span-7 space-y-4">
          
          {activeTab === 'nodes' ? (
            <div className="space-y-4">
              {/* Symbolic Global Network map background */}
              <div className={`relative h-[220px] rounded-2xl border overflow-hidden ${
                theme === 'dark' ? 'bg-[#04070e] border-slate-900' : 'bg-slate-100/60 border-slate-200'
              }`}>
                {/* Symbolic SVG map grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.12] pointer-events-none">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke={theme === 'dark' ? '#38bdf8' : '#1e3a8a'} strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Visual network lines between nodes */}
                  {nodes.map((node, i) => {
                    const nextNode = nodes[(i + 1) % nodes.length];
                    return (
                      <line
                        key={`line-${node.id}`}
                        x1={`${node.coords.x}%`}
                        y1={`${node.coords.y}%`}
                        x2={`${nextNode.coords.x}%`}
                        y2={`${nextNode.coords.y}%`}
                        stroke={theme === 'dark' ? '#4f46e5' : '#3b82f6'}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </svg>

                {/* Node Markers */}
                {nodes.map(node => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        playSynthSound('click');
                      }}
                      style={{ left: `${node.coords.x}%`, top: `${node.coords.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                    >
                      <span className="relative flex h-5 w-5 items-center justify-center">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          node.status === 'checking' 
                            ? 'bg-amber-400' 
                            : isSelected 
                              ? 'bg-indigo-500' 
                              : 'bg-emerald-500'
                        }`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-white dark:border-slate-900 ${
                          node.status === 'checking'
                            ? 'bg-amber-500'
                            : isSelected
                              ? 'bg-indigo-600'
                              : 'bg-emerald-500'
                        }`} />
                      </span>
                      {/* Hover Tooltip label */}
                      <span className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none ${
                        theme === 'dark' ? 'bg-slate-950 border border-slate-900 text-slate-300' : 'bg-slate-800 text-white'
                      }`}>
                        {lang === 'gu' ? node.nameGu : node.nameEn} ({node.ping}ms)
                      </span>
                    </button>
                  );
                })}

                {/* Corner Quick Control */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <button
                    onClick={handlePingAll}
                    disabled={pingingAll}
                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center gap-1 shadow-md active:scale-95 transition"
                  >
                    <Icons.Zap className="w-3 h-3" />
                    <span>{pingingAll ? (lang === 'gu' ? 'તપાસ ચાલુ...' : 'Pinging...') : (lang === 'gu' ? 'બધા નોડ ટેસ્ટ કરો' : 'Test All Nodes')}</span>
                  </button>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] text-emerald-500 font-black uppercase tracking-wider">
                    {lang === 'gu' ? '૯૯.૯૮% અપટાઇમ' : '99.98% Core Uptime'}
                  </span>
                </div>
              </div>

              {/* Node Detailed Information Card */}
              {selectedNode && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  theme === 'dark' ? 'bg-[#04070e] border-slate-900/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Icons.Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          {lang === 'gu' ? selectedNode.nameGu : selectedNode.nameEn}
                        </h4>
                        <p className="text-[9px] text-slate-500 font-bold">{selectedNode.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase block">{lang === 'gu' ? 'રિસ્પોન્સ ટાઈમ' : 'Response'}</span>
                      <span className="text-xs font-black font-mono text-indigo-500 dark:text-indigo-400">
                        {selectedNode.ping} ms
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-500/10 text-[10px]">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold block">{lang === 'gu' ? 'તમામ ટ્રાફિક ભાર' : 'Server Load'}</span>
                      <span className={`font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {selectedNode.id === 'in-west' ? '28%' : selectedNode.id === 'us-east' ? '54%' : '38%'}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold block">{lang === 'gu' ? 'ઈન્ક્રિપ્શન' : 'Encryption'}</span>
                      <span className="font-black text-emerald-500">TLS 1.3 / AES-256</span>
                    </div>
                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                      <span className="text-slate-500 font-bold block">{lang === 'gu' ? 'હબ ઓર્ગેનાઈઝર' : 'Hub Protocol'}</span>
                      <span className="font-black text-blue-500">HTTP/3 Quic</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Speed Test View */
            <div className={`p-4 rounded-2xl border space-y-4 ${
              theme === 'dark' ? 'bg-[#04070e] border-slate-900/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-center py-2 space-y-1">
                <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {lang === 'gu' ? 'બ્રાઉઝર અને ગ્લોબલ ગેટવે લિંક સ્પીડ' : 'Direct Gateway Connection Quality'}
                </h4>
                <p className="text-[9px] text-slate-500 font-bold">
                  {lang === 'gu' ? 'એમ્બિયન્ટ ફાસ્ટ ક્લાઉડ નેટવર્ક જોડાણ માપો' : 'Simulated browser response times & secure cloud latency'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-white border-slate-150'}`}>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">{lang === 'gu' ? 'ડાઉનલોડ સ્પીડ' : 'Download'}</span>
                  <span className="text-lg font-black font-mono text-indigo-500 block leading-tight mt-1">
                    {testResult.download || '—'}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold">Mbps</span>
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-white border-slate-150'}`}>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">{lang === 'gu' ? 'અપલોડ સ્પીડ' : 'Upload'}</span>
                  <span className="text-lg font-black font-mono text-emerald-500 block leading-tight mt-1">
                    {testResult.upload || '—'}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold">Mbps</span>
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-white border-slate-150'}`}>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block">{lang === 'gu' ? 'જીટર / વાઇબ્રેશન' : 'Jitter'}</span>
                  <span className="text-lg font-black font-mono text-amber-500 block leading-tight mt-1">
                    {testResult.jitter ? `${testResult.jitter} ms` : '—'}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold">Latency jitter</span>
                </div>
              </div>

              {/* Graphical representation of the test */}
              <div className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: testResult.stage === 'idle'
                      ? '0%'
                      : testResult.stage === 'pinging'
                        ? '20%'
                        : testResult.stage === 'download'
                          ? '60%'
                          : testResult.stage === 'upload'
                            ? '90%'
                            : '100%'
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
                />
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={startSpeedTest}
                  disabled={testResult.active}
                  className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 ${
                    testResult.active
                      ? 'bg-slate-500/20 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {testResult.stage === 'idle' 
                    ? (lang === 'gu' ? 'સ્પીડ ચેક કરો' : 'Start Performance Meter') 
                    : testResult.stage === 'complete' 
                      ? (lang === 'gu' ? 'ફરી તપાસ કરો' : 'Retest Performance') 
                      : (lang === 'gu' ? 'ચકાસણી ચાલુ...' : 'Measuring Link...')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Network Operations Request Feed */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              {lang === 'gu' ? 'લાઈવ રિક્વેસ્ટ ફીડ (સિગ્નલ)' : 'Real-time Activity stream'}
            </span>
            <span className="flex items-center gap-1.5 text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'gu' ? 'સક્રિય' : 'Active Logs'}</span>
            </span>
          </div>

          <div className="space-y-2 max-h-[295px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {liveRequests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: 20, y: -5 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-left ${
                    theme === 'dark' ? 'bg-[#04070e] border-slate-900/60' : 'bg-slate-50 border-slate-150'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                        req.badge === 'AI' 
                          ? 'bg-blue-500/10 text-blue-500' 
                          : req.badge === 'OCR'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-purple-500/10 text-purple-500'
                      }`}>
                        {req.badge}
                      </span>
                      <span className={`text-[11px] font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
                        {lang === 'gu' ? req.cityGu : req.cityEn}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold leading-none">
                      {lang === 'gu' ? req.actionGu : req.actionEn}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <span className="text-[9px] text-emerald-500 font-mono block font-black">
                      {req.latency}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold block">
                      {lang === 'gu' ? 'હમણાં જ' : 'Live Ping'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
}
