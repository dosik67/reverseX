import React from 'react';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: React.ReactNode; 
  initials?: string;
  customIconUrl?: string;
}

export interface AppItem {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
}

export interface BackgroundTheme {
  name: string;
  value: string;
  textColor: string;
}

export interface AppSettings {
  blurAmount: number;
  isAnimationEnabled: boolean;
  timeFormat: '12h' | '24h';
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'yahoo';
  lockBackground: boolean;
  customBackground: string | null;
  customVideo: boolean;
  themeColor: string;
  language: 'en' | 'ru';
}
