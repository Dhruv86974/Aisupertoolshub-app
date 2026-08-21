import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';
import { collection, getDocs, addDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { db, executeResilientDbOp } from '../firebase';

interface AffiliateLink {
  id: string;
  originalUrl: string;
  refTag: string;
  shortUrl: string;
  clicks: number;
  conversions: number;
  earnings: number;
  dateCreated: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  destination: string;
  status: 'pending' | 'completed';
  dateRequested: string;
}

interface AffiliateCoupon {
  toolName: string;
  code: string;
  discount: string;
  desc: string;
  logo: string;
}

interface AffiliateAndPartnerHubProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle' | 'achievement') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
}

export default function AffiliateAndPartnerHub({
  lang,
  theme,
  playSynthSound,
  addXPPoints
}: AffiliateAndPartnerHubProps) {
  const isGu = lang === 'gu';

  // State
  const [totalBalance, setTotalBalance] = useState<number>(() => {
    const saved = localStorage.getItem('hub_affiliate_balance');
    return saved ? parseFloat(saved) : 10.00; // start with a nice little $10 signup bonus
  });

  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

  // Inputs
  const [inputUrl, setInputUrl] = useState('');
  const [inputTag, setInputTag] = useState('');

  // Payout Form
  const [payMethod, setPayMethod] = useState('PayPal');
  const [payDest, setPayDest] = useState('');

  // Traffic Simulation Mode
  const [simulationActive, setSimulationActive] = useState(false);
  const [trafficLogs, setTrafficLogs] = useState<string[]>([]);

  // Coupons Preload
  const coupons: AffiliateCoupon[] = [
    { toolName: "ChatGPT Plus", code: "AISUPER20", discount: "20% OFF", desc: "Get 20% off your first 3 months of ChatGPT Plus subscription.", logo: "🤖" },
    { toolName: "ElevenLabs AI", code: "SPEECH15", discount: "15% LIFETIME", desc: "Unlock 15% discount on Creator and Pro monthly tiers.", logo: "🎙️" },
    { toolName: "Jasper AI", code: "COPYWRITE30", discount: "30% OFF TRIAL", desc: "Special 30% reduction on annual marketing content package.", logo: "📝" },
    { toolName: "Canva Pro Studio", code: "DESIGNFREE10", discount: "10% RECURRING", desc: "Save 10% on pro vector assets and premium background erasure licenses.", logo: "🎨" }
  ];

  // Load from Firestore
  useEffect(() => {
    async function loadAffiliateData() {
      try {
        await executeResilientDbOp(async (currentDb) => {
          // Fetch links
          const linksQ = query(collection(currentDb, 'affiliate_links'), orderBy('dateCreated', 'desc'));
          const linksSnapshot = await getDocs(linksQ);
          const linksList: AffiliateLink[] = [];
          linksSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            linksList.push({
              id: docSnap.id,
              originalUrl: data.originalUrl || '',
              refTag: data.refTag || '',
              shortUrl: data.shortUrl || '',
              clicks: data.clicks || 0,
              conversions: data.conversions || 0,
              earnings: data.earnings || 0,
              dateCreated: data.dateCreated || ''
            });
          });

          // Fetch payouts
          const payoutsQ = query(collection(currentDb, 'payout_requests'), orderBy('dateRequested', 'desc'));
          const payoutsSnapshot = await getDocs(payoutsQ);
          const payoutsList: PayoutRequest[] = [];
          payoutsSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            payoutsList.push({
              id: docSnap.id,
              amount: data.amount || 0,
              paymentMethod: data.paymentMethod || '',
              destination: data.destination || '',
              status: data.status || 'pending',
              dateRequested: data.dateRequested || ''
            });
          });

          if (linksList.length > 0) setAffiliateLinks(linksList);
          if (payoutsList.length > 0) setPayouts(payoutsList);
        });
      } catch (err) {
        console.warn("[Firestore] Loading affiliate links failed, falling back to local state.", err);
      }
    }
    loadAffiliateData();
  }, []);

  // Save Link state helper
  const saveLinkToFirestore = async (link: AffiliateLink) => {
    try {
      await executeResilientDbOp(async (currentDb) => {
        await setDoc(doc(currentDb, 'affiliate_links', link.id), {
          ...link,
          timestamp: new Date().toISOString()
        });
      });
    } catch (e) {
      console.warn("[Firestore] Link failed to sync to cloud:", e);
    }
  };

  // Save Payout state helper
  const savePayoutToFirestore = async (req: PayoutRequest) => {
    try {
      await executeResilientDbOp(async (currentDb) => {
        await setDoc(doc(currentDb, 'payout_requests', req.id), {
          ...req,
          timestamp: new Date().toISOString()
        });
      });
    } catch (e) {
      console.warn("[Firestore] Payout failed to sync to cloud:", e);
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputTag.trim()) return;

    playSynthSound('success');
    let toolSegment = 'custom';
    try {
      const urlObj = new URL(inputUrl);
      toolSegment = urlObj.hostname.replace('www.', '').split('.')[0] || 'custom';
    } catch (_) {}

    const shortUrl = `https://aisupertools.hub/r/${toolSegment}?ref=${inputTag.trim().toLowerCase()}`;
    const newLink: AffiliateLink = {
      id: 'link-' + Date.now(),
      originalUrl: inputUrl,
      refTag: inputTag.trim().toLowerCase(),
      shortUrl,
      clicks: 0,
      conversions: 0,
      earnings: 0.00,
      dateCreated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newLink, ...affiliateLinks];
    setAffiliateLinks(updated);
    await saveLinkToFirestore(newLink);

    setInputUrl('');
    setInputTag('');
    addXPPoints(10, `Generated affiliate link: ${shortUrl}`, `અફિલિએટ રેફરલ લિંક બનાવી!`);
  };

  // Traffic simulation clock
  useEffect(() => {
    if (!simulationActive || affiliateLinks.length === 0) return;

    const locations = ["London, UK", "New York, USA", "Mumbai, India", "Tokyo, Japan", "Berlin, Germany", "Sydney, Australia", "San Francisco, USA"];
    const browsers = ["Chrome Mobile", "Safari OS X", "Firefox Linux", "Edge Windows"];

    const interval = setInterval(() => {
      // Pick random link
      const rIdx = Math.floor(Math.random() * affiliateLinks.length);
      const targetLink = affiliateLinks[rIdx];

      const loc = locations[Math.floor(Math.random() * locations.length)];
      const b = browsers[Math.floor(Math.random() * browsers.length)];

      const isConverted = Math.random() < 0.20; // 20% conversion probability
      const commission = isConverted ? parseFloat((5 + Math.random() * 25).toFixed(2)) : 0;

      // Update local and firestore link state
      const updatedLink = {
        ...targetLink,
        clicks: targetLink.clicks + 1,
        conversions: isConverted ? targetLink.conversions + 1 : targetLink.conversions,
        earnings: targetLink.earnings + commission
      };

      setAffiliateLinks(prev => prev.map(l => l.id === targetLink.id ? updatedLink : l));
      saveLinkToFirestore(updatedLink);

      let logMessage = `[Click] Visitor from ${loc} using ${b} navigated through link: ${targetLink.refTag}`;
      if (isConverted) {
        logMessage = `🚨 [CONVERSION] Visitor from ${loc} upgraded to a paid license! Earned +$${commission.toFixed(2)} USD Commission!`;
        setTotalBalance(prev => {
          const next = prev + commission;
          localStorage.setItem('hub_affiliate_balance', next.toString());
          return next;
        });
        playSynthSound('achievement');
        addXPPoints(15, `Referral conversion earned $${commission}!`, `રેફરલ દ્વારા $${commission} કમિશન મેળવ્યું!`);
      } else {
        playSynthSound('click');
      }

      setTrafficLogs(prev => [logMessage, ...prev].slice(0, 15));
    }, 4500);

    return () => clearInterval(interval);
  }, [simulationActive, affiliateLinks]);

  const handleSimulateClick = async (id: string) => {
    playSynthSound('click');
    const target = affiliateLinks.find(l => l.id === id);
    if (!target) return;

    const converted = Math.random() < 0.25;
    const rewardEarnings = converted ? 10.00 : 0.00;

    const updated = {
      ...target,
      clicks: target.clicks + 1,
      conversions: converted ? target.conversions + 1 : target.conversions,
      earnings: target.earnings + rewardEarnings
    };

    setAffiliateLinks(prev => prev.map(l => l.id === id ? updated : l));
    await saveLinkToFirestore(updated);

    if (converted) {
      setTotalBalance(b => {
        const next = b + 10.00;
        localStorage.setItem('hub_affiliate_balance', next.toString());
        return next;
      });
      playSynthSound('achievement');
      addXPPoints(15, `Simulated conversion earned $10.00 commission!`, `નવું વેચાણ! $૧૦.૦૦ કમિશન મળ્યું!`);
    }
  };

  const handleWithdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalBalance < 20) {
      playSynthSound('error');
      alert(isGu ? 'લઘુત્તમ ઉપાડ મર્યાદા $૨૦.૦૦ છે.' : 'Minimum withdrawal amount is $20.00.');
      return;
    }
    if (!payDest.trim()) {
      alert("Please provide withdrawal address.");
      return;
    }

    playSynthSound('achievement');
    const payoutAmt = totalBalance;

    const newReq: PayoutRequest = {
      id: 'payout-' + Date.now(),
      amount: payoutAmt,
      paymentMethod: payMethod,
      destination: payDest,
      status: 'pending',
      dateRequested: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newReq, ...payouts];
    setPayouts(updated);
    await savePayoutToFirestore(newReq);

    setTotalBalance(0);
    localStorage.setItem('hub_affiliate_balance', '0');
    setPayDest('');
    
    addXPPoints(30, `Successfully requested affiliate withdrawal of $${payoutAmt.toFixed(2)}!`, `અફિલિએટ કમિશન ઉપાડવાની વિનંતી મોકલી!`);
    alert(isGu ? `સફળ! $${payoutAmt.toFixed(2)} ઉપાડની વિનંતી ઓડિટ હેઠળ છે.` : `Success! $${payoutAmt.toFixed(2)} withdrawal requested via ${payMethod}. Status is under compliance review.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden text-left ${
        theme === 'dark' ? 'bg-gradient-to-br from-indigo-950/20 via-slate-950 to-slate-950 border-indigo-950/40' : 'bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-mono uppercase">
          {isGu ? '૧૭. અફિલિએટ મોનેટાઇઝેશન સિસ્ટમ' : 'PARTNER & AFFILIATE PROGRAM'}
        </span>
        <h2 className={`text-xl font-black mt-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {isGu ? 'એઆઈ હબ અફિલિએટ અને મોનેટાઇઝેશન કેન્દ્ર' : 'AI Partner & Monetization Center'}
        </h2>
        <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
          {isGu ? 'રેફરલ લિંક્સ બનાવો, ટ્રાફિક મોનિટર કરો અને રીઅલ-ટાઇમ કમિશન કમાઓ.' : 'Generate customized referral links, deploy tracking scripts, view analytics performance charts and cash out simulated revenue.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Balance Box and Link Generator */}
        <div className="xl:col-span-1 space-y-5">
          {/* Earnings Display */}
          <div className={`p-6 rounded-2xl border text-left flex flex-col justify-between ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}>
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider font-mono">YOUR REVENUE WALLET</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black font-mono text-emerald-400">${totalBalance.toFixed(2)}</span>
                <span className="text-[9px] font-bold text-slate-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                  USD Active
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                {isGu ? 'જ્યારે રેફરલ ખરીદી પૂર્ણ થાય છે ત્યારે તરત જ કમિશન ઉમેરવામાં આવે છે.' : 'Earnings accrue automatically whenever referrals click and purchase premium licenses via your tracker code.'}
              </p>
            </div>

            {/* Withdrawal form inline */}
            <form onSubmit={handleWithdrawFunds} className="mt-4 pt-4 border-t border-slate-500/5 space-y-2.5 text-left">
              <span className="text-[9px] font-mono font-black text-slate-500 uppercase block">CASH OUT GATEWAY</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="PayPal">PayPal Address</option>
                  <option value="Bank UPI">UPI ID / Bank Wire</option>
                  <option value="Stripe Connect">Stripe ID</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="e.g. user@paypal.com"
                  value={payDest}
                  onChange={(e) => setPayDest(e.target.value)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
              >
                📥 Initiate Payout Clearance
              </button>
            </form>
          </div>

          {/* Generator Form */}
          <form onSubmit={handleGenerateLink} className={`p-5 rounded-2xl border text-left space-y-4 ${
            theme === 'dark' ? 'bg-[#050810]/40 border-slate-900' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-500 flex items-center gap-1.5">
              <Icons.Link className="w-4 h-4 text-indigo-400" />
              <span>{isGu ? 'રેફરલ લિંક જનરેટર' : 'GENERATE TRACKER LINK'}</span>
            </h4>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Original Product URL</label>
              <input
                type="url"
                required
                placeholder="https://elevenlabs.io"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Your Tracker / Ref Tag</label>
              <input
                type="text"
                required
                placeholder="e.g. techblog"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow active:scale-95 cursor-pointer"
            >
              🔗 Compile Tracker Link
            </button>
          </form>

          {/* Autonomous Traffic Simulation Toggle */}
          <div className={`p-5 rounded-2xl border text-left space-y-3 ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black font-mono text-emerald-400 block">SIMULATED TRAFFIC ENGINE</span>
                <span className="text-[8px] text-slate-500 block uppercase">Simulate incoming global visitor clicks</span>
              </div>
              <button
                onClick={() => { playSynthSound('toggle'); setSimulationActive(!simulationActive); }}
                className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                  simulationActive 
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-slate-500/10 text-slate-450 border-slate-500/20"
                }`}
              >
                {simulationActive ? "● Active" : "○ Idle"}
              </button>
            </div>

            {simulationActive && (
              <div className="space-y-1.5 border-t border-slate-500/5 pt-2 max-h-[140px] overflow-y-auto font-mono text-[9px] text-slate-450 text-left">
                {trafficLogs.length === 0 ? (
                  <p className="italic">Warming up pipeline... waiting for clicks</p>
                ) : (
                  trafficLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-500/5 pb-1 last:border-0 truncate">
                      {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Middle/Right columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Active generated links lists */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
              {isGu ? 'તમારી સક્રિય ટ્રેકિંગ લિંક્સ' : 'YOUR GENERATED REFERRAL PIPELINES'}
            </span>

            {affiliateLinks.length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center space-y-3 ${
                theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200'
              }`}>
                <Icons.Layers className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">
                  {isGu ? 'કોઈ રેફરલ કમ્પાઈલ કરેલ નથી. ડાબી બાજુએ ફોર્મ ભરી શરૂ કરો.' : 'No referral tracking pipelines compiled yet. Use the sidebar link generator to construct your tracking endpoints.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {affiliateLinks.map(link => (
                  <div key={link.id} className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-4 ${
                    theme === 'dark' ? 'bg-[#090d16] border-slate-900/80' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-black font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                          TAG: {link.refTag}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 font-mono">{link.dateCreated}</span>
                      </div>
                      <h4 className="text-xs font-black truncate text-slate-200 mt-2">Target: {link.originalUrl}</h4>
                      <div className="flex items-center gap-1 mt-1 bg-slate-500/5 p-1.5 rounded-lg border border-slate-500/5 select-all">
                        <span className="text-[10px] font-mono text-emerald-400 truncate flex-1">{link.shortUrl}</span>
                        <Icons.Copy className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-slate-500/5 pt-3">
                      <div className="text-left">
                        <span className="block text-[8px] font-mono text-slate-500">CLICKS</span>
                        <span className="block text-xs font-black font-mono">{link.clicks}</span>
                      </div>
                      <div className="text-left">
                        <span className="block text-[8px] font-mono text-slate-500">CONV.</span>
                        <span className="block text-xs font-black font-mono text-amber-400">{link.conversions}</span>
                      </div>
                      <div className="text-left">
                        <span className="block text-[8px] font-mono text-slate-500">EARNED</span>
                        <span className="block text-xs font-black font-mono text-emerald-400">${link.earnings.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSimulateClick(link.id)}
                        className="flex-1 py-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 text-[9px] font-mono font-black uppercase rounded-lg border border-slate-500/10 transition-all cursor-pointer"
                      >
                        ⚡ Simulate Click Event
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payout History requested in Firestore */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
              PAYOUT CLEARANCE RECORD
            </span>

            {payouts.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic text-left">No cash-out requested yet. Min limit $20.00.</p>
            ) : (
              <div className={`p-4 rounded-2xl border text-left space-y-2.5 ${
                theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200'
              }`}>
                {payouts.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between border-b border-slate-500/5 pb-2.5 last:border-0 last:pb-0">
                    <div className="text-left">
                      <span className="block text-xs font-black text-emerald-400">${p.amount.toFixed(2)} USD</span>
                      <span className="block text-[9px] font-mono text-slate-500">To {p.paymentMethod} ({p.destination})</span>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block text-[8px] font-black font-mono border px-2 py-0.5 rounded uppercase ${
                        p.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                      <span className="block text-[8px] text-slate-500 font-mono mt-0.5">{p.dateRequested}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Partner Discounts Section */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
              {isGu ? 'હાલ અફિલિએટ બ્રાન્ડ ડિસ્કાઉન્ટ્સ કૂપન' : 'EXCLUSIVE BRANDED PARTNER REVENUE COUPONS'}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((c, idx) => (
                <div key={idx} className={`p-4 rounded-xl border text-left flex gap-3 ${
                  theme === 'dark' ? 'bg-[#090d16]/60 border-slate-900' : 'bg-slate-50 border-slate-150 shadow-sm'
                }`}>
                  <span className="text-2xl p-2 bg-slate-500/5 rounded-xl self-start">{c.logo}</span>
                  <div className="space-y-1 min-w-0 flex-1 text-left">
                    <div className="flex justify-between items-center gap-1">
                      <h4 className="text-xs font-black truncate">{c.toolName}</h4>
                      <span className="text-[8.5px] font-black font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {c.discount}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed font-semibold">{c.desc}</p>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      <span className="text-[8.5px] font-mono text-slate-500 font-black">PROMO CODE:</span>
                      <span className="text-[9.5px] font-mono font-black text-indigo-400 uppercase tracking-wider bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/15 select-all">
                        {c.code}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
