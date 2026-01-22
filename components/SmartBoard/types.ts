export type Tool = 'cursor' | 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'text' | 'laser' | 'star';
export type EraserMode = 'partial' | 'lasso' | 'clear';
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'dash-dot';

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
  borderStyle?: BorderStyle;
  opacity?: number;
}

export interface BoardState {
  tool: Tool;
  eraserMode: EraserMode;
  color: string;
  size: number;
  eraserSize: number;
  strokes: Stroke[];
  history: Stroke[][];
  redoStack: Stroke[][];
  
  // Shape Properties
  fillColor: string;
  isFillEnabled: boolean;
  isBorderEnabled: boolean;
  borderStyle: BorderStyle;
  opacity: number;

  // Question & Board Styling
  questionStyle: {
    fontSize: number;
    color: string;
    fontFamily: string;
    backgroundColor: string;
    position: { x: number; y: number };
    dimensions: { width: number; height: number };
    scale: number;
    textOpacity: number;
    cardOpacity: number;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
  };
  boardBackgroundColor: string;
  boardBackgroundImage: string | null;
  boardOpacity: number;

  setQuestionStyle: (style: Partial<BoardState['questionStyle']>) => void;
  setBoardBackgroundColor: (color: string) => void;
  setBoardBackgroundImage: (url: string | null) => void;
  setBoardOpacity: (opacity: number) => void;
}
  
  setTool: (tool: Tool) => void;
  setEraserMode: (mode: EraserMode) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setEraserSize: (size: number) => void;
  addStroke: (stroke: Stroke) => void;
  updateStroke: (id: string, points: Point[]) => void;
  completeStroke: (id: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setStrokes: (strokes: Stroke[]) => void; // For loading slides

  // Shape Actions
  setFillColor: (color: string) => void;
  setIsFillEnabled: (enabled: boolean) => void;
  setIsBorderEnabled: (enabled: boolean) => void;
  setBorderStyle: (style: BorderStyle) => void;
  setOpacity: (opacity: number) => void;
}
