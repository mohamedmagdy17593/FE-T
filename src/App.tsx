import { useRef } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDndContext,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { Canvas } from "./components/Canvas";
import { Sidebar } from "./components/Sidebar";
import { Nav } from "./components/Nav";
import { useGridStore } from "./store/gridStore";
import type { ComponentType } from "@/lib/types";
import { COMPONENT_COLORS, CELL_SIZE } from "@/lib/constants";
import { getIconForComponentType } from "./lib/componentUtils";

function DragOverlayContent() {
  const { active } = useDndContext();

  if (!active || !active.data.current?.type) {
    return null;
  }

  const type = active.data.current.type as ComponentType;
  const label = active.data.current.label as string;
  const color = COMPONENT_COLORS[type];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          backgroundColor: color,
          borderRadius: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "24px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        {getIconForComponentType(type)}
      </div>
      <div
        style={{
          backgroundColor: "hsl(var(--foreground))",
          color: "hsl(var(--background))",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { addComponent, getComponentAt, clearDragPreview } = useGridStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || over.id !== "grid-canvas") return;

    const componentType = active.data.current?.type;
    if (!componentType) return;

    // Use previewCell calculated by GridCanvas tracking
    const store = useGridStore.getState();
    const { previewCell, gridSize } = store;
    if (!previewCell) return;
    const { x: gridX, y: gridY } = previewCell;
    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize)
      return;

    // Check if cell is occupied
    const existingComponent = getComponentAt(gridX, gridY);
    if (existingComponent) {
      return;
    }

    // Add component
    const id = `${componentType}-${Date.now()}-${Math.random()}`;
    addComponent({
      id,
      type: componentType,
      x: gridX,
      y: gridY,
    });

    // Clear preview after successful drop
    clearDragPreview();
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col">
        <Nav containerRef={containerRef} />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <Canvas canvasRef={canvasRef} containerRef={containerRef} />
        </div>
      </div>
      <DragOverlay>
        <DragOverlayContent />
      </DragOverlay>
    </DndContext>
  );
}

export default App;
