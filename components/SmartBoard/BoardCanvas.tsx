import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Path, Line, Rect, Circle, RegularPolygon, Arrow } from 'react-konva';
import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke } from './utils/getSvgPathFromStroke';
import { useBoardStore } from './store';
import { v4 as uuidv4 } from 'uuid';
import { Stroke } from './types';

interface BoardCanvasProps {
  width: number;
  height: number;
}

export const BoardCanvas: React.FC<BoardCanvasProps> = ({ width, height }) => {
  const { 
    tool, 
    color, 
    size, 
    strokes, 
    addStroke, 
    updateStroke, 
    // completeStroke // We'll handle history locally or via store helpers
  } = useBoardStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);

  // History management helper
  const saveHistory = () => {
    useBoardStore.setState(state => ({
      history: [...state.history, state.strokes],
      redoStack: []
    }));
  };

  const handleMouseDown = (e: any) => {
    if (tool === 'cursor' || tool === 'laser') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    setIsDrawing(true);
    saveHistory(); // Save state BEFORE adding new stroke

    const id = uuidv4();
    setCurrentStrokeId(id);

    const newStroke: Stroke = {
      id,
      tool,
      color: tool === 'eraser' ? '#000000' : color,
      size,
      points: [{ x: point.x, y: point.y, pressure: 0.5 }],
      isComplete: false
    };

    addStroke(newStroke);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentStrokeId) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    const currentStroke = strokes.find(s => s.id === currentStrokeId);
    if (currentStroke) {
      // For shapes, we update the second point (end point)
      if (['rectangle', 'circle', 'triangle', 'arrow', 'line', 'star'].includes(tool)) {
        // Shapes only need Start and End points initially
        // We keep the start point (index 0) and update the end point
        const startPoint = currentStroke.points[0];
        updateStroke(currentStrokeId, [startPoint, { x: point.x, y: point.y }]);
      } else {
        // Freehand tools (Pen, Eraser, Highlighter)
        updateStroke(currentStrokeId, [...currentStroke.points, { x: point.x, y: point.y, pressure: e.evt.pressure || 0.5 }]);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentStrokeId(null);
  };

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      className="absolute inset-0 z-20"
    >
      <Layer>
        {strokes.map((stroke, i) => {
          if (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'eraser') {
            const outlinePoints = getStroke(stroke.points, {
              size: stroke.size,
              thinning: 0.5,
              smoothing: 0.5,
              streamline: 0.5,
            });
            const pathData = getSvgPathFromStroke(outlinePoints);
            
            return (
              <Path
                key={stroke.id}
                data={pathData}
                fill={stroke.tool === 'eraser' ? undefined : stroke.color} // Eraser uses stroke/composite
                stroke={stroke.tool === 'eraser' ? '#000000' : undefined}
                strokeWidth={stroke.tool === 'eraser' ? stroke.size : 0}
                globalCompositeOperation={
                  stroke.tool === 'eraser' ? 'destination-out' : 
                  stroke.tool === 'highlighter' ? 'multiply' : 'source-over'
                }
                opacity={stroke.tool === 'highlighter' ? 0.5 : 1}
                lineCap="round"
                lineJoin="round"
              />
            );
          }

          // Shapes
          const start = stroke.points[0];
          const end = stroke.points[stroke.points.length - 1];
          if (!start || !end) return null;

          if (stroke.tool === 'line') {
            return (
              <Line
                key={stroke.id}
                points={[start.x, start.y, end.x, end.y]}
                stroke={stroke.color}
                strokeWidth={stroke.size}
                lineCap="round"
                lineJoin="round"
              />
            );
          }

          if (stroke.tool === 'arrow') {
             return (
                <Arrow
                    key={stroke.id}
                    points={[start.x, start.y, end.x, end.y]}
                    stroke={stroke.color}
                    strokeWidth={stroke.size}
                    fill={stroke.color}
                    pointerLength={stroke.size * 2}
                    pointerWidth={stroke.size * 2}
                />
             );
          }

          if (stroke.tool === 'rectangle') {
            return (
              <Rect
                key={stroke.id}
                x={Math.min(start.x, end.x)}
                y={Math.min(start.y, end.y)}
                width={Math.abs(end.x - start.x)}
                height={Math.abs(end.y - start.y)}
                stroke={stroke.color}
                strokeWidth={stroke.size}
              />
            );
          }

          if (stroke.tool === 'circle') {
             const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
             return (
                <Circle
                    key={stroke.id}
                    x={start.x}
                    y={start.y}
                    radius={radius}
                    stroke={stroke.color}
                    strokeWidth={stroke.size}
                />
             );
          }

          if (stroke.tool === 'triangle') {
             // Simple isosceles triangle logic
             const width = end.x - start.x;
             const height = end.y - start.y;
             return (
                <Line
                    key={stroke.id}
                    points={[
                        start.x + width / 2, start.y,
                        start.x, start.y + height,
                        start.x + width, start.y + height
                    ]}
                    closed
                    stroke={stroke.color}
                    strokeWidth={stroke.size}
                />
             );
          }

          if (stroke.tool === 'star') {
             const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
             return (
                <RegularPolygon
                    key={stroke.id}
                    x={start.x}
                    y={start.y}
                    sides={5}
                    radius={radius}
                    innerRadius={radius / 2.5}
                    stroke={stroke.color}
                    strokeWidth={stroke.size}
                    rotation={0}
                />
             );
          }

          return null;
        })}
      </Layer>
    </Stage>
  );
};
