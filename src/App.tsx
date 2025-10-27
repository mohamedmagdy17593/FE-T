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
import { GridCanvas } from "./components/GridCanvas";
import { ComponentLibrary } from "./components/ComponentLibrary";
import { GridConfig } from "./components/GridConfig";
import {
  useGridStore,
  COMPONENT_COLORS,
  CELL_SIZE,
  type ComponentType,
} from "./store/gridStore";
import { getIconForComponentType } from "./lib/componentUtils";

function DragOverlayContent() {
  const { active } = useDndContext();

  if (!active || !active.data.current?.type) {
    return null;
  }

  const type = active.data.current.type as ComponentType;
  const color = COMPONENT_COLORS[type] || "#000";

  return (
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
        transform: "translate(-50%, -50%)",
      }}
    >
      {getIconForComponentType(type)}
    </div>
  );
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { addComponent, getComponentAt } = useGridStore();

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

    // Get drop position relative to canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const store = useGridStore.getState();
    const { panOffset, zoom } = store;

    // Calculate grid position from drop coordinates
    const dropX = (active.rect.current.initial?.left ?? 0) + event.delta.x;
    const dropY = (active.rect.current.initial?.top ?? 0) + event.delta.y;

    const canvasX = dropX - rect.left;
    const canvasY = dropY - rect.top;

    const gridX = Math.floor((canvasX - panOffset.x) / (CELL_SIZE * zoom));
    const gridY = Math.floor((canvasY - panOffset.y) / (CELL_SIZE * zoom));

    // Validate position
    const { gridSize } = store;
    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) {
      return;
    }

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
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col">
        <GridConfig containerRef={containerRef} />
        <div className="flex-1 flex overflow-hidden">
          <ComponentLibrary />
          <GridCanvas canvasRef={canvasRef} containerRef={containerRef} />
        </div>
      </div>
      <DragOverlay>
        <DragOverlayContent />
      </DragOverlay>
    </DndContext>
  );
}

export default App;
