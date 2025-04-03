import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { FloorPlanElement } from "@/store/floorPlanStore";
import { X, RotateCcw, Type, Move, SquareIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  selectedElement: FloorPlanElement;
  onClose: () => void;
}

const colorOptions = [
  { value: "white", label: "White", class: "bg-white border border-gray-200" },
  { value: "gray", label: "Gray", class: "bg-gray-200" },
  { value: "beige", label: "Beige", class: "bg-amber-50" },
  { value: "brown", label: "Brown", class: "bg-amber-800" },
  { value: "green", label: "Green", class: "bg-green-100" },
  { value: "blue", label: "Blue", class: "bg-blue-100" },
  { value: "purple", label: "Purple", class: "bg-purple-100" },
];

const PropertiesPanel = ({ selectedElement, onClose }: PropertiesPanelProps) => {
  const updateElementProperty = useFloorPlanStore((state) => state.updateElementProperty);
  
  const [name, setName] = useState(selectedElement.name);
  const [posX, setPosX] = useState(selectedElement.x);
  const [posY, setPosY] = useState(selectedElement.y);
  const [width, setWidth] = useState(selectedElement.width);
  const [height, setHeight] = useState(selectedElement.height);
  const [rotation, setRotation] = useState(selectedElement.rotation);
  const [color, setColor] = useState(selectedElement.color || 'white');
  
  // Update state when selected element changes
  useEffect(() => {
    setName(selectedElement.name);
    setPosX(selectedElement.x);
    setPosY(selectedElement.y);
    setWidth(selectedElement.width);
    setHeight(selectedElement.height);
    setRotation(selectedElement.rotation);
    setColor(selectedElement.color || 'white');
  }, [selectedElement]);
  
  // Handlers for updating properties
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    updateElementProperty(selectedElement.id, 'name', value);
  };
  
  const handlePosXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPosX(value);
    updateElementProperty(selectedElement.id, 'x', value);
  };
  
  const handlePosYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPosY(value);
    updateElementProperty(selectedElement.id, 'y', value);
  };
  
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setWidth(value);
    updateElementProperty(selectedElement.id, 'width', value);
  };
  
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setHeight(value);
    updateElementProperty(selectedElement.id, 'height', value);
  };
  
  const handleRotationChange = (values: number[]) => {
    const value = values[0];
    setRotation(value);
    updateElementProperty(selectedElement.id, 'rotation', value);
  };
  
  const handleColorChange = (value: string) => {
    setColor(value);
    updateElementProperty(selectedElement.id, 'color', value);
  };
  
  return (
    <Card className="fixed right-4 top-24 w-72 z-10 shadow-lg border border-border bg-card">
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center text-sm font-medium">
          <h3 className="text-foreground">Element Properties</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-5">
        <div>
          <div className="flex items-center mb-2">
            <Type className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="element-name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
          </div>
          <Input 
            id="element-name"
            value={name}
            onChange={handleNameChange}
          />
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <Move className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Position
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="position-x" className="text-xs text-muted-foreground block mb-1">X</Label>
              <Input 
                id="position-x"
                type="number"
                value={posX}
                onChange={handlePosXChange}
                className="py-1 px-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="position-y" className="text-xs text-muted-foreground block mb-1">Y</Label>
              <Input 
                id="position-y"
                type="number"
                value={posY}
                onChange={handlePosYChange}
                className="py-1 px-2 text-sm"
              />
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <SquareIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Size
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="size-width" className="text-xs text-muted-foreground block mb-1">Width</Label>
              <Input 
                id="size-width"
                type="number"
                value={width}
                onChange={handleWidthChange}
                className="py-1 px-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="size-height" className="text-xs text-muted-foreground block mb-1">Height</Label>
              <Input 
                id="size-height"
                type="number"
                value={height}
                onChange={handleHeightChange}
                className="py-1 px-2 text-sm"
              />
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <RotateCcw className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="element-rotation" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Rotation
            </Label>
          </div>
          <Slider
            id="element-rotation"
            min={0}
            max={360}
            step={1}
            value={[rotation]}
            onValueChange={handleRotationChange}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0°</span>
            <span>{rotation}°</span>
            <span>360°</span>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="element-color" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Color
            </Label>
          </div>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleColorChange(option.value)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border",
                  option.class,
                  color === option.value && "ring-2 ring-primary ring-offset-2"
                )}
                title={option.label}
                type="button"
              />
            ))}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span>Element ID:</span>
            <span className="font-mono">{selectedElement.id.substring(0, 8)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Type:</span>
            <span className="capitalize">{selectedElement.category} / {selectedElement.type}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;
