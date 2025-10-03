import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useLocationContext } from "@/contexts/location-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Utensils, MapPin, ShoppingCart, User, LogOut, Settings, Receipt } from "lucide-react";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { itemCount } = useCart();
  const { selectedLocation } = useLocationContext();

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
            {/* Location Indicator */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span data-testid="current-location">{selectedLocation}</span>
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
                {user?.role === "restaurant_owner" && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation("/restaurant-dashboard")} data-testid="menu-dashboard">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/restaurant-orders")} data-testid="menu-orders">
                      <Receipt className="mr-2 h-4 w-4" />
                      Orders
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => setLocation("/admin-panel")} data-testid="menu-dashboard">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
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
