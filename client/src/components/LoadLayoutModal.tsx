import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FloorPlan } from "@shared/schema";

interface LoadLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoadLayoutModal = ({ isOpen, onClose }: LoadLayoutModalProps) => {
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const { loadFloorPlan } = useFloorPlanStore();
  
  // Fetch available floor plans
  const { data: floorPlans, isLoading, error, refetch } = useQuery<FloorPlan[]>({
    queryKey: ['/api/floorplans'],
    enabled: isOpen,
  });
  
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);
  
  const handleLoadFloorPlan = () => {
    if (!selectedFloorPlan || !floorPlans) return;
    
    const floorPlan = floorPlans.find(fp => fp.id === selectedFloorPlan);
    
    if (!floorPlan) {
      toast({
        title: "Error",
        description: "Selected floor plan not found",
        variant: "destructive"
      });
      return;
    }
    
    loadFloorPlan(floorPlan);
    toast({
      title: "Success",
      description: `Loaded floor plan: ${floorPlan.name}`,
    });
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Load Floor Plan</DialogTitle>
          <DialogDescription>
            Select a previously saved floor plan to load
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="py-4 text-center text-gray-500">Loading floor plans...</div>
          ) : error ? (
            <div className="py-4 text-center text-red-500">Error loading floor plans</div>
          ) : floorPlans && floorPlans.length > 0 ? (
            <ScrollArea className="h-64 rounded-md border">
              <div className="p-4 space-y-2">
                {floorPlans.map((floorPlan) => (
                  <div
                    key={floorPlan.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedFloorPlan === floorPlan.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedFloorPlan(floorPlan.id)}
                  >
                    <div className="font-medium">{floorPlan.name}</div>
                    <div className="text-xs text-gray-500">
                      {floorPlan.elements.length} elements • 
                      {new Date(floorPlan.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No saved floor plans found
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleLoadFloorPlan}
            disabled={!selectedFloorPlan || isLoading}
          >
            Load
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoadLayoutModal;
