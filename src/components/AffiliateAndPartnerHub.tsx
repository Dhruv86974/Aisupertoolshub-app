import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';

interface AffiliateCoupon {
  toolName: string;
  code: string;
  discount: string;
  desc: string;
  logo: string;
}

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

  // State values for generated affiliate links
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>(() => {
    const saved = localStorage.getItem('hub_affiliate_links');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "link-1",
        originalUrl: "https://openai.com/chatgpt",
        refTag: "primary_admin",
        shortUrl: "https://aisupertools.hub/r/chatgpt?ref=primary_admin",
        clicks: 142,
        conversions: 18,
        earnings: 54.00,
        dateCreated: "Aug 15, 2026"
      },
      {
        id: "link-2",
        originalUrl: "https://anthropic.com/claude",
        refTag: "newsletter_aug",
        shortUrl: "https://aisupertools.hub/r/claude?ref=newsletter_aug",
        clicks: 89,
        conversions: 11,
        earnings: 44.00,
        dateCreated: "Aug 18, 2026"
      }
    ];
  });

  const [inputUrl, setInputUrl] = useState('https://elevenlabs.io');
  const [inputTag, setInputTag] = useState('my_site');

  // Simulated account metrics
  const [totalBalance, setTotalBalance] = useState<number>(() => {
    const saved = localStorage.getItem('hub_affiliate_balance');
    return saved ? parseFloat(saved) : 98.00;
  });

  useEffect(() => {
    localStorage.setItem('hub_affiliate_links', JSON.stringify(affiliateLinks));
  }, [affiliateLinks]);

  useEffect(() => {
    localStorage.setItem('hub_affiliate_balance', totalBalance.toString());
  }, [totalBalance]);

  const coupons: AffiliateCoupon[] = [
    { toolName: "ChatGPT Plus", code: "AISUPER20", discount: "20% OFF", desc: "Get 20% off your first 3 months of ChatGPT Plus subscription.", logo: "🤖" },
    { toolName: "ElevenLabs AI", code: "SPEECH15", discount: "15% LIFETIME", desc: "Unlock 15% discount on Creator and Pro monthly tiers.", logo: "🎙️" },
    { toolName: "Jasper AI", code: "COPYWRITE30", discount: "30% OFF TRIAL", desc: "Special 30% reduction on annual marketing content package.", logo: "📝" },
    { toolName: "Canva Pro Studio", code: "DESIGNFREE10", discount: "10% RECURRING", desc: "Save 10% on pro vector assets and premium background erasure licenses.", logo: "🎨" }
  ];

  const handleGenerateLink = (e: React.FormEvent) => {
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

    setAffiliateLinks(prev => [newLink, ...prev]);
    setInputUrl('');
    setInputTag('');
    addXPPoints(10, `Generated affiliate link: ${shortUrl}`, `અફિલિએટ રેફરલ લિંક બનાવી!`);
  };

  const handleSimulateClick = (id: string) => {
    playSynthSound('click');
    setAffiliateLinks(prev => prev.map(l => {
      if (l.id === id) {
        const nextClicks = l.clicks + 1;
        // 10% chance of conversion
        const converted = Math.random() < 0.15;
        const newConversions = converted ? l.conversions + 1 : l.conversions;
        const rewardEarnings = converted ? 5.00 : 0.00;
        
        if (converted) {
          setTotalBalance(b => b + 5.00);
          setTimeout(() => {
            playSynthSound('achievement');
            addXPPoints(15, `Simulated conversion earned $5.00 commission!`, `નવું વેચાણ! $૫.૦૦ કમિશન મળ્યું!`);
          }, 300);
        }

        return {
          ...l,
          clicks: nextClicks,
          conversions: newConversions,
          earnings: l.earnings + rewardEarnings
        };
      }
      return l;
    }));
  };

  const handleWithdrawFunds = () => {
    if (totalBalance < 20) {
      playSynthSound('error');
      alert(isGu ? 'લઘુત્તમ ઉપાડ મર્યાદા $૨૦.૦૦ છે.' : 'Minimum withdrawal amount is $20.00.');
      return;
    }
    playSynthSound('achievement');
    alert(isGu ? `સફળ! $${totalBalance.toFixed(2)} તમારા બેંક ખાતામાં ટ્રાન્સફર કરવામાં આવ્યા છે.` : `Success! $${totalBalance.toFixed(2)} has been successfully wired to your account.`);
    setTotalBalance(0);
    addXPPoints(30, `Successfully processed affiliate withdrawal!`, `અફિલિએટ કમિશન ઉપાડ્યું!`);
  };

  return (
    <div className="space-y-6">
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
            theme === 'dark' ? 'bg-[#090d16] border-emerald-500/20 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
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

            <button
              onClick={handleWithdrawFunds}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow active:scale-95 cursor-pointer mt-4"
            >
              📥 Cash Out Earnings
            </button>
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
              ✨ Build Tracking URL
            </button>
          </form>
        </div>

        {/* Right: Coupon Deals and Active Tracker Links Table */}
        <div className="xl:col-span-2 space-y-6">
          {/* Coupon Codes */}
          <div className={`p-6 rounded-2xl border text-left space-y-4 ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">
              {isGu ? 'ભાગીદાર કૂપન્સ અને ડિસ્કાઉન્ટ્સ' : 'OFFICIAL HUB EXCLUSIVE COUPONS'}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coupons.map((c, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-1 text-left min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg shrink-0">{c.logo}</span>
                      <h5 className="text-xs font-black truncate">{c.toolName}</h5>
                    </div>
                    <p className="text-[9px] text-slate-500 font-semibold leading-relaxed line-clamp-2">{c.desc}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[8px] font-black text-indigo-400 font-mono uppercase tracking-wider">{c.discount}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        playSynthSound('success');
                        addXPPoints(5, `Copied promo coupon code ${c.code}`, `પ્રોમો કૂપન કોપી કરી!`);
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[9px] font-black font-mono rounded mt-1.5 transition-all uppercase cursor-pointer"
                    >
                      {c.code}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Links Dashboard */}
          <div className={`p-6 rounded-2xl border text-left space-y-4 ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">
              {isGu ? 'સક્રિય અફિલિએટ લિંક્સ એનાલિટિક્સ' : 'ACTIVE TRACKING URL ANALYTICS'}
            </span>

            {affiliateLinks.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold italic py-4 text-center">No tracking links created yet.</p>
            ) : (
              <div className="space-y-3">
                {affiliateLinks.map(link => (
                  <div key={link.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    theme === 'dark' ? 'bg-slate-950/80 border-slate-900' : 'bg-slate-50 border-slate-150'
                  }`}>
                    <div className="space-y-1 text-left min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black truncate text-indigo-400 font-mono leading-none">{link.shortUrl}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(link.shortUrl);
                            playSynthSound('success');
                          }}
                          className="text-[8px] font-black uppercase text-slate-500 hover:text-white"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 truncate font-semibold">Destination: {link.originalUrl}</p>
                    </div>

                    <div className="flex items-center gap-4 text-left font-mono text-[10px] font-extrabold shrink-0 border-t md:border-t-0 border-slate-500/10 pt-2.5 md:pt-0">
                      <div>
                        <span className="text-slate-500 block text-[8px] font-black uppercase">Clicks</span>
                        <span className="text-slate-300 block">{link.clicks}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] font-black uppercase">Sales</span>
                        <span className="text-emerald-400 block">{link.conversions}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px] font-black uppercase">Accrued</span>
                        <span className="text-emerald-400 block">${link.earnings.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => handleSimulateClick(link.id)}
                        className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        Simulate Traffic
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
