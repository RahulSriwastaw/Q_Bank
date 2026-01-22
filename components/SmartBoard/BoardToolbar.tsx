import React, { useState } from 'react';
import { 
  MousePointer2, Pen, Eraser, Undo2, Redo2, 
  Trash2, ChevronLeft, ChevronRight, Highlighter, 
  Minus, Square, Circle, Type, Zap,
  Triangle, Star, ArrowRight, Download
} from 'lucide-react';
import { useBoardStore } from './store';
import { Tool } from './types';

interface BoardToolbarProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
}

export const BoardToolbar: React.FC<BoardToolbarProps> = ({
  currentSlide,
  totalSlides,
  onPrev,
  onNext
}) => {
  const { tool, setTool, color, setColor, size, setSize, undo, redo, clear, history, redoStack } = useBoardStore();
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
    '#84cc16', '#10b981', '#06b6d4', '#3b82f6', 
    '#6366f1', '#8b5cf6', '#ec4899', '#000000'
  ];

  const mainTools = [
    { id: 'cursor', icon: MousePointer2, label: 'Select' },
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlight' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  const shapes = [
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'star', icon: Star, label: 'Star' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  ];

  const isShapeTool = ['line', 'rectangle', 'circle', 'triangle', 'star', 'arrow'].includes(tool);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50 pointer-events-auto">
      
      {/* Settings Popover */}
      {(tool === 'pen' || tool === 'highlighter' || isShapeTool) && showColorPicker && (
        <div className="bg-[#1e1e1e] border border-white/10 p-4 rounded-xl shadow-2xl mb-2 w-64">
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Color</div>
              <div className="grid grid-cols-6 gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stroke</div>
                 <div className="text-xs font-mono text-slate-400">{size}px</div>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="flex items-center gap-1 bg-[#1e1e1e] border border-white/10 p-2 rounded-2xl shadow-2xl">
        
        {/* Navigation */}
        <div className="flex items-center gap-1 bg-black/20 rounded-xl px-1 mr-2">
          <button onClick={onPrev} disabled={currentSlide === 0} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="font-mono text-xs font-bold text-slate-400 min-w-[3rem] text-center">
            {currentSlide + 1} / {totalSlides}
          </span>
          <button onClick={onNext} disabled={currentSlide === totalSlides - 1} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Core Tools */}
        {mainTools.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTool(t.id as Tool);
              if (t.id === 'pen' || t.id === 'highlighter') setShowColorPicker(prev => tool === t.id ? !prev : true);
              else setShowColorPicker(false);
            }}
            className={`p-2.5 rounded-xl transition-all relative ${tool === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title={t.label}
          >
            <t.icon size={20} />
            {(t.id === 'pen' || t.id === 'highlighter') && tool === t.id && (
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-black/20" style={{ backgroundColor: color }} />
            )}
          </button>
        ))}

        {/* Shapes Menu */}
        <div className="relative group">
           <button 
             className={`p-2.5 rounded-xl transition-all ${isShapeTool ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             onClick={() => setShowColorPicker(true)}
           >
              {tool === 'rectangle' ? <Square size={20} /> : 
               tool === 'circle' ? <Circle size={20} /> : 
               tool === 'triangle' ? <Triangle size={20} /> :
               tool === 'star' ? <Star size={20} /> :
               tool === 'arrow' ? <ArrowRight size={20} /> :
               tool === 'line' ? <Minus size={20} /> :
               <Square size={20} />}
           </button>
           
           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1e1e1e] border border-white/10 rounded-xl p-1 hidden group-hover:flex flex-col gap-1 shadow-xl">
              {shapes.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setTool(s.id as Tool); setShowColorPicker(true); }}
                  className={`p-2 rounded-lg hover:bg-white/10 ${tool === s.id ? 'text-blue-400' : 'text-slate-400'}`}
                >
                  <s.icon size={18} />
                </button>
              ))}
           </div>
        </div>

        {/* Laser */}
        <button
          onClick={() => setTool('laser')}
          className={`p-2.5 rounded-xl transition-all ${tool === 'laser' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          title="Laser Pointer"
        >
          <Zap size={20} />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Actions */}
        <button onClick={undo} disabled={history.length === 0} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-30">
          <Undo2 size={20} />
        </button>
        <button onClick={redo} disabled={redoStack.length === 0} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-30">
          <Redo2 size={20} />
        </button>
        
        <button onClick={() => {}} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white">
            <Download size={20} />
        </button>

        <button onClick={clear} className="p-2.5 hover:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-400">
          <Trash2 size={20} />
        </button>

      </div>
    </div>
  );
};
