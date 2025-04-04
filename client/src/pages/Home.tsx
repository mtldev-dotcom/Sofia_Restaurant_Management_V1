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
import { useLocation } from "wouter";
import Header from "@/components/Header";

const Home = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const selectedElement = useFloorPlanStore((state) => state.selectedElement);
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
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
  
  // Redirect to dashboard if no user is found after loading
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/auth');
      toast({
        title: "Authentication required",
        description: "Please sign in to access the floor plan designer",
      });
    }
  }, [isLoading, user, setLocation, toast]);
  
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
