import type { ComponentType } from "./types";

export const COMPONENT_COLORS: Record<ComponentType, string> = {
  light: "oklch(0.7686 0.1647 70.0804)",
  air_supply: "oklch(0.6231 0.1880 259.8145)",
  air_return: "oklch(0.6056 0.2189 292.7172)",
  smoke_detector: "oklch(0.5523 0.1927 32.7272)",
  invalid: "oklch(0.9461 0 0)",
};

export const CELL_SIZE = 40; // pixels per 0.6m cell

export const MAX_GRID_SIZE = 200;
