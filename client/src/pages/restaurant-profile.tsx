import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Store, Upload, User, Clock, DollarSign, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { Restaurant } from "@shared/schema";
import Header from "@/components/layout/header";
import { CartProvider } from "@/hooks/use-cart";

const restaurantProfileSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  cuisine: z.string().min(1, "Cuisine type is required"),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  deliveryFee: z.string().min(1, "Delivery fee is required"),
});

type RestaurantProfileFormData = z.infer<typeof restaurantProfileSchema>;

export default function RestaurantProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch restaurant data for the current user
  const { data: restaurant, isLoading: restaurantLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants/owner", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/restaurants/owner/${user?.id}`);
      return await res.json();
    },
    enabled: !!user?.id,
  });

  const form = useForm<RestaurantProfileFormData>({
    resolver: zodResolver(restaurantProfileSchema),
    defaultValues: {
      name: "",
      description: "",
      cuisine: "",
      imageUrl: "",
      deliveryTime: "",
      deliveryFee: "",
    },
  });

  // Update form values when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      form.reset({
        name: restaurant.name || "",
        description: restaurant.description || "",
        cuisine: restaurant.cuisine || "",
        imageUrl: restaurant.imageUrl || "",
        deliveryTime: restaurant.deliveryTime || "",
        deliveryFee: restaurant.deliveryFee || "",
      });
    }
  }, [restaurant, form]);

  const updateRestaurantMutation = useMutation({
    mutationFn: async (data: RestaurantProfileFormData) => {
      const endpoint = restaurant ? `/api/restaurants/${restaurant.id}` : "/api/restaurants";
      const method = restaurant ? "PUT" : "POST";
      
      const requestData = {
        ...data,
        ownerId: user?.id,
      };

      const res = await apiRequest(method, endpoint, requestData);
      return await res.json();
    },
    onSuccess: (updatedRestaurant) => {
      queryClient.setQueryData(["/api/restaurants/owner", user?.id], updatedRestaurant);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: restaurant ? "Restaurant Updated" : "Restaurant Created",
        description: restaurant 
          ? "Your restaurant profile has been updated successfully."
          : "Your restaurant has been created successfully.",
      });
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        title: restaurant ? "Update Failed" : "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RestaurantProfileFormData) => {
    try {
      await updateRestaurantMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  if (restaurantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const cuisineOptions = [
    "American", "Asian", "Chinese", "Italian", "Mexican", "Indian", 
    "Japanese", "Thai", "Mediterranean", "French", "Greek", "Korean", 
    "Vietnamese", "Middle Eastern", "German", "Spanish", "Other"
  ];

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto space-y-8 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Restaurant Profile</h1>
            <p className="text-muted-foreground">
              {restaurant ? "Update your restaurant information" : "Create your restaurant profile"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="w-5 h-5" />
                <span>Restaurant Information</span>
              </CardTitle>
              <CardDescription>
                Manage your restaurant details that customers will see
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Store className="w-4 h-4" />
                          <span>Restaurant Name</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your restaurant name" 
                            {...field} 
                            data-testid="input-restaurant-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your restaurant, specialties, and what makes you unique..."
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="input-restaurant-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="cuisine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisine Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-restaurant-cuisine">
                                <SelectValue placeholder="Select cuisine type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cuisineOptions.map((cuisine) => (
                                <SelectItem key={cuisine} value={cuisine.toLowerCase()}>
                                  {cuisine}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deliveryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Delivery Time</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 30-45 mins" 
                              {...field} 
                              data-testid="input-restaurant-delivery-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="deliveryFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Delivery Fee</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 2.99" 
                              type="number"
                              step="0.01"
                              {...field} 
                              data-testid="input-restaurant-delivery-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Upload className="w-4 h-4" />
                            <span>Restaurant Logo/Image URL</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/logo.jpg" 
                              {...field} 
                              data-testid="input-restaurant-image"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={updateRestaurantMutation.isPending}
                      data-testid="button-restaurant-save"
                    >
                      {updateRestaurantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      {restaurant ? "Update Restaurant" : "Create Restaurant"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Owner Information Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Owner Information</span>
              </CardTitle>
              <CardDescription>
                Your account details as restaurant owner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Owner Name</Label>
                  <p className="text-foreground" data-testid="text-owner-name">
                    {user?.fullName || user?.username}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Owner Email</Label>
                  <p className="text-foreground" data-testid="text-owner-email">{user?.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                  <p className="text-foreground" data-testid="text-owner-phone">
                    {user?.phoneNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                  <p className="text-foreground capitalize" data-testid="text-owner-role">
                    Restaurant Owner
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CartProvider>
  );
}