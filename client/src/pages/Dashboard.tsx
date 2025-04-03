import { useState, useEffect } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { CalendarDays, Users, ChefHat, LayoutDashboard, UtensilsCrossed, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { toast } = useToast();
  
  // Hard-coded for demo purposes - in a real app, these would come from auth and user selection
  const DEMO_USER_ID = 'd4f5bd34-ae5d-4caf-b835-b7ae2fa5f59d';
  const DEMO_RESTAURANT_ID = 'caf5abc2-4eb0-4641-a212-6f967b99db87';
  
  // Fetch restaurant data
  const { data: restaurantData, isLoading } = useQuery({
    queryKey: ['/api/restaurants', DEMO_RESTAURANT_ID],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${DEMO_RESTAURANT_ID}`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant data');
      }
      return response.json() as Promise<Restaurant>;
    }
  });

  // Fetch floor plans count
  const { data: floorPlansData } = useQuery({
    queryKey: ['/api/restaurants', DEMO_RESTAURANT_ID, 'floorplans'],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${DEMO_RESTAURANT_ID}/floorplans`);
      if (!response.ok) {
        throw new Error('Failed to fetch floor plans');
      }
      return response.json();
    }
  });

  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
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
                {isLoading ? (
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
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;