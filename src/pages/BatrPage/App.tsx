import React, { useState, useEffect, useRef } from 'react';
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

const hexToRgb = (hex: string) => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
    c = '0x' + c.join('');
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',');
  }
  return '0,229,255';
};

// ─── WebGL Shader (upgraded: dual plasma + star field + mouse ripple) ─────────
const VERT_SHADER = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG_SHADER = `
precision highp float;
uniform float u_time;
uniform vec2  u_resolution;
uniform vec3  u_color;
uniform vec2  u_mouse;

float hash21(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }

float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}

float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<7;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=0.48;}
  return v;
}

// Star field
float stars(vec2 uv, float density){
  vec2 g=floor(uv*density);
  float h=hash21(g);
  vec2 offset=vec2(hash21(g+0.1),hash21(g+0.2))-0.5;
  float d=length(fract(uv*density)-0.5+offset);
  float twinkle=0.5+0.5*sin(u_time*2.0+h*6.28);
  return smoothstep(0.05,0.0,d)*twinkle*h;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;
  float t = u_time * 0.15;

  // Mouse ripple
  vec2 mp = u_mouse / u_resolution;
  mp.y = 1.0 - mp.y;
  float ripple = sin(length(uv - mp) * 30.0 - u_time * 4.0) * 0.5 + 0.5;
  ripple *= exp(-length(uv - mp) * 5.0) * 0.08;

  // Dual plasma layers
  vec2 q = vec2(fbm(uv + t*0.4 + vec2(0.0,0.0)), fbm(uv + vec2(5.2,1.3) + t*0.3));
  vec2 r = vec2(fbm(uv + q + vec2(1.7,9.2) + 0.15*t), fbm(uv + q + vec2(8.3,2.8) + 0.126*t));
  float f = fbm(uv + r + ripple);

  // Secondary swirl
  vec2 q2 = vec2(fbm(uv*1.5 - t*0.25), fbm(uv*1.5 + vec2(3.1,7.4)));
  float f2 = fbm(uv + q2*0.6);

  // Colour mapping
  vec3 dark   = vec3(0.02, 0.02, 0.08);
  vec3 deep   = u_color * 0.25;
  vec3 mid    = u_color * 0.65;
  vec3 bright = u_color + 0.15;

  vec3 col = mix(dark, deep, clamp(f*2.5,0.0,1.0));
  col = mix(col, mid,    clamp(f*f*3.5,0.0,1.0));
  col = mix(col, bright, clamp(length(q)*0.7,0.0,1.0));
  col = mix(col, dark,   f*f*f*0.7);
  col += u_color * f2 * 0.12;

  // Mouse glow
  col += u_color * ripple * 1.5;

  // Star field on top
  col += stars(uv, 60.0) * 0.9;
  col += stars(uv + 0.3, 120.0) * 0.5;
  col += stars(uv + 0.7, 200.0) * 0.3;

  // Scanlines
  float scan = sin(gl_FragCoord.y * 4.0) * 0.012;
  col += scan;

  // Vignette
  float vig = uv.x*(1.0-uv.x)*uv.y*(1.0-uv.y)*18.0;
  col *= pow(vig, 0.2);
  col = clamp(col,0.0,1.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

interface WebGLBgProps { themeColor: string; enabled: boolean; }

const WebGLBackground: React.FC<WebGLBgProps> = ({ themeColor, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());
  const mouseRef = useRef<[number, number]>([0, 0]);

  const hexToVec3 = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SHADER));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_resolution');
    const uCol  = gl.getUniformLocation(prog, 'u_color');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => { mouseRef.current = [e.clientX, e.clientY]; };
    window.addEventListener('mousemove', onMouse);

    const loop = () => {
      const t = (Date.now() - startRef.current) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      const [r, g, b] = hexToVec3(themeColor);
      gl.uniform3f(uCol, r, g, b);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [enabled, themeColor]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: 'block' }}
    />
  );
};

// ─── Floating Particles ───────────────────────────────────────────────────────
const FloatingParticles: React.FC<{ themeColor: string; enabled: boolean }> = ({ themeColor, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const hexToRgba = (hex: string, a: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; life: number; maxLife: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      r: Math.random() * 2.5 + 0.5,
      alpha: 0,
      life: Math.random() * 300,
      maxLife: 300 + Math.random() * 200,
    }));

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.vx = (Math.random() - 0.5) * 0.4;
          p.vy = -Math.random() * 0.6 - 0.2;
          p.r = Math.random() * 2.5 + 0.5;
          p.maxLife = 300 + Math.random() * 200;
        }
        p.x += p.vx;
        p.y += p.vy;
        const rel = p.life / p.maxLife;
        p.alpha = rel < 0.1 ? rel * 10 : rel > 0.85 ? (1 - rel) / 0.15 : 1;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grad.addColorStop(0, hexToRgba(themeColor, p.alpha * 0.9));
        grad.addColorStop(1, hexToRgba(themeColor, 0));
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
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
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

// ─── Drop Zone ────────────────────────────────────────────────────────────────
interface DroppedFile { id: string; name: string; size: number; type: string; url: string; }

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image size={18} />;
  if (type.startsWith('video/')) return <Film size={18} />;
  if (type.startsWith('audio/')) return <Music size={18} />;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive size={18} />;
  return <FileText size={18} />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const DropZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const addFiles = (raw: FileList | null) => {
    if (!raw) return;
    setFiles(prev => [...prev, ...Array.from(raw).map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name, size: f.size, type: f.type,
      url: URL.createObjectURL(f),
    }))]);
  };

  // Listen for drag events on document — but NEVER block pointer events otherwise
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragCounter.current++;
      setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      dragCounter.current--;
      if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      addFiles(e.dataTransfer?.files ?? null);
      setIsOpen(true);
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f) URL.revokeObjectURL(f.url);
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <>
      {/* Drag overlay — pointer-events-none always, only shows visual */}
      {isDragging && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(0,229,255,0.07)',
            backdropFilter: 'blur(3px)',
            border: '3px dashed rgba(0,229,255,0.55)',
          }}
        >
          <div className="text-center">
            <div style={{ animation: 'bounceUp 0.8s ease infinite alternate' }}>
              <Upload size={60} className="mx-auto mb-4" style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 24px #00e5ff)' }} />
            </div>
            <p className="text-3xl font-black tracking-widest" style={{
              color: '#00e5ff',
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 0 40px #00e5ff, 0 0 80px #00e5ff55',
            }}>
              DROP FILES
            </p>
            <p className="text-white/50 mt-2 text-sm">Release to add files</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        id="drop-zone-btn"
        onClick={() => { setIsOpen(v => !v); }}
        className="fixed bottom-6 left-6 p-3 rounded-2xl backdrop-blur-md text-white/80 hover:text-white transition-all duration-300 z-40 border flex items-center gap-2 group"
        style={{
          background: 'rgba(0,229,255,0.12)',
          borderColor: 'rgba(0,229,255,0.30)',
          boxShadow: files.length
            ? '0 0 25px rgba(0,229,255,0.45), 0 0 50px rgba(0,229,255,0.15)'
            : '0 4px 20px rgba(0,0,0,0.4)',
        }}
        title="Drop Zone"
      >
        <Upload size={18} style={{ transition: 'transform 0.3s' }} />
        <span className="text-xs font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Drop Zone</span>
        {files.length > 0 && (
          <span className="text-xs font-black rounded-full w-5 h-5 flex items-center justify-center"
            style={{ background: '#00e5ff', color: '#000' }}>
            {files.length}
          </span>
        )}
      </button>

      {/* Hidden input */}
      <input ref={inputRef} type="file" multiple className="hidden"
        onChange={e => { addFiles(e.target.files); setIsOpen(true); e.target.value = ''; }} />

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 left-6 z-50 rounded-2xl overflow-hidden"
          style={{
            width: 330,
            maxHeight: 480,
            background: 'rgba(6,6,18,0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0,229,255,0.22)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 50px rgba(0,229,255,0.12)',
            animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(0,229,255,0.12)' }}>
            <div className="flex items-center gap-2.5">
              <Upload size={16} style={{ color: '#00e5ff' }} />
              <span className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.05em' }}>
                Drop Zone
              </span>
              {files.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(0,229,255,0.18)', color: '#00e5ff' }}>
                  {files.length}
                </span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/8">
              <X size={15} />
            </button>
          </div>

          {/* Drop area inside panel */}
          <div
            className="mx-4 mt-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            style={{
              height: 80,
              border: `2px dashed rgba(0,229,255,0.35)`,
              background: 'rgba(0,229,255,0.04)',
            }}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={20} style={{ color: '#00e5ff', opacity: 0.7 }} />
            <p className="text-xs text-white/50 mt-1.5">
              <span style={{ color: '#00e5ff', fontWeight: 700 }}>Click</span> or drag files here
            </p>
          </div>

          {/* File list */}
          <div className="p-4 overflow-y-auto" style={{ maxHeight: 250 }}>
            {files.length === 0 ? (
              <p className="text-center text-white/25 text-xs py-6">No files yet</p>
            ) : (
              <div className="space-y-1.5">
                {files.map(f => (
                  <div key={f.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl group transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div style={{ color: '#00e5ff', opacity: 0.8, flexShrink: 0 }}>{getFileIcon(f.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/90 truncate">{f.name}</p>
                      <p className="text-xs text-white/35">{formatSize(f.size)}</p>
                    </div>
                    <button onClick={() => removeFile(f.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="px-4 pb-4">
              <button
                onClick={() => { files.forEach(f => URL.revokeObjectURL(f.url)); setFiles([]); }}
                className="w-full text-xs py-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,50,50,0.08)', color: 'rgba(255,100,100,0.75)', border: '1px solid rgba(255,50,50,0.18)' }}
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

// ─── BATR Logo (animated glitch + glow) ──────────────────────────────────────
const BatrLogo: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const schedule = () => {
      const delay = 4000 + Math.random() * 6000;
      setTimeout(() => {
        setGlitch(true);
        setTimeout(() => { setGlitch(false); schedule(); }, 350);
      }, delay);
    };
    schedule();
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center select-none group cursor-default">
      {/* Outer ring pulse */}
      <div className="absolute rounded-full pointer-events-none"
        style={{
          width: '140%', height: '140%',
          border: `1px solid ${themeColor}33`,
          animation: 'ringPulse 3s ease-out infinite',
        }}
      />
      <div className="absolute rounded-full pointer-events-none"
        style={{
          width: '120%', height: '120%',
          border: `1px solid ${themeColor}22`,
          animation: 'ringPulse 3s ease-out 1s infinite',
        }}
      />

      {/* Glow blob */}
      <div className="absolute blur-3xl rounded-full pointer-events-none"
        style={{
          width: '120%', height: '200%',
          background: `radial-gradient(ellipse, ${themeColor}40 0%, transparent 70%)`,
          animation: 'glowPulse 4s ease-in-out infinite',
        }}
      />

      {/* Main text */}
      <span
        className="relative font-black uppercase tracking-widest"
        style={{
          fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
          fontSize: 'clamp(3.5rem, 9vw, 7rem)',
          letterSpacing: '0.3em',
          background: `linear-gradient(135deg, #ffffff 0%, ${themeColor} 40%, #ffffff 70%, ${themeColor} 100%)`,
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'shimmerText 4s linear infinite',
          filter: `drop-shadow(0 0 20px ${themeColor}bb) drop-shadow(0 0 60px ${themeColor}55)`,
          ...(glitch ? {
            textShadow: `4px 0 ${themeColor}, -4px 0 #ff0080`,
            transform: 'skewX(-2deg)',
          } : {}),
          transition: 'transform 0.05s',
        }}
      >
        batr
      </span>

      {/* Glitch copies */}
      {glitch && (
        <>
          <span className="absolute font-black uppercase tracking-widest pointer-events-none"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 'clamp(3.5rem, 9vw, 7rem)',
              letterSpacing: '0.3em',
              color: themeColor,
              opacity: 0.5,
              transform: 'translate(6px, -2px) skewX(3deg)',
              mixBlendMode: 'screen',
              clipPath: 'inset(20% 0 60% 0)',
            }}>batr</span>
          <span className="absolute font-black uppercase tracking-widest pointer-events-none"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 'clamp(3.5rem, 9vw, 7rem)',
              letterSpacing: '0.3em',
              color: '#ff0080',
              opacity: 0.4,
              transform: 'translate(-4px, 3px) skewX(-2deg)',
              mixBlendMode: 'screen',
              clipPath: 'inset(50% 0 20% 0)',
            }}>batr</span>
        </>
      )}

      {/* Subtitle */}
      <p className="mt-3 text-xs font-medium tracking-[0.45em] uppercase"
        style={{ color: `${themeColor}99`, fontFamily: "'Space Grotesk', sans-serif" }}>
        personal space
      </p>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { settings, updateSettings, bgIndex, setBgIndex, user, isSyncing, topLinks, setTopLinks, bookmarks, setBookmarks } = useGlobal();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Bookmark | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Orbitron:wght@700;900&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));

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
    const aC = findContainer(active.id as string);
    const oC = findContainer(overId as string);
    if (!oC || !aC || aC === oC) return;
    const aItems = aC === 'top-bar' ? topLinks : bookmarks;
    const oItems = oC === 'top-bar' ? topLinks : bookmarks;
    const aIdx = aItems.findIndex(i => i.id === active.id);
    const oIdx = oItems.findIndex(i => i.id === overId);
    const newIdx = oIdx >= 0
      ? oIdx + (active.rect.current.translated && active.rect.current.translated.top > over!.rect.top + over!.rect.height ? 1 : 0)
      : oItems.length + 1;
    const item = aItems[aIdx];
    if (aC === 'top-bar') {
      setTopLinks(topLinks.filter(i => i.id !== active.id));
      setBookmarks([...bookmarks.slice(0, newIdx), item, ...bookmarks.slice(newIdx)]);
    } else {
      setBookmarks(bookmarks.filter(i => i.id !== active.id));
      setTopLinks([...topLinks.slice(0, newIdx), item, ...topLinks.slice(newIdx)]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const aC = findContainer(active.id as string);
    const oC = over ? findContainer(over.id as string) : null;
    if (aC && oC && aC === oC && over && active.id !== over.id) {
      if (aC === 'top-bar') setTopLinks(arrayMove(topLinks, topLinks.findIndex(i => i.id === active.id), topLinks.findIndex(i => i.id === over.id)));
      else setBookmarks(arrayMove(bookmarks, bookmarks.findIndex(i => i.id === active.id), bookmarks.findIndex(i => i.id === over.id)));
    }
    setActiveId(null);
    setActiveItem(null);
  };

  const dropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) };

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
    return () => { active = false; };
  }, [settings.customVideo]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const currentBgValue = settings.customBackground || BACKGROUNDS[bgIndex].value;
  const currentSvgId = !settings.customBackground && !settings.customVideo ? BACKGROUNDS[bgIndex].svgId : null;
  const themeRgb = hexToRgb(settings.themeColor);
  const useWebGL = !settings.customBackground && !settings.customVideo && !currentSvgId && settings.isAnimationEnabled;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className={`relative w-full h-screen overflow-hidden text-white ${settings.isAnimationEnabled ? '' : 'disable-animations'}`}>

        {/* Global styles & keyframes */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Orbitron:wght@700;900&display=swap');
          :root {
            --glass-blur: ${settings.blurAmount}px;
            --theme-color: ${settings.themeColor};
            --theme-rgb: ${themeRgb};
          }
          ::selection { background: rgba(var(--theme-rgb),0.35); color: #fff; }
          .glass-panel { backdrop-filter: blur(var(--glass-blur)) !important; -webkit-backdrop-filter: blur(var(--glass-blur)) !important; }
          .theme-text { color: var(--theme-color); }
          .theme-text-accent { color: rgba(var(--theme-rgb),0.8); }
          .theme-bg { background-color: var(--theme-color); }
          .theme-bg-accent { background-color: rgba(var(--theme-rgb),0.3); }
          .theme-bg-glass { background-color: rgba(var(--theme-rgb),0.15); }
          .theme-border { border-color: rgba(var(--theme-rgb),0.25); }
          .theme-hover:hover { background-color: rgba(var(--theme-rgb),0.2); }

          @keyframes gradient-xy {
            0%,100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-slow { background-size:400% 400%; animation: gradient-xy 20s ease infinite; }

          /* Entry animations — staggered */
          @keyframes fadeSlideDown {
            from { opacity:0; transform: translateY(-40px) scale(0.95); }
            to   { opacity:1; transform: translateY(0)    scale(1); }
          }
          @keyframes fadeSlideUp {
            from { opacity:0; transform: translateY(40px) scale(0.95); }
            to   { opacity:1; transform: translateY(0)    scale(1); }
          }
          @keyframes fadeIn {
            from { opacity:0; }
            to   { opacity:1; }
          }
          .animate-fade-in-down { animation: fadeSlideDown 0.9s cubic-bezier(0.22,1,0.36,1) both; }
          .animate-fade-in-down-2 { animation: fadeSlideDown 0.9s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
          .animate-fade-in-up   { animation: fadeSlideUp   0.9s 0.3s  cubic-bezier(0.22,1,0.36,1) both; }
          .animate-fade-in      { animation: fadeIn         0.8s 0.1s  ease both; }

          /* Logo animations */
          @keyframes shimmerText {
            0%   { background-position: 0%   50%; }
            100% { background-position: 200% 50%; }
          }
          @keyframes glowPulse {
            0%,100% { opacity:0.5; transform: scale(1); }
            50%     { opacity:0.9; transform: scale(1.1); }
          }
          @keyframes ringPulse {
            0%   { transform: scale(0.9); opacity:0.8; }
            100% { transform: scale(1.5); opacity:0; }
          }

          /* Drop Zone slide-up */
          @keyframes slideUp {
            from { opacity:0; transform: translateY(16px) scale(0.97); }
            to   { opacity:1; transform: translateY(0)    scale(1); }
          }

          /* Drop overlay bounce */
          @keyframes bounceUp {
            from { transform: translateY(6px); }
            to   { transform: translateY(-6px); }
          }

          /* Infinite bar hover pulse */
          @keyframes subtlePulse {
            0%,100% { opacity: 0.7; }
            50%     { opacity: 1; }
          }

          ${!settings.isAnimationEnabled ? `*,*::before,*::after{animation:none!important;transition:none!important;}` : ''}
        `}</style>

        {/* ── Background ── */}
        <div className="absolute inset-0 overflow-hidden z-0 bg-[#030310]">
          {useWebGL && <WebGLBackground themeColor={settings.themeColor} enabled={useWebGL} />}
          {useWebGL && <FloatingParticles themeColor={settings.themeColor} enabled={settings.isAnimationEnabled} />}

          <video ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 pointer-events-none ${videoUrl ? 'opacity-100' : 'opacity-0'}`}
            src={videoUrl || undefined} autoPlay muted loop playsInline />
          <div className={`absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-1000 ${videoUrl ? 'opacity-100' : 'opacity-0'}`} />

          <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${(videoUrl || useWebGL) ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: settings.customBackground ? `url(${settings.customBackground}) center/cover no-repeat` : currentBgValue }}>
            {currentSvgId === 'white-wave' && <WhiteWaveSvg />}
            {currentSvgId === 'dark-wave'  && <DarkWaveSvg  />}
            {currentSvgId === 'dot-waves'  && <DotWavesSvg  />}
            {currentSvgId === 'carbon'     && <CarbonSvg    />}
            {currentSvgId === 'circuit'    && <CircuitSvg   />}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none ${!settings.customBackground && settings.isAnimationEnabled && !currentSvgId ? 'animate-gradient-slow' : ''}`} />
          </div>
        </div>

        {/* ── Infinite Bar ── */}
        <InfiniteBar language={settings.language} />

        {/* ── Main content ── */}
        <div className="relative z-10 w-full h-full flex flex-col pt-12">
          <div className="animate-fade-in">
            <Clock format={settings.timeFormat} />
          </div>

          <header className="flex justify-end items-center p-4 pr-6 gap-2 mt-2 animate-fade-in">
            <TopNav language={settings.language} />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-white/50" title={isSyncing ? 'Syncing…' : 'Synced'}>
                  {isSyncing ? <CloudUpload size={18} className="animate-pulse theme-text" /> : <Cloud size={18} />}
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
            <div className="mb-6 animate-fade-in-down flex justify-center">
              <BatrLogo themeColor={settings.themeColor} />
            </div>

            <div className="animate-fade-in-down-2 w-full flex justify-center">
              <SearchBar engine={settings.searchEngine} language={settings.language} />
            </div>

            <div className="animate-fade-in-up w-full flex justify-center">
              <BookmarkGrid language={settings.language} />
            </div>
          </main>

          <footer className="p-8 flex justify-center pb-12 relative animate-fade-in">
            {!settings.lockBackground && !settings.customBackground && !settings.customVideo && (
              <BackgroundSwitcher currentIndex={bgIndex} onSwitch={setBgIndex} />
            )}
          </footer>
        </div>

        {/* ── Settings button ── */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-black/20 hover:bg-[rgba(var(--theme-rgb),0.4)] backdrop-blur-md text-white/70 hover:text-white transition-all duration-300 z-40 border border-white/8 hover:rotate-90"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        {isAuthOpen     && <AuthModal language={settings.language} onClose={() => setIsAuthOpen(false)} />}

        {/* ── Drop Zone ── */}
        <DropZone />

        {/* ── DND overlay ── */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeId && activeItem ? (
            <SortableBookmark bookmark={activeItem}
              variant={findContainer(activeId) === 'top-bar' ? 'pill' : 'card'}
              onRemove={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default App;
