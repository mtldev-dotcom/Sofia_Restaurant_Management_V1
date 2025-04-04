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
  Loader2, Trash2, AlertCircle
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { FloorPlan } from "@shared/schema";
import BackgroundSettings from "@/components/BackgroundSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Sidebar = () => {
  console.log("Rendering Sidebar component");
  
  const startDrag = useFloorPlanStore((state) => state.startDrag);
  const { loadFloorPlan } = useFloorPlanStore();
  const restaurantId = useFloorPlanStore((state) => state.restaurantId);
  const [selectedTab, setSelectedTab] = useState("elements");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [floorPlanToDelete, setFloorPlanToDelete] = useState<FloorPlan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
  
  // Handle initiating floor plan deletion
  const handleDeleteClick = (e: React.MouseEvent, floorPlan: FloorPlan) => {
    e.stopPropagation(); // Prevent loading the floor plan
    
    if (floorPlan.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default floor plans cannot be deleted",
        variant: "destructive"
      });
      return;
    }
    
    setFloorPlanToDelete(floorPlan);
    setDeleteDialogOpen(true);
  };
  
  // Handle confirming floor plan deletion
  const confirmDelete = async () => {
    if (!floorPlanToDelete || !restaurantId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/floorplans/${floorPlanToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete floor plan');
      }
      
      // Invalidate the floor plans query to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: ['/api/restaurants', restaurantId, 'floorplans'] 
      });
      
      toast({
        title: "Success",
        description: `Deleted floor plan: ${floorPlanToDelete.name}`,
      });
    } catch (error) {
      console.error("Error deleting floor plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete floor plan",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setFloorPlanToDelete(null);
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
      {/* Confirmation Dialog for Floor Plan Deletion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete Floor Plan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{floorPlanToDelete?.name}</strong>?
              This action cannot be undone and all associated seating areas will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Tabs 
        defaultValue="elements"
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
                    className="relative p-3 border border-border rounded-md hover:bg-accent/5 cursor-pointer transition-colors group"
                    onClick={() => handleLoadFloorPlan(floorPlan)}
                  >
                    <div className="font-medium text-foreground flex items-center justify-between">
                      <span className="flex items-center">
                        <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
                        {floorPlan.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {floorPlan.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center">
                            <Home className="h-3 w-3 mr-1" />
                            Default
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity ${floorPlan.isDefault ? 'text-muted cursor-not-allowed' : 'text-destructive'}`}
                          onClick={(e) => handleDeleteClick(e, floorPlan)}
                          disabled={floorPlan.isDefault}
                          title={floorPlan.isDefault ? "Cannot delete default floor plan" : "Delete floor plan"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
