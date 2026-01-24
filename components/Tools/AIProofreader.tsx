import React from 'react';
import { ArrowLeft, Sparkles, Wand2 } from 'lucide-react';

interface AIProofreaderProps {
    onBack: () => void;
}

export const AIProofreader: React.FC<AIProofreaderProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Sparkles className="text-purple-600" />
                        AI Proofreader
                    </h1>
                    <p className="text-slate-500 font-medium">Automatic grammar and style enhancement for educational content.</p>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-lg p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                        <Wand2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Coming Soon</h3>
                    <p className="text-slate-500 leading-relaxed">
                        This tool is currently under development. It will feature advanced AI capabilities to proofread and enhance your curriculum materials automatically.
                    </p>
                </div>
            </div>
        </div>
    );
};
