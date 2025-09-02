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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, ShoppingBag, DollarSign, Star, Utensils, LogOut, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const lunchboxFormSchema = insertLunchboxSchema.omit({ restaurantId: true });

export default function RestaurantDashboard() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated",
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
    addLunchboxMutation.mutate(data);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Management */}
          <div className="lg:col-span-2">
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
                    <DialogContent>
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
                            name="availableDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Available Days</span>
                                </FormLabel>
                                <div className="grid grid-cols-3 gap-3">
                                  {["monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                                    <div key={day} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={day}
                                        checked={field.value?.includes(day)}
                                        onCheckedChange={(checked) => {
                                          const updatedDays = checked
                                            ? [...(field.value || []), day]
                                            : field.value?.filter((d: string) => d !== day) || [];
                                          field.onChange(updatedDays);
                                        }}
                                        data-testid={`checkbox-day-${day}`}
                                      />
                                      <label htmlFor={day} className="text-sm font-medium capitalize cursor-pointer">
                                        {day.slice(0, 3)}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex space-x-2">
                            <Button type="submit" disabled={addLunchboxMutation.isPending} data-testid="button-submit-lunchbox">
                              Add Lunchbox
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                              Cancel
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
                      <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                        <Skeleton className="w-16 h-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lunchboxes?.map(lunchbox => (
                      <div key={lunchbox.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg" data-testid={`lunchbox-item-${lunchbox.id}`}>
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          {lunchbox.imageUrl ? (
                            <img src={lunchbox.imageUrl} alt={lunchbox.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Utensils className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-card-foreground">{lunchbox.name}</h3>
                          <p className="text-sm text-muted-foreground">${lunchbox.price}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={lunchbox.isAvailable ? "default" : "secondary"}>
                              {lunchbox.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            {lunchbox.dietaryTags?.map(tag => (
                              <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center space-x-1 mt-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {lunchbox.availableDays?.map(day => day.slice(0, 3).toUpperCase()).join(", ") || "All days"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-edit-${lunchbox.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-delete-${lunchbox.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders for your restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-border rounded-lg p-4">
                        <Skeleton className="h-4 w-[100px] mb-2" />
                        <Skeleton className="h-3 w-[150px] mb-1" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.slice(0, 10).map(order => (
                      <div key={order.id} className="border border-border rounded-lg p-4" data-testid={`order-item-${order.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">#{order.id.slice(-6)}</span>
                          <Select 
                            value={order.status}
                            onValueChange={(status) => updateOrderStatusMutation.mutate({ orderId: order.id, status })}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{order.deliveryLocation}</p>
                        <p className="text-sm font-medium text-primary">${order.total}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
