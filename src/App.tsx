import { useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { GridCanvas } from './components/GridCanvas';
import { ComponentLibrary } from './components/ComponentLibrary';
import { GridConfig } from './components/GridConfig';
import { useGridStore } from './store/gridStore';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { generateGrid, addComponent, getComponentAt } = useGridStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || over.id !== 'grid-canvas') return;

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

    const gridX = Math.floor((canvasX - panOffset.x) / (40 * zoom));
    const gridY = Math.floor((canvasY - panOffset.y) / (40 * zoom));

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
        <GridConfig />
        <div className="flex-1 flex overflow-hidden">
          <ComponentLibrary />
          <GridCanvas canvasRef={canvasRef} />
        </div>
      </div>
      <DragOverlay />
    </DndContext>
  );
}

export default App;
