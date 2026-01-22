import React, { useState } from 'react';
import { 
  MousePointer2, Pen, Eraser, Undo2, Redo2, 
  Trash2, ChevronLeft, ChevronRight, Highlighter, 
  Minus, Square, Circle, Type, Zap,
  Triangle, Star, ArrowRight, Download, Palette
} from 'lucide-react';
import { useBoardStore } from './store';
import { Tool } from './types';
import { ShapePropertiesPanel } from './ShapePropertiesPanel';
import { ShapeToolbar } from './ShapeToolbar';
import { StyleToolbar } from './StyleToolbar';

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
  const { tool, setTool, eraserMode, setEraserMode, color, setColor, size, setSize, eraserSize, setEraserSize, undo, redo, clear, history, redoStack } = useBoardStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEraserOptions, setShowEraserOptions] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);

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
    { id: 'text', icon: Type, label: 'Text Box' },
  ];

  const isShapeTool = ['line', 'rectangle', 'circle', 'triangle', 'star', 'arrow'].includes(tool);

  return (
    <>
      {/* Vertical Shape Toolbar */}
      {isShapeTool && <ShapeToolbar />}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50 pointer-events-auto">
        
        {/* Style Panel */}
        {showStylePanel && (
           <StyleToolbar />
        )}

        {/* Pen/Highlighter/Text Settings Popover */}
        {(tool === 'pen' || tool === 'highlighter' || tool === 'text') && showColorPicker && (
          <div className="bg-[#1e1e1e] border border-white/10 p-4 rounded-xl shadow-2xl mb-2 w-64 animate-in slide-in-from-bottom-2 fade-in duration-200">
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
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tool === 'text' ? 'Font Size' : 'Stroke'}</div>
                   <div className="text-xs font-mono text-slate-400">{size}px</div>
                </div>
                <input
                  type="range"
                  min={tool === 'text' ? "12" : "1"}
                  max={tool === 'text' ? "72" : "20"}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Shape Properties Panel */}
        {isShapeTool && showColorPicker && (
          <div className="mb-2">
            <ShapePropertiesPanel />
          </div>
        )}

        {/* Eraser Options Popover */}
        {tool === 'eraser' && showEraserOptions && (
          <div className="bg-[#1e1e1e] border border-white/10 p-2 rounded-xl shadow-2xl mb-2 flex flex-col gap-1 w-56 animate-in slide-in-from-bottom-2 fade-in duration-200">
             <button
               onClick={() => setEraserMode('partial')}
               className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-left ${eraserMode === 'partial' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             >
               Partial Eraser
             </button>
             
             {eraserMode === 'partial' && (
               <div className="px-2 py-2 border-t border-white/10 mt-1">
                  <div className="flex justify-between items-center mb-2">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Eraser Size</div>
                     <div className="text-xs font-mono text-slate-400">{eraserSize}px</div>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={eraserSize}
                    onChange={(e) => setEraserSize(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
               </div>
             )}

             <button
               onClick={() => setEraserMode('lasso')}
               className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-left ${eraserMode === 'lasso' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             >
               Lasso Eraser
             </button>
             <button
               onClick={() => { clear(); setShowEraserOptions(false); }}
               className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-left text-red-400 hover:bg-red-500/10 hover:text-red-300"
             >
               Clear All
             </button>
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
                if (t.id === 'pen' || t.id === 'highlighter') {
                  setShowColorPicker(prev => tool === t.id ? !prev : true);
                  setShowEraserOptions(false);
                } else if (t.id === 'eraser') {
                  setShowEraserOptions(prev => tool === t.id ? !prev : true);
                  setShowColorPicker(false);
                } else if (t.id === 'text') {
                  setShowColorPicker(prev => tool === t.id ? !prev : true);
                  setShowEraserOptions(false);
                } else {
                  setShowColorPicker(false);
                  setShowEraserOptions(false);
                }
              }}
              className={`p-2.5 rounded-xl transition-all relative ${tool === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title={t.label}
            >
              <t.icon size={20} />
              {(t.id === 'pen' || t.id === 'highlighter' || t.id === 'text') && tool === t.id && (
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-black/20" style={{ backgroundColor: color }} />
              )}
            </button>
          ))}

          {/* Shapes Menu */}
          <button 
             className={`p-2.5 rounded-xl transition-all ${isShapeTool ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             onClick={() => {
                if (!isShapeTool) setTool('rectangle');
                setShowColorPicker(prev => isShapeTool ? !prev : true);
                setShowEraserOptions(false);
             }}
             title="Shapes"
          >
              {tool === 'rectangle' ? <Square size={20} /> : 
               tool === 'circle' ? <Circle size={20} /> : 
               tool === 'triangle' ? <Triangle size={20} /> :
               tool === 'star' ? <Star size={20} /> :
               tool === 'arrow' ? <ArrowRight size={20} /> :
               tool === 'line' ? <Minus size={20} /> :
               <Square size={20} />}
          </button>

          {/* Laser */}
          <button
            onClick={() => setTool('laser')}
            className={`p-2.5 rounded-xl transition-all ${tool === 'laser' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Laser Pointer"
          >
            <Zap size={20} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Style Settings */}
          <button
            onClick={() => {
                setShowStylePanel(!showStylePanel);
                setShowColorPicker(false);
                setShowEraserOptions(false);
            }}
            className={`p-2.5 rounded-xl transition-all ${showStylePanel ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Board & Card Settings"
          >
            <Palette size={20} />
          </button>

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
    </>
  );
};
