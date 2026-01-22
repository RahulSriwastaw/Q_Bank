import React from 'react';
import { useBoardStore } from './store';
import { Square, Circle, Triangle, Star, ArrowRight, Minus } from 'lucide-react';
import { Tool } from './types';

export const ShapeToolbar: React.FC = () => {
  const { tool, setTool } = useBoardStore();

  const shapes = [
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'star', icon: Star, label: 'Star' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'line', icon: Minus, label: 'Line' },
  ];

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-[#1e1e1e] border border-white/10 p-2 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-left-4 duration-300">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center py-1 mb-1 border-b border-white/5">
        Shapes
      </div>
      {shapes.map(s => (
        <button
          key={s.id}
          onClick={() => setTool(s.id as Tool)}
          className={`p-3 rounded-xl transition-all relative group ${tool === s.id ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          title={s.label}
        >
          <s.icon size={20} />
          
          {/* Tooltip */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-sm border border-white/10">
            {s.label}
          </div>
        </button>
      ))}
    </div>
  );
};
