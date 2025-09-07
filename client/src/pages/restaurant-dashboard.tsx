import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Restaurant, Lunchbox, Order, insertLunchboxSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, ShoppingBag, DollarSign, Star, Utensils, LogOut, Calendar, BarChart3, Settings, ClipboardList } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const lunchboxFormSchema = insertLunchboxSchema.omit({ restaurantId: true });

export default function RestaurantDashboard() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLunchbox, setEditingLunchbox] = useState<Lunchbox | null>(null);

  // Redirect non-restaurant owners
  if (user && user.role !== "restaurant_owner" && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", "owner", user?.id],
    enabled: !!user,
  });

  const { data: lunchboxes, isLoading: lunchboxesLoading } = useQuery<Lunchbox[]>({
    queryKey: ["/api/restaurants", restaurant?.id, "lunchboxes"],
    enabled: !!restaurant,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!restaurant,
  });

  const form = useForm({
    resolver: zodResolver(lunchboxFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      isAvailable: true,
      dietaryTags: [],
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
  });

  const addLunchboxMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/restaurants/${restaurant?.id}/lunchboxes`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurant?.id, "lunchboxes"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Lunchbox added successfully",
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

  const updateLunchboxMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/lunchboxes/${editingLunchbox?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurant?.id, "lunchboxes"] });
      setIsEditDialogOpen(false);
      setEditingLunchbox(null);
      form.reset();
      toast({
        title: "Success",
        description: "Lunchbox updated successfully",
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

  const deleteLunchboxMutation = useMutation({
    mutationFn: async (lunchboxId: string) => {
      await apiRequest("DELETE", `/api/lunchboxes/${lunchboxId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurant?.id, "lunchboxes"] });
      toast({
        title: "Success",
        description: "Lunchbox deleted successfully",
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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
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

  const onSubmit = async (data: any) => {
    if (editingLunchbox) {
      updateLunchboxMutation.mutate(data);
    } else {
      addLunchboxMutation.mutate(data);
    }
  };

  const handleEditLunchbox = (lunchbox: Lunchbox) => {
    setEditingLunchbox(lunchbox);
    form.reset({
      name: lunchbox.name,
      description: lunchbox.description,
      price: lunchbox.price,
      imageUrl: lunchbox.imageUrl || "",
      isAvailable: lunchbox.isAvailable ?? true,
      dietaryTags: lunchbox.dietaryTags || [],
      availableDays: lunchbox.availableDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteLunchbox = (lunchboxId: string) => {
    if (confirm("Are you sure you want to delete this lunchbox?")) {
      deleteLunchboxMutation.mutate(lunchboxId);
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
  const todayOrders = orders?.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.createdAt!).toDateString() === today;
  }).length || 0;

  const todayRevenue = orders?.filter(order => {
    const today = new Date().toDateString();
    return new Date(order.createdAt!).toDateString() === today;
  }).reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;

  const avgRating = restaurant?.rating || "0.0";
  const activeItems = lunchboxes?.filter(item => item.isAvailable).length || 0;

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
              <h1 className="text-xl font-bold text-foreground">Restaurant Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{restaurant?.name || "Loading..."}</span>
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
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center space-x-2">
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">Menu</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Orders</p>
                      <p className="text-2xl font-bold text-primary" data-testid="stat-today-orders">{todayOrders}</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold text-accent" data-testid="stat-revenue">${todayRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold text-yellow-500" data-testid="stat-rating">{avgRating}</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Items</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-active-items">{activeItems}</p>
                    </div>
                    <Utensils className="w-8 h-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders for your restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Order #{order.orderNumber || order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{order.deliveryLocation}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.total}</p>
                          <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Menu Management</CardTitle>
                    <CardDescription>Manage your lunchbox offerings</CardDescription>
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-lunchbox">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Lunchbox</DialogTitle>
                        <DialogDescription>
                          Create a new lunchbox option for your restaurant
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Lunchbox name" {...field} data-testid="input-lunchbox-name" />
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
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe the lunchbox contents" {...field} data-testid="textarea-lunchbox-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="19.99" {...field} data-testid="input-lunchbox-price" />
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
                                <FormLabel>Image URL (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com/image.jpg" {...field} data-testid="input-lunchbox-image" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="isAvailable"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-lunchbox-available"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Available for ordering</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={addLunchboxMutation.isPending}>
                              {addLunchboxMutation.isPending ? "Adding..." : "Add Lunchbox"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {lunchboxesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !lunchboxes || lunchboxes.length === 0 ? (
                  <div className="text-center py-12">
                    <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No menu items yet</h3>
                    <p className="text-muted-foreground mb-4">Start building your menu by adding your first lunchbox</p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lunchboxes.map((lunchbox) => (
                      <div key={lunchbox.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {lunchbox.imageUrl ? (
                              <img src={lunchbox.imageUrl} alt={lunchbox.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Utensils className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-foreground">{lunchbox.name}</h3>
                              <Badge variant={lunchbox.isAvailable ? "default" : "secondary"}>
                                {lunchbox.isAvailable ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{lunchbox.description}</p>
                            <p className="text-lg font-semibold text-primary mt-1">${lunchbox.price}</p>
                            {lunchbox.dietaryTags && lunchbox.dietaryTags.length > 0 && (
                              <div className="flex space-x-1 mt-2">
                                {lunchbox.dietaryTags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditLunchbox(lunchbox)}
                            data-testid={`button-edit-lunchbox-${lunchbox.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteLunchbox(lunchbox.id)}
                            data-testid={`button-delete-lunchbox-${lunchbox.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>View and manage all incoming orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Button 
                    onClick={() => setLocation("/restaurant-orders")}
                    className="w-full sm:w-auto"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Open Detailed Order Management
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Access advanced filtering, bulk actions, and detailed order management
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Profile</CardTitle>
                <CardDescription>Manage your restaurant information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Restaurant Name</label>
                    <p className="text-lg">{restaurant?.name || "Loading..."}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-muted-foreground">{restaurant?.description || "No description available"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cuisine Type</label>
                    <p className="text-muted-foreground">{restaurant?.cuisine || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{restaurant?.rating || "0.0"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Lunchbox Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lunchbox</DialogTitle>
              <DialogDescription>
                Update your lunchbox details
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Lunchbox name" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the lunchbox contents" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="19.99" {...field} />
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
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Available for ordering</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateLunchboxMutation.isPending}>
                    {updateLunchboxMutation.isPending ? "Updating..." : "Update Lunchbox"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}