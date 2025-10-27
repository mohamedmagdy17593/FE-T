import { create } from "zustand";

export type ComponentType =
  | "light"
  | "air_supply"
  | "air_return"
  | "smoke_detector"
  | "invalid";

export const COMPONENT_COLORS: Record<ComponentType, string> = {
  light: "oklch(0.7686 0.1647 70.0804)",
  air_supply: "oklch(0.6231 0.1880 259.8145)",
  air_return: "oklch(0.6056 0.2189 292.7172)",
  smoke_detector: "oklch(0.5523 0.1927 32.7272)",
  invalid: "oklch(0.9461 0 0)",
};

export const CELL_SIZE = 40; // pixels per 0.6m cell

export interface Component {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
}

interface GridState {
  gridSize: number;
  components: Map<string, Component>;
  panOffset: { x: number; y: number };
  zoom: number;
  selectedComponentId: string | null;
  invalidCount: number;

  // Actions
  setGridSize: (size: number) => void;
  setInvalidCount: (count: number) => void;
  generateGrid: () => void;
  addComponent: (component: Component) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  updatePanZoom: (panOffset: { x: number; y: number }, zoom: number) => void;
  setSelectedComponent: (id: string | null) => void;
  clearComponents: () => void;
  getComponentAt: (x: number, y: number) => Component | undefined;
  resetZoom: () => void;
}

const positionKey = (x: number, y: number) => `${x},${y}`;

export const useGridStore = create<GridState>((set, get) => ({
  gridSize: 20,
  components: new Map(),
  panOffset: { x: 0, y: 0 },
  zoom: 1,
  selectedComponentId: null,
  invalidCount: 5,

  setGridSize: (size: number) => set({ gridSize: size }),

  setInvalidCount: (count: number) =>
    set({ invalidCount: Math.min(count, get().gridSize * get().gridSize) }),

  generateGrid: () => {
    const { gridSize, invalidCount } = get();
    const newComponents = new Map<string, Component>();

    // Generate random invalid positions
    const positions = new Set<string>();
    while (positions.size < Math.min(invalidCount, gridSize * gridSize)) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      const key = positionKey(x, y);
      if (!positions.has(key)) {
        positions.add(key);
        newComponents.set(key, {
          id: `invalid-${x}-${y}`,
          type: "invalid",
          x,
          y,
        });
      }
    }

    set({
      components: newComponents,
      selectedComponentId: null,
      panOffset: { x: 0, y: 0 },
      zoom: 1,
    });
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

  resetZoom: () => {
    set({ panOffset: { x: 0, y: 0 }, zoom: 1 });
  },
}));
