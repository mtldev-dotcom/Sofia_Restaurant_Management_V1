import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { CalendarDays, Users, ChefHat, LayoutDashboard, UtensilsCrossed, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  
  // Fetch user's restaurants
  const { data: userRestaurants, isLoading: loadingRestaurants } = useQuery({
    queryKey: ['/api/user/restaurants'],
    queryFn: async () => {
      const response = await fetch('/api/user/restaurants');
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch user restaurants');
      }
      return response.json();
    },
    enabled: !!user
  });
  
  // Set the first restaurant as selected when the data loads
  useEffect(() => {
    if (userRestaurants && userRestaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(userRestaurants[0].restaurant.id);
    }
  }, [userRestaurants, selectedRestaurantId]);
  
  // Fetch restaurant data
  const { data: restaurantData, isLoading: isLoadingRestaurant } = useQuery({
    queryKey: ['/api/restaurants', selectedRestaurantId],
    queryFn: async () => {
      if (!selectedRestaurantId) {
        throw new Error('No restaurant selected');
      }
      const response = await fetch(`/api/restaurants/${selectedRestaurantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant data');
      }
      return response.json() as Promise<Restaurant>;
    },
    enabled: !!selectedRestaurantId
  });

  // Fetch floor plans count
  const { data: floorPlansData } = useQuery({
    queryKey: ['/api/restaurants', selectedRestaurantId, 'floorplans'],
    queryFn: async () => {
      if (!selectedRestaurantId) {
        throw new Error('No restaurant selected');
      }
      const response = await fetch(`/api/restaurants/${selectedRestaurantId}/floorplans`);
      if (!response.ok) {
        throw new Error('Failed to fetch floor plans');
      }
      return response.json();
    },
    enabled: !!selectedRestaurantId
  });

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {userRestaurants && userRestaurants.length > 1 && (
            <div className="w-full md:w-auto mt-4 md:mt-0">
              <Select
                value={selectedRestaurantId || undefined}
                onValueChange={(value) => setSelectedRestaurantId(value)}
              >
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select a restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {userRestaurants.map((item: any) => (
                    <SelectItem key={item.restaurant.id} value={item.restaurant.id}>
                      {item.restaurant.name} ({item.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {loadingRestaurants ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : userRestaurants && userRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No Restaurants Found</h2>
            <p className="text-muted-foreground mb-6">You don't have any restaurants yet.</p>
            <Link href="/restaurants/new">
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded">
                Create a Restaurant
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Restaurant Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <ChefHat className="mr-2 h-5 w-5 text-primary" />
                  Restaurant
                </CardTitle>
                <CardDescription>Restaurant details</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRestaurant ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-lg">{restaurantData?.name || 'Loading...'}</h3>
                    <p className="text-muted-foreground">Manage your restaurant details</p>
                    <div className="mt-2 text-sm">
                      <div className="flex items-center mt-1">
                        <UtensilsCrossed className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <span>Contact: {restaurantData?.email || 'No email provided'}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <span>Phone: {restaurantData?.phone || 'No phone provided'}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <span>Address: {restaurantData?.address || 'No address provided'}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Floor Plans Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
                  Floor Plans
                </CardTitle>
                <CardDescription>Your restaurant layouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {floorPlansData ? floorPlansData.length : '-'}
                </div>
                <p className="text-muted-foreground">
                  {floorPlansData && floorPlansData.length > 0 
                    ? `Active floor plans available`
                    : 'No floor plans created yet'}
                </p>
                <div className="mt-4">
                  <Link href="/floor-plan" className="text-primary text-sm hover:underline">
                    Manage floor plans →
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Bookings Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                  Upcoming Bookings
                </CardTitle>
                <CardDescription>Today's reservations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-muted-foreground">No bookings for today</p>
                <div className="mt-4">
                  <Link href="/bookings" className="text-primary text-sm hover:underline">
                    Manage bookings →
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Sales Insights Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Sales Insights
                </CardTitle>
                <CardDescription>Revenue overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>This feature is coming soon!</p>
                  <p>Track your restaurant's performance with detailed analytics.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
  );
};

export default Dashboard;