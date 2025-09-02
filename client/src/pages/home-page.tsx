import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Restaurant, Lunchbox } from "@shared/schema";
import Header from "@/components/layout/header";
import ShoppingCart from "@/components/layout/shopping-cart";
import RestaurantCard from "@/components/restaurant-card";
import LunchboxCard from "@/components/lunchbox-card";
import { CartProvider } from "@/hooks/use-cart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Filter, SortAsc } from "lucide-react";

const locations = ["Amazon SLU", "Amazon Bellevue", "Amazon Redmond"];
const cuisineTypes = ["All", "Mediterranean", "Japanese", "Italian", "American", "Vegetarian"];

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState("Amazon SLU");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState("All");

  const { data: restaurants, isLoading: restaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const { data: lunchboxes, isLoading: lunchboxesLoading } = useQuery<Lunchbox[]>({
    queryKey: ["/api/restaurants", selectedRestaurant?.id, "lunchboxes"],
    enabled: !!selectedRestaurant,
  });

  const filteredRestaurants = restaurants?.filter(restaurant => 
    selectedCuisine === "All" || restaurant.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())
  ) || [];

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="gradient-hero py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Fresh Lunchboxes<br />
              <span className="text-white/90">Delivered to Your Office</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Order from premium local restaurants and get your favorite meals delivered directly to Amazon buildings
            </p>
            
            {/* Location & Search */}
            <div className="max-w-md mx-auto bg-white rounded-xl p-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex items-center space-x-2 px-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="border-0 focus:ring-0 text-foreground" data-testid="select-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setSelectedRestaurant(null)}
                  data-testid="button-browse-restaurants"
                >
                  Browse Restaurants
                </Button>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Category Filters */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Browse by Cuisine</h3>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" data-testid="button-filter">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-sort">
                      <SortAsc className="w-4 h-4 mr-2" />
                      Sort
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {cuisineTypes.map(cuisine => (
                    <Badge
                      key={cuisine}
                      variant={selectedCuisine === cuisine ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCuisine(cuisine)}
                      data-testid={`badge-cuisine-${cuisine.toLowerCase()}`}
                    >
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              </section>

              {selectedRestaurant ? (
                /* Restaurant Details */
                <section className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                      {selectedRestaurant.imageUrl ? (
                        <img 
                          src={selectedRestaurant.imageUrl} 
                          alt={selectedRestaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-card-foreground">{selectedRestaurant.name}</h2>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedRestaurant(null)}
                          data-testid="button-back-to-restaurants"
                        >
                          Back to Restaurants
                        </Button>
                      </div>
                      <p className="text-muted-foreground">{selectedRestaurant.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm font-medium">⭐ {selectedRestaurant.rating}</span>
                        <span className="text-sm text-muted-foreground">{selectedRestaurant.deliveryTime} delivery</span>
                        <span className="text-sm text-muted-foreground">${selectedRestaurant.deliveryFee} delivery fee</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-card-foreground">Available Lunchboxes</h3>
                    
                    {lunchboxesLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                            <Skeleton className="w-20 h-20 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-3 w-[300px]" />
                              <div className="flex space-x-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-20" />
                              </div>
                            </div>
                            <Skeleton className="h-10 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {lunchboxes?.map(lunchbox => (
                          <LunchboxCard 
                            key={lunchbox.id} 
                            lunchbox={lunchbox} 
                            restaurantName={selectedRestaurant.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                /* Restaurant Grid */
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Featured Restaurants</h2>
                  
                  {restaurantsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                          <Skeleton className="w-full h-48" />
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-5 w-[150px]" />
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredRestaurants.map(restaurant => (
                        <RestaurantCard 
                          key={restaurant.id} 
                          restaurant={restaurant} 
                          onSelect={setSelectedRestaurant}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Shopping Cart Sidebar */}
            <div className="lg:col-span-1">
              <ShoppingCart selectedLocation={selectedLocation} />
            </div>
          </div>
        </main>
      </div>
    </CartProvider>
  );
}
