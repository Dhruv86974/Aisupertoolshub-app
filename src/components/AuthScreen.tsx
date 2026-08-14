import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, AtSign, Eye, EyeOff, Sparkles, LogIn, ChevronRight, HelpCircle, Chrome, Facebook, ShieldCheck } from 'lucide-react';
import { LanguageCode } from '../types';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

interface AuthScreenProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  playSynthSound: (type: 'click' | 'success' | 'rate' | 'chime' | 'laser' | 'toggle') => void;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
  onAuthSuccess: (user: {
    id: string;
    email: string;
    name: string;
    username: string;
    tier: string;
    credits: number;
  }) => void;
}

const LOCALIZED_AUTH: Record<LanguageCode, {
  loginTab: string;
  signupTab: string;
  emailLabel: string;
  passwordLabel: string;
  nameLabel: string;
  usernameLabel: string;
  loginBtn: string;
  signupBtn: string;
  orText: string;
  demoBtn: string;
  haveAccount: string;
  noAccount: string;
  emailRequired: string;
  passwordRequired: string;
  nameRequired: string;
  usernameRequired: string;
  successLogin: string;
  successSignup: string;
  brandTagline: string;
  securityNotice: string;
  googleBtn: string;
  facebookBtn: string;
  selectAccountTitle: string;
  anotherAccountBtn: string;
  enterEmailPlaceholder: string;
  enterNamePlaceholder: string;
}> = {
  en: {
    loginTab: "Log In",
    signupTab: "Create Account",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    nameLabel: "Full Name",
    usernameLabel: "Username",
    loginBtn: "Access Platform",
    signupBtn: "Register & Launch",
    orText: "OR CONNECT INSTANTLY",
    demoBtn: "1-Click Demo Entry ⚡",
    haveAccount: "Already have an account? Log In",
    noAccount: "New to AI Hub? Create Account",
    emailRequired: "Please enter a valid email address",
    passwordRequired: "Password must be at least 6 characters",
    nameRequired: "Full Name is required",
    usernameRequired: "Username is required",
    successLogin: "Logged in successfully!",
    successSignup: "Account created successfully!",
    brandTagline: "Access 25+ premium AI automation engines, daily productivity trackers, and smart workflows in one seamless, high-performance workspace.",
    securityNotice: "Standard SSL Encryption Active",
    googleBtn: "Google Account",
    facebookBtn: "Facebook Login",
    selectAccountTitle: "Select Social Account to Connect",
    anotherAccountBtn: "Use custom social account",
    enterEmailPlaceholder: "Enter your social account email",
    enterNamePlaceholder: "Enter your full name"
  },
  gu: {
    loginTab: "પ્રવેશ કરો",
    signupTab: "નોંધણી કરો",
    emailLabel: "ઇમેઇલ સરનામું",
    passwordLabel: "પાસવર્ડ",
    nameLabel: "પૂરું નામ",
    usernameLabel: "વપરાશકર્તા નામ",
    loginBtn: "હબ ઍક્સેસ કરો",
    signupBtn: "નોંધણી કરો અને જોડાઓ",
    orText: "અથવા ત્વરિત જોડાઓ",
    demoBtn: "૧-ક્લિક ડેમો પ્રવેશ ⚡",
    haveAccount: "પહેલેથી જ ખાતું છે? પ્રવેશ કરો",
    noAccount: "એઆઈ હબમાં નવા છો? ખાતું બનાવો",
    emailRequired: "કૃપા કરીને સાચો ઇમેઇલ સરનામું દાખલ કરો",
    passwordRequired: "પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ",
    nameRequired: "પૂરું નામ લખવું જરૂરી છે",
    usernameRequired: "વપરાશકર્તા નામ જરૂરી છે",
    successLogin: "સફળતાપૂર્વક પ્રવેશ મેળવ્યો!",
    successSignup: "ખાતું સફળતાપૂર્વક બનાવવામાં આવ્યું!",
    brandTagline: "એક જ સીમલેસ, હાઇ-પરફોર્મન્સ વર્કસ્પેસમાં ૨૫+ પ્રીમિયમ એઆઈ ઓટોમેશન એન્જિન, ઉત્પાદકતા ટ્રેકર્સ અને સ્માર્ટ વર્કફ્લો મેળવો.",
    securityNotice: "સ્ટાન્ડર્ડ SSL એન્ક્રિપ્શન સક્રિય",
    googleBtn: "ગૂગલ એકાઉન્ટ",
    facebookBtn: "ફેસબુક લોગિન",
    selectAccountTitle: "જોડાવા માટે સોશિયલ એકાઉન્ટ પસંદ કરો",
    anotherAccountBtn: "બીજું સોશિયલ એકાઉન્ટ વાપરો",
    enterEmailPlaceholder: "તમારો સોશિયલ ઇમેઇલ દાખલ કરો",
    enterNamePlaceholder: "તમારું પૂરું નામ લખો"
  },
  es: {
    loginTab: "Iniciar Sesión",
    signupTab: "Crear Cuenta",
    emailLabel: "Correo Electrónico",
    passwordLabel: "Contraseña",
    nameLabel: "Nombre Completo",
    usernameLabel: "Nombre de Usuario",
    loginBtn: "Acceder al Hub",
    signupBtn: "Registrarse y Explorar",
    orText: "O CONECTAR AL INSTANTE",
    demoBtn: "Entrada de Demostración ⚡",
    haveAccount: "¿Ya tienes cuenta? Iniciar Sesión",
    noAccount: "¿Nuevo en AI Hub? Crear Cuenta",
    emailRequired: "Ingrese un correo válido",
    passwordRequired: "La contraseña debe tener al menos 6 caracteres",
    nameRequired: "El nombre completo es obligatorio",
    usernameRequired: "El nombre de usuario es obligatorio",
    successLogin: "¡Sesión iniciada correctamente!",
    successSignup: "¡Cuenta creada correctamente!",
    brandTagline: "Acceda a más de 25 motores de automatización de IA premium, rastreadores de productividad y flujos de trabajo inteligentes.",
    securityNotice: "Cifrado SSL Estándar Activo",
    googleBtn: "Cuenta de Google",
    facebookBtn: "Inicio con Facebook",
    selectAccountTitle: "Seleccione cuenta para conectar",
    anotherAccountBtn: "Usar otra cuenta social",
    enterEmailPlaceholder: "Ingrese correo de cuenta social",
    enterNamePlaceholder: "Ingrese su nombre completo"
  },
  hi: {
    loginTab: "लॉग इन करें",
    signupTab: "खाता बनाएं",
    emailLabel: "ईमेल पता",
    passwordLabel: "पासवर्ड",
    nameLabel: "पूरा नाम",
    usernameLabel: "यूज़रनेम",
    loginBtn: "हब में प्रवेश करें",
    signupBtn: "पंजीकरण करें और खोजें",
    orText: "या तुरंत कनेक्ट करें",
    demoBtn: "1-क्लिक डेमो प्रवेश ⚡",
    haveAccount: "पहले से ही एक खाता है? लॉग इन करें",
    noAccount: "एआई हब में नए हैं? खाता बनाएं",
    emailRequired: "कृपया एक वैध ईमेल दर्ज करें",
    passwordRequired: "पासवर्ड कम से कम 6 वर्णों का होना चाहिए",
    nameRequired: "पूरा नाम आवश्यक है",
    usernameRequired: "यूज़रनेम आवश्यक है",
    successLogin: "सफलतापूर्वक लॉग इन किया गया!",
    successSignup: "खाता सफलतापूर्वक बनाया गया!",
    brandTagline: "एक ही एकीकृत, उच्च प्रदर्शन वाले वर्कस्पेस में 25+ प्रीमियम एआई ऑटोमेशन इंजन, दैनिक उत्पादकता ट्रैकर्स और स्मार्ट वर्कफ़्लो प्राप्त करें।",
    securityNotice: "मानक SSL एन्क्रिप्शन सक्रिय",
    googleBtn: "गूगल खाता",
    facebookBtn: "फेसबुक लॉगिन",
    selectAccountTitle: "कनेक्ट करने के लिए सोशल अकाउंट चुनें",
    anotherAccountBtn: "अन्य सोशल अकाउंट का उपयोग करें",
    enterEmailPlaceholder: "अपना सोशल ईमेल दर्ज करें",
    enterNamePlaceholder: "अपना पूरा नाम दर्ज करें"
  },
  ja: {
    loginTab: "ログイン",
    signupTab: "新規登録",
    emailLabel: "メールアドレス",
    passwordLabel: "パスワード",
    nameLabel: "氏名",
    usernameLabel: "ユーザー名",
    loginBtn: "ハブにアクセス",
    signupBtn: "登録して開始",
    orText: "または今すぐ接続",
    demoBtn: "1クリック デモログイン ⚡",
    haveAccount: "すでにアカウントをお持ちですか？ ログイン",
    noAccount: "AIハブは初めてですか？ アカウント作成",
    emailRequired: "有効なメールアドレスを入力してください",
    passwordRequired: "パスワードは6文字以上で入力してください",
    nameRequired: "氏名は必須です",
    usernameRequired: "ユーザー名は必須です",
    successLogin: "ログインに成功しました！",
    successSignup: "アカウントの作成に成功しました！",
    brandTagline: "25種類以上のプレミアムAI自動化エンジン、毎日の生産性トラッカー、スマートなワークフローを1つの統合ワークスペースで利用できます。",
    securityNotice: "標準のSSL暗号化が有効",
    googleBtn: "Googleアカウント",
    facebookBtn: "Facebookログイン",
    selectAccountTitle: "接続するソーシャルアカウントを選択",
    anotherAccountBtn: "他のソーシャルアカウントを使用",
    enterEmailPlaceholder: "ソーシャルメールを入力してください",
    enterNamePlaceholder: "氏名を入力してください"
  }
};

export default function AuthScreen({ lang, theme, playSynthSound, showToast, onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Social authentication states
  const [socialModalType, setSocialModalType] = useState<'google' | 'facebook' | null>(null);
  const [customSocialEmail, setCustomSocialEmail] = useState('');
  const [customSocialName, setCustomSocialName] = useState('');
  const [customSocialUsername, setCustomSocialUsername] = useState('');
  const [showCustomSocialForm, setShowCustomSocialForm] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // Popup OAuth handler
  React.useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data && event.data.type === 'OAUTH_AUTH_SUCCESS' && event.data.user) {
        showToast(lang === 'gu' ? "સોશિયલ લોગિન સફળ રહ્યું!" : "Social Login Successful!", 'success');
        playSynthSound('success');
        setSocialModalType(null);
        onAuthSuccess(event.data.user);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [lang, playSynthSound, onAuthSuccess, showToast]);

  const openOAuthPopup = (provider: 'google' | 'facebook') => {
    playSynthSound('click');
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      `/api/auth/${provider}/login`,
      `${provider}_oauth_popup`,
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      showToast(
        lang === 'gu' 
          ? "પોપ-અપ બ્લોક થયો છે. કૃપા કરીને તેને મંજૂરી આપો!" 
          : "Popup was blocked. Please allow popups for social login!", 
        'error'
      );
    }
  };

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  const t = LOCALIZED_AUTH[lang] || LOCALIZED_AUTH['en'];

  const handleSocialAuth = async (socialEmail: string, socialName: string, socialUsername?: string) => {
    playSynthSound('click');
    setSocialLoading(true);

    const fallbackUsername = socialUsername || socialEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.floor(Math.random() * 100);

    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: socialEmail,
          name: socialName,
          username: fallbackUsername,
          provider: socialModalType || 'google'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Social login failed');
      }

      showToast(lang === 'gu' ? "સોશિયલ લોગિન સફળ રહ્યું!" : "Social Login Successful!", 'success');
      playSynthSound('success');
      setSocialModalType(null);
      onAuthSuccess(data.user);
    } catch (err: any) {
      showToast(err.message || 'Error connecting social account', 'error');
      playSynthSound('laser');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSynthSound('click');

    // Validation
    if (!email || !email.includes('@')) {
      showToast(t.emailRequired, 'error');
      playSynthSound('laser');
      return;
    }
    if (!password || password.length < 6) {
      showToast(t.passwordRequired, 'error');
      playSynthSound('laser');
      return;
    }
    if (activeTab === 'signup') {
      if (!name.trim()) {
        showToast(t.nameRequired, 'error');
        playSynthSound('laser');
        return;
      }
      if (!username.trim()) {
        showToast(t.usernameRequired, 'error');
        playSynthSound('laser');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = activeTab === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = activeTab === 'signup' 
        ? { email, password, name, username }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Synchronize Firebase Authentication on the client side
      try {
        if (activeTab === 'signup') {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch (fbErr: any) {
            if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password') {
              // Register silently inside Firebase Auth so legacy accounts reconcile perfectly
              await createUserWithEmailAndPassword(auth, email, password);
            } else {
              throw fbErr;
            }
          }
        }
      } catch (fbErr: any) {
        console.warn("Firebase Auth synchronization silent fallback:", fbErr);
        try {
          await signInAnonymously(auth);
        } catch (anonErr) {
          console.warn("Firebase Auth completely unavailable:", anonErr);
        }
      }

      showToast(activeTab === 'signup' ? t.successSignup : t.successLogin, 'success');
      playSynthSound('success');
      onAuthSuccess(data.user);
    } catch (err: any) {
      showToast(err.message || 'Error communicating with authentication backend', 'error');
      playSynthSound('laser');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    playSynthSound('chime');
    setLoading(true);

    try {
      // Direct call to login with demo credentials or use a specialized endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'demo@aisupertools.com',
          password: 'demouser123'
        })
      });

      const data = await res.json();
      let loggedInUser = null;

      if (!res.ok) {
        // If demo user is missing on process start, register it automatically
        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'demo@aisupertools.com',
            password: 'demouser123',
            name: 'Aarav Shah',
            username: 'aarav_demo'
          })
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok) throw new Error(signupData.error);
        loggedInUser = signupData.user;
      } else {
        loggedInUser = data.user;
      }

      // Synchronize demo user with Firebase Auth session
      try {
        try {
          await signInWithEmailAndPassword(auth, 'demo@aisupertools.com', 'demouser123');
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password') {
            await createUserWithEmailAndPassword(auth, 'demo@aisupertools.com', 'demouser123');
          } else {
            throw fbErr;
          }
        }
      } catch (fbErr: any) {
        console.warn("Firebase Demo Auth synchronization silent fallback:", fbErr);
        try {
          await signInAnonymously(auth);
        } catch (anonErr) {
          console.warn("Firebase Auth completely unavailable in demo:", anonErr);
        }
      }

      showToast(t.successLogin, 'success');
      playSynthSound('success');
      onAuthSuccess(loggedInUser);
    } catch (err: any) {
      // Fallback local mock login in case server fails
      showToast('Demo Logged In Offline', 'info');
      onAuthSuccess({
        id: 'usr-demo',
        email: 'demo@aisupertools.com',
        name: 'Aarav Shah',
        username: 'aarav_demo',
        tier: 'elite',
        credits: 999999
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white antialiased relative overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#030712] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT SIDE: Splash/Brand Presentation */}
      <div className={`flex-1 flex flex-col justify-between p-8 md:p-16 relative overflow-hidden ${
        theme === 'dark' ? 'border-r border-slate-900 bg-[#060913]' : 'border-r border-slate-200/80 bg-slate-50/50'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase block">MULTI-TIERED</span>
            <h1 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              AI SUPER TOOLS HUB
            </h1>
          </div>
        </div>

        {/* Middle Feature Teaser */}
        <div className="my-auto py-12 space-y-6 max-w-lg text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
              {lang === 'gu' ? "એઆઈ પાવર્ડ સેક્યોર લોગિન" : "SECURE PASS INTEGRATION"}
            </span>
            <h2 className={`text-2xl md:text-4xl font-black leading-tight tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
              {lang === 'gu' ? "તમારા મનપસંદ તમામ સાધનો એક જ સુરક્ષિત લોગિન હેઠળ!" : "Your powerful toolkit, protected and persistent."}
            </h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
              {t.brandTagline}
            </p>
          </motion.div>

          {/* Quick micro stats cards */}
          <div className="grid grid-cols-2 gap-3.5 pt-4">
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900/60' : 'bg-white border-slate-200'}`}>
              <div className="text-lg font-black font-mono text-blue-500">25+</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {lang === 'gu' ? "પ્રીમિયમ સાધનો" : "Smart Engines"}
              </div>
            </div>
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900/60' : 'bg-white border-slate-200'}`}>
              <div className="text-lg font-black font-mono text-emerald-500">100%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {lang === 'gu' ? "સલામત ડેટા" : "Cloud Sync"}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom footer elements */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 border-t border-slate-500/10 pt-4">
          <span>© 2026 AI Super Hub.</span>
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>{t.securityNotice}</span>
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-16">
        <div className={`w-full max-w-md p-6 md:p-8 rounded-3xl border relative ${
          theme === 'dark' ? 'bg-[#060a16] border-slate-900/80 shadow-2xl shadow-blue-500/5' : 'bg-white border-slate-200/80 shadow-2xl'
        }`}>
          {/* Form Tabs */}
          <div className={`flex p-1 rounded-xl mb-8 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <button
              onClick={() => {
                playSynthSound('toggle');
                setActiveTab('login');
              }}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.loginTab}
            </button>
            <button
              onClick={() => {
                playSynthSound('toggle');
                setActiveTab('signup');
              }}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.signupTab}
            </button>
          </div>

          {/* Form container */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Full Name field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {t.nameLabel}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aarav Shah"
                        className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500/80 focus:bg-slate-950/80'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Username field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {t.usernameLabel}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <AtSign className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. aarav_shah"
                        className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500/80 focus:bg-slate-950/80'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Address field */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {t.emailLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className={`w-full text-xs pl-10 pr-4 py-3 rounded-xl border outline-none font-semibold transition ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500/80 focus:bg-slate-950/80'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {t.passwordLabel}
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full text-xs pl-10 pr-10 py-3 rounded-xl border outline-none font-semibold transition ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500/80 focus:bg-slate-950/80'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Trigger button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-black uppercase tracking-wider text-xs py-3 px-4 rounded-xl transition duration-150 active:scale-95 shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{activeTab === 'login' ? t.loginBtn : t.signupBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Separator line */}
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${theme === 'dark' ? 'border-slate-900' : 'border-slate-200'}`} />
            </div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
              <span className={`px-2.5 py-0.5 rounded ${theme === 'dark' ? 'bg-[#060a16] text-slate-500' : 'bg-white text-slate-400'}`}>
                {t.orText}
              </span>
            </div>
          </div>

          {/* Social Sign In Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => openOAuthPopup('google')}
              className={`py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-900 hover:bg-slate-900 text-slate-100 hover:border-slate-800'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300 shadow-sm'
              }`}
            >
              <Chrome className="w-4 h-4 text-rose-500" />
              <span>{t.googleBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => openOAuthPopup('facebook')}
              className={`py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#1877F2]/10 border-[#1877F2]/20 hover:bg-[#1877F2]/20 text-[#1877F2]'
                  : 'bg-[#1877F2]/5 border-[#1877F2]/20 hover:bg-[#1877F2]/10 text-[#1877F2] font-black'
              }`}
            >
              <Facebook className="w-4 h-4 text-[#1877F2] fill-[#1877F2]/20" />
              <span>{t.facebookBtn}</span>
            </button>
          </div>

          {/* Quick Demo Mode Sign-In */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition duration-150 active:scale-95 flex items-center justify-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-purple-900/10 hover:bg-purple-900/20 border-purple-500/25 text-purple-400'
                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
            }`}
          >
            <span>{t.demoBtn}</span>
          </button>

          {/* Account swap suggestion */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                playSynthSound('click');
                setActiveTab(activeTab === 'login' ? 'signup' : 'login');
              }}
              className="text-[10px] font-bold text-blue-500 hover:text-blue-400"
            >
              {activeTab === 'login' ? t.noAccount : t.haveAccount}
            </button>
          </div>
        </div>
      </div>

      {/* ================= SOCIAL AUTH MODAL DIALOG ================= */}
      <AnimatePresence>
        {socialModalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!socialLoading) {
                  playSynthSound('click');
                  setSocialModalType(null);
                }
              }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl z-10 ${
                theme === 'dark' 
                  ? 'bg-[#0b1120] border-slate-900 text-slate-100 shadow-blue-950/20' 
                  : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
              }`}
            >
              {socialModalType === 'google' ? (
                /* ================= GOOGLE AUTHENTIC INTERACTIVE SIMULATOR ================= */
                <div className="p-7 md:p-9 text-center">
                  {/* Google Logo Header */}
                  <div className="flex justify-center mb-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                      <svg className="w-8 h-8" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>
                  </div>

                  <h3 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {lang === 'gu' ? "ગૂગલ સાથે સાઇન-ઇન કરો" : "Sign in with Google"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 mb-7">
                    {lang === 'gu' ? "AISuperTools Hub પર આગળ વધવા માટે" : "to continue to AI Super Tools Hub"}
                  </p>

                  {socialLoading ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-4">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/10" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-extrabold text-blue-500 tracking-wider uppercase block">
                          Connecting OAuth 2.0 Secure Session
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Validating federated digital signature...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!showCustomSocialForm ? (
                        <div className="space-y-2.5">
                          {/* Option 1: Main User Account */}
                          <button
                            onClick={() => handleSocialAuth('dhruvtarsariya3@gmail.com', 'Dhruv Tarsariya')}
                            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-950/60 border-slate-900 hover:border-blue-500/60 hover:bg-slate-900/40'
                                : 'bg-slate-50 border-slate-100 hover:border-blue-400 hover:bg-blue-50/20'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 truncate">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
                                DT
                              </div>
                              <div className="truncate text-left">
                                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Dhruv Tarsariya</p>
                                <p className="text-[10px] text-slate-500">dhruvtarsariya3@gmail.com</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              Signed In
                            </span>
                          </button>

                          {/* Option 2: Alternate Demo Account */}
                          <button
                            onClick={() => handleSocialAuth('aarav@gmail.com', 'Aarav Shah')}
                            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-950/60 border-slate-900 hover:border-blue-500/60 hover:bg-slate-900/40'
                                : 'bg-slate-50 border-slate-100 hover:border-blue-400 hover:bg-blue-50/20'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 truncate">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20">
                                AS
                              </div>
                              <div className="truncate text-left">
                                <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Aarav Shah</p>
                                <p className="text-[10px] text-slate-500">aarav@gmail.com</p>
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400">Offline</span>
                          </button>

                          {/* Option 3: Add Custom Account */}
                          <button
                            onClick={() => {
                              playSynthSound('click');
                              setShowCustomSocialForm(true);
                            }}
                            className={`w-full py-3.5 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center transition-all cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-900 hover:bg-slate-900 text-slate-300 hover:text-white'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800'
                            }`}
                          >
                            {lang === 'gu' ? "+ અન્ય ગૂગલ એકાઉન્ટ વાપરો" : "+ Use another Google account"}
                          </button>
                        </div>
                      ) : (
                        /* Google Custom Account Sign-In Form */
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!customSocialEmail || !customSocialEmail.includes('@')) {
                              showToast(t.emailRequired, 'error');
                              return;
                            }
                            if (!customSocialName.trim()) {
                              showToast(t.nameRequired, 'error');
                              return;
                            }
                            handleSocialAuth(customSocialEmail, customSocialName, customSocialUsername);
                          }}
                          className="space-y-4 text-left"
                        >
                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {lang === 'gu' ? "તમારું પૂરું નામ" : "Full Name"}
                            </label>
                            <input
                              type="text"
                              required
                              value={customSocialName}
                              onChange={(e) => setCustomSocialName(e.target.value)}
                              placeholder="e.g. Dhruv Tarsariya"
                              className={`w-full text-xs px-4 py-3 rounded-xl border outline-none font-semibold transition ${
                                theme === 'dark'
                                  ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500 focus:bg-slate-950/50'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                              }`}
                            />
                          </div>

                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {lang === 'gu' ? "ગૂગલ ઇમેઇલ એડ્રેસ" : "Google Email Address"}
                            </label>
                            <input
                              type="email"
                              required
                              value={customSocialEmail}
                              onChange={(e) => setCustomSocialEmail(e.target.value)}
                              placeholder="username@gmail.com"
                              className={`w-full text-xs px-4 py-3 rounded-xl border outline-none font-semibold transition ${
                                theme === 'dark'
                                  ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500 focus:bg-slate-950/50'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                              }`}
                            />
                          </div>

                          <div className="flex gap-2.5 pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                playSynthSound('click');
                                setShowCustomSocialForm(false);
                              }}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border cursor-pointer ${
                                theme === 'dark'
                                  ? 'border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/15 cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  <div className="mt-8 pt-4 border-t border-slate-500/10 text-left text-[10px] text-slate-400 leading-relaxed">
                    To continue, Google will share your name, email address, language preference, and profile picture with AI Super Tools Hub. See our <span className="text-blue-500 cursor-pointer hover:underline">Privacy Policy</span> and <span className="text-blue-500 cursor-pointer hover:underline">Terms of Service</span>.
                  </div>
                </div>
              ) : (
                /* ================= FACEBOOK AUTHENTIC INTERACTIVE SIMULATOR ================= */
                <div>
                  {/* Facebook Branded Header */}
                  <div className="bg-[#1877F2] p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-wider opacity-90">Facebook Login</h4>
                        <p className="text-[9px] opacity-75">m.facebook.com/oauth/authorize</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20 border border-white/10">
                      SECURE
                    </span>
                  </div>

                  <div className="p-7 md:p-8">
                    <h3 className={`text-lg font-bold text-left tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {lang === 'gu' ? "ફેસબુક સાથે લોગિન કરો" : "Log In with Facebook"}
                    </h3>
                    <p className="text-xs text-slate-400 text-left mb-6 leading-relaxed">
                      AISuperTools Hub is requesting access to your profile name, email, and avatar picture.
                    </p>

                    {socialLoading ? (
                      <div className="py-10 flex flex-col items-center justify-center gap-4">
                        <div className="relative w-12 h-12">
                          <div className="absolute inset-0 rounded-full border-4 border-[#1877F2]/10" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-[#1877F2] animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-extrabold text-[#1877F2] tracking-wider uppercase block">
                            Linking Facebook Secure Profile
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            Validating access token signature...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!showCustomSocialForm ? (
                          <div className="space-y-3">
                            {/* Option 1: Main User Account */}
                            <button
                              onClick={() => handleSocialAuth('dhruvtarsariya3@gmail.com', 'Dhruv Tarsariya')}
                              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                                theme === 'dark'
                                  ? 'bg-slate-950/60 border-slate-900 hover:border-blue-500/60 hover:bg-slate-900/40'
                                  : 'bg-slate-50 border-slate-100 hover:border-blue-400 hover:bg-blue-50/20'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 truncate">
                                <div className="w-11 h-11 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/10">
                                  DT
                                </div>
                                <div className="truncate text-left">
                                  <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Dhruv Tarsariya</p>
                                  <p className="text-[10px] text-slate-500">Facebook Profile Link</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-[#1877F2]">
                                Continue
                              </span>
                            </button>

                            {/* Option 2: Choose Custom Account Form link */}
                            <button
                              onClick={() => {
                                playSynthSound('click');
                                setShowCustomSocialForm(true);
                              }}
                              className={`w-full py-3 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center transition-all cursor-pointer ${
                                theme === 'dark'
                                  ? 'bg-slate-950 border-slate-900 hover:bg-slate-900 text-slate-300 hover:text-white'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800'
                              }`}
                            >
                              {lang === 'gu' ? "અન્ય ફેસબુક આઈડી વાપરો" : "Log in with another Facebook account"}
                            </button>
                          </div>
                        ) : (
                          /* Custom Facebook Login Form */
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!customSocialEmail || !customSocialEmail.includes('@')) {
                                showToast(t.emailRequired, 'error');
                                return;
                              }
                              if (!customSocialName.trim()) {
                                showToast(t.nameRequired, 'error');
                                return;
                              }
                              handleSocialAuth(customSocialEmail, customSocialName, customSocialUsername);
                            }}
                            className="space-y-4 text-left"
                          >
                            <div className="space-y-1.5 flex flex-col">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {lang === 'gu' ? "તમારું ફેસબુક નામ" : "Profile Full Name"}
                              </label>
                              <input
                                type="text"
                                required
                                value={customSocialName}
                                onChange={(e) => setCustomSocialName(e.target.value)}
                                placeholder="e.g. Dhruv Tarsariya"
                                className={`w-full text-xs px-4 py-3 rounded-xl border outline-none font-semibold transition ${
                                  theme === 'dark'
                                    ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-[#1877F2]'
                                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#1877F2] focus:bg-white'
                                }`}
                              />
                            </div>

                            <div className="space-y-1.5 flex flex-col">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {lang === 'gu' ? "ફેસબુક ઇમેઇલ અથવા ફોન નંબર" : "Facebook Email or Phone"}
                              </label>
                              <input
                                type="email"
                                required
                                value={customSocialEmail}
                                onChange={(e) => setCustomSocialEmail(e.target.value)}
                                placeholder="username@facebook-id.com"
                                className={`w-full text-xs px-4 py-3 rounded-xl border outline-none font-semibold transition ${
                                  theme === 'dark'
                                    ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-[#1877F2]'
                                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#1877F2] focus:bg-white'
                                }`}
                              />
                            </div>

                            <div className="flex gap-2.5 pt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  playSynthSound('click');
                                  setShowCustomSocialForm(false);
                                }}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border cursor-pointer ${
                                  theme === 'dark'
                                    ? 'border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center bg-[#1877F2] hover:bg-[#1565C0] text-white shadow-md cursor-pointer"
                              >
                                Log In
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-500/10 pt-4">
                      <span>App Version 2.15</span>
                      <button 
                        onClick={() => {
                          playSynthSound('click');
                          setSocialModalType(null);
                        }} 
                        className="hover:underline text-[#1877F2] font-bold"
                      >
                        Cancel Authorization
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
