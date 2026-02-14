import React, { useRef, useState, useEffect } from 'react';
import { X, Upload, Eye, Clock, Monitor, Image, Globe, Palette, Film, User, Camera, LogOut } from 'lucide-react';
import { AppSettings, Profile } from '../types';
import { TRANSLATIONS } from '../constants';
import { saveVideo, deleteVideo } from '../utils/db';
import { supabase } from '../utils/supabaseClient';

interface SettingsModalProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, updateSettings, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[settings.language];

  const [activeTab, setActiveTab] = useState<'appearance' | 'functionality' | 'profile'>('appearance');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
        } else {
          const newProfile = { id: user.id, full_name: (user.user_metadata as { full_name?: string })?.full_name || '', avatar_url: (user.user_metadata as { avatar_url?: string })?.avatar_url || '' };
          await supabase.from('profiles').upsert(newProfile);
          setProfile(newProfile);
          setFullName(newProfile.full_name);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setSavingProfile(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) {
      alert(uploadError.message);
      setSavingProfile(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
    if (updateError) alert(updateError.message);
    else setProfile({ ...profile, avatar_url: publicUrl });
    setSavingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    if (error) alert(error.message);
    else alert(settings.language === 'ru' ? 'Профиль обновлен' : 'Profile updated');
    setSavingProfile(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Image is too large (max 2MB)."); return; }
      const reader = new FileReader();
      reader.onloadend = () => updateSettings({ customBackground: reader.result as string, customVideo: false });
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
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl glass-panel flex flex-col h-[80vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-out">
        <div className="p-6 border-b theme-border flex justify-between items-center bg-white/5">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('appearance')} className={`text-sm font-semibold transition-all px-4 py-2 rounded-xl ${activeTab === 'appearance' ? 'theme-bg text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{t.appearance}</button>
            <button onClick={() => setActiveTab('functionality')} className={`text-sm font-semibold transition-all px-4 py-2 rounded-xl ${activeTab === 'functionality' ? 'theme-bg text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{t.functionality}</button>
            <button onClick={() => setActiveTab('profile')} className={`text-sm font-semibold transition-all px-4 py-2 rounded-xl ${activeTab === 'profile' ? 'theme-bg text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{t.profile}</button>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm font-medium">{t.lockBackground}</span>
                <div onClick={() => updateSettings({ lockBackground: !settings.lockBackground })} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.lockBackground ? 'theme-bg' : 'bg-white/10'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.lockBackground ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5">
                <span className="text-white text-sm font-semibold block mb-4">{t.customWallpaper}</span>
                <div className="flex gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 px-4 theme-bg-glass hover:bg-white/10 theme-text font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all border theme-border"><Upload size={18}/> {t.uploadImage}</button>
                  {settings.customBackground && <button onClick={() => updateSettings({ customBackground: null })} className="py-3 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-xl text-sm transition-all border border-red-500/20">{t.reset}</button>}
                  <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5">
                <span className="text-white text-sm font-semibold block mb-4">{t.customVideo}</span>
                <div className="flex gap-3">
                  <button onClick={() => videoInputRef.current?.click()} className="flex-1 py-3 px-4 theme-bg-glass hover:bg-white/10 theme-text font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all border theme-border"><Film size={18}/> {t.uploadVideo}</button>
                  {settings.customVideo && <button onClick={clearVideo} className="py-3 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-xl text-sm transition-all border border-red-500/20">{t.reset}</button>}
                  <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={handleVideoUpload} />
                </div>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5">
                <div className="flex justify-between mb-4">
                  <span className="text-white text-sm font-semibold flex items-center gap-2"><Eye size={18} className="theme-text-accent"/> {t.glassBlur}</span>
                  <span className="text-white/50 text-xs font-mono">{settings.blurAmount}px</span>
                </div>
                <input type="range" min="0" max="50" value={settings.blurAmount} onChange={(e) => updateSettings({ blurAmount: parseInt(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--theme-color)]" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm font-medium flex items-center gap-2"><Palette size={18} className="theme-text-accent"/> {t.themeColor}</span>
                <input type="color" value={settings.themeColor} onChange={(e) => updateSettings({ themeColor: e.target.value })} className="w-10 h-10 rounded-2xl cursor-pointer bg-transparent border-none p-0 overflow-hidden shadow-lg" />
              </div>
            </div>
          )}

          {activeTab === 'functionality' && (
            <div className="space-y-6">
              <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5">
                <span className="text-white text-sm font-semibold block mb-4 flex items-center gap-2"><Globe size={18} className="theme-text-accent"/> {t.language}</span>
                <div className="flex bg-black/40 rounded-2xl p-1.5 gap-1.5">
                  <button onClick={() => updateSettings({ language: 'en' })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${settings.language === 'en' ? 'theme-bg text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>English</button>
                  <button onClick={() => updateSettings({ language: 'ru' })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${settings.language === 'ru' ? 'theme-bg text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>Русский</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <span className="text-white text-sm font-medium">{t.animations}</span>
                <div onClick={() => updateSettings({ isAnimationEnabled: !settings.isAnimationEnabled })} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.isAnimationEnabled ? 'theme-bg' : 'bg-white/10'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.isAnimationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 flex justify-between items-center">
                <span className="text-white text-sm font-semibold flex items-center gap-2"><Clock size={18} className="theme-text-accent"/> {t.timeFormat}</span>
                <div className="flex bg-black/40 rounded-2xl p-1.5 gap-1.5">
                  <button onClick={() => updateSettings({ timeFormat: '12h' })} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${settings.timeFormat === '12h' ? 'theme-bg text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>12h</button>
                  <button onClick={() => updateSettings({ timeFormat: '24h' })} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${settings.timeFormat === '24h' ? 'theme-bg text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>24h</button>
                </div>
              </div>
              <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5">
                <span className="text-white text-sm font-semibold block mb-4">{t.searchEngine}</span>
                <select value={settings.searchEngine} onChange={(e) => updateSettings({ searchEngine: e.target.value as AppSettings['searchEngine'] })} className="w-full bg-black/40 text-white text-sm border border-white/10 rounded-2xl p-3.5 focus:outline-none focus:border-[var(--theme-color)] transition-all cursor-pointer">
                  <option value="google">Google</option>
                  <option value="yandex">Yandex</option>
                  <option value="bing">Bing</option>
                  <option value="duckduckgo">DuckDuckGo</option>
                  <option value="yahoo">Yahoo</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-8">
              {!profile ? (
                <div className="flex flex-col items-center justify-center h-48 text-white/50">
                  <User size={48} className="mb-4 opacity-20" />
                  <p className="text-sm">{settings.language === 'ru' ? 'Пожалуйста, войдите в аккаунт' : 'Please log in to view profile'}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 theme-border shadow-2xl relative bg-white/5">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} className="absolute inset-0 m-auto text-white/20" />}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={24} className="text-white" /></div>
                      </div>
                      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*,image/gif,image/webp" onChange={handleAvatarUpload} />
                      {savingProfile && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full animate-pulse"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-white mb-1">{profile.full_name || 'User'}</h4>
                      <p className="text-white/40 text-sm">Member since 2025</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold theme-text-accent uppercase tracking-widest pl-2">{t.fullName}</label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] p-4 text-white focus:outline-none focus:border-[var(--theme-color)] transition-all" placeholder="Your Name" />
                    </div>
                    <div className="flex gap-4">
                      <button onClick={handleSaveProfile} disabled={savingProfile} className="flex-1 py-4 theme-bg text-white font-bold rounded-[1.5rem] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">{t.save}</button>
                      <button onClick={handleLogout} className="px-6 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-[1.5rem] transition-all flex items-center gap-2 border border-red-500/20"><LogOut size={20} /> {t.logout}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
