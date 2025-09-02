import { Lunchbox } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Utensils, Plus } from "lucide-react";

interface LunchboxCardProps {
  lunchbox: Lunchbox;
  restaurantName: string;
}

export default function LunchboxCard({ lunchbox, restaurantName }: LunchboxCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (!lunchbox.isAvailable) {
      toast({
        title: "Item Unavailable",
        description: "This lunchbox is currently not available.",
        variant: "destructive",
      });
      return;
    }

    addItem(lunchbox, restaurantName);
    toast({
      title: "Added to Cart",
      description: `${lunchbox.name} has been added to your cart.`,
    });
  };

  return (
    <div 
      className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
      data-testid={`lunchbox-card-${lunchbox.id}`}
    >
      <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        {lunchbox.imageUrl ? (
          <img 
            src={lunchbox.imageUrl} 
            alt={lunchbox.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Utensils className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1">
        <h4 className="font-semibold text-card-foreground" data-testid={`lunchbox-name-${lunchbox.id}`}>
          {lunchbox.name}
        </h4>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`lunchbox-description-${lunchbox.id}`}>
          {lunchbox.description}
        </p>
        
        {lunchbox.dietaryTags && lunchbox.dietaryTags.length > 0 && (
          <div className="flex items-center space-x-2 flex-wrap">
            {lunchbox.dietaryTags.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs bg-accent/10 text-accent border-accent/20"
                data-testid={`lunchbox-tag-${tag}-${lunchbox.id}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-bold text-primary mb-2" data-testid={`lunchbox-price-${lunchbox.id}`}>
          ${lunchbox.price}
        </div>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
          onClick={handleAddToCart}
          disabled={!lunchbox.isAvailable}
          data-testid={`button-add-to-cart-${lunchbox.id}`}
        >
          {lunchbox.isAvailable ? (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add to Cart
            </>
          ) : (
            "Unavailable"
          )}
        </Button>
      </div>
    </div>
  );
}
