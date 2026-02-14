import React from 'react';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: React.ReactNode;
  initials?: string;
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

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

export interface AppSettings {
  blurAmount: number;
  isAnimationEnabled: boolean;
  timeFormat: '12h' | '24h';
  searchEngine: 'google' | 'yandex' | 'bing' | 'duckduckgo' | 'yahoo';
  lockBackground: boolean;
  customBackground: string | null;
  customVideo: boolean;
  themeColor: string;
  language: 'en' | 'ru';
}
