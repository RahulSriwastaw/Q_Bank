
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { CanvasObject, CanvasState, Viewport } from '../types/canvas.types';

interface CanvasActions {
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  deleteSelected: () => void;
  selectObjects: (ids: string[]) => void;
  clearSelection: () => void;
  updateViewport: (viewport: Partial<Viewport>) => void;
  setTool: (tool: CanvasState['tool']) => void;
  setShapeType: (type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'polygon' | 'star') => void;
  setGridEnabled: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setCurrentColor: (color: string) => void;
  setCurrentThickness: (thickness: number) => void;
  undo: () => void;
  redo: () => void;
  resetCanvas: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
}

interface HistoryState {
  past: CanvasObject[][];
  future: CanvasObject[][];
}

type CanvasStore = CanvasState & CanvasActions & { history: HistoryState };

const initialState: CanvasState = {
  objects: [],
  selectedIds: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  gridEnabled: true,
  snapToGrid: false,
  tool: 'select',
  currentShapeType: 'rectangle',
  currentColor: '#000000',
  currentThickness: 2,
};

export const useCanvasStore = create<CanvasStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      history: { past: [], future: [] },

      addObject: (object) =>
        set((state) => {
          state.history.past.push([...state.objects]);
          state.history.future = [];
          state.objects.push(object);
        }),

      updateObject: (id, updates) =>
        set((state) => {
          const index = state.objects.findIndex((o) => o.id === id);
          if (index !== -1) {
            state.history.past.push([...state.objects]);
            state.history.future = [];
            Object.assign(state.objects[index], updates);
            state.objects[index].updatedAt = Date.now();
          }
        }),

      deleteObject: (id) =>
        set((state) => {
          state.history.past.push([...state.objects]);
          state.history.future = [];
          state.objects = state.objects.filter((o) => o.id !== id);
        }),

      deleteSelected: () =>
        set((state) => {
          if (state.selectedIds.length > 0) {
            state.history.past.push([...state.objects]);
            state.history.future = [];
            state.objects = state.objects.filter((o) => !state.selectedIds.includes(o.id));
            state.selectedIds = [];
          }
        }),

      selectObjects: (ids) =>
        set((state) => {
          state.selectedIds = ids;
        }),

      clearSelection: () =>
        set((state) => {
          state.selectedIds = [];
        }),

      updateViewport: (viewport) =>
        set((state) => {
          Object.assign(state.viewport, viewport);
        }),

      bringToFront: () =>
        set((state) => {
          if (state.selectedIds.length === 0) return;
          state.history.past.push([...state.objects]);
          state.history.future = [];
          
          const selected = state.objects.filter(o => state.selectedIds.includes(o.id));
          const unselected = state.objects.filter(o => !state.selectedIds.includes(o.id));
          state.objects = [...unselected, ...selected];
        }),

      sendToBack: () =>
        set((state) => {
          if (state.selectedIds.length === 0) return;
          state.history.past.push([...state.objects]);
          state.history.future = [];
          
          const selected = state.objects.filter(o => state.selectedIds.includes(o.id));
          const unselected = state.objects.filter(o => !state.selectedIds.includes(o.id));
          state.objects = [...selected, ...unselected];
        }),

      setTool: (tool) =>
        set((state) => {
          state.tool = tool;
          state.selectedIds = []; // Clear selection when changing tools
        }),

      setShapeType: (type) =>
        set((state) => {
          state.currentShapeType = type as any;
        }),

      setGridEnabled: (enabled) =>
        set((state) => {
          state.gridEnabled = enabled;
        }),

      setSnapToGrid: (enabled) =>
        set((state) => {
          state.snapToGrid = enabled;
        }),
        
      setCurrentColor: (color) =>
        set((state) => {
          state.currentColor = color;
        }),

      setCurrentThickness: (thickness) =>
        set((state) => {
          state.currentThickness = thickness;
        }),

      undo: () =>
        set((state) => {
          if (state.history.past.length > 0) {
            const previous = state.history.past.pop();
            if (previous) {
              state.history.future.push([...state.objects]);
              state.objects = previous;
            }
          }
        }),

      redo: () =>
        set((state) => {
          if (state.history.future.length > 0) {
            const next = state.history.future.pop();
            if (next) {
              state.history.past.push([...state.objects]);
              state.objects = next;
            }
          }
        }),
        
      resetCanvas: () => set({ ...initialState, history: { past: [], future: [] } }),
    })),
    {
      name: 'digital-board-storage',
      partialize: (state) => ({
        objects: state.objects,
        viewport: state.viewport,
        gridEnabled: state.gridEnabled,
      }),
    }
  )
);
