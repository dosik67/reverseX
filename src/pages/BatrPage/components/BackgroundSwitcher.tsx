import React from 'react';
import { ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { BACKGROUNDS } from '../constants';

interface BackgroundSwitcherProps {
  currentIndex: number;
  onSwitch: (newIndex: number) => void;
}

const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({ currentIndex, onSwitch }) => {
  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? BACKGROUNDS.length - 1 : currentIndex - 1;
    onSwitch(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === BACKGROUNDS.length - 1 ? 0 : currentIndex + 1;
    onSwitch(newIndex);
  };

  return (
    <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-3 rounded-full shadow-xl glass-panel transition-all duration-300 hover:bg-black/50">
      <button 
        onClick={handlePrev}
        className="p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white"
        title="Previous Theme"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="flex flex-col items-center px-4 min-w-[120px]">
        <span className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-2 drop-shadow-md">
            <Palette size={14} className="text-white/80" />
            {BACKGROUNDS[currentIndex].name}
        </span>
      </div>

      <button 
        onClick={handleNext}
        className="p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all text-white"
        title="Next Theme"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default BackgroundSwitcher;