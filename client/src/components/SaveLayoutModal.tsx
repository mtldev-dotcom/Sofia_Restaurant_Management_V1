import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SaveLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaveLayoutModal = ({ isOpen, onClose }: SaveLayoutModalProps) => {
  const [layoutName, setLayoutName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const floorPlanState = useFloorPlanStore();
  
  const handleSave = async () => {
    if (!layoutName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a layout name",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save current state with the name
      const floorPlanData = {
        name: layoutName,
        elements: floorPlanState.elements
      };
      
      await apiRequest('POST', '/api/floorplans', floorPlanData);
      
      // Update the current floor plan name
      floorPlanState.setName(layoutName);
      
      toast({
        title: "Success",
        description: "Floor plan saved successfully",
      });
      
      onClose();
    } catch (error) {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Save Layout</DialogTitle>
          <DialogDescription>
            Save your current floor plan layout to access it later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Label htmlFor="layout-name" className="text-sm font-medium text-gray-700">
            Layout Name
          </Label>
          <Input
            id="layout-name"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            placeholder="My Restaurant Layout"
            className="mt-1"
          />
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveLayoutModal;
