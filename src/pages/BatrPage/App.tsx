import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, User, LogOut, Cloud, CloudUpload, Upload, X, FileText, Image, Film, Music, Archive } from 'lucide-react';
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
import { WhiteWaveSvg, DarkWaveSvg, DotWavesSvg, CarbonSvg, CircuitSvg } from './components/SvgBackgrounds';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import SortableBookmark from './components/SortableBookmark';
import { Bookmark } from './types';

// Helper to convert hex to RGB
const hexToRgb = (hex: string) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){ c= [c[0], c[0], c[1], c[1], c[2], c[2]]; }
        c= '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255].join(',');
    }
    return '0,229,255'; // fallback cyan
};

// ─── WebGL Shader Background ─────────────────────────────────────────────────
const VERT_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SHADER = `
precision mediump float;
uniform float u_time;
uniform vec2  u_resolution;
uniform vec3  u_color;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(hash(i), hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p  = p * 2.0 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;

  float t = u_time * 0.18;

  // Flowing plasma
  vec2 q = vec2(fbm(uv + t * 0.3), fbm(uv + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(uv + 1.0*q + vec2(1.7, 9.2) + 0.15*t),
                fbm(uv + 1.0*q + vec2(8.3, 2.8) + 0.126*t));
  float f = fbm(uv + r);

  // Colour: dark bg with theme colour streaks
  vec3 dark  = vec3(0.04, 0.04, 0.10);
  vec3 mid   = u_color * 0.6;
  vec3 bright = u_color;

  vec3 col = mix(dark, mid, clamp(f*f*4.0, 0.0, 1.0));
  col = mix(col, bright, clamp(length(q), 0.0, 1.0));
  col = mix(col, dark, f*f*f*0.6);

  // Scanline shimmer
  float scan = sin(uv.y * 800.0 + t * 30.0) * 0.03;
  col += scan;

  // Vignette
  float vig = uv.x * (1.0-uv.x) * uv.y * (1.0-uv.y) * 16.0;
  col *= pow(vig, 0.25);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface WebGLBgProps { themeColor: string; enabled: boolean; }

const WebGLBackground: React.FC<WebGLBgProps> = ({ themeColor, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());

  const hexToVec3 = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1,3),16)/255;
    const g = parseInt(hex.slice(3,5),16)/255;
    const b = parseInt(hex.slice(5,7),16)/255;
    return [r, g, b];
  };

  const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) return;
    glRef.current = gl;

    const vert = compile(gl, gl.VERTEX_SHADER, VERT_SHADER);
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    progRef.current = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const t = (Date.now() - startRef.current) / 1000;
      gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), t);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), canvas.width, canvas.height);
      const [r, g, b] = hexToVec3(themeColor);
      gl.uniform3f(gl.getUniformLocation(prog, 'u_color'), r, g, b);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, themeColor]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
};

// ─── Drop Zone ────────────────────────────────────────────────────────────────
interface DroppedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image size={20} />;
  if (type.startsWith('video/')) return <Film size={20} />;
  if (type.startsWith('audio/')) return <Music size={20} />;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive size={20} />;
  return <FileText size={20} />;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
};

const DropZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const addFiles = (raw: FileList | null) => {
    if (!raw) return;
    const next: DroppedFile[] = Array.from(raw).map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    setFiles(prev => [...prev, ...next]);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
    setIsOpen(true);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f) URL.revokeObjectURL(f.url);
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <>
      {/* Full-page drop overlay */}
      <div
        className="fixed inset-0 z-50 pointer-events-none"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        style={{ pointerEvents: 'auto' }}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'rgba(0,229,255,0.08)',
              backdropFilter: 'blur(2px)',
              border: '3px dashed rgba(0,229,255,0.6)',
              zIndex: 60,
            }}
          >
            <div className="text-center" style={{ pointerEvents: 'none' }}>
              <Upload size={56} className="mx-auto mb-4" style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 20px #00e5ff)' }} />
              <p className="text-2xl font-bold" style={{ color: '#00e5ff', fontFamily: "'Space Grotesk', sans-serif", textShadow: '0 0 30px #00e5ff' }}>
                Drop files here
              </p>
              <p className="text-white/60 mt-2">Release to add files</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Drop Zone Button */}
      <button
        onClick={() => { setIsOpen(true); inputRef.current?.click(); }}
        className="fixed bottom-6 left-6 p-3 rounded-full backdrop-blur-md text-white/70 hover:text-white transition-all duration-300 z-40 border flex items-center gap-2"
        style={{
          background: 'rgba(0,229,255,0.15)',
          borderColor: 'rgba(0,229,255,0.25)',
          boxShadow: files.length ? '0 0 20px rgba(0,229,255,0.4)' : 'none',
        }}
        title="Drop Zone"
      >
        <Upload size={20} />
        {files.length > 0 && (
          <span className="text-xs font-bold rounded-full px-1.5 py-0.5"
            style={{ background: '#00e5ff', color: '#000' }}>
            {files.length}
          </span>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => { addFiles(e.target.files); setIsOpen(true); e.target.value = ''; }}
      />

      {/* Drop Zone Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 left-6 z-50 rounded-2xl overflow-hidden"
          style={{
            width: 320,
            maxHeight: 460,
            background: 'rgba(10,10,20,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,229,255,0.25)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,229,255,0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(0,229,255,0.15)' }}>
            <div className="flex items-center gap-2">
              <Upload size={18} style={{ color: '#00e5ff' }} />
              <span className="font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Drop Zone
              </span>
              {files.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(0,229,255,0.2)', color: '#00e5ff' }}>
                  {files.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drop area */}
          <div
            className="mx-4 mt-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            style={{
              height: 90,
              border: `2px dashed ${isDragging ? '#00e5ff' : 'rgba(0,229,255,0.3)'}`,
              background: isDragging ? 'rgba(0,229,255,0.1)' : 'rgba(0,229,255,0.05)',
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
          >
            <Upload size={24} style={{ color: '#00e5ff', opacity: 0.8 }} />
            <p className="text-sm text-white/60 mt-2">
              <span style={{ color: '#00e5ff', fontWeight: 600 }}>Click</span> or drag files here
            </p>
          </div>

          {/* File list */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: 240 }}>
            {files.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-4">No files yet</p>
            ) : (
              <div className="space-y-2">
                {files.map(f => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl group transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div style={{ color: '#00e5ff', flexShrink: 0 }}>{getFileIcon(f.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.name}</p>
                      <p className="text-xs text-white/40">{formatSize(f.size)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/') ? (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                          title="Open"
                          onClick={e => e.stopPropagation()}
                        >
                          <Upload size={14} />
                        </a>
                      ) : null}
                      <button
                        onClick={() => removeFile(f.id)}
                        className="p-1 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="px-4 pb-4">
              <button
                onClick={() => { files.forEach(f => URL.revokeObjectURL(f.url)); setFiles([]); }}
                className="w-full text-sm py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,60,60,0.1)', color: 'rgba(255,100,100,0.8)', border: '1px solid rgba(255,60,60,0.2)' }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ─── BATR Logo ────────────────────────────────────────────────────────────────
const BatrLogo: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Glow behind */}
      <div
        className="absolute inset-0 blur-3xl opacity-30 rounded-full"
        style={{ background: themeColor, transform: 'scale(1.6)' }}
      />
      <span
        className="relative tracking-widest font-black uppercase"
        style={{
          fontFamily: "'Space Grotesk', 'Orbitron', 'Inter', sans-serif",
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          letterSpacing: '0.25em',
          background: `linear-gradient(135deg, #fff 0%, ${themeColor} 50%, #fff 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 24px ${themeColor}99)`,
          textShadow: 'none',
        }}
      >
        batr
      </span>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const {
    settings, updateSettings, bgIndex, setBgIndex, user, isSyncing,
    topLinks, setTopLinks,
    bookmarks, setBookmarks
  } = useGlobal();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Bookmark | null>(null);

  // Auto-load Space Grotesk font
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Orbitron:wght@900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const findContainer = (id: string) => {
    if (topLinks.find(i => i.id === id)) return 'top-bar';
    if (bookmarks.find(i => i.id === id)) return 'center-grid';
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const item = topLinks.find(i => i.id === id) || bookmarks.find(i => i.id === id);
    if (item) setActiveItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;
    const activeContainer = findContainer(active.id as string);
    let overContainer = findContainer(overId as string);
    if (!overContainer) return;
    if (activeContainer && overContainer && activeContainer !== overContainer) {
        const activeItems = activeContainer === 'top-bar' ? topLinks : bookmarks;
        const overItems   = overContainer   === 'top-bar' ? topLinks : bookmarks;
        const activeIndex = activeItems.findIndex(i => i.id === active.id);
        const overIndex   = overItems.findIndex(i => i.id === overId);
        let newIndex = overIndex >= 0
          ? overIndex + (active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height ? 1 : 0)
          : overItems.length + 1;
        const itemToMove = activeItems[activeIndex];
        if (activeContainer === 'top-bar') {
            setTopLinks(topLinks.filter(i => i.id !== active.id));
            setBookmarks([...bookmarks.slice(0, newIndex), itemToMove, ...bookmarks.slice(newIndex)]);
        } else {
            setBookmarks(bookmarks.filter(i => i.id !== active.id));
            setTopLinks([...topLinks.slice(0, newIndex), itemToMove, ...topLinks.slice(newIndex)]);
        }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer   = over ? findContainer(over.id as string) : null;
    if (activeContainer && overContainer && activeContainer === overContainer && over && active.id !== over.id) {
        if (activeContainer === 'top-bar') {
            setTopLinks(arrayMove(topLinks, topLinks.findIndex(i => i.id === active.id), topLinks.findIndex(i => i.id === over.id)));
        } else {
            setBookmarks(arrayMove(bookmarks, bookmarks.findIndex(i => i.id === active.id), bookmarks.findIndex(i => i.id === over.id)));
        }
    }
    setActiveId(null);
    setActiveItem(null);
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })
  };

  useEffect(() => {
    let active = true;
    if (settings.customVideo) {
        getVideo().then(blob => {
            if (active && blob) setVideoUrl(URL.createObjectURL(blob));
            else if (active && !blob) updateSettings({ customVideo: false });
        }).catch(() => updateSettings({ customVideo: false }));
    } else {
        setVideoUrl(null);
    }
    return () => { active = false; if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, [settings.customVideo]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const currentBgValue = settings.customBackground || BACKGROUNDS[bgIndex].value;
  const currentSvgId   = !settings.customBackground && !settings.customVideo ? BACKGROUNDS[bgIndex].svgId : null;
  const themeRgb = hexToRgb(settings.themeColor);

  // Determine if we should use WebGL shader (only when no custom bg/video and a solid/gradient bg selected)
  const useWebGL = !settings.customBackground && !settings.customVideo && !currentSvgId && settings.isAnimationEnabled;

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
        <div className={`relative w-full h-screen overflow-hidden text-white selection:bg-[rgba(var(--theme-rgb),0.4)] selection:text-white ${settings.isAnimationEnabled ? '' : 'disable-animations'}`}>

        {/* Dynamic CSS Variables */}
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Orbitron:wght@900&display=swap');
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
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-30px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(30px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down { animation: fadeInDown 1s cubic-bezier(0.2,0.8,0.2,1) forwards; }
            .animate-fade-in-up   { animation: fadeInUp   1s cubic-bezier(0.2,0.8,0.2,1) forwards; }

            ${!settings.isAnimationEnabled ? `
                *, *::before, *::after { animation: none !important; transition: none !important; }
            ` : ''}
        `}</style>

        {/* Background Layer */}
        <div className="absolute inset-0 overflow-hidden z-0 bg-[#000]">
            {/* WebGL shader (only when applicable) */}
            {useWebGL && (
              <WebGLBackground themeColor={settings.themeColor} enabled={useWebGL} />
            )}

            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`}
              src={videoUrl || undefined}
              autoPlay muted loop playsInline
            />
            <div className={`absolute inset-0 bg-black/40 transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`} />
            <div
                className={`absolute inset-0 transition-opacity duration-1000 ${(videoUrl || useWebGL) ? 'opacity-0' : 'opacity-100'}`}
                style={{ background: settings.customBackground ? `url(${settings.customBackground}) center/cover no-repeat` : currentBgValue }}
            >
                {currentSvgId === 'white-wave' && <WhiteWaveSvg />}
                {currentSvgId === 'dark-wave'  && <DarkWaveSvg  />}
                {currentSvgId === 'dot-waves'  && <DotWavesSvg  />}
                {currentSvgId === 'carbon'     && <CarbonSvg    />}
                {currentSvgId === 'circuit'    && <CircuitSvg   />}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none ${!settings.customBackground && settings.isAnimationEnabled && !currentSvgId ? 'animate-gradient-slow' : ''}`} />
            </div>
        </div>

        {/* Fixed Infinite Bar */}
        <InfiniteBar language={settings.language} />

        {/* Main Content */}
        <div className="relative z-10 w-full h-full flex flex-col pt-12">
            <Clock format={settings.timeFormat} />

            <header className="flex justify-end items-center p-4 pr-6 gap-2 mt-2">
                <TopNav language={settings.language} />
                {user ? (
                    <div className="flex items-center gap-3">
                        <div className="text-white/50" title={isSyncing ? "Syncing..." : "Synced"}>
                            {isSyncing
                              ? <CloudUpload size={18} className="animate-pulse theme-text" />
                              : <Cloud size={18} />}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5 glass-panel">
                            <div className="w-6 h-6 rounded-full theme-bg flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <button onClick={handleLogout} title="Logout" className="text-white/70 hover:text-white transition-colors">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAuthOpen(true)} className="p-3 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors" title="Login">
                        <User size={20} />
                    </button>
                )}
                <AppMenu language={settings.language} />
            </header>

            <main className="flex-1 flex flex-col items-center justify-center -mt-8 px-4 w-full">
                {/* BATR Logo instead of image */}
                <div className="mb-8 animate-fade-in-down flex justify-center">
                    <BatrLogo themeColor={settings.themeColor} />
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

        {/* Settings Button */}
        <button
            onClick={() => setIsSettingsOpen(true)}
            className="fixed bottom-6 right-6 p-3 rounded-full bg-black/20 hover:bg-[rgba(var(--theme-rgb),0.4)] backdrop-blur-md text-white/70 hover:text-white transition-all duration-300 z-40 border border-white/5 hover:rotate-90"
            title="Settings"
        >
            <Settings size={20} />
        </button>

        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        {isAuthOpen     && <AuthModal language={settings.language} onClose={() => setIsAuthOpen(false)} />}

        {/* Drop Zone */}
        <DropZone />

        {/* DND Overlay */}
        <DragOverlay dropAnimation={dropAnimation}>
            {activeId && activeItem ? (
                <SortableBookmark
                    bookmark={activeItem}
                    variant={findContainer(activeId) === 'top-bar' ? 'pill' : 'card'}
                    onRemove={() => {}}
                    isOverlay
                />
            ) : null}
        </DragOverlay>
        </div>
    </DndContext>
  );
};

export default App;
