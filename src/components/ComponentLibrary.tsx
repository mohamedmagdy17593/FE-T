import { useDraggable } from '@dnd-kit/core';
import type { ComponentType } from '../store/gridStore';
import { FaLightbulb, FaWind, FaFire } from 'react-icons/fa';
import { TbAirConditioning } from 'react-icons/tb';

interface DraggableComponentProps {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

function DraggableComponent({
  type,
  label,
  icon,
  color,
}: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `component-${type}`,
      data: { type },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-3 p-3 bg-card border-2 border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-border/60 transition-colors"
    >
      <div
        className="w-10 h-10 rounded flex items-center justify-center text-white text-xl"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}

export function ComponentLibrary() {
  const components: DraggableComponentProps[] = [
    {
      type: 'light',
      label: 'Light',
      icon: <FaLightbulb />,
      color: 'oklch(0.7686 0.1647 70.0804)', // chart-4 (amber)
    },
    {
      type: 'air_supply',
      label: 'Air Supply',
      icon: <TbAirConditioning />,
      color: 'oklch(0.6231 0.1880 259.8145)', // chart-2 (cyan)
    },
    {
      type: 'air_return',
      label: 'Air Return',
      icon: <FaWind />,
      color: 'oklch(0.6056 0.2189 292.7172)', // chart-3 (pink)
    },
    {
      type: 'smoke_detector',
      label: 'Smoke Detector',
      icon: <FaFire />,
      color: 'oklch(0.5523 0.1927 32.7272)', // destructive (red)
    },
  ];

  return (
    <div className="w-64 bg-muted border-r border-border p-4">
      <h2 className="text-lg font-bold mb-4 text-foreground">Components</h2>
      <div className="space-y-3">
        {components.map((component) => (
          <DraggableComponent key={component.type} {...component} />
        ))}
      </div>
      <div className="mt-6 p-3 bg-accent border border-border rounded-lg">
        <p className="text-xs text-accent-foreground">
          <strong>Tip:</strong> Drag components onto the grid to place them.
          Click to select, press Delete to remove.
        </p>
      </div>
    </div>
  );
}

