export type ComponentType =
  | "light"
  | "air_supply"
  | "air_return"
  | "smoke_detector"
  | "invalid";

export interface Component {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
}
