import React from 'react';
import { Link, useLocation } from 'wouter';
import { X, LayoutDashboard, Calendar, Users, Settings, HelpCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  implemented: boolean;
};

interface SlideoverMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SlideoverMenu: React.FC<SlideoverMenuProps> = ({ isOpen, onClose }) => {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  const navigation: NavigationItem[] = [
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
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                
                return (
                  <li key={item.name}>
                    <Link 
                      href={item.implemented ? item.href : '#'}
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted'
                      } ${!item.implemented ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={(e) => {
                        if (!item.implemented) {
                          e.preventDefault();
                        } else if (isMobile) {
                          onClose();
                        }
                      }}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                      {!item.implemented && (
                        <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
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

export default SlideoverMenu;