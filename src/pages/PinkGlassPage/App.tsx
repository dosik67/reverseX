import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { BACKGROUNDS, DEFAULT_SETTINGS } from './constants';
import { AppSettings } from './types';
import SearchBar from './components/SearchBar';
import AppMenu from './components/AppMenu';
import BookmarkGrid from './components/BookmarkGrid';
import InfiniteBar from './components/InfiniteBar';
import BackgroundSwitcher from './components/BackgroundSwitcher';
import SettingsModal from './components/SettingsModal';
import TopNav from './components/TopNav';
import Clock from './components/Clock';
import { getVideo } from './utils/db';

const hexToRgb = (hex: string) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255].join(',');
    }
    return '255,105,180';
}

const PinkGlassApp: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem('pink_glass_settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [bgIndex, setBgIndex] = useState(() => {
    const saved = localStorage.getItem('pink_glass_bg_index');
    return saved ? parseInt(saved) : 0;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    localStorage.setItem('pink_glass_bg_index', bgIndex.toString());
  }, [bgIndex]);

  useEffect(() => {
    localStorage.setItem('pink_glass_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let active = true;
    if (settings.customVideo) {
        getVideo().then((blob) => {
            if (active && blob) {
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
            } else if (active && !blob) {
                updateSettings({ customVideo: false });
            }
        }).catch(err => {
            console.error("Failed to load video", err);
            updateSettings({ customVideo: false });
        });
    } else {
        setVideoUrl(null);
    }
    
    return () => {
        active = false;
        if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [settings.customVideo]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log("Auto-play blocked", e));
    }
  }, [videoUrl]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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
        .theme-ring-focus { border-color: var(--theme-color) !important; }
        
        @keyframes gradient-xy {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-slow {
            background-size: 400% 400%;
            animation: gradient-xy 20s ease infinite;
        }

        ${!settings.isAnimationEnabled ? `
            *, *::before, *::after {
                animation: none !important;
                transition: none !important;
            }
        ` : ''}
      `}</style>

      <div className="absolute inset-0 overflow-hidden z-0 bg-[#000]">
        
        <video 
           ref={videoRef}
           className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${videoUrl ? 'opacity-100' : 'opacity-0'}`}
           src={videoUrl || ''}
           autoPlay
           muted
           loop
           playsInline
        />
        
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`} />

        <div 
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${videoUrl ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
                background: settings.customBackground ? `url(${settings.customBackground}) center/cover no-repeat` : currentBgValue 
            }}
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
            <AppMenu language={settings.language} />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center -mt-8 px-4 w-full">
          <div className="mb-12 animate-fade-in-down flex justify-center">
             <a 
               href="https://reversex.vercel.app/" 
               className="cursor-pointer block group"
               title="ReverseX"
             >
                 <img 
                   src="./logo%20br%20(1).png" 
                   alt="Logo" 
                   className="h-40 md:h-52 w-auto drop-shadow-[0_0_20px_rgba(var(--theme-rgb),0.5)] transition-transform duration-500 group-hover:scale-110"
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
              <BackgroundSwitcher 
                currentIndex={bgIndex}
                onSwitch={setBgIndex}
              />
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

      {isSettingsOpen && (
        <SettingsModal 
            settings={settings} 
            updateSettings={updateSettings} 
            onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default PinkGlassApp;
