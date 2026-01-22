export type Tool = 'cursor' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'text' | 'laser';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  tool: Tool;
  points: Point[];
  color: string;
  size: number;
  isComplete: boolean;
  fill?: string; // For shapes
  text?: string; // For text tool
}

export interface BoardState {
  tool: Tool;
  color: string;
  size: number;
  strokes: Stroke[];
  history: Stroke[][];
  redoStack: Stroke[][];
  
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  addStroke: (stroke: Stroke) => void;
  updateStroke: (id: string, points: Point[]) => void;
  completeStroke: (id: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setStrokes: (strokes: Stroke[]) => void; // For loading slides
}
