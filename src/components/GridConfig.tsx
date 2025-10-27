import { useState } from "react";
import { useGridStore } from "../store/gridStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FaRedo, FaTrash, FaSearchPlus } from "react-icons/fa";

export function GridConfig() {
  const {
    gridSize,
    invalidCount,
    zoom,
    setGridSize,
    setInvalidCount,
    generateGrid,
    clearComponents,
    resetZoom,
  } = useGridStore();

  const [inputSize, setInputSize] = useState(gridSize.toString());
  const [inputInvalid, setInputInvalid] = useState(invalidCount.toString());

  const handleGenerate = () => {
    const size = parseInt(inputSize);
    const invalid = parseInt(inputInvalid);

    if (!isNaN(size) && size > 0 && size <= 200) {
      setGridSize(size);
    }
    if (!isNaN(invalid) && invalid >= 0) {
      setInvalidCount(invalid);
    }
    generateGrid();
  };

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            Grid Size:
          </label>
          <Input
            type="number"
            min="1"
            max="200"
            value={inputSize}
            onChange={(e) => setInputSize(e.target.value)}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">cells</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            Invalid Positions:
          </label>
          <Input
            type="number"
            min="0"
            value={inputInvalid}
            onChange={(e) => setInputInvalid(e.target.value)}
            className="w-20"
          />
        </div>

        <Button onClick={handleGenerate} className="gap-2">
          <FaRedo className="w-3 h-3" />
          Generate Grid
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Zoom: {(zoom * 100).toFixed(0)}%
          </span>
          <Button
            onClick={resetZoom}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FaSearchPlus className="w-3 h-3" />
            Reset
          </Button>
        </div>

        <Button
          onClick={clearComponents}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <FaTrash className="w-3 h-3" />
          Clear All
        </Button>
      </div>
    </div>
  );
}
