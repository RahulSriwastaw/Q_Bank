
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storageService } from '../services/storageService';
import { QuestionSet, Question } from '../types';
import { Button } from './Button';
import {
  ChevronLeft, ChevronRight, Eye, EyeOff, Hash, Clock, Maximize, RotateCcw, X,
  BookOpen, CheckCircle, Sparkles, AlertCircle, Timer as TimerIcon, ExternalLink,
  Mic, MicOff, MessageSquare, Volume2, Languages, Clipboard, RefreshCw, Layers,
  PenTool, Eraser, MousePointer2, Grid, Palette, Undo, MonitorPlay,
  Move, Type, Image as ImageIcon, Globe, ZoomIn, ZoomOut, Disc, Bookmark, Flag, Lock, Key, Presentation, Download, Save
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface TeacherViewProps {
  onExit: () => void;
  initialSetId?: string;
}

type Point = { x: number, y: number };
type DrawingPath = { points: Point[], color: string, width: number, type: 'pen' | 'highlighter' | 'eraser' | 'laser' };

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ onExit, initialSetId }) => {
  const [mode, setMode] = useState<'access' | 'present' | 'summary' | 'auth' | 'browse'>('access');
  const [passwordInput, setPasswordInput] = useState('');
  const [availableSets, setAvailableSets] = useState<QuestionSet[]>([]);
  const [activeSet, setActiveSet] = useState<QuestionSet | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAns, setShowAns] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [assistantText, setAssistantText] = useState({ user: '', ai: '' });
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  // Customization State
  const [contentPos, setContentPos] = useState({ x: 0, y: 0 });
  const [isDraggingContent, setIsDraggingContent] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [langMode, setLangMode] = useState<'both' | 'eng' | 'hin'>('both');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#0A0C10'); // Default Dark Background
  const [textColor, setTextColor] = useState('#F1F5F9'); // Default Light Text
  const [cardVisible, setCardVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Annotation State
  const [tool, setTool] = useState<'cursor' | 'pen' | 'highlighter' | 'eraser' | 'laser'>('cursor');
  const [strokeColor, setStrokeColor] = useState('#ef4444');
  const [showGrid, setShowGrid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  // Path-based Drawing State
  const [currentPaths, setCurrentPaths] = useState<DrawingPath[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingPath | null>(null);
  const [annotations, setAnnotations] = useState<Record<number, DrawingPath[]>>({}); // idx -> paths
  const [allowDownload, setAllowDownload] = useState(false);

  const liveRef = useRef<any>(null);
  const audioRef = useRef<{ in: AudioContext | null, out: AudioContext | null }>({ in: null, out: null });
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartRef = useRef<number>(0);

  const loadSet = async (id: string) => {
    setIsDataLoading(true);
    try {
      const set = await storageService.getSetById(id);
      if (!set) {
        setIsDataLoading(false);
        return;
      }
      const all = await storageService.getQuestions();
      let qs = set.questionIds.map(qid => all.find(q => q.id === qid)).filter((q): q is Question => !!q);

      if (set.settings?.randomize) {
        qs = [...qs].sort(() => Math.random() - 0.5);
      }

      setActiveSet(set);
      setActiveQuestions(qs);

      if (set.settings?.annotations) {
        setAnnotations(set.settings.annotations);
        if (set.settings.annotations[0]) setCurrentPaths(set.settings.annotations[0]);
      }
      if (set.settings?.allowDownload) {
        setAllowDownload(set.settings.allowDownload);
      }
      setBgImage(set.settings?.backgroundImage || null);

      if (set.password && set.password.trim() !== '') {
        setMode('auth');
      } else {
        setMode('present');
      }
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (initialSetId) {
      loadSet(initialSetId);
    } else {
      loadAvailableSets();
    }
  }, [initialSetId]);

  const loadAvailableSets = async () => {
    setIsDataLoading(true);
    const sets = await storageService.getSets();
    setAvailableSets(sets);
    setMode('browse');
    setIsDataLoading(false);
  };

  useEffect(() => {
    let interval: any;
    if (mode === 'present') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    // Restore paths when slide changes, or annotations update
    if (annotations[currentIdx]) {
      setCurrentPaths(annotations[currentIdx]);
    } else {
      setCurrentPaths([]);
    }
  }, [currentIdx, annotations]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Resizing clears canvas, so we must redraw
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        redrawCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [mode, currentPaths]); // Re-run when paths change to ensure redraw triggers correctly

  const [containerSize, setContainerSize] = useState({ w: 900 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, w: 0 });

  // Global Mouse Handlers for Dragging & Laser
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingContent(false);
      setIsResizing(false);
    }
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingContent) {
        setContentPos({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        });
      }
      if (isDraggingContent || isResizing) {
        // Prevent drawing while dragging or resizing
        e.stopPropagation();
        e.preventDefault(); // Might prevent text selection
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.x;
        setContainerSize({ w: Math.max(400, resizeStartRef.current.w + deltaX * 2) }); // *2 because centered
      }
      if (tool === 'laser') {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDraggingContent, tool, isResizing]);

  const handleAuth = () => {
    if (activeSet?.password === passwordInput) {
      setMode('present');
    } else {
      alert("Incorrect Password");
      setPasswordInput('');
    }
  };



  /* New Toolbar State */
  const bottomBarRef = useRef<HTMLDivElement>(null);

  /* Auth UI - Reference Style */
  const renderAuthModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")' }}>
      <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Access PPT</h2>
            <p className="text-xs text-slate-500">Secure Teacher Gateway</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Set ID</label>
            <input
              type="text"
              value={activeSet?.setId || ''}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 font-mono text-sm text-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="Enter access code..."
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">End Point (Optional)</label>
            <input type="text" placeholder="Custom API Endpoint..." className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-sm" />
          </div>

          <button
            onClick={handleAuth}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 mt-4"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );

  const startContentDrag = (e: React.MouseEvent) => {
    if (tool !== 'cursor') return;
    setIsDraggingContent(true);
    dragStartRef.current = {
      x: e.clientX - contentPos.x,
      y: e.clientY - contentPos.y
    };
  };

  // Canvas Logic - Path Based
  const renderPath = (ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (path.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 40;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.type === 'highlighter' ? 20 : 3;
      if (path.type === 'highlighter') ctx.globalAlpha = 0.4;
      else ctx.globalAlpha = 1.0;
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all committed paths
    currentPaths.forEach(path => renderPath(ctx, path));

    // Draw current stroke
    if (currentStroke) renderPath(ctx, currentStroke);
  };

  // Sync Redraw when paths change
  useEffect(() => {
    redrawCanvas();
  }, [currentPaths, currentStroke]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'cursor' || tool === 'laser') return;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    setCurrentStroke({
      points: [{ x, y }],
      color: strokeColor,
      width: tool === 'highlighter' ? 20 : 3,
      type: tool
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke) {
      setIsDrawing(false);
      const newPaths = [...currentPaths, currentStroke];
      setCurrentPaths(newPaths);
      setCurrentStroke(null);

      // Removed Auto-Save to DB to allow "Next (Skip Save)" option
      // We only update local path state here.
    }
  };

  const saveProgress = async (newAnnotations: Record<number, DrawingPath[]>) => {
    if (activeSet) {
      // Debounce or just save? For now, we save. In prod, maybe debounce.
      // We'll trust Supabase to handle small JSON updates.
      // Note: activeSet is local state. We need to update DB.
      const updatedSettings = { ...(activeSet.settings || {}), annotations: newAnnotations, allowDownload };
      await storageService.saveSet({ ...activeSet, settings: updatedSettings });
    }
  };

  const clearCanvas = () => {
    setCurrentPaths([]);
    // Removed Auto-Save to DB. 
    // If user clears and clicks "Save & Next", it will save empty array.
    // If user clears and clicks "Next", it will revert to previous state (if any).
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setBgImage(url);
    }
  };

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIdx)) newSet.delete(currentIdx);
      else newSet.add(currentIdx);
      return newSet;
    });
  };

  const startAssistant = async () => { /* ... same ... */
    if (isLiveActive) return stopAssistant();
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const inCtx = new AudioContext({ sampleRate: 16000 });
      const outCtx = new AudioContext({ sampleRate: 24000 });
      audioRef.current = { in: inCtx, out: outCtx };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (ev) => {
              const inputData = ev.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcm = encode(new Uint8Array(int16.buffer));
              sessionPromise.then(sess => sess.sendRealtimeInput({ media: { data: pcm, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) { } });
              sourcesRef.current.clear();
              nextStartRef.current = 0;
            }
            if (msg.serverContent?.outputTranscription) setAssistantText(p => ({ ...p, ai: p.ai + msg.serverContent!.outputTranscription!.text }));
            if (msg.serverContent?.turnComplete) {
              setAssistantText(p => ({ ...p, user: '' }));
              setTimeout(() => setAssistantText(p => ({ ...p, ai: '' })), 5000);
            }
            const b64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (b64) {
              nextStartRef.current = Math.max(nextStartRef.current, outCtx.currentTime);
              const buf = await decodeAudioData(decode(b64), outCtx, 24000, 1);
              const src = outCtx.createBufferSource();
              src.buffer = buf;
              src.connect(outCtx.destination);
              src.addEventListener('ended', () => sourcesRef.current.delete(src));
              src.start(nextStartRef.current);
              nextStartRef.current += buf.duration;
              sourcesRef.current.add(src);
            }
          },
          onerror: (e) => console.error(e),
          onclose: () => setIsLiveActive(false)
        },
        config: { responseModalities: [Modality.AUDIO], systemInstruction: `Explain classroom concepts clearly. Help with: ${activeQuestions[currentIdx]?.question_eng}` }
      });
      sessionPromise.then(sess => { liveRef.current = sess; setIsLiveActive(true); });
    } catch (e) { alert("Microphone access required."); }
  };

  const stopAssistant = () => {
    liveRef.current?.close();
    audioRef.current.in?.close();
    audioRef.current.out?.close();
    setIsLiveActive(false);
    setAssistantText({ user: '', ai: '' });
  };

  const toggleDownloadPermission = async () => {
    const newVal = !allowDownload;
    setAllowDownload(newVal);
    if (activeSet) {
      const updatedSettings = { ...(activeSet.settings || {}), allowDownload: newVal, annotations };
      await storageService.saveSet({ ...activeSet, settings: updatedSettings });
    }
  };

  const downloadClassNotes = async () => {
    if (!activeSet) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [window.innerWidth, window.innerHeight] });

    // We need to capture each slide. This is tricky because we need to render them.
    // For "Current Presentation", we capture the CURRENT VIEW as it is (WYSIWYG).
    // But user asked to download "Class Notes" which usually implies ALL slides.
    // Creating a PDF of ALL slides requires programmatically navigating and capturing.
    // That is very slow and complex.
    // Alternative: Capture JUST the current slide? Or iterate?
    // "students mode se us ppt ko students download kar sake" -> implies the whole set.

    // IMPORTANT: Since we can't easily background-render all slides in React without mounting them,
    // and doing so in a loop is slow/flashy...
    // A common compromise: Save the current session annotations.
    // The STUDENT view will reconstruct the slides and download them?
    // Or we simplify: "Download Current Slide"?
    // "class notes" usually means the whole deck.

    // Let's implement a "Record Mode" where the teacher finishes the class, and THEN we generate the PDF?
    // Or we just generate the PDF from the known data (Text) + Annotations (Paths)?
    // Render paths to an offscreen canvas + Render HTML text to image?
    // This is feasible but complex.

    // SIMPLIFIED APPROACH: Capture the CURRENT slide only for now, or just alert "Feature coming soon" for batch?
    // Re-reading user request: "teacher padhayega... likha hua ppt save hote rahna chahiye... students download kar sake".
    // This implies SERVER SIDE storage (which we did: annotations in DB).
    // So the Student View can implement the "Download All" by iterating through questions and rendering them invisible?
    // Yes, Student View is better place for "Download All".

    // For TEACHER VIEW: Let's allow downloading the CURRENT slide as a note.
    const canvas = await html2canvas(document.body);
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, window.innerWidth, window.innerHeight);
    doc.save(`ClassNotes_${activeSet.name}_Slide${currentIdx + 1}.pdf`);
  };

  // NOTE: Full batch download logic should ideally be in Student View or a dedicated "Export" mode
  // because generating 50 slides on the fly takes time. 
  // I'll stick to saving data here, and letting StudentView handle providing the files (as per request).
  // But wait, user asked "aisa kuch banao" (make something like this). 
  // I must ensure the data IS saved so Student View CAN do it.

  // I will add a "Sync/Save" button visual feedback.


  if (mode === 'auth') return renderAuthModal(); // Use new Auth UI



  if (mode === 'access') return (
    <div className="h-screen flex items-center justify-center bg-[#0A0C10]">
      <div className="flex flex-col items-center gap-6">
        {isDataLoading ? (
          <>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">Initializing Theater...</p>
          </>
        ) : (
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="text-red-500 mx-auto" />
            <h3 className="text-white font-bold">Set Unavailable</h3>
            <p className="text-slate-500 text-sm">The requested question set could not be found.</p>
            <Button onClick={onExit} className="bg-slate-800 text-white">Return to Studio</Button>
          </div>

        )}
      </div>
    </div >
  );

  if (mode === 'browse') return (
    <div className="min-h-screen bg-[#0A0C10] p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-cyan-500/10 p-3 rounded-2xl text-cyan-400">
              <Presentation size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Teacher Studio</h1>
              <p className="text-slate-400 text-sm font-medium">Select a set to begin your class.</p>
            </div>
          </div>
          <Button onClick={onExit} className="bg-slate-800 text-white hover:bg-slate-700">Exit Studio</Button>
        </div>

        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading Library...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSets.map(set => (
              <div key={set.setId} onClick={() => loadSet(set.setId)} className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 cursor-pointer group hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all hover:shadow-2xl hover:shadow-cyan-500/10">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${set.status === 'public' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {set.status || 'Draft'}
                  </span>
                  <div className="p-2 bg-white/5 rounded-full text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <MonitorPlay size={20} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">{set.name}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 min-h-[40px]">{set.description}</p>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <span className="flex items-center gap-1"><Layers size={14} /> {set.questionIds?.length || 0} Questions</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {new Date(set.createdDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {availableSets.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-40">
                <Layers size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="font-black uppercase tracking-widest text-sm text-slate-500">No Sets Found. Create one in Creator Studio.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'summary') return (
    <div className="h-screen flex items-center justify-center bg-[#0A0C10] p-6 animate-in zoom-in-95">
      <div className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-3xl p-8 space-y-8 relative">
        <button onClick={() => setMode('present')} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20} /></button>

        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400">
            <Clock size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Session Complete</h2>
          <p className="text-slate-400 font-medium">{activeSet?.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
            <div className="text-2xl font-black text-indigo-400">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Duration</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
            <div className="text-2xl font-black text-emerald-400">{activeQuestions.length}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Covered</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
            <div className="text-2xl font-black text-amber-400">{bookmarks.size}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Bookmarks</div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={() => { setTimer(0); setCurrentIdx(0); setMode('present'); }} className="w-full bg-indigo-600 text-white py-4 h-auto font-bold uppercase tracking-wider">
            Restart Session
          </Button>
          <Button onClick={onExit} className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-4 h-auto font-bold uppercase tracking-wider">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );

  const q = activeQuestions[currentIdx];

  if (!q && mode === 'present') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0A0C10] flex-col gap-4">
        <div className="text-slate-400 font-mono">No questions available in this set.</div>
        <Button onClick={onExit} className="bg-white/10 hover:bg-white/20 text-white">Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden selection:bg-primary/20 bg-slate-950 relative ${tool === 'laser' ? 'cursor-none' : ''}`} style={{ fontFamily: '"Inter", "Poppins", sans-serif' }}>
      {/* 1. CINEMATIC BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple/10 rounded-full blur-[120px]"></div>
      </div>
      {bgImage && <img src={bgImage} className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0" />}

      {/* 2. ANNOTATION CANVAS */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-30 touch-none ${tool === 'cursor' ? 'pointer-events-none' : 'cursor-crosshair'}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* 4. INSTITUTIONAL HEADER */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-10 z-[40]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
            <Presentation size={16} className="text-primary" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeSet?.name || 'Live Environment'}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <span className="text-sm font-black text-slate-100 font-mono">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 mr-4">
            {(['both', 'eng', 'hin'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLangMode(l)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${langMode === l ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => bgInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all">
            <ImageIcon size={18} />
          </button>
          <button onClick={onExit} className="w-10 h-10 flex items-center justify-center bg-error/10 rounded-xl border border-error/20 text-error hover:bg-error hover:text-white transition-all">
            <X size={18} />
          </button>
          <input type="file" accept="image/*" ref={bgInputRef} className="hidden" onChange={handleBgUpload} />
        </div>
      </header>


      {/* 5. CINEMATIC CONTENT CANVAS - DRAGGABLE */}
      <main className="flex-1 relative flex items-center justify-center z-10 px-20 overflow-hidden">
        <div
          className={`animate-in fade-in zoom-in-95 duration-700 transition-transform ${tool === 'cursor' ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{
            transform: `translate(${contentPos.x}px, ${contentPos.y}px) scale(${scale})`,
            width: `${containerSize.w}px`,
            maxWidth: 'none'
          }}
          onMouseDown={startContentDrag}
        >
          {/* DRAG HANDLE */}
          {tool === 'cursor' && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-widest cursor-grab active:cursor-grabbing select-none">
              <Move size={14} className="text-primary" />
              <span>Drag to Move Question</span>
            </div>
          )}

          {showSol ? (
            <div className="glass p-16 rounded-[48px] animate-in slide-in-from-bottom-8 duration-500 border border-white/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center text-success">
                  <BookOpen size={24} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Solution Analysis</h2>
              </div>
              <div className="space-y-8 prose prose-invert max-w-none">
                {q.solution_eng && <div className="text-2xl text-slate-100 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: q.solution_eng }} />}
                {q.solution_hin && <div className="text-xl text-slate-400 leading-relaxed italic border-t border-white/5 pt-8" dangerouslySetInnerHTML={{ __html: q.solution_hin }} />}
              </div>
            </div>
          ) : (
            <div className="space-y-24">
              {/* Massive Question Typography */}
              <div className="text-center space-y-10">
                {(langMode === 'both' || langMode === 'eng') && (
                  <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl font-heading" dangerouslySetInnerHTML={{ __html: q.question_eng }} />
                )}
                {(langMode === 'both' || langMode === 'hin') && (
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-400 italic leading-[1.3] drop-shadow-xl" dangerouslySetInnerHTML={{ __html: q.question_hin }} />
                )}
              </div>

              {/* Glassmorphic Option Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[q.option1_eng, q.option2_eng, q.option3_eng, q.option4_eng].map((opt, i) => {
                  const isCorrect = (i + 1).toString() === q.answer;
                  const showHighlight = showAns && isCorrect;
                  return (
                    <button
                      key={i}
                      onClick={() => setShowAns(!showAns)}
                      className={`relative p-10 rounded-[32px] border transition-all text-left group/opt ${showHighlight
                        ? 'bg-success/20 border-success shadow-[0_0_40px_rgba(34,197,94,0.15)] scale-[1.02]'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center gap-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${showHighlight ? 'bg-success text-white' : 'bg-white/10 text-slate-400 group-hover/opt:bg-primary group-hover/opt:text-white'
                          }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div className={`text-2xl font-bold transition-all ${showHighlight ? 'text-white' : 'text-slate-300 group-hover/opt:text-white'
                          }`} dangerouslySetInnerHTML={{ __html: opt }} />
                      </div>
                      {showHighlight && (
                        <div className="absolute top-4 right-8 flex items-center gap-2 text-success font-black text-[10px] uppercase tracking-widest animate-pulse">
                          <CheckCircle size={14} /> Correct Reference
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FLOATING CONTENT CONTROLS */}
      <div className="fixed top-24 left-6 z-[45] flex flex-col gap-2">
        {/* Move/Drag Toggle Info */}
        <div className="glass px-4 py-3 rounded-2xl border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <Move size={14} className="text-primary" />
            <span>Position Mode</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setContentPos({ x: 0, y: 0 })}
              className="flex-1 h-8 bg-white/5 hover:bg-white/10 text-slate-400 text-[9px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="text-[8px] text-slate-600 text-center">
            X: {Math.round(contentPos.x)} • Y: {Math.round(contentPos.y)}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="glass px-4 py-3 rounded-2xl border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <ZoomIn size={14} className="text-primary" />
            <span>Scale</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="w-8 h-8 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg transition-all flex items-center justify-center"
            >
              <ZoomOut size={14} />
            </button>
            <div className="flex-1 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-white">
              {Math.round(scale * 100)}%
            </div>
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="w-8 h-8 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg transition-all flex items-center justify-center"
            >
              <ZoomIn size={14} />
            </button>
          </div>
          <button
            onClick={() => setScale(1)}
            className="h-7 bg-white/5 hover:bg-white/10 text-slate-400 text-[9px] font-bold uppercase rounded-lg transition-all"
          >
            Reset to 100%
          </button>
        </div>

        {/* Container Width */}
        <div className="glass px-4 py-3 rounded-2xl border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <Maximize size={14} className="text-primary" />
            <span>Width</span>
          </div>
          <input
            type="range"
            min="400"
            max="1600"
            value={containerSize.w}
            onChange={(e) => setContainerSize({ w: parseInt(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="text-[8px] text-slate-600 text-center">
            {containerSize.w}px
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass px-3 py-2 rounded-2xl border border-white/10 flex flex-col gap-1.5">
          <button
            onClick={() => setShowGrid(true)}
            className="h-9 px-3 bg-white/5 hover:bg-white/10 text-slate-400 text-[9px] font-bold uppercase rounded-lg transition-all flex items-center gap-2"
          >
            <Grid size={14} /> Slide Grid
          </button>
          <button
            onClick={toggleBookmark}
            className={`h-9 px-3 text-[9px] font-bold uppercase rounded-lg transition-all flex items-center gap-2 ${bookmarks.has(currentIdx) ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
          >
            <Bookmark size={14} className={bookmarks.has(currentIdx) ? 'fill-amber-400' : ''} /> {bookmarks.has(currentIdx) ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button
            onClick={async () => {
              const newAnnot = { ...annotations, [currentIdx]: currentPaths };
              setAnnotations(newAnnot);
              await saveProgress(newAnnot);
            }}
            className="h-9 px-3 bg-primary/20 hover:bg-primary/30 text-primary text-[9px] font-bold uppercase rounded-lg transition-all flex items-center gap-2"
          >
            <Save size={14} /> Save Annotations
          </button>
          <button
            onClick={downloadClassNotes}
            className="h-9 px-3 bg-white/5 hover:bg-white/10 text-slate-400 text-[9px] font-bold uppercase rounded-lg transition-all flex items-center gap-2"
          >
            <Download size={14} /> Download Slide
          </button>
        </div>
      </div>

      {/* 6. REFINED CONTROL DOCK */}
      <footer className="h-28 flex items-center justify-center z-50">
        <div className="glass px-10 py-5 rounded-[32px] border border-white/10 flex items-center gap-12 shadow-2xl relative">

          {/* Navigation Engine */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { if (currentIdx > 0) { setCurrentIdx(currentIdx - 1); setShowAns(false); setShowSol(false); } }}
              disabled={currentIdx === 0}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-primary transition-all disabled:opacity-20"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Slide</span>
              <span className="text-lg font-black text-white">{currentIdx + 1} <span className="text-slate-600 font-medium">/ {activeQuestions.length}</span></span>
            </div>
            <button
              onClick={() => { if (currentIdx < activeQuestions.length - 1) { setCurrentIdx(currentIdx + 1); setShowAns(false); setShowSol(false); } else { setMode('summary'); } }}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-primary transition-all shadow-xl shadow-primary/10"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="w-px h-10 bg-white/10" />

          {/* Interactive Tools */}
          <div className="flex items-center gap-2">
            {[
              { id: 'cursor', icon: MousePointer2, label: 'Navigate' },
              { id: 'pen', icon: PenTool, label: 'Synthesize' },
              { id: 'highlighter', icon: Hash, label: 'Highlight' },
              { id: 'laser', icon: Disc, label: 'Direct' },
              { id: 'eraser', icon: Eraser, label: 'Clear' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id as any)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all relative group/tool ${tool === t.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/10'}`}
              >
                <t.icon size={20} />
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 border border-white/10 text-[9px] font-black text-white uppercase tracking-widest rounded-lg opacity-0 group-hover/tool:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                  {t.label}
                </span>
              </button>
            ))}
            <div className="w-px h-8 bg-white/10 mx-2" />
            <div className="relative group/color">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 cursor-pointer shadow-inner" style={{ backgroundColor: strokeColor }}></div>
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="w-px h-10 bg-white/10" />

          {/* AI Orchestration & Feedback */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSol(!showSol)}
              className={`h-12 px-6 rounded-2xl flex items-center gap-3 transition-all ${showSol ? 'bg-emerald-500 text-white' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20'}`}
            >
              <BookOpen size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{showSol ? 'Hide Logic' : 'View Logic'}</span>
            </button>

            <button
              onClick={startAssistant}
              className={`h-12 px-6 rounded-22 flex items-center gap-3 transition-all ${isLiveActive ? 'bg-accent-pink text-white animate-pulse' : 'bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30'}`}
            >
              <Sparkles size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Teacher AI</span>
            </button>
          </div>
        </div>
      </footer>

      {/* AI Assistant Overlay */}
      {isLiveActive && (
        <div className="fixed top-24 right-10 w-96 glass p-8 rounded-[40px] border border-white/10 z-[100] animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-accent-pink/20 rounded-2xl flex items-center justify-center text-accent-pink animate-spin-slow">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white tracking-widest uppercase">AI Synthesis active</h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Listening for pedagogical cues...</p>
            </div>
          </div>
          <div className="bg-black/20 p-6 rounded-3xl min-h-[120px] max-h-[300px] overflow-y-auto border border-white/5 mb-6">
            <p className="text-sm font-medium text-slate-100 leading-relaxed italic">{assistantText.ai || 'Analyzing presentation context...'}</p>
          </div>
          <Button onClick={stopAssistant} variant="danger" className="w-full rounded-2xl">Stop Assistant</Button>
        </div>
      )}

      {showGrid && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-8">
          <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative">
            <button onClick={() => setShowGrid(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white"><X size={24} /></button>
            <div className="grid grid-cols-4 md:grid-cols-6 Gap-4">
              {activeQuestions.map((_q, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentIdx(idx); setShowGrid(false); setShowAns(false); setShowSol(false); clearCanvas(); }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all relative ${currentIdx === idx ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  <span className="text-2xl font-black">{idx + 1}</span>
                  {bookmarks.has(idx) && <Bookmark size={12} className="absolute top-2 right-2 fill-amber-400 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
