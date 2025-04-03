import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from './Header';
import SlideoverMenu from './SlideoverMenu';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const [pageTitle, setPageTitle] = useState('Floor Plan Designer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Update page title based on current route
  useEffect(() => {
    switch (location) {
      case '/dashboard':
        setPageTitle('Dashboard');
        break;
      case '/bookings':
        setPageTitle('Bookings');
        break;
      case '/customers':
        setPageTitle('Customers');
        break;
      case '/settings':
        setPageTitle('Settings');
        break;
      default:
        setPageTitle('Floor Plan Designer');
        break;
    }
  }, [location]);

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      <Header 
        title={pageTitle}
        onSave={() => {}}
        onLoad={() => {}}
        onNew={() => {}}
        onMenuClick={() => setIsSidebarOpen(true)}
      />
      
      <SlideoverMenu 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;