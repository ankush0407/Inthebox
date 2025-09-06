import { useState } from "react";
import { useLocationContext } from "@/contexts/location-context";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isProfileComplete, getProfileCompletionMessage } from "@/lib/profile-utils";
import { ArrowLeft, CreditCard, MapPin, ShoppingBag, Calendar, Clock, User } from "lucide-react";


export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { items, subtotal, clearCart, deliveryFee } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedLocation } = useLocationContext();
  const [selectedDeliveryDay, setSelectedDeliveryDay] = useState("");

  // Redirect if cart is empty
  if (items.length === 0) {
    setLocation("/");
    return null;
  }

  // Check if profile is complete before allowing checkout
  if (!isProfileComplete(user)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-8 space-y-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back-home"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Complete Your Profile</span>
              </CardTitle>
              <CardDescription>
                {getProfileCompletionMessage()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  To proceed with your order, please provide the following information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Full Name</li>
                  <li>Phone Number</li>
                </ul>
                <Button 
                  onClick={() => setLocation("/profile")}
                  className="w-full"
                  data-testid="button-complete-profile"
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Group items by restaurant
  const itemsByRestaurant = items.reduce((acc, item) => {
    const restaurantName = item.restaurantName;
    if (!acc[restaurantName]) {
      acc[restaurantName] = [];
    }
    acc[restaurantName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Check if items are from multiple restaurants
  const restaurantNames = Object.keys(itemsByRestaurant);
  const isMultiRestaurant = restaurantNames.length > 1;

  // Get available delivery days from cart items
  const availableDeliveryDays = Array.from(
    new Set(
      items.flatMap(item => item.lunchbox.availableDays || [])
    )
  ).sort((a, b) => {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase());
  });

  // Set default delivery day if not selected
  if (!selectedDeliveryDay && availableDeliveryDays.length > 0) {
    setSelectedDeliveryDay(availableDeliveryDays[0]);
  }

  const serviceFee = 1.50;
  const taxRate = 0.10;
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + serviceFee + tax;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return res.json();
    },
    onSuccess: () => {
      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: "Your lunchbox order has been confirmed and is being prepared.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (isMultiRestaurant) {
      toast({
        title: "Multiple Restaurants",
        description: "Please place separate orders for each restaurant.",
        variant: "destructive",
      });
      return;
    }

    // For now, we'll create a single order for the first restaurant
    const firstRestaurantItems = Object.values(itemsByRestaurant)[0];
    const restaurantId = firstRestaurantItems[0].lunchbox.restaurantId;

    const orderData = {
      restaurantId,
      subtotal: subtotal.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      deliveryLocation: selectedLocation,
      deliveryDay: selectedDeliveryDay,
      items: firstRestaurantItems.map(item => ({
        lunchboxId: item.lunchbox.id,
        quantity: item.quantity,
        price: item.lunchbox.price,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-xl font-bold text-foreground">Checkout</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{items.length} items</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Delivery Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Delivery Location</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <span className="font-medium text-foreground">{selectedLocation}</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="delivery-day">Delivery Day</Label>
                    <Select value={selectedDeliveryDay} onValueChange={setSelectedDeliveryDay}>
                      <SelectTrigger className="mt-2" data-testid="select-delivery-day">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Select delivery day" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDeliveryDays.map(day => (
                          <SelectItem key={day} value={day}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Estimated Delivery - Before 12:30PM at Building Reception</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-accent/10">
                    <div className="text-center">
                      <h4 className="font-medium text-accent mb-2">Pay on Delivery</h4>
                      <p className="text-sm text-muted-foreground">
                        Payment will be collected when your order is delivered to your location.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Cash, card, or digital payment accepted at delivery
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your items before placing the order</CardDescription>
              </CardHeader>
              <CardContent>
                {isMultiRestaurant && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ You have items from multiple restaurants. Please place separate orders for each restaurant.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {Object.entries(itemsByRestaurant).map(([restaurantName, restaurantItems]) => (
                    <div key={restaurantName}>
                      <h4 className="font-medium text-foreground mb-2">{restaurantName}</h4>
                      <div className="space-y-3">
                        {restaurantItems.map(item => (
                          <div key={item.lunchbox.id} className="flex items-center space-x-3" data-testid={`checkout-item-${item.lunchbox.id}`}>
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <span className="text-xs">{item.quantity}x</span>
                            </div>
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-foreground">{item.lunchbox.name}</h5>
                              <p className="text-xs text-muted-foreground">${item.lunchbox.price} each</p>
                              {item.lunchbox.dietaryTags && item.lunchbox.dietaryTags.length > 0 && (
                                <div className="flex space-x-1 mt-1">
                                  {item.lunchbox.dietaryTags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium text-primary">
                              ${(parseFloat(item.lunchbox.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {Object.keys(itemsByRestaurant).length > 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Total */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium" data-testid="checkout-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium" data-testid="checkout-delivery-fee">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span className="font-medium" data-testid="checkout-service-fee">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium" data-testid="checkout-tax">${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary" data-testid="checkout-total">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending || isMultiRestaurant}
                  data-testid="button-place-order"
                >
                  {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
                </Button>

                {/* Payment Note */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Payment on Delivery</p>
                  <div className="flex justify-center space-x-2 text-lg">
                    <span>💵</span>
                    <span>💳</span>
                    <span>📱</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Cash, Card, or Digital Payment</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
