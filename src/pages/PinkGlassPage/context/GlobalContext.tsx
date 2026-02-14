import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, Bookmark, AppItem } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_BOOKMARKS, INITIAL_FAVORITES, INITIAL_OTHERS, DEFAULT_TOP_LINKS, ALL_APPS } from '../constants';
import { supabase } from '../utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface GlobalState {
  settings: AppSettings;
  bookmarks: Bookmark[];
  topLinks: Bookmark[];
  favorites: AppItem[];
  others: AppItem[];
}

interface GlobalContextType extends GlobalState {
  setSettings: (settings: AppSettings) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setTopLinks: (links: Bookmark[]) => void;
  setFavorites: (favorites: AppItem[]) => void;
  setOthers: (others: AppItem[]) => void;
  importData: (jsonData: string) => boolean;
  exportData: () => void;
  user: User | null;
  bgIndex: number;
  setBgIndex: (index: number) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isSyncing: boolean;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const hydrateApps = (items: { id: string }[]): AppItem[] => {
  return items.map(savedItem => {
    const original = ALL_APPS.find(a => a.id === savedItem.id);
    return original || null;
  }).filter((item): item is AppItem => item !== null);
};

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('pink_glass_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('pink_glass_bookmarks');
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch { return DEFAULT_BOOKMARKS; }
  });

  const [topLinks, setTopLinks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('pink_glass_top_bar');
      return saved ? JSON.parse(saved) : DEFAULT_TOP_LINKS;
    } catch { return DEFAULT_TOP_LINKS; }
  });

  const [favorites, setFavorites] = useState<AppItem[]>(() => {
    try {
      const saved = localStorage.getItem('pink_glass_favorites');
      return saved ? hydrateApps(JSON.parse(saved)) : INITIAL_FAVORITES;
    } catch { return INITIAL_FAVORITES; }
  });

  const [others, setOthers] = useState<AppItem[]>(() => {
    try {
      const saved = localStorage.getItem('pink_glass_others');
      return saved ? hydrateApps(JSON.parse(saved)) : INITIAL_OTHERS;
    } catch { return INITIAL_OTHERS; }
  });

  const [bgIndex, setBgIndex] = useState(() => {
    const saved = localStorage.getItem('pink_glass_bg_index');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [user, setUser] = useState<User | null>(null);
  const [isSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('pink_glass_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pink_glass_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('pink_glass_top_bar', JSON.stringify(topLinks));
  }, [topLinks]);

  useEffect(() => {
    const replacer = (_key: string, value: unknown) => (typeof value === 'object' && value !== null && '$$typeof' in value ? undefined : value);
    localStorage.setItem('pink_glass_favorites', JSON.stringify(favorites, replacer));
  }, [favorites]);

  useEffect(() => {
    const replacer = (_key: string, value: unknown) => (typeof value === 'object' && value !== null && '$$typeof' in value ? undefined : value);
    localStorage.setItem('pink_glass_others', JSON.stringify(others, replacer));
  }, [others]);

  useEffect(() => {
    localStorage.setItem('pink_glass_bg_index', String(bgIndex));
  }, [bgIndex]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettingsState(prev => ({ ...prev, ...newSettings }));
  };

  const importData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.settings) setSettingsState(prev => ({ ...prev, ...data.settings }));
      if (Array.isArray(data.bookmarks)) setBookmarks(data.bookmarks);
      if (Array.isArray(data.topLinks)) setTopLinks(data.topLinks);
      if (Array.isArray(data.favorites)) setFavorites(hydrateApps(data.favorites));
      if (Array.isArray(data.others)) setOthers(hydrateApps(data.others));
      if (typeof data.bgIndex === 'number') setBgIndex(data.bgIndex);
      return true;
    } catch {
      return false;
    }
  };

  const exportData = () => {
    const replacer = (_key: string, value: unknown) => (typeof value === 'object' && value !== null && '$$typeof' in value ? undefined : value);
    const data = {
      settings,
      bookmarks,
      topLinks,
      favorites: favorites.map(({ id, name, url }) => ({ id, name, url })),
      others: others.map(({ id, name, url }) => ({ id, name, url })),
      bgIndex,
    };
    const blob = new Blob([JSON.stringify(data, replacer, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pink-glass-settings.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const value: GlobalContextType = {
    settings,
    bookmarks,
    topLinks,
    favorites,
    others,
    setSettings: setSettingsState,
    setBookmarks,
    setTopLinks,
    setFavorites,
    setOthers,
    importData,
    exportData,
    user,
    bgIndex,
    setBgIndex,
    updateSettings,
    isSyncing,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export function useGlobal(): GlobalContextType {
  const ctx = useContext(GlobalContext);
  if (ctx === undefined) throw new Error('useGlobal must be used within GlobalProvider');
  return ctx;
}
