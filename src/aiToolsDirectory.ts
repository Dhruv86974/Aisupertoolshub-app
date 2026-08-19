export interface ToolRatingBreakdown {
  features: number;
  easeOfUse: number;
  price: number;
  outputQuality: number;
  freePlan: number;
  userReviews: number;
}

export interface ToolProfile {
  id: string;
  name: string;
  category: 'students' | 'business' | 'youtube' | 'instagram' | 'coding' | 'free' | 'under10' | 'chatgpt-alt';
  tags: string[];
  logo: string;
  shortDesc: string;
  description: string;
  score: number;
  ratingBreakdown: ToolRatingBreakdown;
  priceInfo: string;
  isFree: boolean;
  bestFor: string;
  featuresList: string[];
  pros: string[];
  cons: string[];
  alternatives: string[];
  reviews: { user: string; rating: number; comment: string }[];
  faqs: { q: string; a: string }[];
  comparisonText: {
    versus: string;
    verdict: string;
  };
}

export const AI_TOOLS_DIRECTORY: ToolProfile[] = [
  {
    id: "chatgpt",
    name: "ChatGPT (OpenAI)",
    category: "chatgpt-alt",
    tags: ["students", "business", "coding", "free", "chatgpt-alt"],
    logo: "🤖",
    shortDesc: "The industry standard conversational large language model.",
    description: "ChatGPT is OpenAI's state-of-the-art conversational agent, capable of drafting essays, writing complex software pipelines, debugging, and general knowledge search.",
    score: 9.6,
    ratingBreakdown: {
      features: 9.8,
      easeOfUse: 9.7,
      price: 9.2,
      outputQuality: 9.6,
      freePlan: 9.5,
      userReviews: 9.8
    },
    priceInfo: "Free Plan available / Plus at $20/month",
    isFree: true,
    bestFor: "General-purpose text generation, quick coding assistance, and brainstorming.",
    featuresList: [
      "GPT-4o Advanced Reasoning Engine",
      "DALL-E 3 High-Fidelity Image Generation",
      "Advanced Data Analysis & Sandbox Executor",
      "Custom GPTs Store Access"
    ],
    pros: [
      "Extremely versatile with broad knowledge",
      "Very fast response times on GPT-4o-mini",
      "Excellent voice interaction mode"
    ],
    cons: [
      "Can hallucinate facts occasionally",
      "Plus plan is relatively expensive for students"
    ],
    alternatives: ["Claude (Anthropic)", "Google Gemini", "Perplexity AI"],
    reviews: [
      { user: "Aarav S.", rating: 5, comment: "Absolutely essential for my daily programming tasks. Saves me hours of research." },
      { user: "Priya P.", rating: 4, comment: "Great for editing documents, though I prefer Claude for creative writing." }
    ],
    faqs: [
      { q: "Is ChatGPT free?", a: "Yes, there is a generous free tier powered by the GPT-4o-mini model." },
      { q: "Can I use it for programming?", a: "Yes, it is highly capable in over 50 programming languages." }
    ],
    comparisonText: {
      versus: "ChatGPT vs Claude 3.5 Sonnet",
      verdict: "ChatGPT is superior for raw speed, coding tasks, and voice conversations, while Claude is preferred for long-form reading comprehension and writing natural, human-sounding text."
    }
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    category: "chatgpt-alt",
    tags: ["students", "coding", "free", "chatgpt-alt"],
    logo: "✍️",
    shortDesc: "Exquisite model for coding, long-form reading, and writing.",
    description: "Claude is Anthropic's flagship LLM, built with safety and a massive context window in mind. It excel at deep analytical thinking, reading long documents, and writing highly professional text.",
    score: 9.7,
    ratingBreakdown: {
      features: 9.6,
      easeOfUse: 9.8,
      price: 9.0,
      outputQuality: 9.9,
      freePlan: 9.2,
      userReviews: 9.9
    },
    priceInfo: "Free Plan available / Pro at $20/month",
    isFree: true,
    bestFor: "Academic paper analysis, natural creative writing, and perfect complex code architecture.",
    featuresList: [
      "Artifacts interactive screen rendering",
      "Huge 200k Token Context Window",
      "Claude Projects feature for custom knowledge integration",
      "Sophisticated XML formatting parsing"
    ],
    pros: [
      "Unbelievably human-like writing tone",
      "Artifacts makes previewing web designs instant",
      "Outstanding analytical performance"
    ],
    cons: [
      "Free plan has strict usage limits",
      "No native web-search browsing integrated on free"
    ],
    alternatives: ["ChatGPT", "Google Gemini"],
    reviews: [
      { user: "Devansh K.", rating: 5, comment: "The Artifacts feature is a game changer for react developers." },
      { user: "Rohan M.", rating: 5, comment: "It writes essays that don't sound like AI at all." }
    ],
    faqs: [
      { q: "What are Claude Artifacts?", a: "Artifacts are separate visual panels that let you see generated code, SVGs, or React UI interactive designs directly." },
      { q: "Is it better than ChatGPT?", a: "For writing quality and analyzing complex files, yes. For general web search, ChatGPT is faster." }
    ],
    comparisonText: {
      versus: "Claude vs Google Gemini",
      verdict: "Claude excels in deep software engineering and creative nuances, while Gemini holds the edge for Google Workspace integration and live Google Search grounding."
    }
  },
  {
    id: "gamma",
    name: "Gamma App",
    category: "students",
    tags: ["students", "business", "free", "under10"],
    logo: "📊",
    shortDesc: "Generate stunning presentations and webpage templates in seconds.",
    description: "Gamma is an AI-powered design tool that turns natural language outlines into beautifully styled, professional slide decks, document pages, and web portfolios.",
    score: 9.4,
    ratingBreakdown: {
      features: 9.5,
      easeOfUse: 9.8,
      price: 9.1,
      outputQuality: 9.3,
      freePlan: 9.4,
      userReviews: 9.5
    },
    priceInfo: "Free (400 credits) / Plus from $8/month",
    isFree: true,
    bestFor: "Students creating presentation slides and startups making quick pitches.",
    featuresList: [
      "One-click aesthetic theme switches",
      "AI card layouts and smart cards",
      "Web link sharing with built-in analytics",
      "PowerPoint and PDF export support"
    ],
    pros: [
      "Extremely fast; presentation ready in 20 seconds",
      "Responsive cards adapt to mobile beautifully",
      "Affordable pricing ($8) under the student budget"
    ],
    cons: [
      "Detailed custom pixel-level placement can be hard",
      "Export layouts can occasionally shift formatting slightly"
    ],
    alternatives: ["Canva Presentation", "Beautiful.ai", "Tome"],
    reviews: [
      { user: "Nisha T.", rating: 5, comment: "I made an entire college presentation in 1 minute. Everyone was shocked by the design." }
    ],
    faqs: [
      { q: "Can I use Gamma for free?", a: "Yes, you get 400 free credits upon signing up, which is enough for about 10 full presentations." }
    ],
    comparisonText: {
      versus: "Gamma vs Canva Slides",
      verdict: "Gamma is far faster and more automated via AI prompting, whereas Canva is better for highly specific manual graphic adjustments and custom templates."
    }
  },
  {
    id: "canva",
    name: "Canva AI Suite",
    category: "instagram",
    tags: ["youtube", "instagram", "business", "free"],
    logo: "🎨",
    shortDesc: "All-in-one design suite with cutting-edge AI Magic tools.",
    description: "Canva has integrated high-powered AI 'Magic Studio' features including text-to-image generators, AI background removers, Magic Write editors, and instant video transition syncs.",
    score: 9.5,
    ratingBreakdown: {
      features: 9.7,
      easeOfUse: 9.9,
      price: 9.2,
      outputQuality: 9.4,
      freePlan: 9.5,
      userReviews: 9.6
    },
    priceInfo: "Free Plan / Canva Pro at $12.99/month",
    isFree: true,
    bestFor: "Instagram reels, YouTube thumbnails, and corporate marketing assets.",
    featuresList: [
      "Magic Grab & Text editing inside photos",
      "AI Text-to-Image / Text-to-Video Generators",
      "Dynamic background eraser",
      "Bulk design generation for campaigns"
    ],
    pros: [
      "Vast library of pre-made premium templates",
      "Superb mobile app interface",
      "Perfect for creators with zero graphic experience"
    ],
    cons: [
      "Advanced AI features require Canva Pro license",
      "Strict template structures can limit custom vector designs"
    ],
    alternatives: ["Adobe Express", "Figma", "CapCut"],
    reviews: [
      { user: "Karan Patel", rating: 5, comment: "My YouTube thumbnail click-through rate jumped 5% using Canva's AI recommendations." }
    ],
    faqs: [
      { q: "Is Canva AI free?", a: "Some basic AI tools are free. Magic Eraser and Premium generation require Canva Pro." }
    ],
    comparisonText: {
      versus: "Canva vs Adobe Express",
      verdict: "Canva is more user-friendly and template-heavy, while Adobe Express integrates better with professional Photoshop elements and Firefly AI vector graphics."
    }
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs Voice AI",
    category: "youtube",
    tags: ["youtube", "instagram", "business", "under10"],
    logo: "🎙️",
    shortDesc: "The world's most realistic generative AI text-to-speech engine.",
    description: "ElevenLabs produces ultra-realistic human voices, custom voice clones, and atmospheric sound effects using advanced audio generative neural networks.",
    score: 9.7,
    ratingBreakdown: {
      features: 9.8,
      easeOfUse: 9.6,
      price: 9.4,
      outputQuality: 9.9,
      freePlan: 9.3,
      userReviews: 9.8
    },
    priceInfo: "Free 10k characters / Starter plan from $5/month",
    isFree: true,
    bestFor: "YouTube narration, faceless Instagram reels, and professional audiobooks.",
    featuresList: [
      "Custom Voice Cloning with 10s audio sample",
      "Voice Design to adjust gender, age, and accent",
      "Sound Effects generation from descriptive text",
      "Multi-lingual synthesis in 32+ languages with native accents"
    ],
    pros: [
      "Unmatched emotional inflection and human breathing pauses",
      "Incredibly cheap starter plan ($5/mo)",
      "High rendering speed"
    ],
    cons: [
      "Free tier requires attributing ElevenLabs",
      "Can consume characters quickly on long articles"
    ],
    alternatives: ["Murf.ai", "Play.ht", "Speechify"],
    reviews: [
      { user: "Amit V.", rating: 5, comment: "My faceless YouTube automation channel reached 100k subscribers thanks to the realistic narration." }
    ],
    faqs: [
      { q: "Is ElevenLabs voice realistic?", a: "Yes, it is currently the industry gold standard. It mimics whispers, excitement, and natural pauses." }
    ],
    comparisonText: {
      versus: "ElevenLabs vs Murf.ai",
      verdict: "ElevenLabs produces much more natural emotional expression and voice cloning, while Murf.ai has slightly better timeline sync tools for slide-based presentations."
    }
  },
  {
    id: "cursor",
    name: "Cursor AI Editor",
    category: "coding",
    tags: ["coding", "free", "business"],
    logo: "💻",
    shortDesc: "An AI-first code editor built directly on top of VS Code.",
    description: "Cursor is an open-source-compatible IDE engineered specifically for AI-assisted software development. It supports inline completions, project-wide code generation, and multi-file codebases understanding.",
    score: 9.8,
    ratingBreakdown: {
      features: 9.9,
      easeOfUse: 9.7,
      price: 9.3,
      outputQuality: 9.8,
      freePlan: 9.4,
      userReviews: 9.9
    },
    priceInfo: "Free Hobby Tier / Pro at $20/month",
    isFree: true,
    bestFor: "Software engineers, boot camp students, and rapid React web developers.",
    featuresList: [
      "Composer Multi-file Code Generation (Cmd+I)",
      "Instant Codebase Search Indexing",
      "Interactive Terminal Debugging with 1 click",
      "Context-aware inline edits (Cmd+K)"
    ],
    pros: [
      "Reads all project files simultaneously to prevent bugs",
      "Built on VS Code, so all extensions load instantly",
      "Extremely productive for rapid prototyping"
    ],
    cons: [
      "High API consumption on heavy codebase scans",
      "Requires subscription ($20) for unlimited custom models"
    ],
    alternatives: ["GitHub Copilot", "VS Code AI", "Windsurf"],
    reviews: [
      { user: "Hardik D.", rating: 5, comment: "I built a full React application in a weekend without writing a single boilerplate line manually." }
    ],
    faqs: [
      { q: "Is Cursor better than VS Code + Copilot?", a: "Yes, because Cursor indexes your entire folder structure natively, allowing much deeper contextual replies." }
    ],
    comparisonText: {
      versus: "Cursor vs GitHub Copilot",
      verdict: "Cursor allows comprehensive codebase rewrites and multi-file generations (Composer), whereas Copilot is mostly a single-line auto-completion utility."
    }
  },
  {
    id: "capcut",
    name: "CapCut AI Editor",
    category: "instagram",
    tags: ["youtube", "instagram", "free", "under10"],
    logo: "📹",
    shortDesc: "Easiest AI video editor with auto captions and reel templates.",
    description: "CapCut by ByteDance offers exceptional AI video workflows including smart auto captions, voice-to-video syncing, background replacement, and trending TikTok templates.",
    score: 9.6,
    ratingBreakdown: {
      features: 9.6,
      easeOfUse: 9.9,
      price: 9.5,
      outputQuality: 9.5,
      freePlan: 9.6,
      userReviews: 9.7
    },
    priceInfo: "Free Plan / Pro at $7.99/month",
    isFree: true,
    bestFor: "Fast mobile-first Instagram Reels, YouTube Shorts, and TikToks.",
    featuresList: [
      "Auto Captions with styled kinetic animations",
      "AI Face Retouch & body shaping filters",
      "Smart Sound Effects sync and vocal separation",
      "Auto Beat cuts detection"
    ],
    pros: [
      "Amazing free plan with almost no watermark limits",
      "Super easy mobile app and fast exports",
      "Always updated with trending audio and memes"
    ],
    cons: [
      "Desktop version can lag on heavy 4K footage",
      "Cloud storage limits on free tier"
    ],
    alternatives: ["Adobe Premiere", "InShot", "KineMaster"],
    reviews: [
      { user: "Aditi S.", rating: 5, comment: "I generate captions for my 60-second reels in 5 seconds. Highly recommended!" }
    ],
    faqs: [
      { q: "Is CapCut Pro worth it?", a: "For casual reels, the Free version is more than enough. Pro is good for advanced cloud templates." }
    ],
    comparisonText: {
      versus: "CapCut vs Premiere Pro",
      verdict: "CapCut is 10 times faster for social media reels due to built-in AI captions, whereas Premiere is better for professional movie pacing and color grading."
    }
  },
  {
    id: "perplexity",
    name: "Perplexity AI Search",
    category: "free",
    tags: ["students", "business", "free", "chatgpt-alt"],
    logo: "🔍",
    shortDesc: "An AI-powered search engine providing conversational sourced answers.",
    description: "Perplexity AI changes web browsing by searching the web and compiling answers with real clickable academic and live source footnotes. No more clicking 10 blue links.",
    score: 9.7,
    ratingBreakdown: {
      features: 9.7,
      easeOfUse: 9.8,
      price: 9.4,
      outputQuality: 9.7,
      freePlan: 9.6,
      userReviews: 9.8
    },
    priceInfo: "Free Plan / Pro at $20/month",
    isFree: true,
    bestFor: "Students researching essays, fact-checking, and market research.",
    featuresList: [
      "Pro search with multi-step web queries",
      "Clickable inline citations",
      "Focus mode (search academic files, YouTube, or general)",
      "File uploads for data charts scanning"
    ],
    pros: [
      "Eliminates ads and SEO clickbait websites",
      "Provides verifiable links for every sentence",
      "Generous free model searches"
    ],
    cons: [
      "Occasionally summarizes old information if search keywords are generic",
      "Pro search has hourly limits on free"
    ],
    alternatives: ["Google Search", "ChatGPT Search", "Phind"],
    reviews: [
      { user: "Prof. Patel", rating: 5, comment: "My research students use Perplexity to locate sources. It saves days of reading bibliographies." }
    ],
    faqs: [
      { q: "How is Perplexity different from Google?", a: "Google gives you a list of websites you have to read yourself. Perplexity reads those websites for you and writes a summarized citation sheet." }
    ],
    comparisonText: {
      versus: "Perplexity vs Google Search",
      verdict: "Perplexity is a conversational answer generator with links, while Google is a directory of indexes. Perplexity is vastly superior for research speed."
    }
  }
];

export const AI_RESOURCES_LIBRARY = [
  {
    title: "Instant ChatGPT Pro Prompts",
    category: "ChatGPT",
    icon: "💬",
    items: [
      { name: "Super Copywriting Prompt", prompt: "Act as an elite conversion copywriter. Rewrite this description to double conversions, using direct response psychology: [insert product text]" },
      { name: "Academic Paper Simplifier", prompt: "Summarize this complex scientific research into five bullet points that a 10-year-old can easily grasp: [insert text]" }
    ]
  },
  {
    title: "Instagram Reels Hook Master",
    category: "Instagram",
    icon: "📸",
    items: [
      { name: "Viral Hook Formula", prompt: "Generate 10 attention-grabbing video hook lines for a Reel about [insert topic] targeting Gen Z developers. Keep it under 5 seconds." },
      { name: "SaaS Growth Script", prompt: "Write a high-retention 45-second script for an Instagram reel promoting our AI tools hub, focusing on maximum speed and usefulness." }
    ]
  },
  {
    title: "Software Coding Architect",
    category: "Coding",
    icon: "💻",
    items: [
      { name: "React Clean Code Auditor", prompt: "Review the following React functional component for performance leaks, redundant states, and infinite re-render loops: [insert component code]" },
      { name: "SQL Query Optimizer", prompt: "Audit this SQL query and optimize the index joins to support rapid querying on 10 million relational rows: [insert query]" }
    ]
  },
  {
    title: "Elite Business Pitch Templates",
    category: "Business",
    icon: "👔",
    items: [
      { name: "Startup 1-Sentence Pitch", prompt: "Distill the value proposition of my startup into one powerful sentence that captures venture capitalists' interest immediately: [insert details]" },
      { name: "Email Cold Outreach", prompt: "Draft a high-conversion, warm-toned cold email inviting SaaS CEOs to partner, keeping it under 150 words with a clear CTA." }
    ]
  }
];
