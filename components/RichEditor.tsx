import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Sparkles, Heading1, Heading2, Eraser, Image as ImageIcon } from 'lucide-react';

export interface RichEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  minHeight?: string;
  accessory?: React.ReactNode;
  className?: string; // Added className prop
}

export const RichEditor: React.FC<RichEditorProps> = ({ label, value, onChange, minHeight = "120px", accessory, className = "" }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          exec('insertImage', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className={`space-y-1 group/editor animate-in fade-in duration-500 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {accessory}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/5 transition-all overflow-hidden relative group/editor">
        {/* Compact Toolbar */}
        <div className="px-2 py-1 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-1 relative z-10">

          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} className={`p-1 rounded transition-all ${activeStyles.bold ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`} title="Bold"><Bold size={13} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} className={`p-1 rounded transition-all ${activeStyles.italic ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`} title="Italic"><Italic size={13} /></button>
          </div>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} className={`p-1 rounded transition-all ${activeStyles.ul ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`} title="List"><List size={13} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }} className={`p-1 rounded transition-all ${activeStyles.ol ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`} title="Ordered List"><ListOrdered size={13} /></button>
          </div>

          <div className="w-px h-4 bg-slate-200 mx-0.5" />

          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h1>'); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all" title="H1"><Heading1 size={13} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h2>'); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all" title="H2"><Heading2 size={13} /></button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button onMouseDown={(e) => { e.preventDefault(); handleImageUpload(); }} className="p-1 rounded text-slate-400 hover:text-primary hover:bg-primary/10 transition-all" title="Insert Image"><ImageIcon size={13} /></button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button onMouseDown={(e) => { e.preventDefault(); exec('undo'); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all" title="Undo"><Undo size={13} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); exec('redo'); }} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all" title="Redo"><Redo size={13} /></button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }} className="p-1 rounded text-slate-400 hover:text-error hover:bg-error/10 transition-all" title="Clear Format"><Eraser size={13} /></button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            className="w-full px-3 py-2 outline-none min-h-[80px] max-h-[600px] overflow-y-auto prose prose-slate prose-sm max-w-none prose-p:my-1 prose-headings:my-2 font-medium text-slate-600 focus:text-slate-800 leading-snug [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-200 [&_img]:my-2"
            style={{ minHeight }}
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            onBlur={() => checkStyles()}
            onKeyUp={() => checkStyles()}
            onMouseUp={() => checkStyles()}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
