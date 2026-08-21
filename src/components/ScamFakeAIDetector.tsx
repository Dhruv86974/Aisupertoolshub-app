import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';
import { collection, getDocs, addDoc, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { db, executeResilientDbOp } from '../firebase';

interface SafetyAudit {
  id: string;
  toolName: string;
  toolUrl: string;
  score: number;
  status: 'trusted' | 'suspicious' | 'scam';
  dateAudited: string;
  threatDetails?: string;
}

interface ScamFakeAIDetectorProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle' | 'achievement') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
}

export default function ScamFakeAIDetector({
  lang,
  theme,
  playSynthSound,
  addXPPoints
}: ScamFakeAIDetectorProps) {
  const isGu = lang === 'gu';

  // Tabs: 'inspector' | 'community_database'
  const [activeTab, setActiveTab] = useState<'inspector' | 'community_database'>('inspector');

  // Audit history states
  const [auditsList, setAuditsList] = useState<SafetyAudit[]>(() => {
    const saved = localStorage.getItem('hub_safety_audits');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "audit-1",
        toolName: "ChatGPT Plus Pro Premium Plus",
        toolUrl: "http://premiumchatgpt-login-discount.cc",
        score: 18,
        status: "scam",
        dateAudited: "Aug 14, 2026",
        threatDetails: "Phishing site imitating official OpenAI billing to harvest credit cards."
      },
      {
        id: "audit-2",
        toolName: "Claude AI Canvas",
        toolUrl: "https://claude.ai",
        score: 96,
        status: "trusted",
        dateAudited: "Aug 19, 2026",
        threatDetails: "Verified secure enterprise architecture from Anthropic."
      }
    ];
  });

  // Slider inputs
  const [targetName, setTargetName] = useState('SuperAI-Free-Credits');
  const [targetUrl, setTargetUrl] = useState('http://superai-credits.tk');

  const [creatorVerified, setCreatorVerified] = useState<number>(30); // 0-100
  const [sslSecure, setSslSecure] = useState<number>(0); // 0-100
  const [pricingTrans, setPricingTrans] = useState<number>(20); // 0-100
  const [reviewCred, setReviewCred] = useState<number>(40); // 0-100
  const [loggingPolicy, setLoggingPolicy] = useState<number>(10); // 0-100

  // Crowd-source scam report form
  const [reportName, setReportName] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportRisk, setReportRisk] = useState<'suspicious' | 'scam'>('scam');

  // Load from Firestore on mount
  useEffect(() => {
    async function fetchThreatReports() {
      try {
        await executeResilientDbOp(async (currentDb) => {
          const q = query(collection(currentDb, 'scam_reports'), orderBy('dateAudited', 'desc'));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const list: SafetyAudit[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                toolName: data.toolName || '',
                toolUrl: data.toolUrl || '',
                score: data.score || 0,
                status: data.status || 'scam',
                dateAudited: data.dateAudited || '',
                threatDetails: data.threatDetails || ''
              });
            });

            // Combine defaults and loaded firestore ones (deduplicated by ID)
            const combined = [...auditsList];
            list.forEach(item => {
              const idx = combined.findIndex(c => c.id === item.id);
              if (idx > -1) {
                combined[idx] = item;
              } else {
                combined.unshift(item);
              }
            });
            setAuditsList(combined);
          }
        });
      } catch (err) {
        console.warn("[Firestore] Failed to fetch threat records, using offline list.", err);
      }
    }
    fetchThreatReports();
  }, []);

  // Save/Persist helpers
  const persistThreatReport = async (updated: SafetyAudit[], report: SafetyAudit) => {
    setAuditsList(updated);
    localStorage.setItem('hub_safety_audits', JSON.stringify(updated));

    try {
      await executeResilientDbOp(async (currentDb) => {
        const docRef = doc(currentDb, 'scam_reports', report.id);
        await setDoc(docRef, {
          id: report.id,
          toolName: report.toolName,
          toolUrl: report.toolUrl,
          score: report.score,
          status: report.status,
          dateAudited: report.dateAudited,
          threatDetails: report.threatDetails || '',
          timestamp: new Date().toISOString()
        });
      });
      console.log("[Firestore] Threat report saved successfully.");
    } catch (e) {
      console.warn("[Firestore] Offline save only, cloud syncer error:", e);
    }
  };

  // Dynamic score calculator
  const aggregateScore = Math.round(
    (creatorVerified * 0.25) +
    (sslSecure * 0.20) +
    (pricingTrans * 0.15) +
    (reviewCred * 0.20) +
    (loggingPolicy * 0.20)
  );

  const getSafetyStatus = (score: number): { text: string, textGu: string, badgeColor: string, icon: any } => {
    if (score >= 75) {
      return { text: "TRUSTED VERIFIED", textGu: "સંપૂર્ણ સુરક્ષિત અને પ્રમાણિત", badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Icons.ShieldCheck };
    } else if (score >= 45) {
      return { text: "SUSPICIOUS / WARNING", textGu: "શંકાસ્પદ ચેતવણી", badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Icons.AlertTriangle };
    } else {
      return { text: "SEVERE SCAM THREAT", textGu: "જોખમી કૌભાંડ ખતરો", badgeColor: "text-red-400 bg-red-500/10 border-red-500/20", icon: Icons.ShieldAlert };
    }
  };

  const currentStatus = getSafetyStatus(aggregateScore);

  const handleRunAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName.trim()) return;

    playSynthSound('success');
    const statusVal: 'trusted' | 'suspicious' | 'scam' = aggregateScore >= 75 ? 'trusted' : aggregateScore >= 45 ? 'suspicious' : 'scam';

    const newAudit: SafetyAudit = {
      id: 'audit-' + Date.now(),
      toolName: targetName,
      toolUrl: targetUrl || 'N/A',
      score: aggregateScore,
      status: statusVal,
      dateAudited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      threatDetails: statusVal === 'scam' ? 'Flagged via local heuristic testing suite for deceptive billing protocols.' : 'Passed trust metrics tests.'
    };

    const updated = [newAudit, ...auditsList];
    persistThreatReport(updated, newAudit);

    setTargetName('');
    setTargetUrl('');
    // Reset sliders to intermediate defaults
    setCreatorVerified(50);
    setSslSecure(50);
    setPricingTrans(50);
    setReviewCred(50);
    setLoggingPolicy(50);

    addXPPoints(15, `Executed safety audit on ${targetName}`, `એઆઈ ટૂલ સુરક્ષા ઓડિટ પૂર્ણ કર્યું!`);
  };

  // Handle crowd-source report submission
  const handleReportScam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim() || !reportUrl.trim()) return;

    playSynthSound('achievement');
    const calculatedScore = reportRisk === 'scam' ? 15 : 40;

    const newThreat: SafetyAudit = {
      id: 'community-scam-' + Date.now(),
      toolName: reportName,
      toolUrl: reportUrl,
      score: calculatedScore,
      status: reportRisk,
      dateAudited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      threatDetails: reportDetails || "Reported by community explorer."
    };

    const updated = [newThreat, ...auditsList];
    await persistThreatReport(updated, newThreat);

    setReportName('');
    setReportUrl('');
    setReportDetails('');
    addXPPoints(30, `Submitted safety threat alert for ${reportName}!`, `સુરક્ષા ધમકી ચેતવણી મોકલી!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden text-left ${
        theme === 'dark' ? 'bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950 border-emerald-950/40' : 'bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono uppercase">
          {isGu ? '૨૫. સ્કેમ અને ફેક એઆઈ સુરક્ષા કેન્દ્ર' : 'AI THREAT & SAFETY AUDITOR'}
        </span>
        <h2 className={`text-xl font-black mt-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {isGu ? 'સ્કેમ અને ફેક એઆઈ ટૂલ્સ ઓડિટર' : 'Scam & Fake AI Security Inspector'}
        </h2>
        <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
          {isGu ? 'એઆઈ ટૂલ્સની ચકાસણી કરો, શંકાસ્પદ લિંક્સ ઓળખો અને અસલી સુરક્ષિત સોફ્ટવેર વાપરો.' : 'Analyze dubious AI sites, adjust safety heuristics, calculate live security indexes and generate secure audit reports to avoid billing fraud and phishing.'}
        </p>
      </div>

      {/* Navigation tabs inside Safety panel */}
      <div className="flex border-b border-slate-500/10 pb-1 gap-2">
        <button
          onClick={() => { playSynthSound('click'); setActiveTab('inspector'); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'inspector' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🔍 Security Inspector Heuristics
        </button>
        <button
          onClick={() => { playSynthSound('click'); setActiveTab('community_database'); }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'community_database' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🚨 Real-time Scam Database ({auditsList.length})
        </button>
      </div>

      {activeTab === 'inspector' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Security Parameter Sliders Form */}
          <div className="xl:col-span-1 space-y-4">
            <form onSubmit={handleRunAudit} className={`p-5 rounded-2xl border text-left space-y-4 ${
              theme === 'dark' ? 'bg-[#050810]/40 border-slate-900' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <h4 className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-500 flex items-center gap-1.5">
                <Icons.Shield className="w-4 h-4 text-emerald-400" />
                <span>{isGu ? 'સુરક્ષા ચકાસણી પરામીટર' : 'SET THREAT PARAMETERS'}</span>
              </h4>

              {/* URL/Name Inputs */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-500 font-mono">AI Site/Tool Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ChatGptDiscountPro"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Website Domain URL</label>
                  <input
                    type="text"
                    placeholder="e.g. http://login-discount.tk"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Sliders Block */}
              <div className="space-y-3.5 pt-2 border-t border-slate-500/5">
                {/* Creator verified */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                    <span>Creator Team/Identity</span>
                    <span className="text-emerald-400">{creatorVerified}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={creatorVerified}
                    onChange={(e) => { playSynthSound('click'); setCreatorVerified(parseInt(e.target.value, 10)); }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* SSL/Certificate security */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                    <span>SSL/Domain safety (HTTPS)</span>
                    <span className="text-emerald-400">{sslSecure}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={sslSecure}
                    onChange={(e) => { playSynthSound('click'); setSslSecure(parseInt(e.target.value, 10)); }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Pricing Transparency */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                    <span>Pricing Transparency</span>
                    <span className="text-emerald-400">{pricingTrans}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={pricingTrans}
                    onChange={(e) => { playSynthSound('click'); setPricingTrans(parseInt(e.target.value, 10)); }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Review Credibility */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                    <span>Reviews & Community Trust</span>
                    <span className="text-emerald-400">{reviewCred}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={reviewCred}
                    onChange={(e) => { playSynthSound('click'); setReviewCred(parseInt(e.target.value, 10)); }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Logging policy */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                    <span>Data Logging Privacy</span>
                    <span className="text-emerald-400">{loggingPolicy}%</span>
                  </div>
                  <input
                    type="range" min="0" max="100"
                    value={loggingPolicy}
                    onChange={(e) => { playSynthSound('click'); setLoggingPolicy(parseInt(e.target.value, 10)); }}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow active:scale-95 cursor-pointer"
              >
                🛡️ Generate Security Report
              </button>
            </form>
          </div>

          {/* Right column: Dynamic Auditor Panel & Sent reports history */}
          <div className="xl:col-span-2 space-y-6">
            {/* Active Audit Calculator Shield */}
            <div className={`p-6 rounded-2xl border text-left flex flex-col md:flex-row items-center justify-between gap-6 ${
              theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="space-y-3 flex-1">
                <div>
                  <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider font-mono">DYNAMIC RADIAL REPORT SHIELD</span>
                  <h3 className={`text-base font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-850'} mt-1`}>
                    Aggregate Trust Safety Rating
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black font-mono text-emerald-400">{aggregateScore}%</span>
                  <span className={`inline-block text-[9px] font-black font-mono border px-2.5 py-1 rounded-full uppercase ${currentStatus.badgeColor}`}>
                    {isGu ? currentStatus.textGu : currentStatus.text}
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Heuristics check validates that any score under 45% represents severe billing risk, credential phishing traps or fake mirror clones.
                </p>
              </div>

              <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center relative shrink-0 ${
                aggregateScore >= 75 ? 'border-emerald-500 bg-emerald-500/5' : aggregateScore >= 45 ? 'border-amber-500 bg-amber-500/5' : 'border-red-500 bg-red-500/5'
              }`}>
                <currentStatus.icon className={`w-8 h-8 ${
                  aggregateScore >= 75 ? 'text-emerald-400' : aggregateScore >= 45 ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className="text-[9px] font-black font-mono mt-1 text-slate-400 uppercase tracking-widest">SHIELD</span>
              </div>
            </div>

            {/* Micro diagnostic breakdown checklist */}
            <div className={`p-5 rounded-2xl border text-left space-y-3 ${
              theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">HEURISTIC EVALUATION PATHWAY</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div>
                    <span className="font-bold block">Developer Credentials Check</span>
                    <span className="text-[10px] text-slate-500 leading-none">Creator signature {creatorVerified > 60 ? "fully verified" : "partially unverified"}.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div>
                    <span className="font-bold block">Security Certificate</span>
                    <span className="text-[10px] text-slate-500 leading-none">SSL certificate {sslSecure > 70 ? "secure TLS" : "expired/unencrypted"}.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div>
                    <span className="font-bold block">Pricing Transparency</span>
                    <span className="text-[10px] text-slate-500 leading-none">Hidden fee index score: {pricingTrans > 70 ? "Low risk" : "Opaque billing warning"}.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div>
                    <span className="font-bold block">Data Compliance</span>
                    <span className="text-[10px] text-slate-500 leading-none">Logs compliance is {loggingPolicy > 50 ? "Private GDPR" : "Deceptive tracking logs"}.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
          {/* Left: Report Scam Form */}
          <div className="xl:col-span-1">
            <form onSubmit={handleReportScam} className={`p-5 rounded-2xl border text-left space-y-4 ${
              theme === 'dark' ? 'bg-[#050810]/40 border-slate-900' : 'bg-slate-50 border-slate-200 shadow-sm'
            }`}>
              <span className="text-[9px] font-black font-mono text-emerald-400 uppercase tracking-widest block">REPORT MALICIOUS AI TRAPS (+30 XP)</span>
              <div className="space-y-1">
                <label className="text-[8px] font-mono font-black text-slate-500 uppercase">Malicious Tool Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ChatGPTFreeGold"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-mono font-black text-slate-500 uppercase">Scam Website Address</label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://chatgpt-free-premium.xyz"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-mono font-black text-slate-500 uppercase">Risk Evaluation</label>
                <select
                  value={reportRisk}
                  onChange={(e) => setReportRisk(e.target.value as any)}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="scam">🚨 Confirmed Scam (Billing fraud / Fake clone)</option>
                  <option value="suspicious">⚠️ Highly Suspicious (Spam / Hidden pricing)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-mono font-black text-slate-500 uppercase">Safety Proof & Threat Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this domain is a scam or malicious..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
              >
                🚨 File Public Threat Report
              </button>
            </form>
          </div>

          {/* Right: Scam database records */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">RECENT PUBLICLY AUDITED SCAMS</span>
              <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-mono px-2 py-0.5 rounded-full font-black uppercase">COMMUNITY BULLETINS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auditsList.map((item) => {
                const spec = getSafetyStatus(item.score);
                return (
                  <div key={item.id} className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 ${
                    theme === 'dark' ? 'bg-[#090d16] border-slate-900/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start gap-1.5">
                        <div className="min-w-0">
                          <h5 className="text-xs font-black truncate text-red-400">{item.toolName}</h5>
                          <span className="text-[8.5px] font-mono text-slate-500 block truncate">{item.toolUrl}</span>
                        </div>
                        <span className={`text-[8.5px] font-black font-mono border px-2 py-0.5 rounded-md shrink-0 uppercase ${spec.badgeColor}`}>
                          {isGu ? spec.textGu : spec.text}
                        </span>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-450 leading-relaxed font-semibold mt-2 border-t border-slate-500/5 pt-2">
                        {item.threatDetails || "Deceptive billing protocols or clone domain setup."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[8px] font-mono font-black text-slate-500 uppercase">
                      <span>Report date: {item.dateAudited}</span>
                      <span className="text-red-400">Score: {item.score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
