export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string; // Lucide icon name
  isPremium?: boolean;
  isInteractive?: boolean; // Renders a customized dashboard widget
  tags?: string[];
  systemInstruction?: string; // System prompt for AI generation
  inputs?: ToolInput[];
}

export type ToolCategory =
  | 'all'
  | 'ai-chat'
  | 'content-writing'
  | 'marketing-social'
  | 'developer-tech'
  | 'image-pdf'
  | 'utilities'
  | 'math-calc'
  | 'business-ideas';

export interface ToolInput {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'toggle' | 'file';
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

export interface UserState {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'elite' | 'ultimate' | 'business' | 'custom' | string;
  credits: number;
  favorites: string[];
  history: HistoryItem[];
  savedNotes: Note[];
  isLoggedIn?: boolean;
  name?: string;
  username?: string;
  college?: string;
  semester?: string;
}

export interface HistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  timestamp: number;
  inputs: Record<string, any>;
  output: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export type LanguageCode = 'en' | 'es' | 'gu' | 'hi' | 'ja' | 'pt' | 'ar';

export interface TranslationSet {
  brand: string;
  tagline: string;
  searchPlaceholder: string;
  categories: Record<ToolCategory, string>;
  proBadge: string;
  freeBadge: string;
  favorites: string;
  history: string;
  noHistory: string;
  savedNotes: string;
  noNotes: string;
  creditsLabel: string;
  upgradeBtn: string;
  languages: Record<LanguageCode, string>;
  close: string;
  runTool: string;
  generating: string;
  outputLabel: string;
  copyBtn: string;
  copied: string;
  favoritesTitle: string;
  pricingTitle: string;
  pricingSub: string;
  monthly: string;
  yearly: string;
  proFeatures: string[];
  adTitle: string;
  adClose: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationSet> = {
  en: {
    brand: 'AI Super Tools Hub',
    tagline: 'Your premium, high-performance toolkit with 200+ AI & daily utilities.',
    searchPlaceholder: 'Search 200+ AI and daily tools...',
    categories: {
      all: 'All Tools',
      'ai-chat': 'AI & Chat Assistants',
      'content-writing': 'Content & Writing',
      'marketing-social': 'Marketing & Social Media',
      'developer-tech': 'Developer & Tech Tools',
      'image-pdf': 'Image & Document PDF',
      utilities: 'Daily Utilities',
      'math-calc': 'Calculators & Math',
      'business-ideas': 'Business & Startups'
    },
    proBadge: 'PRO MEMBER',
    freeBadge: 'FREE ACC',
    favorites: 'Favorites',
    history: 'History',
    noHistory: 'No generations yet. Try running an AI tool!',
    savedNotes: 'Saved Notes',
    noNotes: 'No saved notes. Create one in the Rich Notes utility!',
    creditsLabel: 'Available AI Credits',
    upgradeBtn: 'Upgrade to Premium',
    languages: {
      en: 'English 🇺🇸',
      es: 'Español 🇪🇸',
      gu: 'ગુજરાતી 🇮🇳',
      hi: 'हिन्दी 🇮🇳',
      ja: '日本語 🇯🇵',
      pt: 'Português 🇵🇹',
      ar: 'العربية 🇸🇦'
    },
    close: 'Close',
    runTool: 'Generate with AI',
    generating: 'Generating Output...',
    outputLabel: 'AI Generated Output',
    copyBtn: 'Copy to Clipboard',
    copied: 'Copied!',
    favoritesTitle: 'Your Bookmarked Tools',
    pricingTitle: 'Unlock Premium Unlimited Access',
    pricingSub: 'Supercharge your workflow with 200+ fully-unlocked AI models, faster speeds, and raw OCR exports.',
    monthly: 'Monthly Plan',
    yearly: 'Yearly Plan (Save 40%)',
    proFeatures: [
      'Unlimited High-Speed AI Generations',
      'Advanced Multi-Turn AI Chat',
      'Unlimited Document & Image OCR Extraction',
      'Full-Scale Custom Website Exporter',
      'Zero Ads on Dashboard & Tools',
      'Priority Customer Care'
    ],
    adTitle: 'SPONSORED ADVERTISEMENT',
    adClose: 'Remove Ads (Go Pro)'
  },
  es: {
    brand: 'AI Super Tools Hub',
    tagline: 'Tu caja de herramientas premium de alto rendimiento con más de 200 utilidades de IA.',
    searchPlaceholder: 'Buscar en más de 200 herramientas...',
    categories: {
      all: 'Todas las herramientas',
      'ai-chat': 'Asistentes de IA y Chat',
      'content-writing': 'Contenido y escritura',
      'marketing-social': 'Marketing y redes sociales',
      'developer-tech': 'Herramientas de desarrollador',
      'image-pdf': 'Imagen y PDF de documentos',
      utilities: 'Utilidades diarias',
      'math-calc': 'Calculadoras y matemáticas',
      'business-ideas': 'Negocios y Startups'
    },
    proBadge: 'MIEMBRO PRO',
    freeBadge: 'CUENTA GRATIS',
    favorites: 'Favoritos',
    history: 'Historial',
    noHistory: 'Aún no hay generaciones. ¡Prueba una herramienta de IA!',
    savedNotes: 'Notas guardadas',
    noNotes: 'No hay notas guardadas. ¡Crea una en la herramienta de Notas!',
    creditsLabel: 'Créditos de IA disponibles',
    upgradeBtn: 'Mejorar a Premium',
    languages: {
      en: 'English 🇺🇸',
      es: 'Español 🇪🇸',
      gu: 'ગુજરાતી 🇮🇳',
      hi: 'हिन्दी 🇮🇳',
      ja: '日本語 🇯🇵',
      pt: 'Português 🇵🇹',
      ar: 'العربية 🇸🇦'
    },
    close: 'Cerrar',
    runTool: 'Generar con IA',
    generating: 'Generando resultado...',
    outputLabel: 'Resultado generado por IA',
    copyBtn: 'Copiar al portapapeles',
    copied: '¡Copiado!',
    favoritesTitle: 'Tus herramientas favoritas',
    pricingTitle: 'Desbloquear acceso Premium ilimitado',
    pricingSub: 'Optimiza tu flujo de trabajo con modelos desbloqueados, mayor velocidad y OCR ilimitado.',
    monthly: 'Plan mensual',
    yearly: 'Plan anual (Ahorra 40%)',
    proFeatures: [
      'Generaciones de IA de alta velocidad ilimitadas',
      'Chat de IA avanzado de múltiples turnos',
      'Extracción ilimitada de documentos e imágenes OCR',
      'Exportador de sitios web a escala completa',
      'Cero anuncios en el panel y herramientas',
      'Soporte prioritario'
    ],
    adTitle: 'ANUNCIO PATROCINADO',
    adClose: 'Quitar anuncios (Hazte Pro)'
  },
  gu: {
    brand: 'AI Super Tools Hub',
    tagline: '૨૦૦+ AI અને દૈનિક ઉપયોગિતાઓ સાથેનું તમારું પ્રીમિયમ ટૂલકીટ.',
    searchPlaceholder: '૨૦૦+ AI અને અન્ય સાધનો શોધો...',
    categories: {
      all: 'બધા સાધનો',
      'ai-chat': 'AI અને ચેટ સહાયકો',
      'content-writing': 'લેખન અને સામગ્રી',
      'marketing-social': 'માર્કેટિંગ અને સોશિયલ મીડિયા',
      'developer-tech': 'ડેવલપર સાધનો',
      'image-pdf': 'ઇમેજ અને પીડીએફ',
      utilities: 'દૈનિક ઉપયોગિતાઓ',
      'math-calc': 'કેલ્ક્યુલેટર અને ગણિત',
      'business-ideas': 'બિઝનેસ અને સ્ટાર્ટઅપ્સ'
    },
    proBadge: 'પ્રો સભ્ય',
    freeBadge: 'મફત ખાતું',
    favorites: 'મનપસંદ',
    history: 'ઇતિહાસ',
    noHistory: 'હજુ સુધી કોઈ જનરેશન નથી. AI સાધન અજમાવો!',
    savedNotes: 'સાચવેલી નોંધો',
    noNotes: 'કોઈ નોંધ સાચવેલી નથી. રિચ નોટ્સમાં નવી નોંધ બનાવો!',
    creditsLabel: 'ઉપલબ્ધ AI ક્રેડિટ',
    upgradeBtn: 'પ્રીમિયમમાં અપગ્રેડ કરો',
    languages: {
      en: 'English 🇺🇸',
      es: 'Español 🇪🇸',
      gu: 'ગુજરાતી 🇮🇳',
      hi: 'हिन्दी 🇮🇳',
      ja: '日本語 🇯🇵',
      pt: 'Português 🇵🇹',
      ar: 'العربية 🇸🇦'
    },
    close: 'બંધ કરો',
    runTool: 'AI સાથે બનાવો',
    generating: 'બનાવી રહ્યું છે...',
    outputLabel: 'AI દ્વારા બનાવેલ આઉટપુટ',
    copyBtn: 'ક્લિપબોર્ડ પર કોપી કરો',
    copied: 'કોપી થઈ ગયું!',
    favoritesTitle: 'તમારા પસંદ કરેલા સાધનો',
    pricingTitle: 'પ્રીમિયમ અનલિમિટેડ એક્સેસ મેળવો',
    pricingSub: 'ઝડપી સ્પીડ, અનલિમિટેડ OCR એક્સપોર્ટ અને ૨૦૦+ અનલોક કરેલ મોડલ્સ સાથે તમારું કામ સરળ બનાવો.',
    monthly: 'માસિક પ્લાન',
    yearly: 'વાર્ષિક પ્લાન (૪૦% બચત)',
    proFeatures: [
      'અનલિમિટેડ હાઇ-સ્પીડ AI જનરેશન',
      'અદ્યતન મલ્ટી-ટર્ન AI ચેટ સહાયક',
      'અનલિમિટેડ દસ્તાવેજ અને ઇમેજ OCR એક્સટ્રેક્શન',
      'મોટા પાયે કસ્ટમ વેબસાઇટ નિકાસકાર',
      'ડેસ્કટોપ અને સાધનો પર શૂન્ય જાહેરાતો',
      'પ્રથમ અગ્રતા ગ્રાહક સેવા'
    ],
    adTitle: 'જાહેરાત સ્પોન્સર',
    adClose: 'જાહેરાતો દૂર કરો (પ્રો બનો)'
  },
  hi: {
    brand: 'AI Super Tools Hub',
    tagline: '200+ एआई और दैनिक उपयोगिताओं के साथ आपका प्रीमियम, उच्च प्रदर्शन टूलकिट।',
    searchPlaceholder: '200+ एआई और दैनिक टूल्स खोजें...',
    categories: {
      all: 'सभी उपकरण',
      'ai-chat': 'एआई और चैट सहायक',
      'content-writing': 'सामग्री और लेखन',
      'marketing-social': 'मार्केटिंग और सोशल मीडिया',
      'developer-tech': 'डेवलपर और तकनीकी उपकरण',
      'image-pdf': 'छवि और दस्तावेज़ पीडीएफ',
      utilities: 'दैनिक उपयोगिताएँ',
      'math-calc': 'कैलकुलेटर और गणित',
      'business-ideas': 'व्यवसाय और स्टार्टअप'
    },
    proBadge: 'प्रीमियम सदस्य',
    freeBadge: 'मुफ़्त खाता',
    favorites: 'पसंदीदा',
    history: 'इतिहास',
    noHistory: 'अभी तक कोई गतिविधि नहीं है। एक एआई टूल आज़माएं!',
    savedNotes: 'सहेजे गए नोट्स',
    noNotes: 'कोई सहेजे गए नोट्स नहीं हैं। नोट्स अनुभाग में बनाएं!',
    creditsLabel: 'उपलब्ध एआई क्रेडिट',
    upgradeBtn: 'प्रीमियम में अपग्रेड करें',
    languages: {
      en: 'English 🇺🇸',
      es: 'Español 🇪🇸',
      gu: 'ગુજરાતી 🇮🇳',
      hi: 'हिन्दी 🇮🇳',
      ja: '日本語 🇯🇵',
      pt: 'Português 🇵🇹',
      ar: 'العربية 🇸🇦'
    },
    close: 'बंद करें',
    runTool: 'एआई से बनाएं',
    generating: 'तैयार किया जा रहा है...',
    outputLabel: 'एआई द्वारा तैयार परिणाम',
    copyBtn: 'क्लिपबोर्ड पर कॉपी करें',
    copied: 'कॉपी किया गया!',
    favoritesTitle: 'आपके पसंदीदा उपकरण',
    pricingTitle: 'प्रीमियम असीमित एक्सेस अनलॉक करें',
    pricingSub: 'तेज गति, असीमित ओसीआर और 200+ पूरी तरह से अनलॉक मॉडल के साथ अपने काम को गति दें।',
    monthly: 'मासिक योजना',
    yearly: 'वार्षिक योजना (40% बचत)',
    proFeatures: [
      'असीमित उच्च गति एआई जनरेशन',
      'उन्नत मल्टी-टर्न एआई चैट',
      'असीमित दस्तावेज़ और छवि ओसीआर निष्कर्षण',
      'पूर्ण पैमाने पर कस्टम वेबसाइट निर्यातक',
      'डैशबोर्ड और टूल्स पर शून्य विज्ञापन',
      'प्राथमिकता ग्राहक सहायता'
    ],
    adTitle: 'प्रायोजित विज्ञापन',
    adClose: 'विज्ञापन हटाएं (प्रो बनें)'
  },
  ja: {
    brand: 'AI Super Tools Hub',
    tagline: '200以上のAIおよび日常実用ツールを備えた、プレミアムで高性能なツールキット。',
    searchPlaceholder: '200以上のAIおよび便利ツールを検索...',
    categories: {
      all: 'すべてのツール',
      'ai-chat': 'AIチャットとアシスタント',
      'content-writing': 'コンテンツと執筆',
      'marketing-social': 'マーケティングとSNS',
      'developer-tech': '開発者・技術ツール',
      'image-pdf': '画像とPDFドキュメント',
      utilities: '日常ユーティリティ',
      'math-calc': '電卓と数学',
      'business-ideas': 'ビジネスと起業'
    },
    proBadge: 'プロメンバー',
    freeBadge: '無料アカウント',
    favorites: 'お気に入り',
    history: '履歴',
    noHistory: '履歴がありません。AIツールを実行してみましょう！',
    savedNotes: '保存されたメモ',
    noNotes: '保存されたメモはありません。メモツールで作成してください！',
    creditsLabel: '利用可能なAIクレジット',
    upgradeBtn: 'プレミアムにアップグレード',
    languages: {
      en: 'English 🇺🇸',
      es: 'Español 🇪🇸',
      gu: 'ગુજરાતી 🇮🇳',
      hi: 'हिन्दी 🇮🇳',
      ja: '日本語 🇯🇵',
      pt: 'Português 🇵🇹',
      ar: 'العربية 🇸🇦'
    },
    close: '閉じる',
    runTool: 'AIで生成',
    generating: '生成中...',
    outputLabel: 'AI生成結果',
    copyBtn: 'クリップボードにコピー',
    copied: 'コピー完了！',
    favoritesTitle: 'ブックマークしたツール',
    pricingTitle: 'プレミアム無制限アクセスをアンロック',
    pricingSub: '無制限のAIモデル、より速い応答速度、高精度のOCR機能でワークフローを効率化。',
    monthly: '月間プラン',
    yearly: '年間プラン（40%お得）',
    proFeatures: [
      '無制限の高速AI生成機能',
      '高度な対話型AIチャット機能',
      '画像やPDFからの高精度OCR文字起こし無制限',
      '本格的なHTML/ウェブサイトエクスポート',
      'ダッシュボードやツール内の広告非表示',
      '優先カスタマーサポート'
    ],
    adTitle: 'スポンサー提供の広告',
    adClose: '広告を非表示（プロにする）'
  },
  pt: {
    brand: 'AI Super Tools Hub',
    tagline: 'Seu kit de ferramentas de alta performance premium com mais de 200 utilitários de IA.',
    searchPlaceholder: 'Pesquise mais de 200 ferramentas de IA...',
    categories: {
      all: 'Todas as ferramentas',
      'ai-chat': 'Assistentes de IA & Chat',
      'content-writing': 'Conteúdo & Escrita',
      'marketing-social': 'Marketing & Redes Sociais',
      'developer-tech': 'Ferramentas de Desenvolvedor',
      'image-pdf': 'Imagem & Documento PDF',
      utilities: 'Utilitários Diários',
      'math-calc': 'Calculadoras & Matemática',
      'business-ideas': 'Negócios & Startups'
    },
    proBadge: 'MEMBRO PRO',
    freeBadge: 'CONTA GRÁTIS',
    favorites: 'Favoritos',
    history: 'Histórico',
    noHistory: 'Nenhuma geração ainda. Tente executar uma ferramenta!',
    savedNotes: 'Notas Salvas',
    noNotes: 'Nenhuma nota salva. Crie uma no utilitário de Notas!',
    creditsLabel: 'Créditos de IA Disponíveis',
    upgradeBtn: 'Atualizar para Premium',
    languages: {
      en: 'English 🇺🇸',
      es: 'Español 🇪🇸',
      gu: 'ગુજરાતી 🇮🇳',
      hi: 'हिन्दी 🇮🇳',
      ja: '日本語 🇯🇵',
      pt: 'Português 🇵🇹',
      ar: 'العربية 🇸🇦'
    },
    close: 'Fechar',
    runTool: 'Gerar com IA',
    generating: 'Gerando Resultado...',
    outputLabel: 'Resultado Gerado por IA',
    copyBtn: 'Copiar para a Área de Transferência',
    copied: 'Copiado!',
    favoritesTitle: 'Suas Ferramentas Favoritas',
    pricingTitle: 'Desbloquear Acesso Premium Ilimitado',
    pricingSub: 'Turbine seu fluxo de trabalho com mais de 200 modelos de IA desbloqueados.',
    monthly: 'Plano Mensal',
    yearly: 'Plano Anual (Economize 40%)',
    proFeatures: [
      'Gerações ilimitadas de IA em alta velocidade',
      'Chat de IA multivoltas avançado',
      'Extração ilimitada de documentos e imagens OCR',
      'Exportador de site completo customizado',
      'Zero anúncios no painel de ferramentas',
      'Atendimento ao cliente prioritário'
    ],
    adTitle: 'ANÚNCIO PATROCINADO',
    adClose: 'Remover Anúncios (Go Pro)'
  },
  ar: {
    brand: 'AI Super Tools Hub',
    tagline: 'حقيبة أدواتك المتميزة فائقة الأداء مع أكثر من 200 أداة ذكاء اصطناعي.',
    searchPlaceholder: 'ابحث في أكثر من 200 أداة ذكاء اصطناعي...',
    categories: {
      all: 'جميع الأدوات',
      'ai-chat': 'مساعدي الذكاء الاصطناعي والدردشة',
      'content-writing': 'المحتوى والكتابة',
      'marketing-social': 'التسويق ووسائل التواصل الاجتماعي',
      'developer-tech': 'أدوات المطورين والتكنولوجيا',
      'image-pdf': 'الصور ومستندات PDF',
      utilities: 'أدوات يومية عامة',
      'math-calc': 'الآلات الحاسبة والرياضيات',
      'business-ideas': 'الأعمال والشركات الناشئة'
    },
    proBadge: 'عضو برو',
    freeBadge: 'حساب مجاني',
    favorites: 'المفضلة',
    history: 'السجل',
    noHistory: 'لا توجد عمليات إنشاء حتى الآن. جرب تشغيل أداة!',
    savedNotes: 'الملاحظات المحفوظة',
    noNotes: 'لا توجد ملاحظات محفوظة. أنشئ واحدة في أداة الملاحظات!',
    creditsLabel: 'رصيد الذكاء الاصطناعي المتاح',
    upgradeBtn: 'الترقية إلى برو',
    languages: {
      en: 'English 🇺🇸',
      es: 'Español 🇪🇸',
      gu: 'ગુજરાતી 🇮🇳',
      hi: 'हिन्दी 🇮🇳',
      ja: '日本語 🇯🇵',
      pt: 'Português 🇵🇹',
      ar: 'العربية 🇸🇦'
    },
    close: 'إغلاق',
    runTool: 'توليد بالذكاء الاصطناعي',
    generating: 'جاري التوليد...',
    outputLabel: 'النتيجة المولدة بالذكاء الاصطناعي',
    copyBtn: 'نسخ إلى الحافظة',
    copied: 'تم النسخ!',
    favoritesTitle: 'أدواتك المفضلة',
    pricingTitle: 'فتح الوصول المميز غير المحدود',
    pricingSub: 'عزز إنتاجيتك مع أكثر من 200 نموذج ذكاء اصطناعي غير محدود.',
    monthly: 'خطة شهرية',
    yearly: 'خطة سنوية (وفر 40%)',
    proFeatures: [
      'عمليات توليد غير محدودة فائقة السرعة',
      'دردشة ذكاء اصطناعي متقدمة متعددة الجولات',
      'استخراج غير محدود للنصوص من الصور والمستندات OCR',
      'مصدّر مواقع ويب مخصص بالكامل',
      'خالٍ تماماً من الإعلانات',
      'دعم عملاء ذو أولوية فائقة'
    ],
    adTitle: 'إعلان ممول',
    adClose: 'إزالة الإعلانات (احصل على برو)'
  }
};
