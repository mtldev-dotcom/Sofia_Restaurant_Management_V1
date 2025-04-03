import { useState, useRef, ChangeEvent } from "react";
import { useFloorPlanStore, type BackgroundSettings as BackgroundSettingsType } from "@/store/floorPlanStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PaintBucket, Upload, Image, Grid, Trash } from "lucide-react";

const BackgroundSettings = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"color" | "image" | "grid">("color");
  
  // Get background settings from the store
  const { background, updateBackground, setBackgroundImage } = useFloorPlanStore();
  
  // Handle color change
  const handleColorChange = (color: string) => {
    updateBackground({ color });
  };
  
  // Handle opacity change
  const handleOpacityChange = (values: number[]) => {
    updateBackground({ opacity: values[0] });
  };
  
  // Handle image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setBackgroundImage(imageUrl);
        setActiveTab("image");
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle remove image
  const handleRemoveImage = () => {
    setBackgroundImage(null);
    setActiveTab("color");
  };
  
  // Handle grid settings changes
  const handleGridSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value);
    if (!isNaN(size) && size > 0) {
      updateBackground({ gridSize: size });
    }
  };
  
  const handleGridColorChange = (color: string) => {
    updateBackground({ gridColor: color });
  };
  
  const handleShowGridChange = (show: boolean) => {
    updateBackground({ showGrid: show });
  };
  
  // Common background colors for easy selection
  const commonColors = [
    "#FFFFFF", // White
    "#F5F5F5", // Light Gray
    "#E0E0E0", // Gray
    "#F0F8FF", // Alice Blue
    "#F5F5DC", // Beige
    "#FFFACD", // Lemon Chiffon
    "#FFE4E1", // Misty Rose
    "#E6F9FF"  // Light Blue
  ];
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Background</h3>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="color" className="flex items-center justify-center">
              <PaintBucket className="h-4 w-4 mr-1.5" />
              Color
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center justify-center">
              <Image className="h-4 w-4 mr-1.5" />
              Image
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center justify-center">
              <Grid className="h-4 w-4 mr-1.5" />
              Grid
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="color" className="space-y-4">
            <div>
              <Label htmlFor="bg-color" className="text-xs text-muted-foreground">Background Color</Label>
              <Input 
                id="bg-color"
                type="color"
                value={background.color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 p-1 mt-1"
              />
              
              <div className="grid grid-cols-4 gap-2 mt-3">
                {commonColors.map((color, index) => (
                  <div
                    key={index}
                    className="w-full aspect-square rounded-md cursor-pointer border border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Opacity</Label>
              <div className="flex items-center mt-1">
                <Slider
                  defaultValue={[background.opacity]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleOpacityChange}
                  className="flex-1"
                />
                <span className="text-xs ml-3 w-10 text-center">
                  {Math.round(background.opacity * 100)}%
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="space-y-4">
            {background.imageUrl ? (
              <div className="space-y-3">
                <div className="border border-border rounded-md overflow-hidden aspect-video">
                  <img
                    src={background.imageUrl}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Opacity</Label>
                  <div className="flex items-center mt-1">
                    <Slider
                      defaultValue={[background.opacity]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleOpacityChange}
                      className="flex-1"
                    />
                    <span className="text-xs ml-3 w-10 text-center">
                      {Math.round(background.opacity * 100)}%
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleRemoveImage}
                >
                  <Trash className="h-4 w-4 mr-1.5" />
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="border border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Upload Background Image</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to browse or drag and drop</p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="grid" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-grid" className="text-sm font-medium cursor-pointer">
                Show Grid
              </Label>
              <Switch
                id="show-grid"
                checked={background.showGrid}
                onCheckedChange={handleShowGridChange}
              />
            </div>
            
            <div>
              <Label htmlFor="grid-size" className="text-xs text-muted-foreground">Grid Size</Label>
              <Input 
                id="grid-size"
                type="number"
                min="5"
                max="100"
                value={background.gridSize}
                onChange={handleGridSizeChange}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">Size in pixels between grid lines</p>
            </div>
            
            <div>
              <Label htmlFor="grid-color" className="text-xs text-muted-foreground">Grid Color</Label>
              <Input 
                id="grid-color"
                type="color"
                value={background.gridColor}
                onChange={(e) => handleGridColorChange(e.target.value)}
                className="h-10 p-1 mt-1"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BackgroundSettings;