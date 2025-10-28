import { useEffect, useRef, useState } from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { useGridStore } from "../store/gridStore";
import type { Component, ComponentType } from "@/lib/types";
import { COMPONENT_COLORS, CELL_SIZE } from "@/lib/constants";
import { getIconForComponentType } from "../lib/componentUtils";

const getComputedColor = (varName: string): string => {
  if (typeof window === "undefined") return "#000";
  const style = getComputedStyle(document.documentElement);
  const value = style.getPropertyValue(varName).trim();
  return value;
};

export function GridCanvas({
  canvasRef,
  containerRef: externalContainerRef,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { setNodeRef } = useDroppable({ id: "grid-canvas" });
  const { active } = useDndContext();

  const {
    gridSize,
    components,
    panOffset,
    zoom,
    selectedComponentId,
    draggingComponentId,
    draggedComponentType,
    previewCell,
    updatePanZoom,
    setSelectedComponent,
    removeComponent,
    generateGrid,
    startDraggingComponent,
    updateDragPreview,
    clearDragPreview,
    setDraggedComponentType,
    endCanvasDrag,
  } = useGridStore();

  // Initial grid generation on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      generateGrid(containerWidth, containerHeight);
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle mouse wheel for zoom
  useEffect(() => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const gridCenterX = (centerX - panOffset.x) / (CELL_SIZE * zoom);
      const gridCenterY = (centerY - panOffset.y) / (CELL_SIZE * zoom);

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

      const newPanX = centerX - gridCenterX * CELL_SIZE * newZoom;
      const newPanY = centerY - gridCenterY * CELL_SIZE * newZoom;

      updatePanZoom({ x: newPanX, y: newPanY }, newZoom);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoom, panOffset, updatePanZoom]);

  // Handle pointer down for panning/dragging; capture pointer to continue receiving moves
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;

    // Capture pointer so we continue to receive pointermove events during drag/pan
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to grid coordinates
    const gridX = Math.floor((x - panOffset.x) / (CELL_SIZE * zoom));
    const gridY = Math.floor((y - panOffset.y) / (CELL_SIZE * zoom));

    // Check if clicking on a component
    const component = Array.from(components.values()).find(
      (c) => c.x === gridX && c.y === gridY && c.type !== "invalid"
    );

    if (component) {
      // Start dragging the component
      startDraggingComponent(component.id, gridX, gridY);
    } else {
      setSelectedComponent(null);
      // Start panning
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  // (moved pointer move logic into global handler below)

  const handlePointerUp = () => {
    if (draggingComponentId) {
      endCanvasDrag();
    }
    setIsPanning(false);
  };

  // Global pointermove to ensure preview updates even when overlays or dnd overlay intercept events
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const canvas = localCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Pan regardless of being inside the canvas bounds
      if (isPanning) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        updatePanZoom({ x: newX, y: newY }, zoom);
      }
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inside) {
        if (!draggingComponentId && !isPanning) {
          setDraggedComponentType(null);
          clearDragPreview();
        }
        return;
      }

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gridX = Math.floor((x - panOffset.x) / (CELL_SIZE * zoom));
      const gridY = Math.floor((y - panOffset.y) / (CELL_SIZE * zoom));

      if (draggingComponentId) {
        updateDragPreview(gridX, gridY);
        return;
      }

      if (active?.data.current?.type) {
        setDraggedComponentType(active.data.current.type as ComponentType);
        updateDragPreview(gridX, gridY);
      } else if (!isPanning) {
        setDraggedComponentType(null);
        clearDragPreview();
      }
    };

    window.addEventListener("pointermove", handleGlobalPointerMove, {
      passive: true,
    });
    return () =>
      window.removeEventListener("pointermove", handleGlobalPointerMove);
  }, [
    panOffset,
    zoom,
    active,
    draggingComponentId,
    isPanning,
    dragStart,
    updatePanZoom,
    updateDragPreview,
    setDraggedComponentType,
    clearDragPreview,
  ]);

  // Handle keyboard for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedComponentId
      ) {
        e.preventDefault();
        removeComponent(selectedComponentId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedComponentId, removeComponent]);

  // Render canvas
  useEffect(() => {
    const canvas = localCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas - use background color
    const bgColor = getComputedColor("--background");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw grid lines - use border color
    const gridColor = getComputedColor("--border");
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

      if (component.type !== "invalid") {
        // Draw colored background
        ctx.fillStyle = COMPONENT_COLORS[component.type];
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      } else {
        // Draw invalid cell
        ctx.fillStyle = COMPONENT_COLORS[component.type];
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }

      // Highlight selected component
      if (isSelected && component.type !== "invalid") {
        const selectedColor = getComputedColor("--primary");
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 4 / zoom;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    });

    ctx.restore();
  }, [
    gridSize,
    components,
    panOffset,
    zoom,
    selectedComponentId,
    previewCell,
    active,
    draggingComponentId,
    containerRef,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background"
    >
      <canvas
        ref={(node) => {
          localCanvasRef.current = node;
          if (canvasRef && node) canvasRef.current = node;
          setNodeRef(node);
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="cursor-move touch-none"
      />

      {/* Icon overlay layer */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from(components.values()).map((component) => {
          if (component.type === "invalid") return null;

          const left = panOffset.x + component.x * CELL_SIZE * zoom;
          const top = panOffset.y + component.y * CELL_SIZE * zoom;
          const size = CELL_SIZE * zoom;

          return (
            <div
              key={component.id}
              className="absolute flex items-center justify-center text-white"
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

        {/* Preview icon for drop location */}
        {previewCell && draggedComponentType && (
          <div
            className="absolute flex items-center justify-center text-white"
            style={{
              left: `${panOffset.x + previewCell.x * CELL_SIZE * zoom}px`,
              top: `${panOffset.y + previewCell.y * CELL_SIZE * zoom}px`,
              width: `${CELL_SIZE * zoom}px`,
              height: `${CELL_SIZE * zoom}px`,
              fontSize: `${CELL_SIZE * zoom * 0.6}px`,
              opacity: 0.7,
              backgroundColor: COMPONENT_COLORS[draggedComponentType],
            }}
          >
            {getIconForComponentType(draggedComponentType)}
          </div>
        )}
      </div>
    </div>
  );
}
