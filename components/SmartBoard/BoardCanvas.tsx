import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Path, Line, Rect, Circle, RegularPolygon, Arrow, Text } from 'react-konva';
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
    eraserMode,
    color, 
    size, 
    eraserSize,
    strokes, 
    addStroke, 
    updateStroke, 
    setStrokes,
    fillColor,
    isFillEnabled,
    isBorderEnabled,
    borderStyle,
    opacity
  } = useBoardStore();

  const isCursor = tool === 'cursor';
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);
  const [lassoPoints, setLassoPoints] = useState<{x:number, y:number}[]>([]);

  // History management helper
  const saveHistory = () => {
    useBoardStore.setState(state => ({
      history: [...state.history, state.strokes],
      redoStack: []
    }));
  };

  const getDashArray = (style?: string) => {
      switch (style) {
          case 'dashed': return [15, 15];
          case 'dotted': return [2, 10];
          case 'dash-dot': return [15, 5, 2, 5];
          default: return undefined;
      }
  };

  const isPointInPolygon = (point: {x:number, y:number}, vs: {x:number, y:number}[]) => {
      // Ray-casting algorithm based on
      // https://github.com/substack/point-in-polygon
      const x = point.x, y = point.y;
      let inside = false;
      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
          const xi = vs[i].x, yi = vs[i].y;
          const xj = vs[j].x, yj = vs[j].y;
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
      }
      return inside;
  };

  const handleMouseDown = (e: any) => {
    if (tool === 'cursor' || tool === 'laser') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    if (tool === 'eraser' && eraserMode === 'lasso') {
        setIsDrawing(true);
        setLassoPoints([{ x: point.x, y: point.y }]);
        return;
    }

    if (tool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
             const id = uuidv4();
             saveHistory();
             addStroke({
                 id,
                 tool: 'text',
                 points: [{ x: point.x, y: point.y }],
                 color: color,
                 size: size,
                 text: text,
                 isComplete: true,
                 opacity: opacity
             });
        }
        return;
    }

    setIsDrawing(true);
    saveHistory(); // Save state BEFORE adding new stroke

    const id = uuidv4();
    setCurrentStrokeId(id);

    const isShape = ['rectangle', 'circle', 'triangle', 'star', 'arrow', 'line'].includes(tool);
    
    // Determine properties based on tool type
    let strokeColor = color;
    let strokeFill = undefined;
    let strokeOpacity = 1;
    let strokeBorderStyle = undefined;

    if (tool === 'eraser') {
        strokeColor = '#000000';
    } else if (isShape) {
        strokeColor = isBorderEnabled ? color : 'transparent';
        strokeFill = isFillEnabled ? fillColor : undefined;
        strokeOpacity = opacity;
        strokeBorderStyle = borderStyle;
    }

    const newStroke: Stroke = {
      id,
      tool,
      color: strokeColor,
      size: tool === 'eraser' ? eraserSize : size,
      points: [{ x: point.x, y: point.y, pressure: 0.5 }],
      isComplete: false,
      fill: strokeFill,
      borderStyle: strokeBorderStyle,
      opacity: strokeOpacity
    };

    addStroke(newStroke);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    if (tool === 'eraser' && eraserMode === 'lasso') {
        setLassoPoints(prev => [...prev, { x: point.x, y: point.y }]);
        return;
    }

    if (!currentStrokeId) return;

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
    if (tool === 'eraser' && eraserMode === 'lasso') {
        // Lasso logic: Find strokes inside the polygon
        saveHistory(); // Save state before deletion
        
        // Simple bounding box check first for performance
        const xs = lassoPoints.map(p => p.x);
        const ys = lassoPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const newStrokes = strokes.filter(stroke => {
            // Check if any point of the stroke is inside the lasso polygon
            // Sampling points to avoid checking every single pixel
            const pointsToCheck = stroke.points.filter((_, i) => i % 5 === 0); 
            if (pointsToCheck.length === 0 && stroke.points.length > 0) pointsToCheck.push(stroke.points[0]);
            
            // If ANY point is inside, delete the stroke? Or if ALL?
            // "Lasso Eraser" usually means "Touch to delete" or "Enclose to delete".
            // Let's implement "Touch/Intersect" logic (if any point is inside).
            // Actually, "Enclose" is safer. Let's do "If center or some points are inside".
            
            // Let's check if at least one point is inside
            return !pointsToCheck.some(p => isPointInPolygon(p, lassoPoints));
        });

        setStrokes(newStrokes);
        setLassoPoints([]);
    }

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
      className={`absolute inset-0 z-20 ${isCursor ? 'pointer-events-none' : 'pointer-events-auto'}`}
    >
      <Layer>
        {tool === 'eraser' && eraserMode === 'lasso' && lassoPoints.length > 0 && (
          <Line
            points={lassoPoints.flatMap(p => [p.x, p.y])}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[5, 5]}
            closed
            fill="rgba(59, 130, 246, 0.1)"
          />
        )}

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
                dash={getDashArray(stroke.borderStyle)}
                opacity={stroke.opacity}
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
                    fill={stroke.fill || stroke.color}
                    dash={getDashArray(stroke.borderStyle)}
                    opacity={stroke.opacity}
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
                fill={stroke.fill}
                dash={getDashArray(stroke.borderStyle)}
                opacity={stroke.opacity}
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
                    fill={stroke.fill}
                    dash={getDashArray(stroke.borderStyle)}
                    opacity={stroke.opacity}
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
                    fill={stroke.fill}
                    dash={getDashArray(stroke.borderStyle)}
                    opacity={stroke.opacity}
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
                    fill={stroke.fill}
                    dash={getDashArray(stroke.borderStyle)}
                    opacity={stroke.opacity}
                    rotation={0}
                />
             );
          }

          if (stroke.tool === 'text' && stroke.text) {
              return (
                  <Text
                      key={stroke.id}
                      x={stroke.points[0].x}
                      y={stroke.points[0].y}
                      text={stroke.text}
                      fontSize={stroke.size}
                      fill={stroke.color}
                      opacity={stroke.opacity}
                      fontFamily="sans-serif"
                  />
              );
          }

          return null;
        })}
      </Layer>
    </Stage>
  );
};
