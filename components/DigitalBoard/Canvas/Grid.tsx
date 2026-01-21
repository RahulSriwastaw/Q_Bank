
import React from 'react';
import { Group, Line } from 'react-konva';
import { Viewport } from '../types/canvas.types';

interface GridProps {
  viewport: Viewport;
  width: number;
  height: number;
  gridSize?: number;
}

export const Grid: React.FC<GridProps> = ({ viewport, width, height, gridSize = 50 }) => {
  const { x, y, zoom } = viewport;
  const stageWidth = width / zoom;
  const stageHeight = height / zoom;
  
  const startX = Math.floor((-x / zoom) / gridSize) * gridSize;
  const startY = Math.floor((-y / zoom) / gridSize) * gridSize;
  
  const lines = [];
  
  // Vertical lines
  for (let i = 0; i < stageWidth + gridSize; i += gridSize) {
    const lineX = startX + i;
    lines.push(
      <Line
        key={`v-${lineX}`}
        points={[lineX, -y/zoom, lineX, stageHeight + (-y/zoom)]}
        stroke="#ddd"
        strokeWidth={1 / zoom}
      />
    );
  }

  // Horizontal lines
  for (let i = 0; i < stageHeight + gridSize; i += gridSize) {
    const lineY = startY + i;
    lines.push(
      <Line
        key={`h-${lineY}`}
        points={[-x/zoom, lineY, stageWidth + (-x/zoom), lineY]}
        stroke="#ddd"
        strokeWidth={1 / zoom}
      />
    );
  }

  return <Group>{lines}</Group>;
};
