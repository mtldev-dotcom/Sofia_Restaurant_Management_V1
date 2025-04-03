import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import Header from './Header';
import { Menu, X, LayoutDashboard, Home, Calendar, Users, Settings, HelpCircle, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";

// Create a local version of the SlideoverMenu component
interface SlideoverMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SlideoverMenu: React.FC<SlideoverMenuProps> = ({ isOpen, onClose }) => {
  const [currentLocation] = useLocation();
  const isMobile = useIsMobile();
  const { logoutMutation } = useAuth();
  
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      implemented: true,
    },
    {
      name: 'Floor Plan',
      href: '/',
      icon: <Home className="h-5 w-5" />,
      implemented: true,
    },
    {
      name: 'Bookings',
      href: '/bookings',
      icon: <Calendar className="h-5 w-5" />,
      implemented: false,
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: <Users className="h-5 w-5" />,
      implemented: false,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
      implemented: false,
    },
    {
      name: 'Help',
      href: '/help',
      icon: <HelpCircle className="h-5 w-5" />,
      implemented: false,
    },
  ];

  return (
    <>
      {/* Backdrop - only show on mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-medium">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    onClick={item.implemented ? undefined : (e) => e.preventDefault()}
                  >
                    <div 
                      className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                        currentLocation === item.href 
                          ? 'bg-primary/10 text-primary' 
                          : item.implemented 
                            ? 'hover:bg-muted' 
                            : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                      {!item.implemented && (
                        <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full mb-4 text-destructive border-destructive hover:bg-destructive/10 flex items-center justify-center"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
            <div className="text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} TablePlan App</p>
              <p>Version 1.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

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