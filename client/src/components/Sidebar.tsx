import { useState } from "react";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CircleIcon, SquareIcon, RectangleHorizontalIcon, ArmchairIcon, CircleDotIcon, BedDoubleIcon, PanelTopIcon, PanelTopCloseIcon, GithubIcon, Flower2Icon } from "lucide-react";
import BackgroundSettings from "@/components/BackgroundSettings";

const Sidebar = () => {
  const startDrag = useFloorPlanStore((state) => state.startDrag);
  
  // Furniture element categories with modernized visualization
  const tables = [
    { type: "round", size: "small", label: "Round Small", width: 12, height: 12, isRound: true, icon: CircleIcon },
    { type: "round", size: "large", label: "Round Large", width: 16, height: 16, isRound: true, icon: CircleIcon },
    { type: "square", size: "small", label: "Square Small", width: 12, height: 12, icon: SquareIcon },
    { type: "square", size: "large", label: "Square Large", width: 16, height: 16, icon: SquareIcon },
    { type: "rectangle", size: "small", label: "Rectangle S", width: 16, height: 10, icon: RectangleHorizontalIcon },
    { type: "rectangle", size: "large", label: "Rectangle L", width: 20, height: 12, icon: RectangleHorizontalIcon },
  ];
  
  const chairs = [
    { type: "standard", label: "Standard", width: 8, height: 8, icon: ArmchairIcon },
    { type: "armchair", label: "Armchair", width: 10, height: 10, icon: ArmchairIcon },
    { type: "stool", label: "Stool", width: 6, height: 6, isRound: true, icon: CircleDotIcon },
    { type: "booth", label: "Booth", width: 16, height: 6, icon: BedDoubleIcon },
  ];
  
  const fixtures = [
    { type: "bar", label: "Bar Counter", width: 20, height: 8, icon: PanelTopIcon },
    { type: "wall", label: "Wall Divider", width: 20, height: 4, icon: PanelTopCloseIcon },
    { type: "plant", label: "Plant", width: 8, height: 8, isRound: true, icon: Flower2Icon },
    { type: "entrance", label: "Entrance", width: 12, height: 6, icon: GithubIcon },
  ];

  const handleDragStart = (
    e: React.MouseEvent, 
    elementType: string, 
    elementCategory: string, 
    details: any
  ) => {
    e.preventDefault();
    
    startDrag({
      type: elementType,
      category: elementCategory,
      ...details
    });
  };

  // Render furniture item with better visualization
  const renderFurnitureItem = (item: any, category: string, index: number) => {
    const Icon = item.icon;
    
    return (
      <div
        key={`${category}-${index}`}
        className="p-3 border border-border rounded-md bg-card hover:bg-accent/10 cursor-grab flex flex-col items-center transition-colors"
        onMouseDown={(e) => handleDragStart(e, item.type, category, item)}
      >
        <div className="w-12 h-12 flex items-center justify-center text-primary">
          <Icon className="w-8 h-8" />
        </div>
        <span className="mt-1 text-xs text-muted-foreground font-medium">{item.label}</span>
      </div>
    );
  };

  return (
    <div className="w-72 border-r border-border bg-card h-full">
      <Tabs defaultValue="elements" className="h-full flex flex-col">
        <div className="border-b border-border">
          <TabsList className="w-full justify-start rounded-none border-b p-0">
            <TabsTrigger 
              value="elements" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6"
            >
              Elements
            </TabsTrigger>
            <TabsTrigger 
              value="layouts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6"
            >
              Layouts
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="elements" className="p-4 m-0 space-y-6 h-full">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Tables</h3>
              <div className="grid grid-cols-2 gap-3">
                {tables.map((table, index) => renderFurnitureItem(table, 'table', index))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Chairs</h3>
              <div className="grid grid-cols-2 gap-3">
                {chairs.map((chair, index) => renderFurnitureItem(chair, 'chair', index))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Fixtures</h3>
              <div className="grid grid-cols-2 gap-3">
                {fixtures.map((fixture, index) => renderFurnitureItem(fixture, 'fixture', index))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layouts" className="p-4 m-0 h-full">
            <p className="text-sm text-muted-foreground mb-4">Your saved layouts will appear here.</p>
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-md hover:bg-accent/10 cursor-pointer transition-colors">
                <p className="font-medium text-foreground">No layouts saved</p>
                <p className="text-xs text-muted-foreground mt-1">Save a layout to see it here</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-4 m-0 h-full">
            <p className="text-sm text-muted-foreground mb-4">Configure your floor plan settings.</p>
            
            <div className="space-y-6">
              {/* Canvas Settings */}
              <div>
                <Label className="text-sm font-medium mb-2">Canvas Size</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="width" className="text-xs text-muted-foreground">Width (px)</Label>
                    <Input 
                      id="width"
                      type="number"
                      className="mt-1"
                      defaultValue="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs text-muted-foreground">Height (px)</Label>
                    <Input 
                      id="height"
                      type="number"
                      className="mt-1"
                      defaultValue="800"
                    />
                  </div>
                </div>
              </div>
              
              {/* Background Settings */}
              <BackgroundSettings />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Sidebar;
