import { create } from "zustand";
import type { Component, ComponentType } from "@/lib/types";
import { CELL_SIZE } from "@/lib/constants";

interface GridState {
  gridSize: number;
  components: Map<string, Component>;
  panOffset: { x: number; y: number };
  zoom: number;
  selectedComponentId: string | null;
  invalidCount: number;

  // Drag state - Library drag (from ComponentLibrary)
  draggedComponentType: ComponentType | null;
  // Drag state - Canvas drag (moving existing component)
  draggingComponentId: string | null;
  dragStartGridPos: { x: number; y: number } | null;
  previewCell: { x: number; y: number } | null;

  // Actions
  setGridSize: (size: number) => void;
  setInvalidCount: (count: number) => void;
  generateGrid: (containerWidth: number, containerHeight: number) => void;
  addComponent: (component: Component) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  updatePanZoom: (panOffset: { x: number; y: number }, zoom: number) => void;
  setSelectedComponent: (id: string | null) => void;
  clearComponents: () => void;
  getComponentAt: (x: number, y: number) => Component | undefined;
  resetZoom: (containerWidth: number, containerHeight: number) => void;

  // Library drag actions
  setDraggedComponentType: (type: ComponentType | null) => void;
  // Canvas drag actions
  startDraggingComponent: (
    componentId: string,
    startX: number,
    startY: number
  ) => void;
  updateDragPreview: (x: number, y: number) => void;
  clearDragPreview: () => void;
  endCanvasDrag: () => void;
}

const positionKey = (x: number, y: number) => `${x},${y}`;

// Generate unique random positions using Fisher-Yates shuffle
const generateUniqueRandomPositions = (
  gridSize: number,
  count: number
): Array<{ x: number; y: number }> => {
  // Create array of all possible positions
  const allPositions: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      allPositions.push({ x, y });
    }
  }

  // Fisher-Yates shuffle
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }

  // Take first 'count' positions
  return allPositions.slice(0, count);
};

export const useGridStore = create<GridState>((set, get) => ({
  gridSize: 20,
  components: new Map(),
  panOffset: { x: 0, y: 0 },
  zoom: 1,
  selectedComponentId: null,
  invalidCount: 5,

  draggedComponentType: null,
  draggingComponentId: null,
  dragStartGridPos: null,
  previewCell: null,

  setGridSize: (size: number) => set({ gridSize: size }),

  setInvalidCount: (count: number) =>
    set({ invalidCount: Math.min(count, get().gridSize * get().gridSize) }),

  generateGrid: (containerWidth: number, containerHeight: number) => {
    const { gridSize, invalidCount, resetZoom } = get();
    const newComponents = new Map<string, Component>();

    // Generate unique random positions
    const randomPositions = generateUniqueRandomPositions(
      gridSize,
      Math.min(invalidCount, gridSize * gridSize)
    );

    // Add invalid components at those positions
    randomPositions.forEach(({ x, y }) => {
      const key = positionKey(x, y);
      newComponents.set(key, {
        id: `invalid-${x}-${y}`,
        type: "invalid",
        x,
        y,
      });
    });

    set({
      components: newComponents,
      selectedComponentId: null,
    });

    // Center the grid
    resetZoom(containerWidth, containerHeight);
  },

  addComponent: (component: Component) => {
    const components = new Map(get().components);
    const key = positionKey(component.x, component.y);
    components.set(key, component);
    set({ components });
  },

  removeComponent: (id: string) => {
    const components = new Map(get().components);
    for (const [key, component] of components.entries()) {
      if (component.id === id) {
        components.delete(key);
        break;
      }
    }
    set({ components, selectedComponentId: null });
  },

  moveComponent: (id: string, x: number, y: number) => {
    const components = new Map(get().components);
    let componentToMove: Component | null = null;
    let oldKey: string | null = null;

    // Find and remove from old position
    for (const [key, component] of components.entries()) {
      if (component.id === id) {
        componentToMove = component;
        oldKey = key;
        break;
      }
    }

    if (componentToMove && oldKey) {
      components.delete(oldKey);
      const newComponent = { ...componentToMove, x, y };
      const newKey = positionKey(x, y);
      components.set(newKey, newComponent);
      set({ components });
    }
  },

  updatePanZoom: (panOffset: { x: number; y: number }, zoom: number) => {
    set({ panOffset, zoom });
  },

  setSelectedComponent: (id: string | null) => {
    set({ selectedComponentId: id });
  },

  clearComponents: () => {
    const components = new Map(get().components);
    // Keep only invalid cells
    for (const [key, component] of Array.from(components.entries())) {
      if (component.type !== "invalid") {
        components.delete(key);
      }
    }
    set({ components, selectedComponentId: null });
  },

  getComponentAt: (x: number, y: number) => {
    return get().components.get(positionKey(x, y));
  },

  resetZoom: (containerWidth: number, containerHeight: number) => {
    const { gridSize } = get();
    const gridPixelSize = gridSize * CELL_SIZE;

    const centerX = (containerWidth - gridPixelSize) / 2;
    const centerY = (containerHeight - gridPixelSize) / 2;

    set({ panOffset: { x: centerX, y: centerY }, zoom: 1 });
  },

  setDraggedComponentType: (type: ComponentType | null) =>
    set({ draggedComponentType: type }),

  startDraggingComponent: (
    componentId: string,
    startX: number,
    startY: number
  ) => {
    const component = Array.from(get().components.values()).find(
      (c) => c.id === componentId
    );
    set({
      draggingComponentId: componentId,
      dragStartGridPos: { x: startX, y: startY },
      draggedComponentType: component?.type ?? null,
      selectedComponentId: componentId,
    });
  },

  updateDragPreview: (x: number, y: number) => {
    const { gridSize } = get();
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      set({ previewCell: { x, y } });
    } else {
      set({ previewCell: null });
    }
  },

  clearDragPreview: () => set({ previewCell: null }),

  endCanvasDrag: () => {
    const { draggingComponentId, previewCell, components } = get();

    if (draggingComponentId && previewCell) {
      const targetComponent = Array.from(components.values()).find(
        (c) => c.x === previewCell.x && c.y === previewCell.y
      );

      // Only move if target cell is empty
      if (!targetComponent) {
        get().moveComponent(draggingComponentId, previewCell.x, previewCell.y);
      }
    }

    set({
      draggingComponentId: null,
      dragStartGridPos: null,
      draggedComponentType: null,
      previewCell: null,
    });
  },
}));
