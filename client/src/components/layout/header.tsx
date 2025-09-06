import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocationContext } from "@/contexts/location-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Utensils, MapPin, ShoppingCart, User, LogOut, Settings, Receipt } from "lucide-react";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { itemCount } = useCart();
  const { selectedLocation, setSelectedLocation } = useLocationContext();

  // Fetch delivery locations
  const { data: deliveryLocations } = useQuery({
    queryKey: ["/api/delivery-locations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/delivery-locations");
      return await res.json();
    },
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/auth");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const navigateBasedOnRole = () => {
    if (user?.role === "restaurant_owner") {
      setLocation("/restaurant-dashboard");
    } else if (user?.role === "admin") {
      setLocation("/admin-panel");
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => setLocation("/")}
            data-testid="logo"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LunchBox</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary"
              onClick={() => setLocation("/")}
              data-testid="nav-browse"
            >
              Browse
            </Button>
            {user?.role === "restaurant_owner" && (
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => setLocation("/restaurant-dashboard")}
                data-testid="nav-dashboard"
              >
                Dashboard
              </Button>
            )}
            {user?.role === "admin" && (
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-primary"
                onClick={() => setLocation("/admin-panel")}
                data-testid="nav-admin"
              >
                Admin
              </Button>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Location Selector */}
            <div className="hidden sm:flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-primary" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent text-muted-foreground hover:text-foreground text-sm h-auto p-0" data-testid="header-location-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deliveryLocations?.map((location: any) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="sm"
              className="relative"
              onClick={() => setLocation("/checkout")}
              data-testid="cart-button"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                  data-testid="cart-count"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu-trigger">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium" data-testid="user-name">
                    {user?.username || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">
                  <div data-testid="user-email">{user?.email}</div>
                  <div className="text-xs text-muted-foreground capitalize" data-testid="user-role">
                    {user?.role?.replace("_", " ")}
                  </div>
                </div>
                {user?.role === "restaurant_owner" ? (
                  <DropdownMenuItem onClick={() => setLocation("/restaurant-profile")} data-testid="menu-restaurant-profile">
                    <User className="mr-2 h-4 w-4" />
                    Restaurant Profile
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                )}
                {user?.role === "customer" && (
                  <DropdownMenuItem onClick={() => setLocation("/orders")} data-testid="menu-orders">
                    <Receipt className="mr-2 h-4 w-4" />
                    My Orders
                  </DropdownMenuItem>
                )}
                {(user?.role === "restaurant_owner" || user?.role === "admin") && (
                  <DropdownMenuItem onClick={navigateBasedOnRole} data-testid="menu-dashboard">
                    <Settings className="mr-2 h-4 w-4" />
                    {user.role === "admin" ? "Admin Panel" : "Dashboard"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
