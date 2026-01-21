
import { useState, useCallback, useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '../store/canvasStore';
import { Point } from '../types/canvas.types';
import { v4 as uuidv4 } from 'uuid';

export const useDrawing = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const { addObject, tool, currentColor, currentThickness, currentShapeType } = useCanvasStore();

  const startDrawing = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    const point = stage?.getRelativePointerPosition();
    if (!point) return;

    if (tool === 'text') {
        addObject({
            id: uuidv4(),
            type: 'text',
            position: point,
            content: 'Double click to edit',
            width: 200,
            height: 50,
            fontSize: 20,
            fontFamily: 'Arial',
            color: currentColor,
            backgroundColor: 'transparent',
            bold: false,
            italic: false,
            underline: false,
            align: 'left',
            opacity: 1,
            zIndex: 0,
            rotation: 0,
            locked: false,
            visible: true,
            createdBy: 'user',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return;
    }

    if (tool === 'sticky') {
        addObject({
            id: uuidv4(),
            type: 'sticky',
            position: point,
            width: 200,
            height: 200,
            content: 'New Sticky Note',
            color: currentColor,
            opacity: 1,
            zIndex: 0,
            rotation: 0,
            locked: false,
            visible: true,
            createdBy: 'user',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return;
    }

    if (tool !== 'pen' && tool !== 'shape') return;
    
    setIsDrawing(true);
    isDrawingRef.current = true;
    currentPointsRef.current = [point];
  }, [tool, addObject, currentColor, currentShapeType]);

  const draw = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawingRef.current || (tool !== 'pen' && tool !== 'shape')) return;
    
    const stage = e.target.getStage();
    const point = stage?.getRelativePointerPosition();
    
    if (point) {
        if (tool === 'pen') {
            const lastPoint = currentPointsRef.current[currentPointsRef.current.length - 1];
            
            if (lastPoint) {
                const distance = Math.sqrt(
                    Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
                );
                // Only add point if it's far enough from the last one (smoother lines, better performance)
                if (distance > 3) {
                    currentPointsRef.current.push(point);
                }
            } else {
                currentPointsRef.current.push(point);
            }
        } else {
            // For shapes, we only need start and current end point
            const start = currentPointsRef.current[0];
            if (start) {
                currentPointsRef.current = [start, point];
            }
        }
    }
  }, [tool]);

  const endDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    
    const currentPoints = currentPointsRef.current;
    
    if (tool === 'pen' && currentPoints.length > 0) {
      addObject({
        id: uuidv4(),
        type: 'pen',
        points: currentPoints,
        color: currentColor,
        thickness: currentThickness,
        opacity: 1,
        smoothing: 0.5,
        position: { x: 0, y: 0 },
        zIndex: 0,
        rotation: 0,
        locked: false,
        visible: true,
        createdBy: 'user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (tool === 'shape' && currentPoints.length === 2) {
        const start = currentPoints[0];
        const end = currentPoints[1];
        
        let x = Math.min(start.x, end.x);
        let y = Math.min(start.y, end.y);
        let width = Math.abs(end.x - start.x);
        let height = Math.abs(end.y - start.y);
        let points: number[] | undefined;

        if (currentShapeType === 'line' || currentShapeType === 'arrow') {
            x = start.x;
            y = start.y;
            points = [0, 0, end.x - start.x, end.y - start.y];
        }

        addObject({
            id: uuidv4(),
            type: 'shape',
            shapeType: currentShapeType,
            position: { x, y },
            width,
            height,
            points,
            fillColor: 'transparent',
            borderColor: currentColor,
            borderWidth: currentThickness,
            opacity: 1,
            zIndex: 0,
            rotation: 0,
            locked: false,
            visible: true,
            createdBy: 'user',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }
    
    setIsDrawing(false);
    isDrawingRef.current = false;
    currentPointsRef.current = [];
  }, [tool, addObject, currentColor, currentThickness, currentShapeType]);

  return {
    isDrawing,
    currentPointsRef,
    isDrawingRef,
    startDrawing,
    draw,
    endDrawing
  };
};
