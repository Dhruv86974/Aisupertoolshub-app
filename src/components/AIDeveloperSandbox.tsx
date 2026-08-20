import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';

interface AIDeveloperSandboxProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle' | 'achievement') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
}

export default function AIDeveloperSandbox({
  lang,
  theme,
  playSynthSound,
  addXPPoints
}: AIDeveloperSandboxProps) {
  const isGu = lang === 'gu';

  // Config parameters state
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [topP, setTopP] = useState<number>(0.95);
  const [stream, setStream] = useState<boolean>(false);

  // Active code tab
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');

  // Simulator states
  const [simulating, setSimulating] = useState(false);
  const [simulatedResponse, setSimulatedResponse] = useState<string>('');

  const generateCodeSnippet = () => {
    switch (activeTab) {
      case 'curl':
        return `curl https://api.aisupertools.hub/v1/chat/completions \\
  -H "Authorization: Bearer $AI_SUPERTOOLS_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [{"role": "user", "content": "Explain quantum physics"}],
    "temperature": ${temperature},
    "max_tokens": ${maxTokens},
    "top_p": ${topP},
    "stream": ${stream}
  }'`;
      case 'js':
        return `import { AISuperTools } from '@aisupertools/sdk';

const ai = new AISuperTools({ apiKey: process.env.AI_SUPERTOOLS_KEY });

const response = await ai.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Explain quantum physics" }],
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  top_p: ${topP},
  stream: ${stream}
});

console.log(response.choices[0].message.content);`;
      case 'python':
        return `from aisupertools import AISuperTools

ai = AISuperTools(api_key="your_api_key_here")

response = ai.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Explain quantum physics"}],
    temperature=${temperature},
    max_tokens=${maxTokens},
    top_p=${topP},
    stream=${stream}
)

print(response.choices[0].message.content)`;
    }
  };

  const handleSimulateCall = () => {
    if (simulating) return;
    playSynthSound('click');
    setSimulating(true);
    setSimulatedResponse('// Initializing client handshake...\n// Sending payload...');

    setTimeout(() => {
      setSimulatedResponse('// Secure connection established with API Node APAC-1\n// Transmitting parameters and fetching model weights...');
      playSynthSound('toggle');
    }, 1200);

    setTimeout(() => {
      const responseObj = {
        id: `chatcmpl-${Math.random().toString(36).substring(2, 11)}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: `Hello! This is a simulated response generated using ${model}. Your request was received with temperature ${temperature}, max_tokens ${maxTokens}, and top_p ${topP}. Integration is successful and fully validated.`
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 18,
          completion_tokens: 54,
          total_tokens: 72
        }
      };
      setSimulatedResponse(JSON.stringify(responseObj, null, 2));
      setSimulating(false);
      playSynthSound('success');
      addXPPoints(15, `Simulated API call using ${model}`, `એઆઈ ડેવલપર સેન્ડબોક્સમાં કૉલ સિમ્યુલેટ કર્યો!`);
    }, 2800);
  };

  const copyCodeToClipboard = () => {
    const code = generateCodeSnippet();
    navigator.clipboard.writeText(code);
    playSynthSound('success');
    addXPPoints(5, `Copied ${activeTab.toUpperCase()} code snippet`, `એપીઆઈ કોડ સ્નિપેટ કોપી કરી!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden text-left ${
        theme === 'dark' ? 'bg-gradient-to-br from-indigo-950/20 via-slate-950 to-slate-950 border-indigo-950/40' : 'bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-mono uppercase">
          {isGu ? '૧૮. ડેવલપર એપીઆઈ સેન્ડબોક્સ' : 'DEVELOPER API SANDBOX'}
        </span>
        <h2 className={`text-xl font-black mt-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {isGu ? 'ઇન્ટરેક્ટિવ એપીઆઈ પ્લેગ્રાઉન્ડ' : 'Interactive Developer API Playground'}
        </h2>
        <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
          {isGu ? 'એપીઆઈ પરિમાણો સેટ કરો, મલ્ટિ-લેંગ્વેજ કોડ જનરેટ કરો અને લાઈવ વિનંતીઓનું અનુકરણ કરો.' : 'Adjust API query metrics, generate copyable integration templates in Python or JavaScript and simulate active endpoint payloads.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Hyper-parameters Control Sliders */}
        <div className="xl:col-span-1 space-y-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
            {isGu ? 'એપીઆઈ રૂપરેખાંકન સ્લાઈડર' : 'HYPER-PARAMETER CONTROLS'}
          </span>

          <div className={`p-5 rounded-2xl border text-left space-y-4 ${
            theme === 'dark' ? 'bg-[#050810]/40 border-slate-900' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            {/* Model selector */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Target LLM Model</label>
              <select
                value={model}
                onChange={(e) => { playSynthSound('click'); setModel(e.target.value); }}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (High Reasoning)</option>
                <option value="gpt-4o">GPT-4o Omnimodal</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            {/* Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-slate-500/5">
              {/* Temperature */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                  <span>Temperature (Creativity)</span>
                  <span className="text-indigo-400">{temperature}</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={temperature}
                  onChange={(e) => { playSynthSound('click'); setTemperature(parseFloat(e.target.value)); }}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Max Tokens */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                  <span>Max Tokens (Length)</span>
                  <span className="text-indigo-400">{maxTokens}</span>
                </div>
                <input
                  type="range" min="256" max="8192" step="256"
                  value={maxTokens}
                  onChange={(e) => { playSynthSound('click'); setMaxTokens(parseInt(e.target.value, 10)); }}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Top_P */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                  <span>Top P (Nucleus Sampling)</span>
                  <span className="text-indigo-400">{topP}</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={topP}
                  onChange={(e) => { playSynthSound('click'); setTopP(parseFloat(e.target.value)); }}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Stream toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[8px] font-mono font-black text-slate-500 uppercase">Server-Sent Streaming</span>
                <button
                  type="button"
                  onClick={() => { playSynthSound('toggle'); setStream(!stream); }}
                  className={`px-3 py-1 text-[9px] font-black font-mono rounded-lg border transition-all ${
                    stream 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-950 text-slate-500 border-slate-900'
                  }`}
                >
                  {stream ? 'ENABLED (SSE)' : 'DISABLED'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateCall}
              disabled={simulating}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {simulating ? '🛰️ Broadcasting Payload...' : '📡 Send Sandbox Request'}
            </button>
          </div>
        </div>

        {/* Right: Code Tabs and simulated API terminal output */}
        <div className="xl:col-span-2 space-y-4">
          {/* Header Code language tabs */}
          <div className="flex items-center justify-between border-b border-slate-500/5 pb-2">
            <div className="flex gap-2">
              {(['curl', 'js', 'python'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { playSynthSound('click'); setActiveTab(tab); }}
                  className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono border transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : theme === 'dark' ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'curl' ? 'cURL Request' : tab === 'js' ? 'JavaScript ESM' : 'Python SDK'}
                </button>
              ))}
            </div>

            <button
              onClick={copyCodeToClipboard}
              className="p-1 text-slate-400 hover:text-indigo-400 cursor-pointer"
              title="Copy code snippet"
            >
              <Icons.Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Snippet terminal output */}
          <div className={`p-4 rounded-2xl border border-slate-500/10 font-mono text-[10px] text-left leading-relaxed text-indigo-300 overflow-x-auto whitespace-pre ${
            theme === 'dark' ? 'bg-[#03060b]' : 'bg-slate-900 text-indigo-200 shadow-inner'
          }`}>
            {generateCodeSnippet()}
          </div>

          {/* Simulated response terminal console output */}
          <div className="space-y-2 text-left pt-2">
            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">LIVE RESPONSE CONSOLE TERMINAL</span>
            
            <div className={`p-4 rounded-2xl border border-slate-500/10 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre min-h-[140px] ${
              theme === 'dark' ? 'bg-[#03060b]' : 'bg-slate-950 text-emerald-400 shadow-inner'
            } ${simulating ? 'text-indigo-300' : 'text-emerald-400'}`}>
              {simulatedResponse || '// Terminal idle. Adjust hyperparameters on the left and trigger a sandbox call.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
