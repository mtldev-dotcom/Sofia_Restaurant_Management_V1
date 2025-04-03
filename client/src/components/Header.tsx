import { Button } from "@/components/ui/button";
import { useFloorPlanStore } from "@/store/floorPlanStore";

interface HeaderProps {
  onSave: () => void;
  onLoad: () => void;
}

const Header = ({ onSave, onLoad }: HeaderProps) => {
  const floorPlanName = useFloorPlanStore((state) => state.name);
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <svg className="text-primary-600 w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3 L21 21"></path>
              <path d="M3 21 L21 3"></path>
              <circle cx="12" cy="12" r="7"></circle>
            </svg>
            <h1 className="text-xl font-semibold text-gray-900">
              Restaurant Floor Plan Designer
              {floorPlanName && <span className="text-sm text-gray-500 ml-2">({floorPlanName})</span>}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={onSave} className="inline-flex items-center">
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Save Layout
            </Button>
            <Button variant="outline" onClick={onLoad} className="inline-flex items-center">
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"></path>
                <path d="M12 17V5"></path>
                <path d="m9 8-2.2-2.2a1 1 0 0 0-1.4 0L3.2 7.8a1 1 0 0 0 0 1.4L5.4 11"></path>
                <path d="m20.8 7.8-2.2-2.2a1 1 0 0 0-1.4 0L15 7.8a1 1 0 0 0 0 1.4L17.2 11"></path>
              </svg>
              Load
            </Button>
            <div className="ml-3 relative">
              <div>
                <button type="button" className="flex items-center max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">JD</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
