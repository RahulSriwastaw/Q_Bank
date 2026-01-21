
export interface Point {
  x: number;
  y: number;
}

export interface BaseObject {
  id: string;
  type: 'pen' | 'shape' | 'text' | 'sticky' | 'image';
  position: Point;
  zIndex: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PenStroke extends BaseObject {
  type: 'pen';
  points: Point[];
  color: string;
  thickness: number;
  opacity: number;
  smoothing: number;
}

export interface Shape extends BaseObject {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'polygon' | 'star';
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  cornerRadius?: number; // for rectangles
  points?: number[]; // for lines and arrows ([x1, y1, x2, y2])
}

export interface TextObject extends BaseObject {
  type: 'text';
  content: string;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
  opacity: number;
}

export interface StickyNote extends BaseObject {
  type: 'sticky';
  content: string;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  opacity: number;
}

export type CanvasObject = PenStroke | Shape | TextObject | StickyNote | ImageObject;

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  objects: CanvasObject[];
  selectedIds: string[];
  viewport: Viewport;
  gridEnabled: boolean;
  snapToGrid: boolean;
  tool: 'select' | 'pan' | 'pen' | 'shape' | 'text' | 'sticky' | 'eraser' | 'image';
  currentShapeType: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'polygon' | 'star';
  currentColor: string;
  currentThickness: number;
}
