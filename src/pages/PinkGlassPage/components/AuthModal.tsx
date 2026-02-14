import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { TRANSLATIONS } from '../constants';

interface AuthModalProps {
  language: 'en' | 'ru';
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ language, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel p-6 rounded-3xl shadow-2xl relative border border-white/10">
        <button 
           onClick={onClose}
           className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
        >
           <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.authTitle}</h2>

        <form onSubmit={handleAuth} className="space-y-4">
           {error && (
             <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg">
               {error}
             </div>
           )}

           <div>
             <label className="block text-sm font-medium text-white/70 mb-1">{t.email}</label>
             <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)]"
                  placeholder="name@example.com"
                />
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-white/70 mb-1">{t.password}</label>
             <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--theme-color)]"
                  placeholder="••••••••"
                />
             </div>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="w-full py-3 rounded-xl theme-bg text-white font-medium hover:brightness-110 shadow-lg flex items-center justify-center gap-2 mt-4"
           >
             {loading ? '...' : t.login} 
             {!loading && (isSignUp ? <UserPlus size={18}/> : <LogIn size={18}/>)}
           </button>
        </form>

        <div className="mt-4 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {isSignUp ? "Already have an account? Login" : "No account? Sign Up"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
