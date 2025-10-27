import { useEffect, useRef, useState } from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { useGridStore } from '../store/gridStore';
import type { Component, ComponentType } from '../store/gridStore';
import { FaLightbulb, FaWind, FaFire } from 'react-icons/fa';
import { TbAirConditioning } from 'react-icons/tb';

const CELL_SIZE = 40; // pixels per 0.6m cell

const getComputedColor = (varName: string): string => {
  if (typeof window === 'undefined') return '#000';
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue(varName).trim();
};

const COMPONENT_COLORS: Record<ComponentType, string> = {
  light: 'oklch(0.7686 0.1647 70.0804)', // chart-4 (amber)
  air_supply: 'oklch(0.6231 0.1880 259.8145)', // chart-2 (cyan)
  air_return: 'oklch(0.6056 0.2189 292.7172)', // chart-3 (pink)
  smoke_detector: 'oklch(0.5523 0.1927 32.7272)', // destructive (red)
  invalid: 'oklch(0.9461 0 0)', // muted
};

const getIconForComponentType = (type: ComponentType) => {
  switch (type) {
    case 'light':
      return <FaLightbulb />;
    case 'air_supply':
      return <TbAirConditioning />;
    case 'air_return':
      return <FaWind />;
    case 'smoke_detector':
      return <FaFire />;
    default:
      return null;
  }
};

export function GridCanvas({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement> }) {
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewCell, setPreviewCell] = useState<{ x: number; y: number } | null>(null);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);

  const { setNodeRef } = useDroppable({ id: 'grid-canvas' });
  const { active } = useDndContext();

  const {
    gridSize,
    components,
    panOffset,
    zoom,
    selectedComponentId,
    updatePanZoom,
    setSelectedComponent,
    removeComponent,
    moveComponent,
  } = useGridStore();

  // Handle mouse wheel for zoom
  useEffect(() => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
      updatePanZoom(panOffset, newZoom);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom, panOffset, updatePanZoom]);

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to grid coordinates
    const gridX = Math.floor((x - panOffset.x) / (CELL_SIZE * zoom));
    const gridY = Math.floor((y - panOffset.y) / (CELL_SIZE * zoom));

    // Check if clicking on a component
    const component = Array.from(components.values()).find(
      (c) => c.x === gridX && c.y === gridY && c.type !== 'invalid'
    );

    if (component) {
      setSelectedComponent(component.id);
      // Start dragging the component
      setDraggingComponentId(component.id);
      setDragStart({ x: gridX, y: gridY });
    } else {
      setSelectedComponent(null);
      setDraggingComponentId(null);
      // Start panning
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle dragging existing component on grid
    if (draggingComponentId) {
      const canvas = localCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const gridX = Math.floor((x - panOffset.x) / (CELL_SIZE * zoom));
      const gridY = Math.floor((y - panOffset.y) / (CELL_SIZE * zoom));

      // Validate position
      if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
        setPreviewCell({ x: gridX, y: gridY });
      } else {
        setPreviewCell(null);
      }
      return;
    }

    if (!isPanning) {
      // Track preview cell when dragging component from library
      if (active?.data.current?.type) {
        const canvas = localCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gridX = Math.floor((x - panOffset.x) / (CELL_SIZE * zoom));
        const gridY = Math.floor((y - panOffset.y) / (CELL_SIZE * zoom));

        // Validate position
        if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
          setPreviewCell({ x: gridX, y: gridY });
        } else {
          setPreviewCell(null);
        }
      } else {
        setPreviewCell(null);
      }
      return;
    }

    // Pan the canvas
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    updatePanZoom({ x: newX, y: newY }, zoom);
  };

  const handleMouseUp = () => {
    // Complete component drag
    if (draggingComponentId && previewCell) {
      const targetComponent = Array.from(components.values()).find(
        (c) => c.x === previewCell.x && c.y === previewCell.y
      );

      // Only move if target cell is empty (not occupied or invalid)
      if (!targetComponent) {
        moveComponent(draggingComponentId, previewCell.x, previewCell.y);
      }
    }

    setDraggingComponentId(null);
    setIsPanning(false);
    setPreviewCell(null);
  };

  // Handle keyboard for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedComponentId
      ) {
        e.preventDefault();
        removeComponent(selectedComponentId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, removeComponent]);

  // Render canvas
  useEffect(() => {
    const canvas = localCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas - use background color
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim() || 'oklch(0.9911 0 0)';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw grid lines - use border color
    const gridColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--border')
      .trim() || 'oklch(0.9037 0 0)';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1 / zoom;

    for (let i = 0; i <= gridSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, gridSize * CELL_SIZE);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(gridSize * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw components - just colored background
    components.forEach((component: Component) => {
      const x = component.x * CELL_SIZE;
      const y = component.y * CELL_SIZE;
      const isSelected = component.id === selectedComponentId;

      if (component.type !== 'invalid') {
        // Draw colored background
        ctx.fillStyle = COMPONENT_COLORS[component.type];
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      } else {
        // Draw invalid cell
        ctx.fillStyle = COMPONENT_COLORS[component.type];
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }

      // Highlight selected component
      if (isSelected && component.type !== 'invalid') {
        const selectedColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--primary')
          .trim() || 'oklch(0.8348 0.1302 160.9080)';
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 4 / zoom;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    });

    // Draw preview cell
    if (previewCell) {
      const x = previewCell.x * CELL_SIZE;
      const y = previewCell.y * CELL_SIZE;

      let previewColor: string;

      // Determine preview color based on drag source
      if (draggingComponentId) {
        // Dragging existing component
        const component = Array.from(components.values()).find(
          (c) => c.id === draggingComponentId
        );
        previewColor = component ? COMPONENT_COLORS[component.type] : 'oklch(0.5 0 0)';
      } else if (active?.data.current?.type) {
        // Dragging from library
        previewColor = COMPONENT_COLORS[active.data.current.type];
      } else {
        previewColor = 'oklch(0.5 0 0)';
      }

      // Semi-transparent fill
      ctx.fillStyle = previewColor + '40'; // 40 = ~25% opacity in hex
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

      // Dashed border
      ctx.strokeStyle = previewColor;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [gridSize, components, panOffset, zoom, selectedComponentId, previewCell, active, draggingComponentId]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background"
    >
      <canvas
        ref={(node) => {
          localCanvasRef.current = node;
          if (canvasRef) canvasRef.current = node;
          setNodeRef(node);
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-move"
      />

      {/* Icon overlay layer */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from(components.values()).map((component) => {
          if (component.type === 'invalid') return null;

          const left = panOffset.x + component.x * CELL_SIZE * zoom;
          const top = panOffset.y + component.y * CELL_SIZE * zoom;
          const size = CELL_SIZE * zoom;

          return (
            <div
              key={component.id}
              className="absolute flex items-center justify-center text-white transition-all"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${size}px`,
                height: `${size}px`,
                fontSize: `${size * 0.6}px`,
              }}
            >
              {getIconForComponentType(component.type)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

