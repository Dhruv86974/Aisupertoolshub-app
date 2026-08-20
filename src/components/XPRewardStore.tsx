import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';

interface RewardItem {
  id: string;
  title: string;
  titleGu: string;
  description: string;
  descriptionGu: string;
  costXP: number;
  badge: string;
  category: 'api' | 'coupon' | 'service' | 'course';
  unlockedContent: string;
}

interface RedeemedReward {
  rewardId: string;
  title: string;
  code: string;
  redeemedAt: string;
}

interface XPRewardStoreProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  userXP: number;
  setUserXP: React.Dispatch<React.SetStateAction<number>> | ((xp: number) => void);
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle' | 'achievement') => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export default function XPRewardStore({
  lang,
  theme,
  userXP,
  setUserXP,
  playSynthSound,
  showToast
}: XPRewardStoreProps) {
  const isGu = lang === 'gu';

  // State for redeemed rewards history
  const [redeemedList, setRedeemedList] = useState<RedeemedReward[]>(() => {
    const saved = localStorage.getItem('hub_redeemed_rewards');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  // Modal display reward
  const [activeRedeemed, setActiveRedeemed] = useState<RedeemedReward | null>(null);

  useEffect(() => {
    localStorage.setItem('hub_redeemed_rewards', JSON.stringify(redeemedList));
  }, [redeemedList]);

  // List of items in shop
  const rewardCatalog: RewardItem[] = [
    {
      id: "rw-openai",
      title: "OpenAI $15 API Key Credit",
      titleGu: "ઓપનએઆઈ $૧૫ એપીઆઈ ક્રેડિટ",
      description: "Direct credit code to fund your personal OpenAI custom GPT API integrations.",
      descriptionGu: "તમારા પર્સનલ એપીઆઈ પ્રોગ્રામિંગમાં વાપરવા માટેનું પ્રીમિયમ કૂપન.",
      costXP: 75,
      badge: "API Tokens",
      category: "api",
      unlockedContent: "OPENAI-API-XP-75X-9281-ZLW"
    },
    {
      id: "rw-eleven",
      title: "ElevenLabs 1-Mo Creator License",
      titleGu: "ઇલેવનલેબ્સ ૧-મહિનો ક્રિએટર પરવાનો",
      description: "Unlock up to 100,000 speech characters and custom voice clone slots instantly.",
      descriptionGu: "૧૦૦,૦૦૦ સુધીના વોઈસ અક્ષરો અને ક્લોન સ્લોટ્સ ચાલુ કરવાનો કોડ.",
      costXP: 120,
      badge: "Software Pro",
      category: "coupon",
      unlockedContent: "ELEVEN-CREATOR-FREE-1MO-9382-AQW"
    },
    {
      id: "rw-consulting",
      title: "1-on-1 AI Strategy Audit (20 Min)",
      titleGu: "એઆઈ સ્ટ્રેટેજી ઓડિટ કન્સલ્ટિંગ",
      description: "Book an elite private calendar slot with custom project engineers to review your stack.",
      descriptionGu: "એઆઈ ડેવલપર સાથે ૨૦ મિનિટનું વ્યક્તિગત કન્સલ્ટિંગ બુકિંગ.",
      costXP: 200,
      badge: "Expert Service",
      category: "service",
      unlockedContent: "https://calendly.com/aisupertools/strategy-audit?code=XP200"
    },
    {
      id: "rw-midjourney",
      title: "Midjourney Fast Hours Code",
      titleGu: "મિડજર્ની ફાસ્ટ ગ્રાફિક્સ કલાક",
      description: "Redeem 5 hours of premium fast GPU generation time for stunning artwork designs.",
      descriptionGu: "મિડજર્ની હાઇ સ્પીડ ઈમેજ જનરેશન વાઉચર.",
      costXP: 90,
      badge: "Premium Assets",
      category: "coupon",
      unlockedContent: "MIDJOURNEY-FAST5-XP90-5511-KPL"
    }
  ];

  const handleRedeemReward = (item: RewardItem) => {
    if (userXP < item.costXP) {
      playSynthSound('error');
      showToast(
        isGu 
          ? `ભૂલ! આ ઈનામ માટે ${item.costXP} એક્સપીની જરૂર છે. તમારી પાસે ${userXP} છે.` 
          : `Error! This reward requires ${item.costXP} XP. You currently have ${userXP} XP.`,
        'error'
      );
      return;
    }

    // Deduct points
    const nextXP = userXP - item.costXP;
    if (typeof setUserXP === 'function') {
      setUserXP(nextXP);
      localStorage.setItem('hub_user_xp', nextXP.toString());
    }

    playSynthSound('achievement');
    
    // Save redeemed code
    const generatedRedeemed: RedeemedReward = {
      rewardId: item.id,
      title: isGu ? item.titleGu : item.title,
      code: item.unlockedContent,
      redeemedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setRedeemedList(prev => [generatedRedeemed, ...prev]);
    setActiveRedeemed(generatedRedeemed);
    showToast(
      isGu ? `સફળતાપૂર્વક ખરીદ્યો: ${item.titleGu}!` : `Successfully redeemed: ${item.title}!`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden text-left ${
        theme === 'dark' ? 'bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950 border-emerald-950/40' : 'bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono uppercase">
          {isGu ? '૨૩. એક્સપી ગેમિફિકેશન રિવાર્ડ સ્ટોર' : 'EXPLORER REWARDS SHOP'}
        </span>
        <h2 className={`text-xl font-black mt-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {isGu ? 'એક્સપ્લોરર પોઈન્ટ્સ ગેમિફિકેશન સ્ટોર' : 'Explorer XP Rewards Store'}
        </h2>
        <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
          {isGu ? 'તમારા મેળવેલા પોઇન્ટ્સ ખર્ચો અને સાચા પ્રીમિયમ લાઈસન્સ, એપીઆઈ વાઉચર્સ ખરીદો.' : 'Spend your hard-earned Explorer XP points to redeem actual SaaS licenses, developer API credit tokens, strategy consults and digital premium assets.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Active Points Panel and Redeemed Log */}
        <div className="xl:col-span-1 space-y-5">
          {/* Active points Display */}
          <div className={`p-6 rounded-2xl border text-left flex items-center justify-between ${
            theme === 'dark' ? 'bg-[#090d16] border-emerald-500/20' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider font-mono">YOUR CURRENT BALANCE</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-3xl font-black font-mono text-emerald-400">{userXP}</span>
                <span className="text-xs font-black text-slate-400 font-mono">XP</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
                {isGu ? 'એઆઈ ટૂલ્સ એક્સપ્લોર કરવા, મંતવ્ય આપવા અને લિંક્સ શેર કરવાથી પોઈન્ટ્સ મળે છે.' : 'Earn more points by reviewing directory tools, building business stacks, and executing simulated campaigns.'}
              </p>
            </div>

            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl animate-pulse">
              <Icons.Gem className="w-7 h-7" />
            </div>
          </div>

          {/* Redeemed list history log */}
          <div className={`p-5 rounded-2xl border text-left space-y-3.5 ${
            theme === 'dark' ? 'bg-[#050810]/40 border-slate-900' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-500 flex items-center gap-1.5">
              <Icons.FolderCheck className="w-4 h-4 text-emerald-400" />
              <span>{isGu ? 'ખરીદેલ ઈનામો' : 'MY REDEEMED REWARDS'}</span>
            </h4>

            {redeemedList.length === 0 ? (
              <p className="text-[10px] text-slate-500 font-bold italic py-4 text-center">No rewards redeemed in this session yet.</p>
            ) : (
              <div className="space-y-2">
                {redeemedList.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => { playSynthSound('click'); setActiveRedeemed(r); }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-900 hover:border-slate-800' : 'bg-white border-slate-200 hover:bg-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black truncate max-w-[130px]">{r.title}</span>
                      <span className="text-[8px] font-black font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                        VIEW CODE
                      </span>
                    </div>
                    <span className="block text-[8px] font-bold text-slate-500 mt-0.5 font-mono">Redeemed: {r.redeemedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Reward Catalog Cards Grid */}
        <div className="xl:col-span-2 space-y-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
            {isGu ? 'ઉપલબ્ધ રિવાર્ડ વાઉચર' : 'AVAILABLE REWARD VAULT'}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardCatalog.map(item => {
              const canAfford = userXP >= item.costXP;
              return (
                <div key={item.id} className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all ${
                  theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[8px] font-black uppercase text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 tracking-wider">
                        {item.badge}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-black font-mono text-emerald-400">
                        <span>💰</span> <span>{item.costXP} XP</span>
                      </div>
                    </div>

                    <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                      {isGu ? item.titleGu : item.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      {isGu ? item.descriptionGu : item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRedeemReward(item)}
                    className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                        : theme === 'dark' ? 'bg-slate-950 border border-slate-900 text-slate-500 hover:text-slate-400' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {canAfford ? 'Redeem Voucher' : 'Insufficient XP Balance'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= MODAL: REVEAL REDEEMED CODE ================= */}
      {activeRedeemed && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border p-6 text-left relative ${
            theme === 'dark' ? 'bg-[#04060c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
          }`}>
            <button
              onClick={() => setActiveRedeemed(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Icons.X className="w-5 h-5" />
            </button>

            <div className="space-y-4 text-center py-4">
              <span className="text-3xl">🎉</span>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-emerald-400 tracking-widest uppercase font-mono block">VOUCHER SECURELY UNLOCKED</span>
                <h3 className="text-sm font-black uppercase tracking-wider">{activeRedeemed.title}</h3>
              </div>

              <div className={`p-4 rounded-xl border border-dashed text-center ${
                theme === 'dark' ? 'bg-slate-950 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-300'
              }`}>
                {activeRedeemed.code.startsWith('http') ? (
                  <a
                    href={activeRedeemed.code}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-emerald-400 underline hover:text-emerald-300 flex items-center justify-center gap-1.5"
                  >
                    <span>Click to Claim / Book Appointment</span>
                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-xs font-mono font-black tracking-widest text-emerald-400 select-all">{activeRedeemed.code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeRedeemed.code);
                        playSynthSound('success');
                        showToast("Voucher code copied to clipboard!", "success");
                      }}
                      className="text-[9px] font-black uppercase text-slate-500 hover:text-emerald-400 transition-all font-mono"
                    >
                      Copy to clipboard
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                Copy the license key above or use the claim link to redeem your exclusive software perks immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
