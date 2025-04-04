import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import EditorPanel from "@/components/EditorPanel";
import PropertiesPanel from "@/components/PropertiesPanel";
import SaveLayoutModal from "@/components/SaveLayoutModal";
import LoadLayoutModal from "@/components/LoadLayoutModal";
import AppLayout from "@/components/AppLayout";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useRoute, useParams } from "wouter";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";

const Home = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const selectedElement = useFloorPlanStore((state) => state.selectedElement);
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [location, setLocation] = useLocation();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [, params] = useRoute('/floor-plan/:id?');
  const floorPlanId = params?.id;
  
  // Handle save button click
  const handleSave = () => {
    setIsSaveModalOpen(true);
  };
  
  // Handle load button click
  const handleLoad = () => {
    setIsLoadModalOpen(true);
  };
  
  // Get the user's restaurants
  const { data: userRestaurants, isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ['/api/user/restaurants'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch('/api/user/restaurants');
      if (!response.ok) {
        throw new Error('Failed to fetch user restaurants');
      }
      return response.json();
    },
    enabled: !!user,
  });
  
  // Fetch specific floor plan if ID is provided
  const { data: floorPlanData, isLoading: isLoadingFloorPlan } = useQuery({
    queryKey: ['/api/floorplans', floorPlanId],
    queryFn: async () => {
      if (!floorPlanId) return null;
      const response = await fetch(`/api/floorplans/${floorPlanId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch floor plan');
      }
      return response.json();
    },
    enabled: !!floorPlanId && !!user,
  });
  
  // Load specific floor plan when data is available
  useEffect(() => {
    if (floorPlanData) {
      try {
        useFloorPlanStore.getState().loadFloorPlan(floorPlanData);
        toast({
          title: "Floor plan loaded",
          description: `Loaded floor plan: ${floorPlanData.name}`,
        });
      } catch (error) {
        console.error("Error loading floor plan:", error);
        toast({
          title: "Error",
          description: "Failed to load floor plan",
          variant: "destructive"
        });
      }
    }
  }, [floorPlanData, toast]);
  
  // Set the restaurant ID from the user's restaurants
  useEffect(() => {
    if (userRestaurants && userRestaurants.length > 0) {
      // Use the first restaurant by default
      const firstRestaurant = userRestaurants[0].restaurant;
      setRestaurantId(firstRestaurant.id);
      
      // Update the floor plan store
      useFloorPlanStore.getState().setRestaurantId(firstRestaurant.id);
      if (user) {
        useFloorPlanStore.getState().setCreatedBy(user.id);
      }
    }
  }, [userRestaurants, user]);
  
  // Redirect to auth if no user is found after loading
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setLocation('/auth');
      toast({
        title: "Authentication required",
        description: "Please sign in to access the floor plan designer",
      });
    }
  }, [isLoadingAuth, user, setLocation, toast]);
  
  const isLoading = isLoadingAuth || isLoadingRestaurants || isLoadingFloorPlan;
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-screen flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading floor plan designer...</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header
          title="Floor Plan Designer"
          onSave={handleSave}
          onLoad={handleLoad}
          onNew={() => useFloorPlanStore.getState().resetFloorPlan()}
        />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <EditorPanel />
          
          {selectedElement && (
            <PropertiesPanel 
              selectedElement={selectedElement}
              onClose={() => useFloorPlanStore.getState().selectElement(null)}
            />
          )}
        </div>

        {user && (
          <>
            <SaveLayoutModal 
              isOpen={isSaveModalOpen}
              onClose={() => setIsSaveModalOpen(false)}
              restaurantId={restaurantId || undefined}
              userId={user.id}
            />
            
            <LoadLayoutModal 
              isOpen={isLoadModalOpen}
              onClose={() => setIsLoadModalOpen(false)}
              restaurantId={restaurantId || undefined}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Home;
