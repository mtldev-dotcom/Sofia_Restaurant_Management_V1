import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import EditorPanel from "@/components/EditorPanel";
import PropertiesPanel from "@/components/PropertiesPanel";
import SaveLayoutModal from "@/components/SaveLayoutModal";
import LoadLayoutModal from "@/components/LoadLayoutModal";
import { useFloorPlanStore } from "@/store/floorPlanStore";

const Home = () => {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const selectedElement = useFloorPlanStore((state) => state.selectedElement);
  
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
      />
      
      <LoadLayoutModal 
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />
    </div>
  );
};

export default Home;
