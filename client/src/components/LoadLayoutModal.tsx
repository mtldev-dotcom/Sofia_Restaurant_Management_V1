import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FloorPlan } from "@shared/schema";
import { Folder, Upload, Calendar, LayoutGrid, Trash2, AlertCircle, Home } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface LoadLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
}

const LoadLayoutModal = ({ isOpen, onClose, restaurantId }: LoadLayoutModalProps) => {
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [floorPlanToDelete, setFloorPlanToDelete] = useState<FloorPlan | null>(null);
  const { toast } = useToast();
  const { loadFloorPlan } = useFloorPlanStore();
  const queryClient = useQueryClient();
  
  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFloorPlanId(null);
      setDeleteDialogOpen(false);
      setFloorPlanToDelete(null);
    }
  }, [isOpen]);
  
  // Fetch available floor plans for the given restaurant
  const { data: floorPlans, isLoading, error, refetch } = useQuery<FloorPlan[]>({
    queryKey: ['/api/restaurants', restaurantId, 'floorplans'],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const response = await fetch(`/api/restaurants/${restaurantId}/floorplans`);
      if (!response.ok) {
        throw new Error('Failed to load floor plans');
      }
      
      return response.json();
    },
    enabled: isOpen && !!restaurantId,
  });
  
  // Refetch when the modal opens or restaurantId changes
  useEffect(() => {
    if (isOpen && restaurantId) {
      refetch();
    }
  }, [isOpen, restaurantId, refetch]);
  
  const handleLoadFloorPlan = async () => {
    if (!selectedFloorPlanId) return;
    
    try {
      // Fetch the selected floor plan with all its details
      const response = await fetch(`/api/floorplans/${selectedFloorPlanId}`);
      if (!response.ok) {
        throw new Error('Failed to load floor plan details');
      }
      
      const floorPlan = await response.json();
      
      // Load the floor plan into the store
      loadFloorPlan(floorPlan);
      
      toast({
        title: "Success",
        description: `Loaded floor plan: ${floorPlan.name}`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error loading floor plan:", error);
      toast({
        title: "Error",
        description: "Failed to load floor plan",
        variant: "destructive"
      });
    }
  };
  
  // Calculate elements count for a floor plan
  const getElementsCount = (floorPlan: FloorPlan): number => {
    try {
      const layout = floorPlan.layout as any;
      return (layout?.elements?.length || 0);
    } catch (e) {
      return 0;
    }
  };
  
  // Function to handle deleting a floor plan
  const handleDeleteFloorPlan = async () => {
    if (!floorPlanToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/floorplans/${floorPlanToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete floor plan');
      }
      
      // Invalidate and refetch the floor plans list
      await queryClient.invalidateQueries({
        queryKey: ['/api/restaurants', restaurantId, 'floorplans']
      });
      
      // Reset selection
      if (selectedFloorPlanId === floorPlanToDelete.id) {
        setSelectedFloorPlanId(null);
      }
      
      toast({
        title: "Success",
        description: `Deleted floor plan: ${floorPlanToDelete.name}`,
      });
      
      setDeleteDialogOpen(false);
      setFloorPlanToDelete(null);
    } catch (error) {
      console.error("Error deleting floor plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete floor plan",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Function to open the delete confirmation dialog
  const openDeleteDialog = (event: React.MouseEvent, floorPlan: FloorPlan) => {
    event.stopPropagation(); // Prevent selecting the floor plan
    setFloorPlanToDelete(floorPlan);
    setDeleteDialogOpen(true);
  };
  
  return (
    <>
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
                        selectedFloorPlanId === floorPlan.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/5"
                      )}
                      onClick={() => setSelectedFloorPlanId(floorPlan.id)}
                    >
                      <div className="font-medium text-foreground flex items-center justify-between">
                        <span className="flex items-center">
                          <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
                          {floorPlan.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {floorPlan.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary flex items-center">
                              <Home className="h-3 w-3 mr-1" />
                              Default
                            </span>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className={cn(
                              "h-6 w-6",
                              !floorPlan.isDefault ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground opacity-50 cursor-not-allowed"
                            )}
                            onClick={(e) => !floorPlan.isDefault && openDeleteDialog(e, floorPlan)}
                            disabled={floorPlan.isDefault || isDeleting}
                            title={floorPlan.isDefault ? "Cannot delete default floor plan" : "Delete floor plan"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <AlertDialogTitle>Delete Floor Plan</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {floorPlanToDelete ? (
                <>
                  Are you sure you want to delete the floor plan <span className="font-semibold">"{floorPlanToDelete.name}"</span>?
                  <br />
                  <br />
                  This action cannot be undone. The floor plan will be permanently deleted from the database.
                </>
              ) : (
                "Are you sure you want to delete this floor plan? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFloorPlan}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete Floor Plan
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LoadLayoutModal;
