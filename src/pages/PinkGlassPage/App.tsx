import React, { useState, useEffect, useRef } from 'react';
import { Settings, User, LogOut } from 'lucide-react';
import { BACKGROUNDS } from './constants';
import { useGlobal } from './context/GlobalContext';
import SearchBar from './components/SearchBar';
import AppMenu from './components/AppMenu';
import BookmarkGrid from './components/BookmarkGrid';
import InfiniteBar from './components/InfiniteBar';
import BackgroundSwitcher from './components/BackgroundSwitcher';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import TopNav from './components/TopNav';
import Clock from './components/Clock';
import { getVideo } from './utils/db';
import { supabase } from './utils/supabaseClient';

const hexToRgb = (hex: string) => {
  let c: number;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    const parts = hex.substring(1).split('');
    const hexStr = parts.length === 3
      ? [parts[0], parts[0], parts[1], parts[1], parts[2], parts[2]].join('')
      : parts.join('');
    c = parseInt(hexStr, 16);
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',');
  }
  return '255,105,180';
};

const PinkGlassApp: React.FC = () => {
  const { settings, updateSettings, bgIndex, setBgIndex, user } = useGlobal();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    let blobUrl: string | null = null;
    if (settings.customVideo) {
      getVideo().then((blob) => {
        if (active && blob) {
          blobUrl = URL.createObjectURL(blob);
          setVideoUrl(blobUrl);
        } else if (active && !blob) {
          updateSettings({ customVideo: false });
        }
      }).catch(() => updateSettings({ customVideo: false }));
    } else {
      setVideoUrl(null);
    }
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [settings.customVideo, updateSettings]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const currentBgValue = settings.customBackground || BACKGROUNDS[bgIndex].value;
  const themeRgb = hexToRgb(settings.themeColor);

  return (
    <div className={`relative w-full h-screen overflow-hidden text-white selection:bg-[rgba(var(--theme-rgb),0.4)] selection:text-white ${settings.isAnimationEnabled ? '' : 'disable-animations'}`}>
      <style>{`
        :root {
          --glass-blur: ${settings.blurAmount}px;
          --theme-color: ${settings.themeColor};
          --theme-rgb: ${themeRgb};
        }
        .glass-panel {
          backdrop-filter: blur(var(--glass-blur)) !important;
          -webkit-backdrop-filter: blur(var(--glass-blur)) !important;
        }
        .theme-text { color: var(--theme-color); }
        .theme-text-accent { color: rgba(var(--theme-rgb), 0.8); }
        .theme-bg { background-color: var(--theme-color); }
        .theme-bg-accent { background-color: rgba(var(--theme-rgb), 0.3); }
        .theme-bg-glass { background-color: rgba(var(--theme-rgb), 0.15); }
        .theme-border { border-color: rgba(var(--theme-rgb), 0.25); }
        .theme-hover:hover { background-color: rgba(var(--theme-rgb), 0.2); }
        @keyframes gradient-xy {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-slow {
          background-size: 400% 400%;
          animation: gradient-xy 20s ease infinite;
        }
        .glass-input {
          background: rgba(0, 0, 0, 0.2) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(var(--theme-rgb), 0.3) !important;
        }
        .glass-input::placeholder { color: rgba(var(--theme-rgb), 0.6) !important; }
        ${!settings.isAnimationEnabled ? `*, *::before, *::after { animation: none !important; transition: none !important; }` : ''}
      `}</style>

      <div className="absolute inset-0 overflow-hidden z-0 bg-[#000]">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`}
          src={videoUrl || ''}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`} />
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${videoUrl ? 'opacity-0' : 'opacity-100'}`}
          style={{ background: settings.customBackground ? `url(${settings.customBackground}) center/cover no-repeat` : currentBgValue }}
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none ${!settings.customBackground && settings.isAnimationEnabled ? 'animate-gradient-slow' : ''}`} />
        </div>
      </div>

      <InfiniteBar language={settings.language} />

      <div className="relative z-10 w-full h-full flex flex-col pt-12">
        <Clock format={settings.timeFormat} />

        <header className="flex justify-end items-center p-4 pr-6 gap-2 mt-2">
          <TopNav language={settings.language} />
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
              <div className="w-6 h-6 rounded-full theme-bg flex items-center justify-center text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} title="Logout" className="text-white/70 hover:text-white transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="p-3 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors" title="Login">
              <User size={20} />
            </button>
          )}
          <AppMenu language={settings.language} />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center -mt-8 px-4 w-full">
          <div className="mb-8 animate-fade-in-down flex justify-center">
            <a href="https://reversex.vercel.app/" className="cursor-pointer block group" title="ReverseX">
              <img
                src="/pink-glass-start-page/logo%20br%20(1).png"
                alt="Logo"
                className="h-24 md:h-28 w-auto drop-shadow-[0_0_15px_rgba(var(--theme-rgb),0.4)] transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </a>
          </div>
          <SearchBar engine={settings.searchEngine} language={settings.language} />
          <div className="animate-fade-in-up w-full flex justify-center">
            <BookmarkGrid language={settings.language} />
          </div>
        </main>

        <footer className="p-8 flex justify-center animate-fade-in-up pb-12 relative">
          {!settings.lockBackground && !settings.customBackground && !settings.customVideo && (
            <BackgroundSwitcher currentIndex={bgIndex} onSwitch={setBgIndex} />
          )}
        </footer>
      </div>

      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-black/20 hover:bg-[rgba(var(--theme-rgb),0.4)] backdrop-blur-md text-white/70 hover:text-white transition-all duration-300 z-40 border border-white/5 hover:rotate-90"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {isAuthOpen && <AuthModal language={settings.language} onClose={() => setIsAuthOpen(false)} />}

      <style>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fadeInDown 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default PinkGlassApp;
