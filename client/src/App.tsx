import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import AppLayout from "@/components/AppLayout";
import { useEffect, useState } from "react";

// Custom Protected Route with Layout
function LayoutProtectedRoute({
  path,
  component: Component,
  useAppLayout = true
}: {
  path: string;
  component: () => React.JSX.Element;
  useAppLayout?: boolean;
}) {
  return (
    <ProtectedRoute
      path={path}
      component={() => {
        // If we don't need the app layout (like floor plan page)
        if (!useAppLayout) {
          return <Component />;
        }
        
        // Wrap with app layout
        return (
          <AppLayout>
            <Component />
          </AppLayout>
        );
      }}
    />
  );
}

function Router() {
  // Using customized routing logic to ensure only one route renders
  const [location] = useLocation();
  
  // Debug the current route
  console.log("Current route location:", location);
  
  // Map paths to components with exact matching for clarity
  // This prevents any overlapping route matches
  
  // Exact matches in order of priority
  const routes = [
    { 
      path: "/floor-plan", 
      match: (loc: string) => loc === "/floor-plan",
      component: () => <LayoutProtectedRoute path="/floor-plan" component={Home} useAppLayout={false} />
    },
    { 
      path: "/floor-plan/:id", 
      match: (loc: string) => loc.startsWith("/floor-plan/") && loc !== "/floor-plan",
      component: () => <LayoutProtectedRoute path="/floor-plan/:id" component={Home} useAppLayout={false} />
    },
    { 
      path: "/dashboard", 
      match: (loc: string) => loc === "/dashboard",
      component: () => <LayoutProtectedRoute path="/dashboard" component={Dashboard} />
    },
    { 
      path: "/", 
      match: (loc: string) => loc === "/",
      component: () => <LayoutProtectedRoute path="/" component={Dashboard} />
    },
    { 
      path: "/auth", 
      match: (loc: string) => loc === "/auth",
      component: () => <Route path="/auth" component={AuthPage} />
    },
    { 
      path: "/auth/callback", 
      match: (loc: string) => loc === "/auth/callback",
      component: () => (
        <Route path="/auth/callback">
          {() => <div>Processing authentication...</div>}
        </Route>
      )
    }
  ];
  
  // Find the first matching route
  const matchedRoute = routes.find(route => route.match(location));
  
  console.log("Matched route:", matchedRoute?.path || "Not found");
  
  // Return the matched component or NotFound
  return matchedRoute ? matchedRoute.component() : <Route component={NotFound} />;
}

function App() {
  const [location] = useLocation();
  
  // Clear any extra body styles - important for page transitions
  useEffect(() => {
    document.body.style.overflow = "";
  }, [location]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
