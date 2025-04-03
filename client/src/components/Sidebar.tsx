import { useState, useEffect } from "react";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  CircleIcon, SquareIcon, RectangleHorizontalIcon, ArmchairIcon, 
  CircleDotIcon, BedDoubleIcon, PanelTopIcon, PanelTopCloseIcon, 
  GithubIcon, Flower2Icon, LayoutGrid, Calendar, Home, RefreshCw,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { FloorPlan } from "@shared/schema";
import BackgroundSettings from "@/components/BackgroundSettings";

const Sidebar = () => {
  const startDrag = useFloorPlanStore((state) => state.startDrag);
  const { loadFloorPlan } = useFloorPlanStore();
  const restaurantId = useFloorPlanStore((state) => state.restaurantId);
  const [selectedTab, setSelectedTab] = useState("elements");
  const { toast } = useToast();
  
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

  // Fetch floor plans when layouts tab is selected
  const { 
    data: floorPlans, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<FloorPlan[]>({
    queryKey: ['/api/restaurants', restaurantId, 'floorplans'],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const response = await fetch(`/api/restaurants/${restaurantId}/floorplans`);
      if (!response.ok) {
        console.error("Error fetching floor plans:", response.statusText);
        throw new Error('Failed to load floor plans');
      }
      
      return response.json();
    },
    enabled: !!restaurantId && selectedTab === "layouts",
  });

  // Calculate elements count for a floor plan
  const getElementsCount = (floorPlan: FloorPlan): number => {
    try {
      const layout = floorPlan.layout as any;
      return (layout?.elements?.length || 0);
    } catch (e) {
      return 0;
    }
  };

  // Handle loading a floor plan
  const handleLoadFloorPlan = async (floorPlan: FloorPlan) => {
    try {
      // Load the floor plan into the store
      loadFloorPlan(floorPlan);
      
      toast({
        title: "Success",
        description: `Loaded floor plan: ${floorPlan.name}`,
      });
      
      // Switch back to elements tab
      setSelectedTab("elements");
    } catch (error) {
      console.error("Error loading floor plan:", error);
      toast({
        title: "Error",
        description: "Failed to load floor plan",
        variant: "destructive"
      });
    }
  };

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
      <Tabs 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="h-full flex flex-col"
      >
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Your saved layouts</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={isLoading}
                className="h-8 px-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isLoading ? (
              <div className="py-8 flex items-center justify-center text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Loading layouts...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">
                <p>Error loading layouts</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()} 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : floorPlans && floorPlans.length > 0 ? (
              <div className="space-y-3">
                {floorPlans.map((floorPlan) => (
                  <div
                    key={floorPlan.id}
                    className="p-3 border border-border rounded-md hover:bg-accent/5 cursor-pointer transition-colors"
                    onClick={() => handleLoadFloorPlan(floorPlan)}
                  >
                    <div className="font-medium text-foreground flex items-center justify-between">
                      <span className="flex items-center">
                        <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
                        {floorPlan.name}
                      </span>
                      {floorPlan.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center">
                          <Home className="h-3 w-3 mr-1" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" /> 
                        {new Date(floorPlan.createdAt).toLocaleDateString()}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{getElementsCount(floorPlan)} elements</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-border rounded-md text-center">
                <p className="font-medium text-foreground">No layouts saved</p>
                <p className="text-xs text-muted-foreground mt-1">Save a layout to see it here</p>
              </div>
            )}
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
