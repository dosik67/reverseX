import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { TRANSLATIONS } from '../constants';

interface AuthModalProps {
  language: 'en' | 'ru';
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ language, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = TRANSLATIONS[language];

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) console.error('Google Auth Error:', error.message);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md glass-panel p-8 rounded-[2.5rem] shadow-2xl relative border border-white/10">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          {isSignUp ? (language === 'ru' ? 'Регистрация' : 'Sign Up') : (language === 'ru' ? 'Вход' : 'Log In')}
        </h2>
        <p className="text-white/50 text-center mb-8 text-sm">
          {language === 'ru' ? 'Добро пожаловать в Pink Glass' : 'Welcome to Pink Glass'}
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-3.5 rounded-2xl font-semibold mb-6 hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
        >
          <svg viewBox="0 0 48 48" className="w-5 h-5">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {t.signInWithGoogle}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-white/30 text-xs font-medium uppercase tracking-widest">{language === 'ru' ? 'ИЛИ' : 'OR'}</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-[var(--theme-color)] transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-[var(--theme-color)] transition-all"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl theme-bg text-white font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '...' : (isSignUp ? (language === 'ru' ? 'Создать аккаунт' : 'Create Account') : t.login)}
          </button>
        </form>

        <p className="mt-8 text-center text-white/50 text-sm">
          {isSignUp ? (language === 'ru' ? 'Уже есть аккаунт?' : 'Already have an account?') : (language === 'ru' ? 'Нет аккаунта?' : "Don't have an account?")}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="theme-text font-semibold hover:underline">
            {isSignUp ? t.login : (language === 'ru' ? 'Зарегистрироваться' : 'Sign Up')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
