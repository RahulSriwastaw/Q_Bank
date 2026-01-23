import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Sparkles, Heading1, Heading2, Eraser } from 'lucide-react';

export interface RichEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  minHeight?: string;
  accessory?: React.ReactNode;
}

export const RichEditor: React.FC<RichEditorProps> = ({ label, value, onChange, minHeight = "120px", accessory }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    ul: false,
    ol: false
  });

  const exec = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    checkStyles();
  };

  const checkStyles = () => {
    setActiveStyles({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList')
    });
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="space-y-3 group/editor animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>
        {accessory}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.04)] focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden relative group/editor">
        {/* Cinematic Toolbar */}
        <div className="px-6 py-4 bg-slate-900 border-b border-white/5 flex flex-wrap items-center gap-2 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent-purple/5 pointer-events-none" />

          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            <button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={`p-2.5 rounded-xl transition-all ${activeStyles.bold ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Bold"><Bold size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={`p-2.5 rounded-xl transition-all ${activeStyles.italic ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Italic"><Italic size={16} /></button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className={`p-2.5 rounded-xl transition-all ${activeStyles.ul ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="List"><List size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }} className={`p-2.5 rounded-xl transition-all ${activeStyles.ol ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Ordered List"><ListOrdered size={16} /></button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            <button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h1>'); }} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="H1"><Heading1 size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h2>'); }} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="H2"><Heading2 size={16} /></button>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button onMouseDown={(e) => { e.preventDefault(); exec('undo'); }} className="p-2.5 rounded-xl text-slate-500 hover:text-white transition-all" title="Undo"><Undo size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('redo'); }} className="p-2.5 rounded-xl text-slate-500 hover:text-white transition-all" title="Redo"><Redo size={16} /></button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }} className="p-2.5 rounded-xl text-slate-500 hover:text-error hover:bg-error/10 transition-all" title="Clear Format"><Eraser size={16} /></button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            className="w-full p-8 outline-none min-h-[120px] max-h-[600px] overflow-y-auto prose prose-slate max-w-none prose-p:my-2 prose-headings:my-3 font-medium text-slate-600 focus:text-slate-800"
            style={{ minHeight }}
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            onBlur={() => checkStyles()}
            onKeyUp={() => checkStyles()}
            onMouseUp={() => checkStyles()}
          />
          
          <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-300 pointer-events-none uppercase tracking-widest bg-white/80 backdrop-blur px-2 py-1 rounded-lg">
            Rich Text Editor
          </div>
        </div>
      </div>
    </div>
  );
};
