import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { UserMigrationDialog } from "@/components/UserMigrationDialog";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().default("user"),
  restaurantOption: z.enum(["create", "join", "none"]).default("none"),
  restaurantName: z.string().optional(),
  restaurantAddress: z.string().optional(),
  inviteCode: z.string().optional(),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
.refine(
  (data) => 
    data.restaurantOption === "none" || 
    (data.restaurantOption === "create" && data.restaurantName) || 
    (data.restaurantOption === "join" && data.inviteCode),
  {
    message: "Restaurant name is required when creating a new restaurant",
    path: ["restaurantName"],
  }
)
.refine(
  (data) => 
    data.restaurantOption === "none" || 
    (data.restaurantOption === "create" && data.restaurantName) || 
    (data.restaurantOption === "join" && data.inviteCode),
  {
    message: "Invite code is required when joining a restaurant",
    path: ["inviteCode"],
  }
);

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Login form - MUST be created before any conditional returns
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Registration form - MUST be created before any conditional returns
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "user",
      restaurantOption: "none",
      restaurantName: "",
      restaurantAddress: "",
      inviteCode: "",
    },
  });
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Handle login form submission
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  // Handle registration form submission
  const onRegisterSubmit = (values: RegisterFormValues) => {
    const dataWithRole = {
      ...values,
      role: "user" // Ensure role is included
    };
    registerMutation.mutate(dataWithRole);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Sofia Restaurant Management</h1>
            <p className="mt-2 text-muted-foreground">Sign in to your account or create a new one</p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col justify-center space-y-2">
                  <Button variant="link" onClick={() => setActiveTab("register")}>
                    Don't have an account? Register
                  </Button>
                  <Button variant="link" className="text-sm text-muted-foreground" onClick={() => setMigrationDialogOpen(true)}>
                    Migrate existing account to Supabase
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>Create a new account to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-medium text-center">Restaurant Options</h3>
                        <FormField
                          control={registerForm.control}
                          name="restaurantOption"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Choose an option</FormLabel>
                              <FormControl>
                                <div className="flex flex-col space-y-2">
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      className="h-4 w-4 text-primary"
                                      checked={field.value === "create"}
                                      onChange={() => field.onChange("create")}
                                    />
                                    <span>Create a new restaurant</span>
                                  </label>
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      className="h-4 w-4 text-primary"
                                      checked={field.value === "join"}
                                      onChange={() => field.onChange("join")}
                                    />
                                    <span>Join an existing restaurant with invite code</span>
                                  </label>
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      className="h-4 w-4 text-primary"
                                      checked={field.value === "none"}
                                      onChange={() => field.onChange("none")}
                                    />
                                    <span>I'll set this up later</span>
                                  </label>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {registerForm.watch("restaurantOption") === "create" && (
                          <>
                            <FormField
                              control={registerForm.control}
                              name="restaurantName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Restaurant Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="My Restaurant" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="restaurantAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Restaurant Address (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123 Main St, City, Country" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        {registerForm.watch("restaurantOption") === "join" && (
                          <FormField
                            control={registerForm.control}
                            name="inviteCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Invite Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your invite code" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="link" onClick={() => setActiveTab("login")}>
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* User Migration Dialog */}
      <UserMigrationDialog 
        isOpen={migrationDialogOpen} 
        onClose={() => setMigrationDialogOpen(false)} 
      />
      
      {/* Right side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/90 to-primary-foreground text-primary-foreground">
        <div className="flex flex-col justify-center px-12 py-12">
          <h2 className="text-4xl font-bold mb-4">Restaurant Management Made Simple</h2>
          <p className="text-xl mb-8">
            Streamline your restaurant operations with our intuitive floor plan designer and reservation system.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-white rounded-full flex items-center justify-center text-primary mr-3">
                ✓
              </div>
              <p>Drag-and-drop floor plan designer</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-white rounded-full flex items-center justify-center text-primary mr-3">
                ✓
              </div>
              <p>Reservation management</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-white rounded-full flex items-center justify-center text-primary mr-3">
                ✓
              </div>
              <p>Staff scheduling</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 bg-white rounded-full flex items-center justify-center text-primary mr-3">
                ✓
              </div>
              <p>Real-time analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}