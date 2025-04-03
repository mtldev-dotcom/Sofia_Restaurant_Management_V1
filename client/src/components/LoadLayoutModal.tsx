import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FloorPlan } from "@shared/schema";
import { Folder, Upload, Calendar, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoadLayoutModal = ({ isOpen, onClose }: LoadLayoutModalProps) => {
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string | null>(null);
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
    if (!selectedFloorPlanId || !floorPlans) return;
    
    const floorPlan = floorPlans.find(fp => String(fp.id) === selectedFloorPlanId);
    
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
      <DialogContent className="sm:max-w-md border border-border">
        <DialogHeader>
          <div className="flex items-center">
            <Folder className="h-5 w-5 text-primary mr-2" />
            <DialogTitle>Load Floor Plan</DialogTitle>
          </div>
          <DialogDescription>
            Select a previously saved design to load
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="py-4 flex items-center justify-center text-muted-foreground">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading floor plans...
            </div>
          ) : error ? (
            <div className="py-4 text-center text-destructive flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Error loading floor plans
            </div>
          ) : floorPlans && floorPlans.length > 0 ? (
            <ScrollArea className="h-64 rounded-md border border-border">
              <div className="p-4 space-y-2">
                {floorPlans.map((floorPlan) => (
                  <div
                    key={floorPlan.id}
                    className={cn(
                      "p-3 border rounded-md cursor-pointer transition-colors",
                      selectedFloorPlanId === String(floorPlan.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent/5"
                    )}
                    onClick={() => setSelectedFloorPlanId(String(floorPlan.id))}
                  >
                    <div className="font-medium text-foreground flex items-center">
                      <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
                      {floorPlan.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" /> 
                        {new Date(floorPlan.createdAt).toLocaleDateString()}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{(floorPlan.elements as any[])?.length || 0} elements</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No saved floor plans found
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleLoadFloorPlan}
            disabled={!selectedFloorPlanId || isLoading}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Load Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoadLayoutModal;
