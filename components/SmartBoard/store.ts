import { create } from 'zustand';
import { BoardState, Stroke } from './types';

export const useBoardStore = create<BoardState>((set, get) => ({
  tool: 'pen',
  color: '#3b82f6', // Default blue
  size: 4,
  strokes: [],
  history: [],
  redoStack: [],

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),

  addStroke: (stroke) => {
    const { strokes, history } = get();
    // Save current state to history before adding new stroke (for undo)
    // Actually, usually we save to history when stroke is COMPLETED.
    // But for "live" undo, we might need snapshots. 
    // Let's adopt a simple model: History is an array of snapshots of `strokes`.
    set({ strokes: [...strokes, stroke] });
  },

  updateStroke: (id, points) => {
    const { strokes } = get();
    const index = strokes.findIndex(s => s.id === id);
    if (index !== -1) {
      const newStrokes = [...strokes];
      newStrokes[index] = { ...newStrokes[index], points };
      set({ strokes: newStrokes });
    }
  },

  completeStroke: (id) => {
    const { strokes, history } = get();
    // Snapshot state for undo
    // We only save the state BEFORE the stroke was added? 
    // No, standard undo is: Stack contains previous states.
    // So before we finish this stroke, the "previous state" was (strokes - 1).
    // Let's refine: When a stroke starts, we don't push history. When it ENDS, we assume the action is done.
    // BUT to undo "adding the stroke", we need the state *before* it was added.
    
    // Better approach: 
    // 1. `addStroke` pushes the *current* strokes (before add) to history.
    // 2. But `addStroke` is called on MouseDown. `updateStroke` on MouseMove. `completeStroke` on MouseUp.
    // So:
    // MouseDown -> save current strokes to history -> add new empty/start stroke.
    
    // Let's refactor logic slightly in the component or here.
    // For now, let's just make the store simple and let the component handle history triggers? 
    // Or handle it here.
    
    // Let's keep it simple: `history` stores the full array of strokes.
    // We push to history ONLY when `completeStroke` is called? 
    // No, we push the *previous* state.
    
    // Let's do this manually in the component for fine control, or:
    // We'll just provide the primitives here.
  },

  undo: () => {
    const { strokes, history, redoStack } = get();
    if (history.length === 0) return;
    
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    set({
      strokes: previous,
      history: newHistory,
      redoStack: [...redoStack, strokes]
    });
  },

  redo: () => {
    const { strokes, history, redoStack } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    set({
      strokes: next,
      history: [...history, strokes],
      redoStack: newRedoStack
    });
  },

  clear: () => {
    const { strokes, history } = get();
    set({
      history: [...history, strokes],
      strokes: [],
      redoStack: []
    });
  },

  setStrokes: (strokes) => set({ strokes, history: [], redoStack: [] })
}));
