import { Restaurant } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Utensils } from "lucide-react";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSelect: (restaurant: Restaurant) => void;
}

export default function RestaurantCard({ restaurant, onSelect }: RestaurantCardProps) {
  const handleClick = () => {
    onSelect(restaurant);
  };

  return (
    <Card 
      className="card-hover cursor-pointer overflow-hidden"
      onClick={handleClick}
      data-testid={`restaurant-card-${restaurant.id}`}
    >
      <div className="aspect-video w-full bg-muted flex items-center justify-center">
        {restaurant.imageUrl ? (
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Utensils className="w-12 h-12 mb-2" />
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-card-foreground" data-testid={`restaurant-name-${restaurant.id}`}>
            {restaurant.name}
          </h3>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-muted-foreground" data-testid={`restaurant-rating-${restaurant.id}`}>
              {restaurant.rating}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2" data-testid={`restaurant-cuisine-${restaurant.id}`}>
          {restaurant.cuisine}
        </p>
        
        {restaurant.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`restaurant-description-${restaurant.id}`}>
            {restaurant.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span data-testid={`restaurant-delivery-time-${restaurant.id}`}>
              {restaurant.deliveryTime}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              ${restaurant.deliveryFee} delivery
            </span>
            {restaurant.isActive ? (
              <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                Available
              </Badge>
            ) : (
              <Badge variant="secondary">
                Closed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
