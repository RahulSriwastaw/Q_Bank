
import React, { useState, useEffect, useRef } from 'react';
import { 
  MousePointer2, PenTool, Hash, Eraser, Disc, 
  RotateCcw, RotateCw, X, 
  Minus, Square, Circle, Type, ChevronRight, ChevronLeft,
  GripHorizontal, GripVertical, Feather, Brush, Sparkles,
  Settings, ToggleLeft, ToggleRight, Lock, Unlock, Trash2, MoreHorizontal
} from 'lucide-react';

interface FloatingToolbarProps {
  tool: string;
  setTool: (t: any) => void;
  strokeColor: string;
  setStrokeColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  nextSlide: () => void;
  prevSlide: () => void;
  currentSlide: number;
  totalSlides: number;
  onExit: () => void;
  extraTools?: React.ReactNode;
  penStyle: 'basic' | 'pro' | 'calligraphy';
  setPenStyle: (style: 'basic' | 'pro' | 'calligraphy') => void;
  smartOpts: { line: boolean; shape: boolean; pressure: boolean };
  setSmartOpts: (opts: { line: boolean; shape: boolean; pressure: boolean }) => void;
  eraserMode: 'partial' | 'whole';
  setEraserMode: (mode: 'partial' | 'whole') => void;
  isEraserLocked: boolean;
  setIsEraserLocked: (locked: boolean) => void;
  // Laser Props
  laserMode: 'trail' | 'point';
  setLaserMode: (mode: 'trail' | 'point') => void;
  laserSize: number;
  setLaserSize: (size: number) => void;
  laserColor: string;
  setLaserColor: (color: string) => void;
  laserEffect: 'standard' | 'white_burn';
  setLaserEffect: (effect: 'standard' | 'white_burn') => void;
  laserIntensity: number;
  setLaserIntensity: (intensity: number) => void;
  laserDelay: number;
  setLaserDelay: (delay: number) => void;
  isLaserLocked: boolean;
  setIsLaserLocked: (locked: boolean) => void;
  isLaserGlow: boolean;
  setIsLaserGlow: (glow: boolean) => void;
  isLaserHighlight: boolean;
  setIsLaserHighlight: (highlight: boolean) => void;
  clearLaser: () => void;
  clearAllSlides?: () => void;
  savedEraserSize?: number;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  tool, setTool, strokeColor, setStrokeColor, strokeWidth, setStrokeWidth,
  undo, redo, nextSlide, prevSlide, currentSlide, totalSlides, onExit, extraTools,
  penStyle, setPenStyle, smartOpts, setSmartOpts, opacity, setOpacity,
  eraserMode, setEraserMode, isEraserLocked, setIsEraserLocked, clear,
  laserMode, setLaserMode, laserSize, setLaserSize, laserColor, setLaserColor,
  laserEffect, setLaserEffect, laserIntensity, setLaserIntensity, laserDelay, setLaserDelay,
  isLaserLocked, setIsLaserLocked, isLaserGlow, setIsLaserGlow, isLaserHighlight, setIsLaserHighlight,
  clearLaser, clearAllSlides, savedEraserSize
}) => {
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [showEraserMore, setShowEraserMore] = useState(false);
  const [showLaserMore, setShowLaserMore] = useState(false);
  const [isVertical, setIsVertical] = useState(false); // Default to horizontal for "pill" look
  
  // Draggable State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPosition({
          x: startPosRef.current.x + dx,
          y: startPosRef.current.y + dy
        });
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          hasMovedRef.current = true;
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { ...position };
  };

  const handleGripClick = () => {
    if (!hasMovedRef.current) {
      setIsVertical(!isVertical);
      // Reset position when toggling orientation to snap back to default dock
      setPosition({ x: 0, y: 0 });
    }
  };
  
  // Colors palette
  const colors = [
    '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', 
    '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', 
    '#8B5CF6', '#EC4899'
  ];

  const tools = [
    { id: 'cursor', icon: MousePointer2, label: 'Select' },
    { id: 'pen', icon: PenTool, label: 'Pen', hasSettings: true },
    { id: 'highlighter', icon: Hash, label: 'Highlighter', hasSettings: true },
    { id: 'eraser', icon: Eraser, label: 'Eraser', hasSettings: true },
    { id: 'laser', icon: Disc, label: 'Laser', hasSettings: true },
    { id: 'text', icon: Type, label: 'Text', hasSettings: true },
    { id: 'shapes', icon: Square, label: 'Shapes', hasSettings: true },
  ];

  const togglePopover = (id: string) => {
    if (activePopover === id) setActivePopover(null);
    else setActivePopover(id);
  };

  const handleToolClick = (id: string, hasSettings: boolean) => {
    setTool(id);

    // Auto-configure tool defaults for better UX
    if (id === 'highlighter') {
      setOpacity(0.5);
      setStrokeWidth(25);
      // Optional: Set default highlighter color if current is not suitable? 
      // Keeping existing color allows user to pick, but usually highlighter is yellow/green
      if (strokeColor === '#000000' || strokeColor === '#FFFFFF') {
          setStrokeColor('#FFFF00');
      }
    } else if (id === 'pen') {
      setOpacity(1);
      setStrokeWidth(3);
      setPenStyle('basic');
    } else if (id === 'eraser') {
      setStrokeWidth(savedEraserSize || 40);
    } else if (id === 'laser') {
      setStrokeColor('#ef4444');
      setStrokeWidth(16);
      setOpacity(0.8);
      if (laserMode === 'point' && laserSize < 4) setLaserSize(4); // Ensure visibility
    } else if (id === 'text') {
      setStrokeColor('#ffffff');
      setStrokeWidth(24); // used as font size
      setOpacity(1);
    }

    if (hasSettings) {
      togglePopover(id);
    } else {
      setActivePopover(null);
    }
  };

  const applyLaserPreset = (type: 'online' | 'projector') => {
      if (type === 'online') {
          setLaserMode('trail');
          setLaserSize(4);
          setLaserColor('#ef4444');
          setLaserEffect('standard');
          setLaserIntensity(0.65);
          setLaserDelay(5.0);
          setIsLaserGlow(true);
      } else {
          setLaserMode('point');
          setLaserSize(6);
          setLaserColor('#ef4444'); // Or Purple
          setLaserEffect('white_burn');
          setLaserIntensity(0.65);
          setLaserDelay(5.0);
          setIsLaserGlow(true);
      }
  };

  return (
    <div 
      className={`fixed z-[100] transition-all ease-out ${isDragging ? 'duration-0' : 'duration-300'} ${isVertical ? 'top-1/2 right-4 -translate-y-1/2 flex-col max-h-[85vh]' : 'bottom-6 left-1/2 -translate-x-1/2 flex-row max-w-[90vw]'}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      
      {/* MAIN PILL TOOLBAR */}
      <div className={`bg-black/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-2 flex ${isVertical ? 'flex-col overflow-y-auto overflow-x-hidden' : 'flex-row overflow-x-auto overflow-y-hidden'} gap-1.5 rounded-3xl items-center select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/40`}>
        
        {/* DRAG / TOGGLE HANDLE */}
        <div 
          onMouseDown={handleMouseDown}
          onClick={handleGripClick}
          className={`flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing ${isVertical ? 'w-full pb-1 border-b border-white/10 mb-1' : 'h-full pr-1 border-r border-white/10 mr-1'}`}
        >
           <button className="text-white p-1 rounded-full hover:bg-white/10 transition-colors pointer-events-none">
             {isVertical ? <GripHorizontal size={16} /> : <GripVertical size={16} />}
           </button>
        </div>

        {/* TOOLS */}
        {tools.map((t) => (
          <div key={t.id} className="relative group">
            <button
              onClick={() => handleToolClick(t.id, t.hasSettings || false)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                tool === t.id 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-110 z-10' 
                  : 'text-slate-400 hover:bg-white/10 hover:text-white hover:scale-105'
              }`}
              title={t.label}
            >
              <t.icon size={20} strokeWidth={tool === t.id ? 2.5 : 2} />
              {t.hasSettings && tool === t.id && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"></div>
              )}
            </button>
          </div>
        ))}

        <div className={`bg-white/10 ${isVertical ? 'w-8 h-px my-1' : 'w-px h-8 mx-1'}`}></div>

        {/* UNDO/REDO */}
        <div className={`flex ${isVertical ? 'flex-col gap-1.5' : 'flex-row gap-1.5'}`}>
          <button onClick={undo} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all hover:scale-105" title="Undo">
            <RotateCcw size={18} />
          </button>
          <button onClick={redo} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all hover:scale-105" title="Redo">
            <RotateCw size={18} />
          </button>
        </div>

        <div className={`bg-white/10 ${isVertical ? 'w-8 h-px my-1' : 'w-px h-8 mx-1'}`}></div>

        {/* NAVIGATION */}
        <div className={`flex ${isVertical ? 'flex-col gap-1' : 'flex-row gap-1'} items-center bg-white/5 rounded-full px-1 py-0.5`}>
            <button onClick={prevSlide} disabled={currentSlide === 0} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                <ChevronLeft size={18} />
            </button>
            <span className={`text-[10px] font-black text-slate-300 font-mono ${isVertical ? 'py-1' : 'px-1'}`}>
              {currentSlide + 1}<span className="text-slate-600">/</span>{totalSlides}
            </span>
            <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                <ChevronRight size={18} />
            </button>
        </div>

        {extraTools && (
          <>
            <div className={`bg-white/10 ${isVertical ? 'w-8 h-px my-1' : 'w-px h-8 mx-1'}`}></div>
            <div className={`flex ${isVertical ? 'flex-col gap-1.5' : 'flex-row gap-1.5'} items-center`}>
              {extraTools}
            </div>
          </>
        )}

        <div className={`bg-white/10 ${isVertical ? 'w-8 h-px my-1' : 'w-px h-8 mx-1'}`}></div>

        {/* EXIT */}
         <button onClick={onExit} className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all hover:scale-110 hover:rotate-90" title="Exit">
            <X size={20} />
         </button>

      </div>

      {/* SETTINGS POPOVER (Dynamic Positioning) */}
      {activePopover && (
        <div className={`absolute ${isVertical ? 'right-full top-0 mr-4' : 'bottom-full left-1/2 -translate-x-1/2 mb-4'} bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-64 animate-in fade-in zoom-in-95 duration-200 z-[110]`}>
          
          {/* PEN SETTINGS */}
          {activePopover === 'pen' && (
            <div className="space-y-5">
              {/* HEADER */}
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <PenTool size={12} /> Pen Studio
                </span>
                <button onClick={() => setActivePopover(null)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
              </div>

              {/* MODES */}
              <div className="grid grid-cols-3 gap-2">
                {[
                   { id: 'basic', label: 'Basic', sub: 'Fixed width', icon: PenTool },
                   { id: 'pro', label: 'Pro', sub: 'Variable width', icon: Brush, premium: true },
                   { id: 'calligraphy', label: 'Calligraphy', sub: 'Dynamic width', icon: Feather, premium: true }
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setPenStyle(m.id as any)}
                    className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all relative overflow-hidden ${penStyle === m.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                  >
                    {m.premium && <div className="absolute top-1 right-1 text-amber-400"><Sparkles size={8} /></div>}
                    <m.icon size={18} className="mb-1" />
                    <span className="text-[10px] font-bold">{m.label}</span>
                    <span className="text-[8px] opacity-60 scale-90">{m.sub}</span>
                  </button>
                ))}
              </div>
              
              {/* SIZE SLIDER */}
              <div>
                <div className="flex justify-between mb-2">
                   <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Size</label>
                   <span className="text-[9px] font-mono text-white bg-white/10 px-1.5 rounded">{strokeWidth}px</span>
                </div>
                <div className="relative h-6 flex items-center">
                  <input 
                    type="range" 
                    min="1" max="50" 
                    value={strokeWidth} 
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)] hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                  />
                </div>
              </div>

              {/* APPEARANCE */}
              <div>
                <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Appearance</label>
                
                {/* Colors */}
                <div className="grid grid-cols-6 gap-2 mb-4">
                   {colors.map(c => (
                     <button
                        key={c}
                        onClick={() => setStrokeColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${strokeColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110 hover:border-white/50'}`}
                        style={{ backgroundColor: c }}
                     />
                   ))}
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-3">
                   <div className="flex-1 relative h-6 flex items-center">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full h-1.5 top-1/2 -translate-y-1/2"></div>
                     <input 
                       type="range" 
                       min="0.1" max="1" step="0.1"
                       value={opacity} 
                       onChange={(e) => setOpacity(Number(e.target.value))}
                       className="w-full h-1.5 bg-transparent relative z-10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                     />
                   </div>
                   <span className="text-[9px] font-mono text-slate-400 w-8 text-right">{Math.round(opacity * 100)}%</span>
                </div>
              </div>

              {/* SMART INKING */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-3 text-indigo-400">
                  <Sparkles size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Smart Inking</span>
                </div>
                
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-300">Ink Pressure</span>
                      <button onClick={() => setSmartOpts({...smartOpts, pressure: !smartOpts.pressure})} className={`text-2xl transition-colors ${smartOpts.pressure ? 'text-indigo-500' : 'text-slate-600'}`}>
                        {smartOpts.pressure ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-300">Ink to Line</span>
                      <button onClick={() => setSmartOpts({...smartOpts, line: !smartOpts.line})} className={`text-2xl transition-colors ${smartOpts.line ? 'text-indigo-500' : 'text-slate-600'}`}>
                        {smartOpts.line ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-300">Ink to Shape</span>
                      <button onClick={() => setSmartOpts({...smartOpts, shape: !smartOpts.shape})} className={`text-2xl transition-colors ${smartOpts.shape ? 'text-indigo-500' : 'text-slate-600'}`}>
                        {smartOpts.shape ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ERASER SETTINGS */}
          {activePopover === 'eraser' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Eraser size={12} /> Eraser Tool
                </span>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setIsEraserLocked(!isEraserLocked)}
                     className={`text-slate-400 hover:text-white transition-colors ${isEraserLocked ? 'text-amber-400' : ''}`}
                     title={isEraserLocked ? "Unlock Settings" : "Lock Settings"}
                   >
                     {isEraserLocked ? <Lock size={14} /> : <Unlock size={14} />} 
                   </button>
                   <button 
                      onClick={() => setShowEraserMore(!showEraserMore)}
                      className={`transition-colors ${showEraserMore ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                      title="More Options"
                   >
                      <MoreHorizontal size={14} />
                   </button>
                   <button onClick={() => setActivePopover(null)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
                </div>
              </div>

              <div className={`${isEraserLocked ? 'opacity-50 pointer-events-none' : ''} space-y-4 transition-opacity`}>
                  {/* ERASE MODE */}
                  <div>
                     <label className="text-[9px] text-slate-500 font-black mb-2 block uppercase tracking-widest">Erase Mode</label>
                     <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setEraserMode('partial')}
                          className={`p-2 rounded-lg border text-center transition-all ${eraserMode === 'partial' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                           <span className="block text-[10px] font-bold">Partial</span>
                           <span className="text-[8px] opacity-70">Precise</span>
                        </button>
                        <button 
                          onClick={() => setEraserMode('whole')}
                          className={`p-2 rounded-lg border text-center transition-all ${eraserMode === 'whole' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                           <span className="block text-[10px] font-bold">Whole Stroke</span>
                           <span className="text-[8px] opacity-70">One-click</span>
                        </button>
                     </div>
                  </div>

                  {/* SIZE SLIDER */}
                  <div>
                     <div className="flex justify-between mb-2">
                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Size</label>
                        <span className="text-[9px] font-mono text-white bg-white/10 px-1.5 rounded">{strokeWidth}px</span>
                     </div>
                     <input 
                        type="range" 
                        min="5" max="100" 
                        value={strokeWidth} 
                        onChange={(e) => setStrokeWidth(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                     />
                     {/* PRESETS */}
                     <div className="flex gap-2 mt-2">
                        {[10, 30, 60].map(s => (
                            <button 
                              key={s}
                              onClick={() => setStrokeWidth(s)}
                              className="text-[8px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1 rounded border border-white/5"
                            >
                              {s}px
                            </button>
                        ))}
                     </div>
                  </div>

                  {/* ACTIONS */}
                  <div>
                      <label className="text-[9px] text-slate-500 font-black mb-2 block uppercase tracking-widest">Actions</label>
                      <button 
                         onClick={() => {
                           if(window.confirm('Clear all content on this slide?')) clear();
                         }}
                         className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg p-2 transition-all"
                      >
                         <Trash2 size={14} />
                         <span className="text-[10px] font-bold">Clear Slide (Delete)</span>
                      </button>
                  </div>

                  {/* MORE OPTIONS */}
                  {showEraserMore && (
                      <div className="pt-2 border-t border-white/10 animate-in slide-in-from-top-2 space-y-2">
                          <label className="text-[9px] text-slate-500 font-black block uppercase tracking-widest">Advanced</label>
                          {clearAllSlides && (
                            <button 
                               onClick={() => clearAllSlides()}
                               className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg p-2 transition-all"
                            >
                               <Trash2 size={14} />
                               <span className="text-[10px] font-bold">Clear ALL Slides</span>
                            </button>
                          )}
                      </div>
                  )}
              </div>
            </div>
          )}

          {/* HIGHLIGHTER SETTINGS */}
          {activePopover === 'highlighter' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-white/10">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Hash size={12} /> Highlighter
                 </span>
                 <button onClick={() => setActivePopover(null)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
               </div>
               
               <div>
                 <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Brush Size</label>
                 <input 
                   type="range" 
                   min="10" max="50" 
                   value={strokeWidth} 
                   onChange={(e) => setStrokeWidth(Number(e.target.value))}
                   className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(234,179,8,0.5)] hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                 />
               </div>
 
               <div>
                 <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Ink Color</label>
                 <div className="grid grid-cols-6 gap-2">
                    {['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFA500'].map(c => (
                      <button
                         key={c}
                         onClick={() => setStrokeColor(c)}
                         className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${strokeColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110 hover:border-white/50'}`}
                         style={{ backgroundColor: c, opacity: 0.6 }}
                      />
                    ))}
                 </div>
               </div>
             </div>
          )}

          {/* SHAPES SETTINGS */}
          {activePopover === 'shapes' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center pb-3 border-b border-white/10">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Square size={12} /> Shapes
                 </span>
                 <button onClick={() => setActivePopover(null)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
               </div>
               
               <div className="grid grid-cols-3 gap-2">
                 {[
                   { id: 'line', icon: Minus, label: 'Line' },
                   { id: 'rect', icon: Square, label: 'Box' },
                   { id: 'circle', icon: Circle, label: 'Circle' }
                 ].map(s => (
                   <button 
                     key={s.id}
                     onClick={() => setTool(s.id as any)}
                     className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${tool === s.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                   >
                     <s.icon size={20} />
                     <span className="text-[9px] uppercase font-bold tracking-wider">{s.label}</span>
                   </button>
                 ))}
               </div>

               <div>
                <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Stroke Width</label>
                <div className="relative h-8 flex items-center">
                  <input 
                    type="range" 
                    min="1" max="20" 
                    value={strokeWidth} 
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Stroke Color</label>
                <div className="grid grid-cols-6 gap-2">
                   {colors.map(c => (
                     <button
                        key={c}
                        onClick={() => setStrokeColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${strokeColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110 hover:border-white/50'}`}
                        style={{ backgroundColor: c }}
                     />
                   ))}
                </div>
              </div>
             </div>
          )}


          {/* LASER SETTINGS */}
          {activePopover === 'laser' && (
            <div className="space-y-4">
              {/* HEADER */}
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Disc size={12} /> Laser Pointer
                </span>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setIsLaserLocked(!isLaserLocked)}
                     className={`text-slate-400 hover:text-white transition-colors ${isLaserLocked ? 'text-amber-400' : ''}`}
                     title={isLaserLocked ? "Unlock Settings" : "Lock Settings"}
                   >
                     {isLaserLocked ? <Lock size={14} /> : <Unlock size={14} />} 
                   </button>
                   <button 
                      onClick={clearLaser}
                      className="text-slate-500 hover:text-white transition-colors"
                      title="Clear Laser"
                   >
                      <Trash2 size={14} />
                   </button>
                   <button className="text-slate-500 hover:text-white transition-colors" title="More Options">
                      <MoreHorizontal size={14} />
                   </button>
                   <button onClick={() => setActivePopover(null)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
                </div>
              </div>

              <div className={`${isLaserLocked ? 'opacity-50 pointer-events-none' : ''} space-y-4 transition-opacity`}>
                  {/* PRESETS */}
                  <div className="flex gap-2">
                      <button onClick={() => applyLaserPreset('online')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-2 flex flex-col items-center gap-1 transition-all">
                          <span className="text-[9px] font-bold text-slate-300">Online Class</span>
                          <span className="text-[8px] text-slate-500">Red Trail</span>
                      </button>
                      <button onClick={() => applyLaserPreset('projector')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-2 flex flex-col items-center gap-1 transition-all">
                          <span className="text-[9px] font-bold text-slate-300">Projector</span>
                          <span className="text-[8px] text-slate-500">White Point</span>
                      </button>
                  </div>

                  {/* POINTER MODES */}
                  <div>
                     <label className="text-[9px] text-slate-500 font-black mb-2 block uppercase tracking-widest">Pointer Mode</label>
                     <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setLaserMode('trail')}
                          className={`p-2 rounded-lg border text-center transition-all ${laserMode === 'trail' ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                           <span className="block text-[10px] font-bold">Trail</span>
                           <span className="text-[8px] opacity-70">Glowing Line</span>
                        </button>
                        <button 
                          onClick={() => setLaserMode('point')}
                          className={`p-2 rounded-lg border text-center transition-all ${laserMode === 'point' ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                           <span className="block text-[10px] font-bold">Point</span>
                           <span className="text-[8px] opacity-70">Dot Only</span>
                        </button>
                     </div>
                  </div>

                  {/* SIZE SLIDER */}
                  <div>
                     <div className="flex justify-between mb-2">
                        <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Size (pt)</label>
                        <span className="text-[9px] font-mono text-white bg-white/10 px-1.5 rounded">{laserSize}pt</span>
                     </div>
                     <input 
                        type="range" 
                        min="0.5" max="64" step="0.5"
                        value={laserSize} 
                        onChange={(e) => setLaserSize(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                     />
                  </div>

                  {/* COLOR PICKER */}
                  <div>
                    <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Color</label>
                    <div className="grid grid-cols-6 gap-2">
                       {['#ef4444', '#f97316', '#ec4899', '#22c55e', '#3b82f6', '#a855f7', '#000000'].map(c => (
                         <button
                            key={c}
                            onClick={() => setLaserColor(c)}
                            className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${laserColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110 hover:border-white/50'}`}
                            style={{ backgroundColor: c }}
                         />
                       ))}
                       {/* Custom Color Button Placeholder */}
                       <button className="w-7 h-7 rounded-full border-2 border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white transition-all">
                          <span className="text-[10px]">+</span>
                       </button>
                    </div>
                  </div>

                  {/* EFFECTS */}
                  <div>
                     <label className="text-[9px] text-slate-500 font-black mb-2 block uppercase tracking-widest">Effect Type</label>
                     <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setLaserEffect('standard')}
                          className={`p-2 rounded-lg border text-center transition-all ${laserEffect === 'standard' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                           <span className="block text-[10px] font-bold">Standard</span>
                           <span className="text-[8px] opacity-70">Simple Glow</span>
                        </button>
                        <button 
                          onClick={() => setLaserEffect('white_burn')}
                          className={`p-2 rounded-lg border text-center transition-all ${laserEffect === 'white_burn' ? 'bg-white text-black border-white shadow-[0_0_15px_white]' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                           <span className="block text-[10px] font-bold">White Burn</span>
                           <span className="text-[8px] opacity-70">Intense</span>
                        </button>
                     </div>
                  </div>

                  {/* ADVANCED SETTINGS */}
                  {showLaserMore && (
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-3 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-300 font-bold">Delay (sec)</span>
                          <input 
                             type="number" 
                             value={laserDelay}
                             onChange={(e) => setLaserDelay(Number(e.target.value))}
                             className="w-12 bg-black/20 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white text-center"
                             step="0.5"
                          />
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-300 font-bold">Glow</span>
                          <button onClick={() => setIsLaserGlow(!isLaserGlow)} className={`text-xl transition-colors ${isLaserGlow ? 'text-green-500' : 'text-slate-600'}`}>
                             {isLaserGlow ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-300 font-bold">Highlight Mode</span>
                          <button onClick={() => setIsLaserHighlight(!isLaserHighlight)} className={`text-xl transition-colors ${isLaserHighlight ? 'text-green-500' : 'text-slate-600'}`}>
                             {isLaserHighlight ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* TEXT SETTINGS */}
          {activePopover === 'text' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Type size={12} /> Text Tool
                </span>
                <button onClick={() => setActivePopover(null)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Font Size</label>
                <div className="relative h-8 flex items-center">
                  <input 
                    type="range" 
                    min="12" max="72" 
                    value={strokeWidth} 
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-black mb-3 block uppercase tracking-widest">Text Color</label>
                <div className="grid grid-cols-6 gap-2">
                   {colors.map(c => (
                     <button
                        key={c}
                        onClick={() => setStrokeColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${strokeColor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110 hover:border-white/50'}`}
                        style={{ backgroundColor: c }}
                     />
                   ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
