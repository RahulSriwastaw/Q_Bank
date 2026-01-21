
import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { 
  MousePointer2, 
  Hand, 
  Pen, 
  Square, 
  Type, 
  StickyNote as StickyNoteIcon, 
  Undo, 
  Redo, 
  Trash2,
  Grid as GridIcon,
  Circle as CircleIcon,
  Eraser,
  Triangle,
  Minus,
  ArrowRight,
  Hexagon,
  Star,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { exportToImage } from '../utils/export';

export const Toolbar: React.FC = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { 
    tool, 
    setTool, 
    addObject, 
    undo, 
    redo, 
    resetCanvas,
    deleteSelected, 
    gridEnabled, 
    setGridEnabled,
    currentColor,
    setCurrentColor,
    currentThickness,
    setCurrentThickness,
    currentShapeType,
    setShapeType
  } = useCanvasStore();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const src = event.target?.result as string;
          const img = new Image();
          img.src = src;
          img.onload = () => {
              // Scale down if too large
              let width = img.width;
              let height = img.height;
              const maxSize = 500;
              
              if (width > maxSize || height > maxSize) {
                  const ratio = Math.min(maxSize / width, maxSize / height);
                  width *= ratio;
                  height *= ratio;
              }

              addObject({
                  id: uuidv4(),
                  type: 'image',
                  src,
                  position: { x: window.innerWidth / 2 - width / 2, y: window.innerHeight / 2 - height / 2 },
                  width,
                  height,
                  originalWidth: img.width,
                  originalHeight: img.height,
                  rotation: 0,
                  zIndex: 0,
                  locked: false,
                  visible: true,
                  createdBy: 'user',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  opacity: 1
              });
              
              setTool('select');
          };
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tools = [
    { name: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
    { name: 'pan', icon: <Hand size={20} />, label: 'Pan' },
    { name: 'pen', icon: <Pen size={20} />, label: 'Pen' },
    { name: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
    { name: 'shape', icon: <Square size={20} />, label: 'Shape' },
    { name: 'text', icon: <Type size={20} />, label: 'Text' },
    { name: 'sticky', icon: <StickyNoteIcon size={20} />, label: 'Sticky Note' },
  ];

  const defaultColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#800080'];
  const stickyColors = ['#fff740', '#ff7eb9', '#7afcff', '#feff9c', '#ffffff'];

  const colors = tool === 'sticky' ? stickyColors : defaultColors;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex gap-2 items-center z-50">
      <div className="flex gap-1 border-r pr-2">
        {tools.map((t) => (
          <button
            key={t.name}
            onClick={() => {
                if (t.name === 'image') {
                    fileInputRef.current?.click();
                } else {
                    setTool(t.name as any);
                }
            }}
            className={`p-2 rounded hover:bg-gray-100 ${
              tool === t.name ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="flex gap-1 border-r pr-2 items-center">
        <button onClick={undo} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Undo">
          <Undo size={20} />
        </button>
        <button onClick={redo} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Redo">
          <Redo size={20} />
        </button>
      </div>

      {tool === 'shape' && (
        <div className="flex gap-1 border-r pr-2 items-center">
            <button
                onClick={() => setShapeType('rectangle')}
                className={`p-2 rounded hover:bg-gray-100 ${currentShapeType === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Rectangle"
            >
                <Square size={18} />
            </button>
            <button
                onClick={() => setShapeType('circle')}
                className={`p-2 rounded hover:bg-gray-100 ${currentShapeType === 'circle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Circle"
            >
                <CircleIcon size={18} />
            </button>
            <button
                onClick={() => setShapeType('triangle')}
                className={`p-2 rounded hover:bg-gray-100 ${currentShapeType === 'triangle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Triangle"
            >
                <Triangle size={18} />
            </button>
            <button
                onClick={() => setShapeType('line')}
                className={`p-2 rounded hover:bg-gray-100 ${currentShapeType === 'line' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Line"
            >
                <Minus size={18} />
            </button>
            <button
                onClick={() => setShapeType('arrow')}
                className={`p-2 rounded hover:bg-gray-100 ${currentShapeType === 'arrow' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Arrow"
            >
                <ArrowRight size={18} />
            </button>
            <button
                onClick={() => setShapeType('polygon')}
                className={`p-2 rounded hover:bg-gray-100 ${currentShapeType === 'polygon' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Polygon"
            >
                <Hexagon size={18} />
            </button>
            <button
                onClick={() => setShapeType('star')}
                className={`p-2 rounded hover:bg-gray-100 ${currentShapeType === 'star' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Star"
            >
                <Star size={18} />
            </button>
        </div>
      )}

      <div className="flex gap-1 border-r pr-2 items-center">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setCurrentColor(c)}
            className={`w-6 h-6 rounded-full border ${
              currentColor === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      
      <div className="flex gap-1 items-center px-2">
         <input 
            type="range" 
            min="1" 
            max="20" 
            value={currentThickness} 
            onChange={(e) => setCurrentThickness(parseInt(e.target.value))}
            className="w-20"
         />
      </div>

      <div className="flex gap-1 items-center">
        <button 
            onClick={() => setGridEnabled(!gridEnabled)}
            className={`p-2 rounded hover:bg-gray-100 ${gridEnabled ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
        >
            <GridIcon size={20} />
        </button>
        <button onClick={deleteSelected} className="p-2 rounded hover:bg-red-100 text-red-600" title="Delete Selected">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex gap-1 items-center border-l pl-2">
         <button onClick={exportToImage} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Download Image">
            <Download size={20} />
         </button>
         <button onClick={() => { if(confirm('Clear Canvas?')) resetCanvas(); }} className="p-2 rounded hover:bg-red-100 text-red-600" title="Clear Canvas">
            <Trash2 size={20} />
         </button>
      </div>
    </div>
  );
};
