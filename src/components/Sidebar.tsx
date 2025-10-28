import { useDraggable } from "@dnd-kit/core";
import type { ComponentType } from "@/lib/types";
import { COMPONENT_COLORS, CELL_SIZE } from "@/lib/constants";
import { getIconForComponentType } from "@/lib/componentUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      data: { type, label },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0 : 1,
      }
    : undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={{
            ...style,
            backgroundColor: color,
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
          }}
          {...listeners}
          {...attributes}
          className="flex items-center justify-center text-white text-2xl rounded cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity"
        >
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const components: DraggableComponentProps[] = [
    {
      type: "light",
      label: "Light",
      icon: getIconForComponentType("light"),
      color: COMPONENT_COLORS["light"],
    },
    {
      type: "air_supply",
      label: "Air Supply",
      icon: getIconForComponentType("air_supply"),
      color: COMPONENT_COLORS["air_supply"],
    },
    {
      type: "air_return",
      label: "Air Return",
      icon: getIconForComponentType("air_return"),
      color: COMPONENT_COLORS["air_return"],
    },
    {
      type: "smoke_detector",
      label: "Smoke Detector",
      icon: getIconForComponentType("smoke_detector"),
      color: COMPONENT_COLORS["smoke_detector"],
    },
  ];

  return (
    <div className="w-fit bg-background border-r border-border p-4">
      <div className="flex flex-col gap-3">
        {components.map((component) => (
          <DraggableComponent key={component.type} {...component} />
        ))}
      </div>
    </div>
  );
}
