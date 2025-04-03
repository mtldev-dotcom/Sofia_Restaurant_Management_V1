import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import EditorPanel from "@/components/EditorPanel";
import PropertiesPanel from "@/components/PropertiesPanel";
import SaveLayoutModal from "@/components/SaveLayoutModal";
import LoadLayoutModal from "@/components/LoadLayoutModal";
import { useFloorPlanStore } from "@/store/floorPlanStore";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const selectedElement = useFloorPlanStore((state) => state.selectedElement);
  
  // Hard-coded for demo purposes - in a real app, these would come from auth and user selection
  const DEMO_USER_ID = 'd4f5bd34-ae5d-4caf-b835-b7ae2fa5f59d';
  const DEMO_RESTAURANT_ID = 'caf5abc2-4eb0-4641-a212-6f967b99db87';
  
  // Fetch the user's restaurant data when the component mounts
  const { data: restaurantData } = useQuery({
    queryKey: ['/api/user', DEMO_USER_ID, 'restaurants'],
    queryFn: async () => {
      const response = await fetch(`/api/user/${DEMO_USER_ID}/restaurants`);
      if (!response.ok) {
        throw new Error('Failed to fetch user restaurants');
      }
      return response.json();
    }
  });
  
  // Set the restaurant ID in the store when data is available
  useEffect(() => {
    if (DEMO_RESTAURANT_ID) {
      useFloorPlanStore.getState().setRestaurantId(DEMO_RESTAURANT_ID);
    }
    if (DEMO_USER_ID) {
      useFloorPlanStore.getState().setCreatedBy(DEMO_USER_ID);
    }
  }, []);
  
  return (
    <div className="bg-background min-h-screen h-screen text-foreground flex flex-col overflow-hidden">
      <Header 
        onSave={() => setIsSaveModalOpen(true)}
        onLoad={() => setIsLoadModalOpen(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <EditorPanel />
        
        {selectedElement && (
          <PropertiesPanel 
            selectedElement={selectedElement}
            onClose={() => useFloorPlanStore.getState().selectElement(null)}
          />
        )}
      </div>

      <SaveLayoutModal 
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        restaurantId={DEMO_RESTAURANT_ID}
        userId={DEMO_USER_ID}
      />
      
      <LoadLayoutModal 
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        restaurantId={DEMO_RESTAURANT_ID}
      />
    </div>
  );
};

export default Home;
