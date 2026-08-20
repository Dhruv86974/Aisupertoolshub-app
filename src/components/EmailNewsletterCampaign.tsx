import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { LanguageCode } from '../types';

interface NewsletterCampaign {
  id: string;
  subject: string;
  body: string;
  segment: 'all' | 'developers' | 'agencies' | 'founders';
  audienceSize: number;
  openRate: string;
  clickRate: string;
  dateSent: string;
}

interface EmailNewsletterCampaignProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'error' | 'toggle' | 'achievement') => void;
  addXPPoints: (points: number, reasonEn: string, reasonGu: string) => void;
}

export default function EmailNewsletterCampaign({
  lang,
  theme,
  playSynthSound,
  addXPPoints
}: EmailNewsletterCampaignProps) {
  const isGu = lang === 'gu';

  // Local state for campaign history
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>(() => {
    const saved = localStorage.getItem('hub_newsletter_campaigns');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "camp-1",
        subject: "The Quantum Shift: 12 Emerging AI Trends to Watch in Q3 2026",
        body: "Inside this report, we detail the rapid decentralization of smaller models and localized edge intelligence...",
        segment: "all",
        audienceSize: 14250,
        openRate: "42.5%",
        clickRate: "18.2%",
        dateSent: "Aug 12, 2026"
      },
      {
        id: "camp-2",
        subject: "Exclusive: Essential developer API integrations with custom code samples",
        body: "Unlock high performance cURL and JavaScript modules directly designed for API integration...",
        segment: "developers",
        audienceSize: 2150,
        openRate: "51.8%",
        clickRate: "24.9%",
        dateSent: "Aug 16, 2026"
      }
    ];
  });

  // State values for active subscription newsletter signups
  const [subscribersCount, setSubscribersCount] = useState<number>(() => {
    const saved = localStorage.getItem('hub_subscriber_count');
    return saved ? parseInt(saved, 10) : 16420;
  });

  // Editor fields
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState<'all' | 'developers' | 'agencies' | 'founders'>('all');

  // Transmission states
  const [transmitting, setTransmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    localStorage.setItem('hub_newsletter_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('hub_subscriber_count', subscribersCount.toString());
  }, [subscribersCount]);

  const getSegmentSize = (seg: typeof segment) => {
    switch (seg) {
      case 'all': return subscribersCount;
      case 'developers': return Math.round(subscribersCount * 0.15);
      case 'agencies': return Math.round(subscribersCount * 0.35);
      case 'founders': return Math.round(subscribersCount * 0.50);
    }
  };

  const currentAudienceSize = getSegmentSize(segment);

  const handleTransmitBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim() || transmitting) return;

    playSynthSound('success');
    setTransmitting(true);
    setProgress(0);

    // Simulate progress delivery transmission
    const duration = 2000; // 2 seconds
    const intervalTime = 100;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const percent = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(percent);

      if (percent === 50) {
        playSynthSound('toggle');
      }

      if (percent >= 100) {
        clearInterval(timer);
        
        // Finalize campaign saving
        const finalOpen = (30 + Math.random() * 30).toFixed(1) + '%';
        const finalClick = (10 + Math.random() * 15).toFixed(1) + '%';
        
        const newCampaign: NewsletterCampaign = {
          id: 'camp-' + Date.now(),
          subject,
          body,
          segment,
          audienceSize: currentAudienceSize,
          openRate: finalOpen,
          clickRate: finalClick,
          dateSent: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        setCampaigns(prev => [newCampaign, ...prev]);
        setSubject('');
        setBody('');
        setTransmitting(false);
        setProgress(0);
        
        // Boost subscribers count
        setSubscribersCount(prev => prev + Math.floor(Math.random() * 45) + 15);

        playSynthSound('achievement');
        addXPPoints(25, `Broadcasted newsletter to ${currentAudienceSize} subscribers!`, `સફળતાપૂર્વક ${currentAudienceSize} લોકોને ન્યૂઝલેટર મોકલ્યું!`);
      }
    }, intervalTime);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden text-left ${
        theme === 'dark' ? 'bg-gradient-to-br from-indigo-950/20 via-slate-950 to-slate-950 border-indigo-950/40' : 'bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[9px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-mono uppercase">
          {isGu ? '૨૨. ન્યૂઝલેટર પ્લેટફોર્મ' : 'NEWSLETTER BROADCAST AUTOMATION'}
        </span>
        <h2 className={`text-xl font-black mt-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
          {isGu ? 'સ્વયંસંચાલિત માર્કેટિંગ અને બ્રોડકાસ્ટ સિસ્ટમ' : 'Newsletter Marketing & Email Broadcast Studio'}
        </h2>
        <p className="text-xs text-slate-450 mt-1 leading-relaxed font-semibold">
          {isGu ? 'તમારા વ્યાવસાયિક પ્રેક્ષકોને માર્કેટિંગ પત્રો મોકલો, આંકડાઓ ટ્રેક કરો અને વ્યુઅરશીપ વધારો.' : 'Draft custom targeted announcements, calculate audience reach segments, view real-time transmission trackers and analyze CTR/open-rate performance histories.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: Drafting and Transmission */}
        <div className="xl:col-span-1 space-y-5">
          {/* Active Subscriber Indicator */}
          <div className={`p-5 rounded-2xl border text-left flex items-center justify-between ${
            theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider font-mono">TOTAL VERIFIED AUDIENCE</span>
              <span className="block text-2xl font-black font-mono text-emerald-400">{subscribersCount.toLocaleString()}</span>
              <span className="text-[9px] text-slate-500 font-bold block leading-none">Healthy Double Opt-in</span>
            </div>

            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Icons.Users className="w-6 h-6" />
            </div>
          </div>

          {/* Drafting Block */}
          <form onSubmit={handleTransmitBroadcast} className={`p-5 rounded-2xl border text-left space-y-4 ${
            theme === 'dark' ? 'bg-[#050810]/40 border-slate-900' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-500 flex items-center gap-1.5">
              <Icons.MailPlus className="w-4 h-4 text-indigo-400" />
              <span>{isGu ? 'ન્યૂઝલેટર પત્ર કમ્પોઝ કરો' : 'COMPOSE EMAIL BROADCAST'}</span>
            </h4>

            {/* Segment picker */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Target Audience Segment</label>
              <select
                value={segment}
                onChange={(e: any) => { playSynthSound('click'); setSegment(e.target.value); }}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="all">All Subscribers ({getSegmentSize('all').toLocaleString()})</option>
                <option value="developers">AI Developers ({getSegmentSize('developers').toLocaleString()})</option>
                <option value="agencies">Marketing Agencies ({getSegmentSize('agencies').toLocaleString()})</option>
                <option value="founders">Startup Founders ({getSegmentSize('founders').toLocaleString()})</option>
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Subject Line</label>
              <input
                type="text"
                required
                placeholder="e.g. Exclusive Tools updates for scaling your business..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                }`}
              />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-500 font-mono">Newsletter Content Markdown / Text</label>
              <textarea
                required
                rows={5}
                placeholder="Write your email body here. Supports standard formatting..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-inner'
                }`}
              />
            </div>

            {/* Transmission progress bar */}
            {transmitting ? (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-indigo-400">
                  <span>SENDING EMAILS...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Icons.Send className="w-3.5 h-3.5" />
                <span>Transmit Broadcast</span>
              </button>
            )}
          </form>
        </div>

        {/* Right column: Broadcast reports log */}
        <div className="xl:col-span-2 space-y-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left font-mono">
            {isGu ? 'ભૂતકાળના ઝુંબેશ રિપોર્ટ્સ' : 'NEWSLETTER CAMPAIGN HISTORY & ANALYTICS'}
          </span>

          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className={`p-5 rounded-2xl border text-left space-y-4 ${
                theme === 'dark' ? 'bg-[#090d16] border-slate-900' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex justify-between items-start gap-3 border-b border-slate-500/5 pb-3">
                  <div>
                    <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10 uppercase font-mono tracking-wider">
                      Segment: {c.segment}
                    </span>
                    <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'} mt-1.5`}>{c.subject}</h4>
                    <span className="block text-[8px] font-bold text-slate-500 mt-0.5 font-mono">{c.dateSent}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-black font-mono text-emerald-400">{c.audienceSize.toLocaleString()}</span>
                    <span className="block text-[8px] font-bold text-slate-500 uppercase font-mono">Recipients</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                  {c.body}
                </p>

                {/* Open/Click Rates metrics panel */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="p-2.5 bg-slate-500/5 rounded-xl border border-slate-500/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-500 font-mono uppercase">Avg Open Rate</span>
                    <span className="text-xs font-black font-mono text-emerald-400">{c.openRate}</span>
                  </div>
                  <div className="p-2.5 bg-slate-500/5 rounded-xl border border-slate-500/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-slate-500 font-mono uppercase">Click-Through Rate</span>
                    <span className="text-xs font-black font-mono text-emerald-400">{c.clickRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
