import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface SaveLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
  userId?: string;
}

const SaveLayoutModal = ({ isOpen, onClose, restaurantId, userId }: SaveLayoutModalProps) => {
  const [layoutName, setLayoutName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const floorPlanState = useFloorPlanStore();
  
  // Pre-fill the layout name if we're editing an existing floor plan
  useEffect(() => {
    if (isOpen && floorPlanState.name) {
      setLayoutName(floorPlanState.name);
      setIsDefault(floorPlanState.isDefault);
    } else if (isOpen) {
      setLayoutName("");
      setIsDefault(false);
    }
  }, [isOpen, floorPlanState.name, floorPlanState.isDefault]);

  // Ensure the restaurantId and userId are set in the store
  useEffect(() => {
    if (restaurantId) {
      floorPlanState.setRestaurantId(restaurantId);
    }
    if (userId) {
      floorPlanState.setCreatedBy(userId);
    }
  }, [restaurantId, userId]);
  
  const handleSave = async () => {
    if (!layoutName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a layout name",
        variant: "destructive"
      });
      return;
    }

    if (!floorPlanState.restaurantId) {
      toast({
        title: "Error",
        description: "Restaurant ID is required",
        variant: "destructive"
      });
      return;
    }

    if (!floorPlanState.createdBy) {
      toast({
        title: "Error",
        description: "User ID is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update isDefault in the store
      floorPlanState.setIsDefault(isDefault);
      
      // Get current floor plan layout data
      const layout = floorPlanState.getFloorPlanData();
      
      if (floorPlanState.id) {
        // Update existing floor plan
        const updateData = {
          name: layoutName,
          isDefault: isDefault,
          layout: layout
        };
        
        await apiRequest('PUT', `/api/floorplans/${floorPlanState.id}`, updateData);
        toast({
          title: "Success",
          description: "Floor plan updated successfully",
        });
      } else {
        // Create new floor plan
        const floorPlanData = {
          restaurantId: floorPlanState.restaurantId,
          name: layoutName,
          layout: layout,
          isDefault: isDefault,
          createdBy: floorPlanState.createdBy
        };
        
        const response = await apiRequest('POST', '/api/floorplans', floorPlanData);
        const newFloorPlan = await response.json();
        
        // Update the store with the new ID and other details
        if (newFloorPlan && newFloorPlan.id) {
          floorPlanState.setName(layoutName);
          floorPlanState.id = newFloorPlan.id;
          // The full floor plan object will be loaded later when needed
        }
        
        toast({
          title: "Success",
          description: "Floor plan saved successfully",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving floor plan:', error);
      toast({
        title: "Error",
        description: "Failed to save floor plan",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border border-border">
        <DialogHeader>
          <div className="flex items-center">
            <Save className="h-5 w-5 text-primary mr-2" />
            <DialogTitle>{floorPlanState.id ? "Update Floor Plan" : "Save Floor Plan"}</DialogTitle>
          </div>
          <DialogDescription>
            {floorPlanState.id ? "Update your floor plan with the latest changes" : "Save your current design to access it later"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="layout-name" className="text-sm font-medium">
              Layout Name
            </Label>
            <Input
              id="layout-name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="My Restaurant Design"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Choose a descriptive name that helps you identify this layout easily.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="default-layout" 
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked as boolean)}
            />
            <Label 
              htmlFor="default-layout" 
              className="text-sm font-medium cursor-pointer"
            >
              Set as default layout
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (floorPlanState.id ? "Update Layout" : "Save Layout")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveLayoutModal;
