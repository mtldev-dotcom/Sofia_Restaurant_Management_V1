import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { FloorPlanElement } from "@/store/floorPlanStore";

interface PropertiesPanelProps {
  selectedElement: FloorPlanElement;
  onClose: () => void;
}

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
    <Panel variant="floating" className="fixed right-4 top-24 w-64 z-10">
      <PanelHeader className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Properties</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </PanelHeader>
      <PanelBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="element-name">Element Name</Label>
            <Input 
              id="element-name"
              value={name}
              onChange={handleNameChange}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Position</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="position-x" className="text-xs text-gray-500">X</Label>
                <Input 
                  id="position-x"
                  type="number"
                  value={posX}
                  onChange={handlePosXChange}
                  className="py-1 px-2 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="position-y" className="text-xs text-gray-500">Y</Label>
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
            <Label>Size</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="size-width" className="text-xs text-gray-500">Width</Label>
                <Input 
                  id="size-width"
                  type="number"
                  value={width}
                  onChange={handleWidthChange}
                  className="py-1 px-2 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="size-height" className="text-xs text-gray-500">Height</Label>
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
            <Label htmlFor="element-rotation">Rotation</Label>
            <Slider
              id="element-rotation"
              min={0}
              max={360}
              step={1}
              value={[rotation]}
              onValueChange={handleRotationChange}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0°</span>
              <span>180°</span>
              <span>360°</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="element-color">Color</Label>
            <Select value={color} onValueChange={handleColorChange}>
              <SelectTrigger id="element-color" className="mt-1">
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="gray">Gray</SelectItem>
                <SelectItem value="beige">Beige</SelectItem>
                <SelectItem value="brown">Brown</SelectItem>
                <SelectItem value="green">Green</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
};

export default PropertiesPanel;
