import React, { useEffect, useState } from 'react';
import { BoardCanvas } from './BoardCanvas';
import { BoardToolbar } from './BoardToolbar';
import { useBoardStore } from './store';
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
  
  const { setStrokes, strokes, clear } = useBoardStore();

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
    <div className="fixed inset-0 bg-[#0A0C10] flex flex-col text-slate-200 font-sans overflow-hidden">
      
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
      <main className="flex-1 relative flex items-center justify-center p-4 sm:p-8 z-10">
         {currentQuestion ? (
             <div className="w-full max-w-5xl pointer-events-none select-none">
                <div className="space-y-6 md:space-y-8">
                    {/* Question Text */}
                    <div className="space-y-4">
                        {(langMode === 'both' || langMode === 'eng') && (
                            <h1 
                                className="text-xl md:text-3xl font-black leading-snug text-white drop-shadow-lg"
                                dangerouslySetInnerHTML={{ __html: currentQuestion.question_eng }}
                            />
                        )}
                        {(langMode === 'both' || langMode === 'hin') && (
                            <h2 
                                className="text-lg md:text-2xl font-bold leading-snug text-slate-300 drop-shadow-md font-serif"
                                dangerouslySetInnerHTML={{ __html: currentQuestion.question_hin }}
                            />
                        )}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pointer-events-auto">
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
                                    onClick={() => setShowAns(!showAns)}
                                    className={`
                                        group relative p-4 rounded-2xl border text-left transition-all duration-200
                                        ${show 
                                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                                            : 'bg-[#151921] border-white/5 hover:border-blue-500/30 hover:bg-[#1a1f29]'}
                                    `}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors shrink-0
                                            ${show ? 'bg-emerald-500 text-white' : 'bg-[#252a33] text-slate-400 group-hover:bg-blue-500 group-hover:text-white'}
                                        `}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <div className="space-y-1 pt-1">
                                            {(langMode === 'both' || langMode === 'eng') && (
                                                <div className={`text-base font-medium ${show ? 'text-emerald-100' : 'text-slate-200'}`} dangerouslySetInnerHTML={{ __html: opt.e }} />
                                            )}
                                            {(langMode === 'both' || langMode === 'hin') && (
                                                <div className={`text-sm ${show ? 'text-emerald-200/70' : 'text-slate-500'}`} dangerouslySetInnerHTML={{ __html: opt.h }} />
                                            )}
                                        </div>
                                    </div>
                                    {show && (
                                        <div className="absolute top-4 right-4 text-emerald-500 animate-in zoom-in">
                                            <CheckCircle size={20} />
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
