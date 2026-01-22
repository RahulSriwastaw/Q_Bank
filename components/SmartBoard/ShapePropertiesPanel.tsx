import React from 'react';
import { useBoardStore } from './store';
import { Tool } from './types';
import { 
  Minus, Square, Circle, Triangle, Star, ArrowRight, 
  MoreHorizontal, Lock, Trash2, Check, Palette
} from 'lucide-react';

const shapes = [
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
  { id: 'line', label: 'Line', icon: Minus }
];

export const ShapePropertiesPanel: React.FC = () => {
  const { 
    tool, setTool,
    color, setColor, 
    size, setSize,
    fillColor, setFillColor,
    isFillEnabled, setIsFillEnabled,
    isBorderEnabled, setIsBorderEnabled,
    borderStyle, setBorderStyle,
    opacity, setOpacity
  } = useBoardStore();

  const colors = [
    '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
    '#84cc16', '#10b981', '#06b6d4', '#3b82f6', 
    '#6366f1', '#8b5cf6', '#ec4899', '#000000'
  ];

  const borderStyles = [
    { id: 'solid', label: 'Solid', preview: 'border-solid' },
    { id: 'dashed', label: 'Dashed', preview: 'border-dashed' },
    { id: 'dotted', label: 'Dotted', preview: 'border-dotted' },
    // { id: 'dash-dot', label: 'Dash Dot', preview: '' } // CSS doesn't support dash-dot natively easily without SVG/complex borders, skipping for now or mapping to dashed
  ];

  const getToolIcon = () => {
    switch (tool) {
      case 'rectangle': return <Square size={16} />;
      case 'circle': return <Circle size={16} />;
      case 'triangle': return <Triangle size={16} />;
      case 'star': return <Star size={16} />;
      case 'arrow': return <ArrowRight size={16} />;
      case 'line': return <Minus size={16} />;
      default: return <Square size={16} />;
    }
  };

  const getToolName = () => {
    return tool.charAt(0).toUpperCase() + tool.slice(1);
  };

  const renderPreview = () => {
    const strokeWidth = isBorderEnabled ? Math.min(size, 4) : 0;
    const strokeColor = isBorderEnabled ? color : 'transparent';
    const fillColorVal = isFillEnabled ? fillColor : 'transparent';
    const strokeDasharray = borderStyle === 'dashed' ? '5,5' : borderStyle === 'dotted' ? '2,2' : undefined;

    const commonProps = {
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        fill: fillColorVal,
        strokeDasharray: strokeDasharray,
        opacity: opacity,
        vectorEffect: "non-scaling-stroke"
    };

    switch (tool) {
        case 'circle':
            return <circle cx="50" cy="50" r="30" {...commonProps} />;
        case 'rectangle':
            return <rect x="20" y="25" width="60" height="50" rx="4" {...commonProps} />;
        case 'triangle':
            return <polygon points="50,20 20,80 80,80" {...commonProps} />;
        case 'star':
             // Simple 5-point star
            return <polygon points="50,15 61,38 86,38 66,53 73,77 50,65 27,77 34,53 14,38 39,38" {...commonProps} />;
        case 'arrow':
            return (
                <g opacity={opacity}>
                   <line x1="20" y1="50" x2="70" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
                   <polygon points="70,40 90,50 70,60" fill={strokeColor} /> 
                   {/* Arrow usually uses stroke color for fill of the head, or we can use fill color if it's a block arrow. 
                       For simple line arrow, head matches stroke. */}
                </g>
            );
        case 'line':
            return <line x1="20" y1="20" x2="80" y2="80" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} opacity={opacity} />;
        default:
            return <rect x="20" y="25" width="60" height="50" rx="4" {...commonProps} />;
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-80 max-w-[90vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Shape Selector Grid */}
      <div className="p-3 grid grid-cols-3 gap-2 border-b border-white/10 bg-white/5">
         {shapes.map(s => (
            <button
              key={s.id}
              onClick={() => setTool(s.id as Tool)}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${tool === s.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title={s.label}
            >
               <s.icon size={20} />
               <span className="text-[9px] font-bold uppercase tracking-wider">{s.label}</span>
            </button>
         ))}
      </div>

      <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        {/* Preview Box */}
        <div className="flex justify-center py-4 bg-black/20 rounded-lg border border-white/5">
            <div className="w-24 h-24 flex items-center justify-center">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    {renderPreview()}
                </svg>
            </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
            <button 
                onClick={() => setIsBorderEnabled(!isBorderEnabled)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${isBorderEnabled ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
            >
                <div className={`w-3 h-3 border-2 border-current rounded-sm`} />
                Border
            </button>
            <button 
                onClick={() => setIsFillEnabled(!isFillEnabled)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${isFillEnabled ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
            >
                <div className={`w-3 h-3 bg-current rounded-sm`} />
                Fill
            </button>
        </div>

        {/* Colors */}
        <div>
            <div className="flex justify-between items-center mb-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {isBorderEnabled ? (isFillEnabled ? "Colors" : "Border Color") : (isFillEnabled ? "Fill Color" : "Color")}
                </div>
                {/* Active Color Indicator */}
                <div className="flex gap-2">
                   {isBorderEnabled && (
                       <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color }} title="Border Color" />
                   )}
                   {isFillEnabled && (
                       <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: fillColor }} title="Fill Color" />
                   )}
                </div>
            </div>
            
            <div className="grid grid-cols-6 gap-2">
                {colors.map(c => (
                    <button
                        key={c}
                        onClick={() => {
                            // Logic: If both enabled, maybe we need a selector for WHICH color to edit?
                            // For simplicity: If Border is active tab? No, we have toggles.
                            // Let's assume user wants to set the MAIN color. 
                            // Usually: Left click = fill, Right click = stroke? No.
                            // Let's just set BOTH if user hasn't specified, or default to Stroke if Border enabled, Fill if Fill enabled.
                            // If BOTH enabled: We need a way to select which one we are editing.
                            // Let's add a "Target" selector or just assume Stroke for now.
                            // UPDATE: Image 2 has separate color pickers next to the toggles. 
                            // My UI has toggles.
                            
                            // Let's just update the "active" property.
                            // Simple heuristic: Update STROKE if Border enabled. Update FILL if Fill enabled (and Border disabled).
                            // Better: Update BOTH if confusing?
                            
                            // Let's default to updating STROKE. 
                            // If user wants to update FILL, they might expect it to update FILL if FILL is enabled.
                            
                            if (isBorderEnabled) setColor(c);
                            if (isFillEnabled && !isBorderEnabled) setFillColor(c);
                            if (isFillEnabled && isBorderEnabled) {
                                // Ambiguous. Let's just update STROKE (Border) as primary, maybe long press for fill?
                                // Or maybe we add two color grids?
                                // Let's try: Update Stroke. 
                            }
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (isFillEnabled) setFillColor(c);
                        }}
                        className={`group relative w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                        title="Left click: Border, Right click: Fill"
                    >
                        {color === c && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" /></div>}
                    </button>
                ))}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 text-center italic">
                Right-click for Fill color
            </div>
        </div>

        {/* Stroke Width */}
        {isBorderEnabled && (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stroke Width</div>
                    <div className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">{size}px</div>
                </div>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                />
            </div>
        )}

        {/* Border Style */}
        {isBorderEnabled && (
            <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Border Style</div>
                <div className="grid grid-cols-3 gap-2">
                    {borderStyles.map(style => (
                        <button
                            key={style.id}
                            onClick={() => setBorderStyle(style.id as any)}
                            className={`h-10 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center transition-all ${borderStyle === style.id ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500' : ''}`}
                        >
                            <div className={`w-8 h-0 border-t-2 ${style.preview} border-current ${borderStyle === style.id ? 'text-blue-400' : 'text-slate-400'}`} />
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Opacity */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opacity</div>
                <div className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">{Math.round(opacity * 100)}%</div>
            </div>
            <input
                type="range"
                min="10"
                max="100"
                value={opacity * 100}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
            />
        </div>

      </div>
    </div>
  );
};
