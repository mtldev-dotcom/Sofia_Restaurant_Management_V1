import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import ThemeToggle from "@/components/ThemeToggle";
import { Save, Upload, Layout, Trash2, AlertCircle, Loader2, FilePlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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

interface HeaderProps {
  onSave: () => void;
  onLoad: () => void;
  onDelete?: () => void;
  onNew?: () => void;
}

const Header = ({ onSave, onLoad, onDelete, onNew }: HeaderProps) => {
  const floorPlanName = useFloorPlanStore((state) => state.name);
  const floorPlanId = useFloorPlanStore((state) => state.id);
  const isDefault = useFloorPlanStore((state) => state.isDefault);
  const resetFloorPlan = useFloorPlanStore((state) => state.resetFloorPlan);
  const elements = useFloorPlanStore((state) => state.elements);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Handle initiating floor plan deletion
  const handleDeleteClick = () => {
    if (!floorPlanId) {
      toast({
        title: "Nothing to delete",
        description: "No floor plan is currently loaded",
        variant: "destructive"
      });
      return;
    }
    
    if (isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default floor plans cannot be deleted",
        variant: "destructive"
      });
      return;
    }
    
    setDeleteDialogOpen(true);
  };

  // Handle new floor plan
  const handleNewClick = () => {
    // Check if there are unsaved changes (elements exist)
    if (elements.length > 0 || floorPlanId) {
      setNewDialogOpen(true);
    } else {
      // If no elements or floor plan, just reset directly
      resetFloorPlan();
      if (onNew) onNew();
      
      toast({
        title: "New Floor Plan",
        description: "Started a new empty floor plan",
      });
    }
  };
  
  // Handle confirming floor plan deletion
  const confirmDelete = async () => {
    if (!floorPlanId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/floorplans/${floorPlanId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete floor plan');
      }
      
      toast({
        title: "Success",
        description: `Deleted floor plan: ${floorPlanName}`,
      });
      
      // Reset the floor plan in the store
      resetFloorPlan();
      
      // Call the optional onDelete callback
      if (onDelete) {
        onDelete();
      }
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
    }
  };
  
  // Handle confirming new floor plan
  const confirmNew = () => {
    resetFloorPlan();
    if (onNew) onNew();
    
    toast({
      title: "New Floor Plan",
      description: "Started a new empty floor plan",
    });
    
    setNewDialogOpen(false);
  };

  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      {/* Confirmation Dialog for Floor Plan Deletion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Delete Floor Plan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{floorPlanName}</strong>?
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
      
      {/* Confirmation Dialog for New Floor Plan */}
      <AlertDialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Create New Floor Plan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Any unsaved changes to the current floor plan will be lost. 
              Are you sure you want to create a new floor plan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmNew}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="text-primary w-8 h-8 mr-3 flex items-center justify-center">
              <Layout className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Floor Plan Designer
              {floorPlanName && (
                <span className="text-sm text-muted-foreground ml-2 font-normal">
                  ({floorPlanName})
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleNewClick}
              className="inline-flex items-center"
              size="sm"
              variant="outline"
            >
              <FilePlus className="mr-1.5 h-4 w-4" />
              New
            </Button>
            <Button 
              onClick={onSave} 
              className="inline-flex items-center"
              size="sm"
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              onClick={onLoad} 
              className="inline-flex items-center"
              size="sm"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Load
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDeleteClick} 
              className={`inline-flex items-center ${!floorPlanId || isDefault ? 'opacity-50 cursor-not-allowed' : ''}`}
              size="sm"
              disabled={!floorPlanId || isDefault}
              title={!floorPlanId ? "No floor plan loaded" : isDefault ? "Cannot delete default floor plan" : "Delete this floor plan"}
            >
              <Trash2 className="mr-1.5 h-4 w-4 text-destructive" />
              Delete
            </Button>
            <div className="ml-2">
              <ThemeToggle />
            </div>
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">FP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
