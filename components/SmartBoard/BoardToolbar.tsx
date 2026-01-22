import React, { useState, useRef, useEffect } from 'react';
import { 
  MousePointer2, Pen, Eraser, Undo2, Redo2, 
  Trash2, ChevronLeft, ChevronRight, Highlighter, 
  Minus, Square, Circle, Type, Zap, Image as ImageIcon,
  Triangle, Star, ArrowRight, Download, Palette
} from 'lucide-react';
import { useBoardStore } from './store';
import { Tool } from './types';
import { ShapePropertiesPanel } from './ShapePropertiesPanel';
import { StyleToolbar } from './StyleToolbar';
import { LaserToolbar } from './LaserToolbar';

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
  const { tool, setTool, eraserMode, setEraserMode, color, setColor, size, setSize, eraserSize, setEraserSize, undo, redo, clear, history, redoStack, activePanel, setActivePanel } = useBoardStore();
  // Removed local state for visibility
  const panelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // We rely on store state now. 
  // If we need to close on outside click, we can still use this effect, or rely on BoardCanvas to close it.
  // Using BoardCanvas is safer for the "Canvas Click" requirement.
  // But we still need to close if clicking on valid HTML elements OUTSIDE the toolbar (e.g. some other UI overlay).
  // So let's keep this logic but update it to use store actions.

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const { activePanel, setActivePanel } = useBoardStore.getState();
      if (activePanel === 'none') return;

      const target = event.target as Node;
      
      const path = event.composedPath ? event.composedPath() : [];
      const isPanelClick = panelRef.current && path.includes(panelRef.current);
      const isBarClick = barRef.current && path.includes(barRef.current);
      
      const isPanelClickFallback = panelRef.current?.contains(target);
      const isBarClickFallback = barRef.current?.contains(target);

      if (!isPanelClick && !isBarClick && !isPanelClickFallback && !isBarClickFallback) {
        setActivePanel('none');
      }
    };

    document.addEventListener('pointerdown', handleClickOutside, true);
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);

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
    { id: 'image', icon: ImageIcon, label: 'Insert Image' },
  ];

  const isShapeTool = ['line', 'rectangle', 'circle', 'triangle', 'star', 'arrow'].includes(tool);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            const maxSize = 500;
            if (width > maxSize || height > maxSize) {
                const ratio = width / height;
                if (width > height) {
                    width = maxSize;
                    height = maxSize / ratio;
                } else {
                    height = maxSize;
                    width = maxSize * ratio;
                }
            }
            
            useBoardStore.getState().addStroke({
                id: crypto.randomUUID(),
                tool: 'image',
                points: [{ x: 100, y: 100 }],
                x: 100,
                y: 100,
                width: width,
                height: height,
                imageUrl: imageUrl,
                color: '#000000',
                size: 0,
                isComplete: true
            });
            useBoardStore.getState().setTool('cursor');
        };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*" 
      />
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50 pointer-events-auto">
        
        {/* Options Panels Container */}
        <div ref={panelRef} className="flex flex-col items-center gap-2 w-full">
            {/* Laser Toolbar */}
            {tool === 'laser' && activePanel === 'laser' && (
                <div className="mb-2">
                <LaserToolbar onClose={() => setActivePanel('none')} />
                </div>
            )}

            {/* Style Panel */}
            {activePanel === 'style' && (
            <StyleToolbar onClose={() => setActivePanel('none')} />
            )}

            {/* Pen/Highlighter/Text Settings Popover */}
            {(tool === 'pen' || tool === 'highlighter' || tool === 'text') && activePanel === 'pen_settings' && (
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
                    max={tool === 'text' ? "72" : (tool === 'highlighter' ? "50" : "20")}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {tool === 'highlighter' && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opacity</div>
                        <div className="text-xs font-mono text-slate-400">{Math.round((useBoardStore.getState().opacity || 0.5) * 100)}%</div>
                        </div>
                        <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={(useBoardStore.getState().opacity || 0.5) * 100}
                        onChange={(e) => useBoardStore.getState().setOpacity(Number(e.target.value) / 100)}
                        className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                )}
                </div>
            </div>
            )}

            {/* Shape Properties Panel */}
            {isShapeTool && activePanel === 'shape' && (
            <div className="mb-2">
                <ShapePropertiesPanel />
            </div>
            )}

            {/* Eraser Options Popover */}
            {tool === 'eraser' && activePanel === 'eraser_options' && (
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
                onClick={() => { clear(); setActivePanel('none'); }}
                className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-left text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                Clear All
                </button>
            </div>
            )}
        </div>

        {/* Main Bar */}
        <div ref={barRef} className="flex items-center gap-1 bg-[#1e1e1e] border border-white/10 p-2 rounded-2xl shadow-2xl overflow-x-auto max-w-[95vw] custom-scrollbar">
          
          {/* Navigation */}
          <div className="flex items-center gap-1 bg-black/20 rounded-xl px-1 mr-2 shrink-0">
            <button onClick={onPrev} disabled={currentSlide === 0} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            <span className="font-mono text-xs font-bold text-slate-400 min-w-[3rem] text-center hidden sm:block">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button onClick={onNext} disabled={currentSlide === totalSlides - 1} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

          {/* Core Tools */}
          {mainTools.map(t => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'image') {
                    fileInputRef.current?.click();
                    return;
                }

                setTool(t.id as Tool);
                setActivePanel('none'); // Reset active panel on tool switch
                
                if (t.id === 'pen') {
                  if (tool !== 'pen') setSize(4);
                  setActivePanel(tool === t.id && activePanel === 'pen_settings' ? 'none' : 'pen_settings');
                } else if (t.id === 'highlighter') {
                  if (tool !== 'highlighter') setSize(30);
                  setActivePanel(tool === t.id && activePanel === 'pen_settings' ? 'none' : 'pen_settings');
                } else if (t.id === 'eraser') {
                  setActivePanel(tool === t.id && activePanel === 'eraser_options' ? 'none' : 'eraser_options');
                } else if (t.id === 'text') {
                  setActivePanel(tool === t.id && activePanel === 'pen_settings' ? 'none' : 'pen_settings');
                }
              }}
              className={`p-2.5 rounded-xl transition-all relative shrink-0 ${tool === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
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
             className={`p-2.5 rounded-xl transition-all shrink-0 ${isShapeTool ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             onClick={() => {
                if (!isShapeTool) setTool('rectangle');
                setActivePanel(isShapeTool && activePanel === 'shape' ? 'none' : 'shape');
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
            onClick={() => {
              if (tool === 'laser') {
                 setActivePanel(activePanel === 'laser' ? 'none' : 'laser');
              } else {
                 setTool('laser');
                 setActivePanel('laser');
              }
            }}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${tool === 'laser' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Laser Pointer"
          >
            <Zap size={20} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

          {/* Style Settings */}
          <button
            onClick={() => {
                setActivePanel(activePanel === 'style' ? 'none' : 'style');
            }}
            className={`p-2.5 rounded-xl transition-all shrink-0 ${activePanel === 'style' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Board & Card Settings"
          >
            <Palette size={20} />
          </button>

          {/* Actions */}
          <button onClick={undo} disabled={history.length === 0} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 shrink-0">
            <Undo2 size={20} />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 shrink-0">
            <Redo2 size={20} />
          </button>
          
          <button onClick={() => {}} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white shrink-0">
              <Download size={20} />
          </button>

          <button onClick={clear} className="p-2.5 hover:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-400 shrink-0">
            <Trash2 size={20} />
          </button>

        </div>
      </div>
    </>
  );
};
