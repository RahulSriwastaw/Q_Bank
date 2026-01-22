import React, { useEffect, useState } from 'react';
import { BoardCanvas } from './BoardCanvas';
import { BoardToolbar } from './BoardToolbar';
import { useBoardStore } from './store';
import { useDraggable } from './useDraggable';
import { useResizable } from './useResizable';
import { Question } from '../../types';
import { Clock, Presentation, Maximize, CheckCircle, ArrowLeft } from 'lucide-react';

interface SmartBoardProps {
  questions: Question[];
  initialIdx?: number;
  setName?: string;
  onExit: () => void;
}

export const SmartBoard: React.FC<SmartBoardProps> = ({
  questions = [],
  initialIdx = 0,
  setName = 'Live Session',
  onExit
}) => {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [timer, setTimer] = useState(0);
  const [showAns, setShowAns] = useState(false);
  const [langMode, setLangMode] = useState<'both' | 'eng' | 'hin'>('both');
  const [slideStrokes, setSlideStrokes] = useState<Record<number, any[]>>({});
  
  const { setStrokes, strokes, clear, questionStyle, setQuestionStyle, boardBackgroundColor, boardBackgroundImage, boardOpacity, tool } = useBoardStore();

  const isCursor = tool === 'cursor';

  const { position, isDragging, dragHandlers } = useDraggable(
    questionStyle.position,
    (pos) => setQuestionStyle({ position: pos })
  );

  const { size, isResizing, resizeHandlers, initResize } = useResizable(
    questionStyle.dimensions,
    (newSize) => setQuestionStyle({ dimensions: newSize })
  );

  const currentQuestion = questions[currentIdx];

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Slide Management
  useEffect(() => {
    // Save current strokes before changing slide
    return () => {
      // This runs on unmount or update. 
      // But we need to save when `currentIdx` CHANGES.
    };
  }, []);

  // When strokes change, update the "current slide's" saved state in memory (debounced ideally, but direct is fine for now)
  // Actually, better pattern: 
  // When `currentIdx` changes:
  // 1. Save `strokes` to `slideStrokes[prevIdx]`
  // 2. Load `slideStrokes[newIdx]` into `strokes`
  
  // We need a ref to track previous index? Or just use effect.
  
  // Let's manually handle Next/Prev to control this sequence perfectly.
  
  const saveCurrentSlide = () => {
    setSlideStrokes(prev => ({
        ...prev,
        [currentIdx]: useBoardStore.getState().strokes
    }));
  };

  const loadSlide = (idx: number) => {
    const saved = slideStrokes[idx] || [];
    setStrokes(saved);
    setShowAns(false);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
        saveCurrentSlide();
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        loadSlide(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
        saveCurrentSlide();
        const prevIdx = currentIdx - 1;
        setCurrentIdx(prevIdx);
        loadSlide(prevIdx);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col text-slate-200 font-sans overflow-hidden">
      
      {/* Board Background Layer */}
      <div 
        className="absolute inset-0 transition-colors duration-500 z-0"
        style={{ 
            backgroundColor: boardBackgroundColor,
            backgroundImage: boardBackgroundImage ? `url(${boardBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: boardOpacity
        }}
      />
      
      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-50 bg-[#0A0C10]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Presentation size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                    {setName}
                </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs font-bold">
                <Clock size={14} />
                <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                {(['both', 'eng', 'hin'] as const).map(l => (
                    <button
                        key={l}
                        onClick={() => setLangMode(l)}
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${langMode === l ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                <Maximize size={18} />
            </button>
            <button 
                onClick={onExit}
                className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20"
            >
                <ArrowLeft size={18} />
            </button>
        </div>
      </header>

      {/* Content Layer (Behind Canvas) */}
      <main 
        className="flex-1 relative flex items-center justify-center p-4 sm:p-8 z-10"
        onPointerMove={(e) => {
            // Pass events to both handlers if active
            dragHandlers.onPointerMove(e);
            resizeHandlers.onPointerMove(e);
        }}
        onPointerUp={(e) => {
            dragHandlers.onPointerUp(e);
            resizeHandlers.onPointerUp(e);
        }}
      >
         {currentQuestion ? (
             <div 
                className={`select-none transition-shadow duration-75 relative ${isDragging ? 'cursor-grabbing shadow-2xl scale-[1.005]' : isCursor ? 'cursor-move' : ''}`}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    width: size.width,
                    height: size.height,
                    maxWidth: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onPointerDown={(e) => {
                    // Only enable drag if not clicking a resize handle or button
                    const target = e.target as HTMLElement;
                    if (!target.closest('.resize-handle') && !target.closest('button')) {
                        dragHandlers.onPointerDown(e);
                    }
                }}
             >
                {/* Resize Handles (Only visible in Cursor mode) */}
                {isCursor && (
                    <>
                        <div className="resize-handle absolute -right-1 -bottom-1 w-6 h-6 bg-blue-500 rounded-full cursor-se-resize z-50 hover:scale-125 transition-transform border-2 border-white shadow-lg flex items-center justify-center"
                            onPointerDown={(e) => initResize(e, 'se')}
                        >
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                        
                        <div className="resize-handle absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white/20 hover:bg-blue-500 rounded-full cursor-e-resize z-50 transition-colors"
                            onPointerDown={(e) => initResize(e, 'e')}
                        />
                        <div className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 w-8 bg-white/20 hover:bg-blue-500 rounded-full cursor-s-resize z-50 transition-colors"
                             onPointerDown={(e) => initResize(e, 's')}
                        />
                    </>
                )}

                {/* Card Background Layer */}
                <div 
                    className="absolute inset-0 rounded-2xl border border-white/5"
                    style={{
                        backgroundColor: questionStyle.backgroundColor,
                        opacity: questionStyle.cardOpacity,
                        backdropFilter: questionStyle.backgroundColor === 'transparent' ? 'none' : 'blur(12px)',
                    }}
                />

                {/* Card Content Layer */}
                <div className="relative z-10 p-4 md:p-6 space-y-3 h-full flex flex-col" style={{
                    fontSize: `${questionStyle.fontSize}px`,
                    fontFamily: questionStyle.fontFamily,
                    color: questionStyle.color,
                    opacity: questionStyle.textOpacity,
                    textAlign: questionStyle.textAlign,
                    lineHeight: questionStyle.lineHeight,
                    fontWeight: questionStyle.fontWeight,
                    fontStyle: questionStyle.fontStyle,
                    textDecoration: questionStyle.textDecoration
                }}>
                    {/* Question Text */}
                    <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {(langMode === 'both' || langMode === 'eng') && (
                            <h1 
                                className="font-black leading-snug drop-shadow-lg"
                                style={{ fontSize: '1.5em', color: 'inherit' }}
                                dangerouslySetInnerHTML={{ __html: currentQuestion.question_eng }}
                            />
                        )}
                        {(langMode === 'both' || langMode === 'hin') && (
                            <h2 
                                className="font-bold leading-snug drop-shadow-md mt-2"
                                style={{ fontSize: '1.25em', color: 'inherit', opacity: 0.9 }}
                                dangerouslySetInnerHTML={{ __html: currentQuestion.question_hin }}
                            />
                        )}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2 pointer-events-auto shrink-0">
                        {[
                            { e: currentQuestion.option1_eng, h: currentQuestion.option1_hin },
                            { e: currentQuestion.option2_eng, h: currentQuestion.option2_hin },
                            { e: currentQuestion.option3_eng, h: currentQuestion.option3_hin },
                            { e: currentQuestion.option4_eng, h: currentQuestion.option4_hin }
                        ].map((opt, i) => {
                            const isCorrect = (i + 1).toString() === currentQuestion.answer;
                            const show = showAns && isCorrect;
                            
                            return (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setShowAns(!showAns); }}
                                    className={`
                                        group relative p-2 rounded-md border text-left transition-all duration-200
                                        ${show 
                                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                                            : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'}
                                    `}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`
                                            w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-colors shrink-0 mt-0.5
                                            ${show ? 'bg-emerald-500 text-white' : 'bg-white/10 text-inherit group-hover:bg-blue-500 group-hover:text-white'}
                                        `}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <div className="space-y-0.5 min-w-0 flex-1">
                                            {(langMode === 'both' || langMode === 'eng') && (
                                                <div className={`font-medium leading-tight truncate ${show ? 'text-emerald-100' : 'text-inherit'}`} style={{ fontSize: '0.9em' }} dangerouslySetInnerHTML={{ __html: opt.e }} />
                                            )}
                                            {(langMode === 'both' || langMode === 'hin') && (
                                                <div className={`leading-tight truncate ${show ? 'text-emerald-200/70' : 'text-inherit opacity-70'}`} style={{ fontSize: '0.8em' }} dangerouslySetInnerHTML={{ __html: opt.h }} />
                                            )}
                                        </div>
                                    </div>
                                    {show && (
                                        <div className="absolute top-2 right-2 text-emerald-500 animate-in zoom-in">
                                            <CheckCircle size={12} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
             </div>
         ) : (
            <div className="text-slate-500 font-mono">No Question Loaded</div>
         )}
      </main>

      {/* Canvas Layer (Top) */}
      <BoardCanvas width={window.innerWidth} height={window.innerHeight} />

      {/* Toolbar */}
      <BoardToolbar 
        currentSlide={currentIdx} 
        totalSlides={questions.length || 1} 
        onPrev={handlePrev}
        onNext={handleNext}
      />

    </div>
  );
};
