import React, { useRef } from 'react';
import { X, Upload, Zap, Eye, Clock, Monitor, Image, Globe, Palette, Film, Download, Database } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { TRANSLATIONS } from '../constants';
import { saveVideo, deleteVideo } from '../utils/db';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, importData, exportData } = useGlobal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[settings.language];

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const success = importData(event.target.result as string);
        if (success) alert(t.importSuccess);
        else alert(t.importError);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
         alert("Image is too large (max 2MB).");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ customBackground: reader.result as string, customVideo: false });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          await saveVideo(file);
          updateSettings({ customVideo: true, customBackground: null });
      } catch (err) {
          console.error("Video save failed", err);
          alert("Failed to save video.");
      }
  };

  const clearVideo = async () => {
      try {
          await deleteVideo();
          updateSettings({ customVideo: false });
      } catch (err) {
          console.error("Failed to delete video", err);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel p-6 rounded-3xl shadow-2xl relative">
        <div className="flex justify-between items-center mb-6 border-b theme-border pb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
             <div className="theme-bg-accent p-2 rounded-lg"><Monitor size={18}/></div>
             {t.settings}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {/* Data Management */}
            <section className="space-y-3">
              <h3 className="theme-text-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Database size={12}/> {t.dataManagement}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportData}
                  className="p-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 transition-colors flex flex-col items-center gap-2 text-center"
                >
                  <Download size={20} className="text-white/70" />
                  <span className="text-xs text-white/80">{t.downloadSettings}</span>
                </button>
                <button
                  onClick={() => jsonInputRef.current?.click()}
                  className="p-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/5 transition-colors flex flex-col items-center gap-2 text-center"
                >
                  <Upload size={20} className="text-white/70" />
                  <span className="text-xs text-white/80">{t.uploadSettings}</span>
                  <input type="file" accept=".json" ref={jsonInputRef} className="hidden" onChange={handleJsonImport}/>
                </button>
              </div>
            </section>

            {/* Appearance */}
            <section className="space-y-3 pt-4 border-t border-white/5">
                <h3 className="theme-text-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Image size={12}/> {t.appearance}
                </h3>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors">
                    <span className="text-white text-sm">{t.lockBackground}</span>
                    <div 
                        onClick={() => updateSettings({ lockBackground: !settings.lockBackground })}
                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.lockBackground ? 'theme-bg' : 'bg-white/20'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${settings.lockBackground ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </div>

                {/* Custom Image Wallpaper */}
                <div className="p-3 rounded-xl bg-black/20">
                    <span className="text-white text-sm block mb-2">{t.customWallpaper}</span>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-2 px-3 theme-bg-accent hover:bg-white/10 theme-text-accent rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all border theme-border"
                         >
                            <Upload size={14}/> {t.uploadImage}
                         </button>
                         {settings.customBackground && (
                             <button 
                                onClick={() => updateSettings({ customBackground: null })}
                                className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg text-xs transition-all border border-red-500/20"
                             >
                                {t.reset}
                             </button>
                         )}
                         <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                         />
                    </div>
                </div>

                {/* Custom Video Wallpaper */}
                <div className="p-3 rounded-xl bg-black/20">
                    <span className="text-white text-sm block mb-2">{t.customVideo}</span>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => videoInputRef.current?.click()}
                            className="flex-1 py-2 px-3 theme-bg-accent hover:bg-white/10 theme-text-accent rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all border theme-border"
                         >
                            <Film size={14}/> {t.uploadVideo}
                         </button>
                         {settings.customVideo && (
                             <button 
                                onClick={clearVideo}
                                className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg text-xs transition-all border border-red-500/20"
                             >
                                {t.reset}
                             </button>
                         )}
                         <input 
                            type="file" 
                            accept="video/*" 
                            ref={videoInputRef} 
                            className="hidden" 
                            onChange={handleVideoUpload}
                         />
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20">
                    <div className="flex justify-between mb-2">
                        <span className="text-white text-sm flex items-center gap-2"><Eye size={14} className="theme-text-accent"/> {t.glassBlur}</span>
                        <span className="text-white/50 text-xs">{settings.blurAmount}px</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        value={settings.blurAmount}
                        onChange={(e) => updateSettings({ blurAmount: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:theme-bg [&::-webkit-slider-thumb]:rounded-full"
                    />
                </div>
                
                {/* Theme Color Picker */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors">
                    <span className="text-white text-sm flex items-center gap-2"><Palette size={14} className="theme-text-accent"/> {t.themeColor}</span>
                    <input 
                        type="color" 
                        value={settings.themeColor} 
                        onChange={(e) => updateSettings({ themeColor: e.target.value })}
                        className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-none p-0"
                    />
                </div>
            </section>

             {/* Functionality */}
            <section className="space-y-3 pt-2 border-t border-white/5">
                <h3 className="theme-text-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Zap size={12}/> {t.functionality}
                </h3>
                
                {/* Language Selector */}
                <div className="p-3 rounded-xl bg-black/20">
                    <span className="text-white text-sm block mb-2 flex items-center gap-2"><Globe size={14} className="theme-text-accent"/> {t.language}</span>
                    <div className="flex bg-black/30 rounded-lg p-1">
                        <button 
                            onClick={() => updateSettings({ language: 'en' })}
                            className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${settings.language === 'en' ? 'theme-bg text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => updateSettings({ language: 'ru' })}
                            className={`flex-1 py-1 rounded-md text-xs font-medium transition-all ${settings.language === 'ru' ? 'theme-bg text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                        >
                            Русский
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors">
                    <span className="text-white text-sm">{t.animations}</span>
                    <div 
                        onClick={() => updateSettings({ isAnimationEnabled: !settings.isAnimationEnabled })}
                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.isAnimationEnabled ? 'theme-bg' : 'bg-white/20'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${settings.isAnimationEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20 flex justify-between items-center">
                    <span className="text-white text-sm flex items-center gap-2"><Clock size={14} className="theme-text-accent"/> {t.timeFormat}</span>
                    <div className="flex bg-black/30 rounded-lg p-1">
                        <button 
                            onClick={() => updateSettings({ timeFormat: '12h' })}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.timeFormat === '12h' ? 'theme-bg text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                        >
                            12h
                        </button>
                        <button 
                            onClick={() => updateSettings({ timeFormat: '24h' })}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.timeFormat === '24h' ? 'theme-bg text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                        >
                            24h
                        </button>
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20">
                    <span className="text-white text-sm block mb-2">{t.searchEngine}</span>
                    <select 
                        value={settings.searchEngine}
                        onChange={(e) => updateSettings({ searchEngine: e.target.value as any })}
                        className="w-full bg-black/30 text-white text-sm border border-white/10 rounded-lg p-2 focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                    >
                        <option value="google">Google</option>
                        <option value="bing">Bing</option>
                        <option value="duckduckgo">DuckDuckGo</option>
                        <option value="yahoo">Yahoo</option>
                    </select>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
