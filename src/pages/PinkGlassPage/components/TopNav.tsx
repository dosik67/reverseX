import React, { useState, useEffect } from 'react';
import { LogIn, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../utils/supabaseClient';
import { Profile } from '../types';
import AuthModal from './AuthModal';

interface TopNavProps {
  language: 'en' | 'ru';
  onOpenSettings: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ language, onOpenSettings }) => {
  const t = TRANSLATIONS[language];
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
  };

  return (
    <nav className="flex items-center gap-5 text-[13px] font-medium text-white/90 mr-4">
      <a href="https://mail.google.com" className="hover:underline hover:text-white transition-colors opacity-80 hover:opacity-100">{t.gmail}</a>
      <a href="https://www.google.com/imghp" className="hover:underline hover:text-white transition-colors opacity-80 hover:opacity-100">{t.images}</a>

      <div className="relative h-9 flex items-center">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 theme-border hover:scale-110 transition-transform active:scale-95 shadow-lg bg-white/5"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-pink-500 to-purple-500">
                  <User size={18} className="text-white" />
                </div>
              )}
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-12 right-0 w-56 rounded-2xl glass-panel p-2 shadow-2xl z-50 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b theme-border mb-1">
                    <p className="text-sm font-bold text-white truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setIsDropdownOpen(false); onOpenSettings(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 text-white/80 transition-colors text-xs"
                  >
                    <SettingsIcon size={16} /> {t.settings}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors text-xs"
                  >
                    <LogOut size={16} /> {t.logout}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full theme-bg text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg"
          >
            <LogIn size={16} />
            {t.login}
          </button>
        )}
      </div>

      {isAuthOpen && <AuthModal language={language} onClose={() => setIsAuthOpen(false)} />}
    </nav>
  );
};

export default TopNav;
