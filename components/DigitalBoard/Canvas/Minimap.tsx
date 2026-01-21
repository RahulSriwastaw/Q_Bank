import React, { useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const PADDING = 500; // Large padding to keep view in context

export const Minimap: React.FC = () => {
  const { objects, viewport } = useCanvasStore();

  const bounds = useMemo(() => {
    // Start with viewport center to ensure we always show where we are looking
    const vpX = -viewport.x / viewport.zoom;
    const vpY = -viewport.y / viewport.zoom;
    const vpW = window.innerWidth / viewport.zoom;
    const vpH = window.innerHeight / viewport.zoom;
    
    let minX = vpX;
    let minY = vpY;
    let maxX = vpX + vpW;
    let maxY = vpY + vpH;
    
    if (objects.length > 0) {
        objects.forEach(obj => {
            const x = obj.position.x;
            const y = obj.position.y;
            let w = 0, h = 0;
            
            if (obj.type === 'shape' || obj.type === 'image' || obj.type === 'sticky') {
                w = (obj as any).width || 0;
                h = (obj as any).height || 0;
            } else if (obj.type === 'text') {
                w = (obj as any).width || 100; // Est
                h = (obj as any).height || 20;
            } else if (obj.type === 'pen') {
                 // Pen points are absolute if position is 0,0
                 // If position is not 0,0, they are relative
                 // Usually pen strokes have 0,0 position in my implementation
                 const points = (obj as any).points || [];
                 if (points.length > 0) {
                     // Approximate
                     const first = points[0];
                     minX = Math.min(minX, x + first.x);
                     minY = Math.min(minY, y + first.y);
                     maxX = Math.max(maxX, x + first.x);
                     maxY = Math.max(maxY, y + first.y);
                 }
            }
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        });
    }

    return { 
        minX: minX - PADDING, 
        minY: minY - PADDING, 
        maxX: maxX + PADDING, 
        maxY: maxY + PADDING,
        width: Math.max(maxX - minX + 2 * PADDING, 1000),
        height: Math.max(maxY - minY + 2 * PADDING, 1000)
    };
  }, [objects, viewport, window.innerWidth, window.innerHeight]);

  const scale = Math.min(
    MINIMAP_WIDTH / bounds.width,
    MINIMAP_HEIGHT / bounds.height
  );

  const viewRect = {
    x: (-viewport.x / viewport.zoom - bounds.minX) * scale,
    y: (-viewport.y / viewport.zoom - bounds.minY) * scale,
    width: (window.innerWidth / viewport.zoom) * scale,
    height: (window.innerHeight / viewport.zoom) * scale
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white border shadow-lg rounded overflow-hidden z-40 opacity-90 hover:opacity-100 transition-opacity" style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}>
      <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} className="bg-gray-50">
        {objects.map(obj => {
           let x = (obj.position.x - bounds.minX) * scale;
           let y = (obj.position.y - bounds.minY) * scale;
           let w = ((obj as any).width || 20) * scale;
           let h = ((obj as any).height || 20) * scale;
           
           if (obj.type === 'pen') {
               // Render pen as a small path or rect covering bounds?
               // Just a rect for now
               return <rect key={obj.id} x={x} y={y} width={2} height={2} fill={obj.type === 'pen' ? (obj as any).color : '#ccc'} />;
           }

           return <rect key={obj.id} x={x} y={y} width={Math.max(2, w)} height={Math.max(2, h)} fill="#ccc" rx={2} />;
        })}
        <rect 
            x={viewRect.x} 
            y={viewRect.y} 
            width={viewRect.width} 
            height={viewRect.height} 
            fill="rgba(59, 130, 246, 0.1)" 
            stroke="rgb(37, 99, 235)" 
            strokeWidth="1" 
        />
      </svg>
    </div>
  );
};
