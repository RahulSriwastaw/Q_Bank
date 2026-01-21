import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const { 
    selectedIds, 
    objects, 
    updateObject, 
    deleteSelected,
    bringToFront,
    sendToBack
  } = useCanvasStore();

  if (selectedIds.length === 0) return null;

  const firstId = selectedIds[0];
  const object = objects.find(o => o.id === firstId);

  if (!object) return null;

  const handleChange = (key: string, value: any) => {
      selectedIds.forEach(id => {
          updateObject(id, { [key]: value });
      });
  };

  return (
    <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg w-64 z-50 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-700 border-b pb-2">Properties</h3>
      
      {/* Position & Size */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>X: {Math.round(object.position.x)}</div>
          <div>Y: {Math.round(object.position.y)}</div>
          {(object as any).width && <div>W: {Math.round((object as any).width)}</div>}
          {(object as any).height && <div>H: {Math.round((object as any).height)}</div>}
      </div>

      {/* Style Properties */}
      <div className="space-y-2">
          {/* Stroke/Color */}
          {(object as any).borderColor !== undefined && (
              <div className="flex items-center justify-between">
                  <label className="text-sm">Stroke</label>
                  <input 
                    type="color" 
                    value={(object as any).borderColor} 
                    onChange={(e) => handleChange('borderColor', e.target.value)}
                  />
              </div>
          )}
           {(object.type === 'pen') && (
              <div className="flex items-center justify-between">
                  <label className="text-sm">Color</label>
                  <input 
                    type="color" 
                    value={(object as any).color} 
                    onChange={(e) => handleChange('color', e.target.value)}
                  />
              </div>
          )}
           {(object.type === 'text') && (
              <div className="flex items-center justify-between">
                  <label className="text-sm">Color</label>
                  <input 
                    type="color" 
                    value={(object as any).color} 
                    onChange={(e) => handleChange('color', e.target.value)}
                  />
              </div>
          )}

          {/* Fill Color */}
          {(object as any).fillColor !== undefined && (
              <div className="flex items-center justify-between">
                  <label className="text-sm">Fill</label>
                  <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        checked={(object as any).fillColor !== 'transparent'}
                        onChange={(e) => handleChange('fillColor', e.target.checked ? '#ffffff' : 'transparent')}
                    />
                    {(object as any).fillColor !== 'transparent' && (
                        <input 
                            type="color" 
                            value={(object as any).fillColor} 
                            onChange={(e) => handleChange('fillColor', e.target.value)}
                        />
                    )}
                  </div>
              </div>
          )}

          {/* Stroke Width */}
          {((object as any).borderWidth !== undefined || (object.type === 'pen')) && (
               <div className="space-y-1">
                  <label className="text-sm">Thickness: { (object as any).borderWidth || (object as any).thickness }</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={(object as any).borderWidth || (object as any).thickness} 
                    onChange={(e) => handleChange(object.type === 'pen' ? 'thickness' : 'borderWidth', parseInt(e.target.value))}
                    className="w-full"
                  />
               </div>
          )}
          
           {/* Opacity */}
           <div className="space-y-1">
              <label className="text-sm">Opacity: {Math.round((object.opacity || 1) * 100)}%</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={object.opacity || 1} 
                onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                className="w-full"
              />
           </div>
      </div>
      
      {/* Text Specific */}
      {object.type === 'text' && (
          <div className="border-t pt-2 space-y-2">
              <div className="flex gap-2">
                  <button 
                    onClick={() => handleChange('bold', !(object as any).bold)}
                    className={`p-1 rounded ${ (object as any).bold ? 'bg-blue-100' : 'hover:bg-gray-100'} font-bold`}
                  >B</button>
                  <button 
                    onClick={() => handleChange('italic', !(object as any).italic)}
                    className={`p-1 rounded ${ (object as any).italic ? 'bg-blue-100' : 'hover:bg-gray-100'} italic`}
                  >I</button>
                  <button 
                    onClick={() => handleChange('underline', !(object as any).underline)}
                    className={`p-1 rounded ${ (object as any).underline ? 'bg-blue-100' : 'hover:bg-gray-100'} underline`}
                  >U</button>
              </div>
              <div>
                  <label className="text-sm">Size: {(object as any).fontSize}</label>
                  <input 
                    type="range" 
                    min="8" 
                    max="72" 
                    value={(object as any).fontSize} 
                    onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                    className="w-full"
                  />
              </div>
          </div>
      )}

      {/* Layering Actions */}
      <div className="flex gap-2 border-t pt-2">
          <button onClick={bringToFront} className="flex-1 flex items-center justify-center gap-1 p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm" title="Bring to Front">
              <ArrowUp size={16} /> Front
          </button>
          <button onClick={sendToBack} className="flex-1 flex items-center justify-center gap-1 p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm" title="Send to Back">
              <ArrowDown size={16} /> Back
          </button>
      </div>
      
      <button onClick={deleteSelected} className="w-full flex items-center justify-center gap-2 p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 mt-2">
          <Trash2 size={16} /> Delete
      </button>
    </div>
  );
};
