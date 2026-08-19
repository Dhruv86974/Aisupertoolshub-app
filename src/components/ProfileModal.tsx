import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, AtSign, Key, Save, ShieldAlert, Award, Star, History, Check, GraduationCap, BookOpen, Download, Upload, LogOut } from 'lucide-react';
import { LanguageCode } from '../types';

interface ProfileModalProps {
  lang: LanguageCode;
  theme: 'dark' | 'light';
  userState: {
    id: string;
    email: string;
    name?: string;
    username?: string;
    tier: string;
    credits: number;
    history: any[];
    college?: string;
    semester?: string;
  };
  onClose: () => void;
  onUpdateSuccess: (updatedUser: { name: string; username: string; college?: string; semester?: string }) => void;
  onLogout?: () => void;
  playSynthSound: (type: 'click' | 'success' | 'rate' | 'chime' | 'laser' | 'toggle') => void;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

const LOCALIZED_PROFILE: Record<LanguageCode, {
  title: string;
  editTab: string;
  passwordTab: string;
  nameLabel: string;
  usernameLabel: string;
  emailLabel: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  saveBtn: string;
  updating: string;
  successProfileUpdate: string;
  successPasswordUpdate: string;
  passwordMismatch: string;
  tierLabel: string;
  creditsLabel: string;
  unlimited: string;
  activeTier: string;
  statsTitle: string;
  interactiveCalls: string;
}> = {
  en: {
    title: "Profile Settings",
    editTab: "Edit Profile",
    passwordTab: "Change Password",
    nameLabel: "Full Name",
    usernameLabel: "Username",
    emailLabel: "Email Address (Read-only)",
    currentPasswordLabel: "Current Password",
    newPasswordLabel: "New Password",
    confirmPasswordLabel: "Confirm New Password",
    saveBtn: "Save Changes",
    updating: "Updating...",
    successProfileUpdate: "Profile updated successfully!",
    successPasswordUpdate: "Password changed successfully!",
    passwordMismatch: "New passwords do not match!",
    tierLabel: "Subscription Tier",
    creditsLabel: "Remaining Credits",
    unlimited: "Unlimited (Enterprise Active)",
    activeTier: "Active Pass",
    statsTitle: "Your AI Usage Stats",
    interactiveCalls: "Total AI Computations"
  },
  gu: {
    title: "પ્રોફાઇલ સેટિંગ્સ",
    editTab: "પ્રોફાઇલ બદલો",
    passwordTab: "પાસવર્ડ બદલો",
    nameLabel: "પૂરું નામ",
    usernameLabel: "વપરાશકર્તા નામ",
    emailLabel: "ઇમેઇલ સરનામું (ફક્ત વાંચવા માટે)",
    currentPasswordLabel: "વર્તમાન પાસવર્ડ",
    newPasswordLabel: "નવો પાસવર્ડ",
    confirmPasswordLabel: "નવા પાસવર્ડની પુષ્ટિ કરો",
    saveBtn: "ફેરફારો સાચવો",
    updating: "અપડેટ થઈ રહ્યું છે...",
    successProfileUpdate: "પ્રોફાઇલ સફળતાપૂર્વક અપડેટ થઈ!",
    successPasswordUpdate: "પાસવર્ડ સફળતાપૂર્વક બદલાયો!",
    passwordMismatch: "નવા પાસવર્ડ્સ મેળ ખાતા નથી!",
    tierLabel: "સબ્સ્ક્રિપ્શન પ્લાન",
    creditsLabel: "બાકી રહેલ ક્રેડિટ્સ",
    unlimited: "અમર્યાદિત (એન્ટરપ્રાઇઝ સક્રિય)",
    activeTier: "સક્રિય પાસ",
    statsTitle: "તમારી એઆઈ વપરાશની વિગતો",
    interactiveCalls: "કુલ એઆઈ ગણતરીઓ"
  },
  es: {
    title: "Ajustes de Perfil",
    editTab: "Editar Perfil",
    passwordTab: "Cambiar Contraseña",
    nameLabel: "Nombre Completo",
    usernameLabel: "Nombre de Usuario",
    emailLabel: "Correo Electrónico (Solo lectura)",
    currentPasswordLabel: "Contraseña Actual",
    newPasswordLabel: "Nueva Contraseña",
    confirmPasswordLabel: "Confirmar Nueva Contraseña",
    saveBtn: "Guardar Cambios",
    updating: "Actualizando...",
    successProfileUpdate: "¡Perfil actualizado con éxito!",
    successPasswordUpdate: "¡Contraseña cambiada con éxito!",
    passwordMismatch: "¡Las nuevas contraseñas no coinciden!",
    tierLabel: "Nivel de Suscripción",
    creditsLabel: "Créditos Restantes",
    unlimited: "Ilimitado (Empresa Activa)",
    activeTier: "Pase Activo",
    statsTitle: "Estadísticas de Uso de IA",
    interactiveCalls: "Computaciones Totales de IA"
  },
  hi: {
    title: "प्रोफ़ाइल सेटिंग्स",
    editTab: "प्रोफ़ाइल संपादित करें",
    passwordTab: "पासवर्ड बदलें",
    nameLabel: "पूरा नाम",
    usernameLabel: "यूज़रनेम",
    emailLabel: "ईमेल पता (केवल पढ़ने के लिए)",
    currentPasswordLabel: "वर्तमान पासवर्ड",
    newPasswordLabel: "नया पासवर्ड",
    confirmPasswordLabel: "नए पासवर्ड की पुष्टि करें",
    saveBtn: "फायदे बचाएं",
    updating: "अपडेट हो रहा है...",
    successProfileUpdate: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
    successPasswordUpdate: "पासवर्ड सफलतापूर्वक बदला गया!",
    passwordMismatch: "नए पासवर्ड मेल नहीं खाते हैं!",
    tierLabel: "सदस्यता स्तर",
    creditsLabel: "शेष क्रेडिट",
    unlimited: "असीमित (एंटरप्राइज सक्रिय)",
    activeTier: "सक्रिय पास",
    statsTitle: "आपका एआई उपयोग आंकड़े",
    interactiveCalls: "कुल एआई गणनाएं"
  },
  ja: {
    title: "プロフィール設定",
    editTab: "プロフィール編集",
    passwordTab: "パスワード変更",
    nameLabel: "氏名",
    usernameLabel: "ユーザー名",
    emailLabel: "メールアドレス（読み取り専用）",
    currentPasswordLabel: "現在のパスワード",
    newPasswordLabel: "新しいパスワード",
    confirmPasswordLabel: "新しいパスワードの確認",
    saveBtn: "変更を保存",
    updating: "更新中...",
    successProfileUpdate: "プロフィールが正常に更新されました！",
    successPasswordUpdate: "パスワードが正常に変更されました！",
    passwordMismatch: "新しいパスワードが一致しません！",
    tierLabel: "サブスクリプションプラン",
    creditsLabel: "残りクレジット",
    unlimited: "無制限（エンタープライズアクティブ）",
    activeTier: "有効なパス",
    statsTitle: "AI使用状況の統計",
    interactiveCalls: "総AI計算回数"
  }
};

export default function ProfileModal({
  lang,
  theme,
  userState,
  onClose,
  onUpdateSuccess,
  onLogout,
  playSynthSound,
  showToast
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);

  // Profile fields state
  const [name, setName] = useState(userState.name || '');
  const [username, setUsername] = useState(userState.username || '');
  const [college, setCollege] = useState(userState.college || 'Universal College of Commerce & Computer Applications');
  const [semester, setSemester] = useState(userState.semester || 'BCA Semester 3');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const t = LOCALIZED_PROFILE[lang] || LOCALIZED_PROFILE['en'];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    playSynthSound('click');

    if (!name.trim()) {
      showToast(lang === 'gu' ? 'પૂરું નામ જરૂરી છે!' : 'Full Name is required!', 'error');
      return;
    }
    if (!username.trim()) {
      showToast(lang === 'gu' ? 'વપરાશકર્તા નામ જરૂરી છે!' : 'Username is required!', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userState.id,
          name: name.trim(),
          username: username.trim(),
          college: college.trim(),
          semester: semester.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      showToast(t.successProfileUpdate, 'success');
      playSynthSound('success');
      onUpdateSuccess({ 
        name: data.user.name, 
        username: data.user.username,
        college: data.user.college,
        semester: data.user.semester
      });
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
      playSynthSound('laser');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    playSynthSound('click');

    if (!currentPassword) {
      showToast(lang === 'gu' ? 'વર્તમાન પાસવર્ડ લખો!' : 'Please enter your current password!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast(lang === 'gu' ? 'નવો પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ!' : 'New password must be at least 6 characters!', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t.passwordMismatch, 'error');
      playSynthSound('laser');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userState.id,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      showToast(t.successPasswordUpdate, 'success');
      playSynthSound('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
    } catch (err: any) {
      showToast(err.message || 'Error changing password', 'error');
      playSynthSound('laser');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 300 }}
        dragElastic={{ top: 0.1, bottom: 0.8 }}
        onDragEnd={(event, info) => {
          if (info.offset.y > 120) {
            playSynthSound('click');
            onClose();
          }
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-xl rounded-3xl border overflow-hidden relative ${
          theme === 'dark' ? 'bg-[#060a16] border-slate-900 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Mobile Swipe-down Grab Indicator (Visual Guide for Gestures) */}
        <div className="md:hidden w-full flex justify-center pt-3 select-none cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
        </div>
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-900 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-wider">{t.title}</h3>
              <p className="text-[10px] text-slate-500 font-bold">{userState.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              playSynthSound('click');
              onClose();
            }}
            className={`p-1.5 rounded-lg border transition ${
              theme === 'dark' ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left panel info & status */}
          <div className={`md:col-span-5 p-6 border-r flex flex-col justify-between ${theme === 'dark' ? 'border-slate-900 bg-slate-950/20' : 'border-slate-100 bg-slate-50/20'}`}>
            <div className="space-y-4 text-left">
              {/* Profile card view */}
              <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900/60' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                    {userState.name ? userState.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'DT'}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-extrabold truncate">{userState.name || 'Aarav Shah'}</h4>
                    <p className="text-[10px] text-slate-500 truncate">@{userState.username || 'aarav_demo'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-500/10 space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-500 uppercase">{t.tierLabel}:</span>
                    <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px] font-black ${
                      userState.tier === 'elite' 
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/10' 
                        : userState.tier === 'pro' 
                        ? 'bg-blue-500/15 text-blue-500 border border-blue-500/10' 
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {userState.tier === 'elite' ? 'ULTRA ELITE' : userState.tier === 'pro' ? 'PRO MEMBER' : 'FREE USER'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-slate-500 uppercase">{t.creditsLabel}:</span>
                    <span className="text-slate-300 font-mono">
                      {userState.credits > 10000 ? t.unlimited : `${userState.credits} Credits`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats and micro analytics inside modal */}
              <div className="space-y-2">
                <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block">{t.statsTitle}</span>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-950/40 border-slate-900' : 'bg-white border-slate-200'}`}>
                  <span className="text-[9px] font-bold text-slate-400">{t.interactiveCalls}</span>
                  <div className="flex items-center gap-1 font-mono text-xs font-black">
                    <History className="w-3.5 h-3.5 text-blue-500" />
                    <span>{userState.history.length}</span>
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      playSynthSound('laser');
                      onLogout();
                    }}
                    className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-[10px] font-black py-2.5 rounded-xl transition-all duration-150 uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{lang === 'gu' ? 'લોગ આઉટ કરો' : 'Log Out Account'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick tips notice */}
            <div className={`mt-6 p-3 rounded-xl border flex gap-2 items-start text-left ${
              theme === 'dark' ? 'bg-blue-950/10 border-blue-500/10' : 'bg-blue-50/40 border-blue-200/40'
            }`}>
              <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-slate-500 leading-normal font-medium">
                {lang === 'gu' 
                  ? "તમારી બધી સાધનોની પ્રગતિ આ સુરક્ષિત ખાતા સાથે સિન્ક થાય છે." 
                  : "All configurations, notebooks, analytics, and history are synchronized instantly."}
              </p>
            </div>
          </div>

          {/* Right form section */}
          <div className="md:col-span-7 p-6">
            {/* Tabs selector */}
            <div className={`flex p-1 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <button
                onClick={() => {
                  playSynthSound('toggle');
                  setActiveTab('profile');
                }}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {t.editTab}
              </button>
              <button
                onClick={() => {
                  playSynthSound('toggle');
                  setActiveTab('password');
                }}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === 'password'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-500 hover:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {t.passwordTab}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'profile' ? (
                <motion.form
                  key="edit-profile-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleUpdateProfile}
                  className="space-y-4"
                >
                  {/* Name field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t.nameLabel}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Username field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t.usernameLabel}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <AtSign className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* College Name field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-wider text-indigo-400">{lang === 'gu' ? 'કોલેજ નામ' : 'College Name'}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-indigo-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Semester / Academic Year field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-wider text-indigo-400">{lang === 'gu' ? 'સેમેસ્ટર / વર્ષ' : 'Semester & Course'}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                        <BookOpen className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-indigo-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Read-only Email Field */}
                  <div className="space-y-1.5 text-left opacity-75">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">{t.emailLabel}</label>
                    <input
                      type="text"
                      value={userState.email}
                      disabled
                      className={`w-full text-xs px-4 py-2.5 rounded-xl border outline-none font-semibold cursor-not-allowed ${
                        theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-150 border-slate-200 text-slate-400'
                      }`}
                    />
                  </div>

                  {/* Submit profile button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-black uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl transition shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 mt-6 cursor-pointer"
                  >
                    {loading ? (
                      <span>{t.updating}</span>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.saveBtn}</span>
                      </>
                    )}
                  </button>

                  {/* Offline Data Backup & Restore */}
                  <div className={`mt-6 pt-5 border-t ${theme === 'dark' ? 'border-slate-900/60' : 'border-slate-100'} space-y-3`}>
                    <div className="flex justify-between items-center text-left">
                      <span className="text-[9px] font-black tracking-wider uppercase text-slate-500">
                        {lang === 'gu' ? "ઓફલાઇન બેકઅપ અને ડેટા પુનઃસ્થાપિત" : "Offline Backup & Data Recovery"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-left">
                      {/* Export Button */}
                      <button
                        type="button"
                        onClick={() => {
                          playSynthSound('success');
                          const userData = localStorage.getItem('hub_user');
                          if (!userData) {
                            showToast(lang === 'gu' ? "નિકાસ કરવા માટે કોઈ ડેટા મળ્યો નથી!" : "No user data found to export!", 'error');
                            return;
                          }
                          const blob = new Blob([userData], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `ai-super-tools-backup-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          showToast(lang === 'gu' ? "બેકઅપ ફાઇલ ડાઉનલોડ થઈ ગઈ!" : "Backup downloaded successfully!", 'success');
                        }}
                        className={`py-2 px-3 text-[10px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                          theme === 'dark' 
                            ? 'bg-slate-950 border-slate-900 text-slate-300 hover:bg-slate-900' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5 text-blue-500" />
                        <span>{lang === 'gu' ? "નિકાસ (Export)" : "Export JSON"}</span>
                      </button>

                      {/* Import Button */}
                      <label
                        className={`py-2 px-3 text-[10px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-center ${
                          theme === 'dark' 
                            ? 'bg-slate-950 border-slate-900 text-slate-300 hover:bg-slate-900' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{lang === 'gu' ? "આયાત (Import)" : "Import JSON"}</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const json = JSON.parse(event.target?.result as string);
                                if (!json.id || !json.email) {
                                  throw new Error("Invalid backup format");
                                }
                                localStorage.setItem('hub_user', json.email ? JSON.stringify(json) : localStorage.getItem('hub_user') || '');
                                playSynthSound('success');
                                showToast(lang === 'gu' ? "ડેટા સફળતાપૂર્વક પુનઃસ્થાપિત થયો! પેજ રિલોડ કરો..." : "Data restored successfully! Reloading...", 'success');
                                setTimeout(() => {
                                  window.location.reload();
                                }, 1500);
                              } catch (err) {
                                showToast(lang === 'gu' ? "અમાન્ય બેકઅપ ફાઇલ!" : "Invalid or corrupted backup JSON!", 'error');
                              }
                            };
                            reader.readAsText(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="change-pass-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleChangePassword}
                  className="space-y-4"
                >
                  {/* Current Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t.currentPasswordLabel}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <Key className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t.newPasswordLabel}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <Key className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">{t.confirmPasswordLabel}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <Key className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold transition ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-900 text-slate-100 focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Submit password button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-black uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl transition shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 mt-6 cursor-pointer"
                  >
                    {loading ? (
                      <span>{t.updating}</span>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>{t.saveBtn}</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
