import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Restaurant, User, DeliveryLocation, insertRestaurantSchema, insertDeliveryLocationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Store, Users, TrendingUp, LogOut, MapPin, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const restaurantFormSchema = insertRestaurantSchema;
const deliveryLocationFormSchema = insertDeliveryLocationSchema;

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null);

  // Redirect non-admins
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: restaurants, isLoading: restaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const { data: deliveryLocations, isLoading: locationsLoading } = useQuery<DeliveryLocation[]>({
    queryKey: ["/api/delivery-locations/all"],
  });

  const form = useForm({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      description: "",
      cuisine: "",
      imageUrl: "",
      deliveryTime: "",
      deliveryFee: "",
      ownerId: "",
      isActive: true,
    },
  });

  const locationForm = useForm({
    resolver: zodResolver(deliveryLocationFormSchema),
    defaultValues: {
      name: "",
      address: "",
      isActive: true,
    },
  });

  const addRestaurantMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/restaurants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Restaurant added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/delivery-locations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-locations/all"] });
      setIsLocationDialogOpen(false);
      locationForm.reset();
      setEditingLocation(null);
      toast({
        title: "Success",
        description: "Delivery location added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/delivery-locations/${editingLocation?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-locations/all"] });
      setIsLocationDialogOpen(false);
      locationForm.reset();
      setEditingLocation(null);
      toast({
        title: "Success",
        description: "Delivery location updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/delivery-locations/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-locations/all"] });
      toast({
        title: "Success", 
        description: "Delivery location deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    addRestaurantMutation.mutate(data);
  };

  const onLocationSubmit = (data: any) => {
    if (editingLocation) {
      updateLocationMutation.mutate(data);
    } else {
      addLocationMutation.mutate(data);
    }
  };

  const handleEditLocation = (location: DeliveryLocation) => {
    setEditingLocation(location);
    locationForm.reset({
      name: location.name,
      address: location.address,
      isActive: location.isActive ?? true,
    });
    setIsLocationDialogOpen(true);
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm("Are you sure you want to delete this delivery location?")) {
      deleteLocationMutation.mutate(id);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/auth");
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Calculate stats
  const activeRestaurants = restaurants?.filter(r => r.isActive).length || 0;
  const pendingRestaurants = restaurants?.filter(r => !r.isActive).length || 0;
  const activeLocations = deliveryLocations?.filter(l => l.isActive).length || 0;
  const inactiveLocations = deliveryLocations?.filter(l => !l.isActive).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/")}
                data-testid="button-back-to-home"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">System Administrator</span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Restaurants</span>
                <Store className="w-6 h-6 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-medium text-accent" data-testid="stat-active-restaurants">{activeRestaurants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="text-sm font-medium text-yellow-500" data-testid="stat-pending-restaurants">{pendingRestaurants}</span>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-3" data-testid="button-add-restaurant">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Restaurant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Restaurant</DialogTitle>
                    <DialogDescription>
                      Onboard a new restaurant to the platform
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Restaurant Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Restaurant name" {...field} data-testid="input-restaurant-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cuisine"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cuisine Type</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Mediterranean, Italian" {...field} data-testid="input-restaurant-cuisine" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Restaurant description" {...field} data-testid="textarea-restaurant-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="deliveryTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Time</FormLabel>
                              <FormControl>
                                <Input placeholder="25-35 min" {...field} data-testid="input-restaurant-delivery-time" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Fee</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="2.99" {...field} data-testid="input-restaurant-delivery-fee" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} data-testid="input-restaurant-image" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ownerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner User ID (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Leave empty if creating without owner" {...field} data-testid="input-restaurant-owner-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={addRestaurantMutation.isPending} data-testid="button-submit-restaurant">
                          Add Restaurant
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Delivery Locations</span>
                <MapPin className="w-6 h-6 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-medium text-accent" data-testid="stat-active-locations">{activeLocations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inactive</span>
                <span className="text-sm font-medium text-muted-foreground" data-testid="stat-inactive-locations">{inactiveLocations}</span>
              </div>
              <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full mt-3" 
                    data-testid="button-add-location"
                    onClick={() => {
                      setEditingLocation(null);
                      locationForm.reset({
                        name: "",
                        address: "",
                        isActive: true,
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLocation ? "Edit Delivery Location" : "Add New Delivery Location"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingLocation ? "Update delivery location details" : "Configure a new delivery location for restaurants"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...locationForm}>
                    <form onSubmit={locationForm.handleSubmit(onLocationSubmit)} className="space-y-4">
                      <FormField
                        control={locationForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Amazon SLU" {...field} data-testid="input-location-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={locationForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Full address details" {...field} data-testid="textarea-location-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={addLocationMutation.isPending || updateLocationMutation.isPending} 
                          data-testid="button-submit-location"
                        >
                          {editingLocation ? "Update Location" : "Add Location"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsLocationDialogOpen(false);
                            setEditingLocation(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users</span>
                <Users className="w-6 h-6 text-secondary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Customers</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Restaurant Owners</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <Button className="w-full mt-3" variant="secondary" data-testid="button-user-management">
                User Management
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today's Stats</span>
                <TrendingUp className="w-6 h-6 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orders</span>
                <span className="text-sm font-medium text-primary">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="text-sm font-medium text-accent">-</span>
              </div>
              <Button className="w-full mt-3" variant="outline" data-testid="button-view-analytics">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Management</CardTitle>
            <CardDescription>Manage all restaurants on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {restaurantsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Cuisine</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants?.map(restaurant => (
                    <TableRow key={restaurant.id} data-testid={`restaurant-row-${restaurant.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            {restaurant.imageUrl ? (
                              <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Store className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{restaurant.name}</p>
                            {restaurant.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {restaurant.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{restaurant.cuisine}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {restaurant.deliveryTime} • ${restaurant.deliveryFee}
                      </TableCell>
                      <TableCell>
                        <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">⭐ {restaurant.rating}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="outline" size="sm" data-testid={`button-edit-restaurant-${restaurant.id}`}>
                            Edit
                          </Button>
                          <Button 
                            variant={restaurant.isActive ? "destructive" : "default"} 
                            size="sm"
                            data-testid={`button-toggle-restaurant-${restaurant.id}`}
                          >
                            {restaurant.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delivery Location Management Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Delivery Location Management</CardTitle>
            <CardDescription>Manage all delivery locations and office buildings</CardDescription>
          </CardHeader>
          <CardContent>
            {locationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[300px]" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryLocations?.map(location => (
                    <TableRow key={location.id} data-testid={`location-row-${location.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{location.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                        <div className="truncate">{location.address}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.isActive ? "default" : "secondary"}>
                          {location.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {location.createdAt ? new Date(location.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditLocation(location)}
                            data-testid={`button-edit-location-${location.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                            disabled={deleteLocationMutation.isPending}
                            data-testid={`button-delete-location-${location.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {deliveryLocations?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <MapPin className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No delivery locations configured</p>
                          <p className="text-sm text-muted-foreground">Add locations to enable restaurant onboarding</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
