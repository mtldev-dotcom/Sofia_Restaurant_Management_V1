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
      
      let floorPlanId = floorPlanState.id;
      
      if (floorPlanId) {
        // Update existing floor plan
        const updateData = {
          name: layoutName,
          isDefault: isDefault,
          layout: layout
        };
        
        await apiRequest('PUT', `/api/floorplans/${floorPlanId}`, updateData);
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
          floorPlanId = newFloorPlan.id;
        }
        
        toast({
          title: "Success",
          description: "Floor plan saved successfully",
        });
      }
      
      // Save tables as seating areas
      if (floorPlanId) {
        await saveTablesAsSeatingAreas(floorPlanId, layout.elements);
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
  
  // Helper function to save tables as seating areas
  const saveTablesAsSeatingAreas = async (floorPlanId: string, elements: any[]) => {
    try {
      // First, fetch existing seating areas for this floor plan
      const response = await fetch(`/api/floorplans/${floorPlanId}/seatingareas`);
      const existingSeatingAreas = await response.json();
      
      // Create a map of existing seating areas by element ID for quick lookup
      const existingSeatingAreasMap = new Map();
      existingSeatingAreas.forEach((area: any) => {
        if (area.properties?.elementId) {
          existingSeatingAreasMap.set(area.properties.elementId, area);
        }
      });
      
      // Filter elements that are tables (category === 'table')
      const tableElements = elements.filter(element => element.category === 'table');
      
      // Process each table element
      for (const tableElement of tableElements) {
        // Use capacity from the element if available, otherwise use defaults based on table type/size
        let capacity = tableElement.capacity || {
          min: 1,
          max: 4,
          default: 2
        };
        
        // If no custom capacity has been set, adjust capacity based on table size
        if (!tableElement.capacity) {
          if (tableElement.type === 'round' && tableElement.size === 'large') {
            capacity = { min: 4, max: 8, default: 6 };
          } else if (tableElement.type === 'square' && tableElement.size === 'large') {
            capacity = { min: 4, max: 6, default: 4 };
          } else if (tableElement.type === 'rectangle') {
            capacity = { min: 2, max: 6, default: 4 };
            if (tableElement.size === 'large') {
              capacity = { min: 4, max: 8, default: 6 };
            }
          }
        }
        
        // Create properties object
        const properties = {
          type: 'table',
          shape: tableElement.isRound ? 'round' : tableElement.type,
          color: tableElement.color || '#8B4513', // Default to brown if no color specified
          isReservable: tableElement.isReservable !== false, // Use the element's isReservable property or default to true
          status: 'available',
          elementId: tableElement.id, // Store reference to the floor plan element
          size: tableElement.size || 'standard'
        };
        
        // Check if this table already exists as a seating area
        const existingArea = existingSeatingAreasMap.get(tableElement.id);
        
        if (existingArea) {
          // Update the existing seating area
          const updateData = {
            name: `Table ${tableElement.name || tableElement.id.substring(0, 5)}`,
            capacityRange: capacity,
            description: `${tableElement.type} table - ${tableElement.size || 'standard'} size`,
            x: tableElement.x,
            y: tableElement.y,
            properties: properties
          };
          
          await apiRequest('PUT', `/api/seatingareas/${existingArea.id}`, updateData);
        } else {
          // Create a new seating area
          const seatingAreaData = {
            floorPlanId: floorPlanId,
            name: `Table ${tableElement.name || tableElement.id.substring(0, 5)}`,
            capacityRange: capacity,
            description: `${tableElement.type} table - ${tableElement.size || 'standard'} size`,
            x: tableElement.x,
            y: tableElement.y,
            properties: properties
          };
          
          await apiRequest('POST', '/api/seatingareas', seatingAreaData);
        }
      }
      
      // Handle removal of tables that no longer exist
      const currentTableIds = new Set(tableElements.map(table => table.id));
      
      for (const [elementId, area] of existingSeatingAreasMap.entries()) {
        if (!currentTableIds.has(elementId)) {
          // This seating area's corresponding table no longer exists, delete it
          await apiRequest('DELETE', `/api/seatingareas/${area.id}`, null);
        }
      }
      
    } catch (error) {
      console.error('Error saving tables as seating areas:', error);
      // Don't throw, as we don't want to prevent the floor plan from being saved
      toast({
        title: "Warning",
        description: "Floor plan saved, but there was an issue saving tables as seating areas",
        variant: "destructive"
      });
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
