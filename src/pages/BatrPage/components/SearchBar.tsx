import React, { useState, useEffect, useRef } from 'react';
import { Search, History, X } from 'lucide-react';
import { SEARCH_ENGINES, TRANSLATIONS } from '../constants';

interface SearchBarProps {
  engine: keyof typeof SEARCH_ENGINES;
  language: 'en' | 'ru';
}

const SearchBar: React.FC<SearchBarProps> = ({ engine, language }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const t = TRANSLATIONS[language];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('batr_searchHistory');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch {}
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveHistory = (h: string[]) => {
    setHistory(h);
    localStorage.setItem('batr_searchHistory', JSON.stringify(h));
  };

  const addToHistory = (term: string) => {
    const next = [term, ...history.filter(h => h !== term)].slice(0, 8);
    saveHistory(next);
  };

  const removeFromHistory = (e: React.MouseEvent, term: string) => {
    e.preventDefault();
    e.stopPropagation();
    saveHistory(history.filter(h => h !== term));
  };

  const handleSearch = (e?: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const q = (term ?? query).trim();
    if (!q) return;
    addToHistory(q);
    window.location.href = `${SEARCH_ENGINES[engine] || SEARCH_ENGINES.google}${encodeURIComponent(q)}`;
  };

  const isOpen = isFocused && history.length > 0;

  return (
    <>
      {/* Overlay layer (like original search) */}
      {isFocused && (
        <div
          onMouseDown={() => setIsFocused(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 50,
          }}
        />
      )}

      <div ref={containerRef} className="w-full max-w-2xl px-4 relative" style={{ zIndex: 60 }}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none" style={{ zIndex: 1 }}>
            <Search size={20} style={{ color: 'rgba(var(--theme-rgb), 0.7)' }} />
          </div>

          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={t.searchPlaceholder}
            style={{
              width: '100%',
              paddingLeft: 52,
              paddingRight: 20,
              paddingTop: 16,
              paddingBottom: 16,
              fontSize: 16,
              color: '#fff',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid rgba(var(--theme-rgb), ${isFocused ? '0.5' : '0.2'})`,
              borderRadius: isOpen ? '24px 24px 0 0' : 24,
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: isFocused ? `0 0 20px rgba(var(--theme-rgb), 0.2)` : 'none',
            }}
          />
        </div>

        {/* History dropdown */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 16,
            right: 16,
            background: 'rgba(10,5,15,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid rgba(var(--theme-rgb), 0.3)`,
            borderTop: 'none',
            borderRadius: '0 0 20px 20px',
            overflow: 'hidden',
            zIndex: 70,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: idx < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(var(--theme-rgb), 0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => handleSearch(undefined, item)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
                  <History size={14} style={{ opacity: 0.5 }} />
                  <span>{item}</span>
                </div>
                {/* Delete button — explicit zIndex and mousedown */}
                <button
                  type="button"
                  onMouseDown={e => removeFromHistory(e, item)}
                  style={{
                    padding: '4px 6px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.15s, background 0.15s',
                    zIndex: 75,
                    position: 'relative',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  title="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
      </div>
    </>
  );
};

export default SearchBar;