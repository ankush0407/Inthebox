import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Filter, Package, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";

interface EnhancedOrder {
  id: string;
  orderNumber?: number;
  customerId: string;
  restaurantId: string;
  subtotal: string;
  deliveryFee: string;
  serviceFee: string;
  tax: string;
  total: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  deliveryLocation: string;
  deliveryDay?: string;
  createdAt: string;
  customer?: {
    id: string;
    fullName?: string;
    email: string;
  };
  items: Array<{
    id: string;
    orderId: string;
    lunchboxId: string;
    quantity: number;
    price: string;
    lunchbox?: {
      id: string;
      name: string;
      price: string;
    };
  }>;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const deliveryDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
];

export default function RestaurantOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryLocationFilter, setDeliveryLocationFilter] = useState<string>("all");
  const [deliveryDayFilter, setDeliveryDayFilter] = useState<string>("all");
  const [menuItemFilter, setMenuItemFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  // State for bulk actions
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const { data: orders, isLoading } = useQuery<EnhancedOrder[]>({
    queryKey: ["/api/orders"],
  });

  const { data: deliveryLocations } = useQuery({
    queryKey: ["/api/delivery-locations"],
  });

  // Get unique menu items for filter
  const uniqueMenuItems = useMemo(() => {
    if (!orders) return [];
    const items = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.lunchbox?.name) {
          items.add(item.lunchbox.name);
        }
      });
    });
    return Array.from(items).sort();
  }, [orders]);

  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter(order => {
      // Search query filter
      if (searchQuery && !order.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !order.orderNumber?.toString().includes(searchQuery) &&
          !order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Delivery location filter
      if (deliveryLocationFilter !== "all" && order.deliveryLocation !== deliveryLocationFilter) {
        return false;
      }

      // Delivery day filter
      if (deliveryDayFilter !== "all" && order.deliveryDay !== deliveryDayFilter) {
        return false;
      }

      // Menu item filter
      if (menuItemFilter !== "all") {
        const hasMenuItem = order.items.some(item => item.lunchbox?.name === menuItemFilter);
        if (!hasMenuItem) return false;
      }

      // Date range filter
      if (dateFromFilter || dateToFilter) {
        const orderDate = parseISO(order.createdAt);
        if (dateFromFilter && orderDate < parseISO(dateFromFilter)) return false;
        if (dateToFilter && orderDate > parseISO(dateToFilter + "T23:59:59")) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, deliveryLocationFilter, deliveryDayFilter, menuItemFilter, dateFromFilter, dateToFilter]);

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: string[]; status: string }) => {
      return apiRequest("PATCH", "/api/orders/bulk-status", { orderIds, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrders(new Set());
      setBulkStatus("");
      toast({
        title: "Success",
        description: "Order statuses updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order statuses",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkStatusUpdate = () => {
    if (selectedOrders.size === 0 || !bulkStatus) return;
    
    bulkUpdateStatusMutation.mutate({
      orderIds: Array.from(selectedOrders),
      status: bulkStatus,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDeliveryLocationFilter("all");
    setDeliveryDayFilter("all");
    setMenuItemFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground">Manage incoming orders and update their status</p>
          </div>
          {selectedOrders.size > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.size} order(s) selected
              </span>
              <Select value={bulkStatus} onValueChange={setBulkStatus} data-testid="select-bulk-status">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus || bulkUpdateStatusMutation.isPending}
                data-testid="button-bulk-update"
              >
                {bulkUpdateStatusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Customer name, order #..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label>Order Placed Date</Label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="From date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      data-testid="input-date-from"
                    />
                    <Input
                      type="date"
                      placeholder="To date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      data-testid="input-date-to"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label htmlFor="status-filter">Order Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Delivery Location Filter */}
                <div>
                  <Label htmlFor="location-filter">Delivery Location</Label>
                  <Select value={deliveryLocationFilter} onValueChange={setDeliveryLocationFilter} data-testid="select-location-filter">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {Array.isArray(deliveryLocations) && deliveryLocations.map((location: any) => (
                        <SelectItem key={location.id} value={location.name}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Delivery Day Filter */}
                <div>
                  <Label htmlFor="day-filter">Delivery Day</Label>
                  <Select value={deliveryDayFilter} onValueChange={setDeliveryDayFilter} data-testid="select-day-filter">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Days</SelectItem>
                      {deliveryDays.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Menu Item Filter */}
                <div>
                  <Label htmlFor="item-filter">Menu Item</Label>
                  <Select value={menuItemFilter} onValueChange={setMenuItemFilter} data-testid="select-item-filter">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {uniqueMenuItems.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="w-full"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <div className="col-span-12 lg:col-span-9">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Orders ({filteredOrders.length})</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Orders Found</h3>
                    <p className="text-muted-foreground">
                      {orders && orders.length > 0 
                        ? "No orders match your current filters." 
                        : "You haven't received any orders yet."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                              onCheckedChange={handleSelectAll}
                              data-testid="checkbox-select-all"
                            />
                          </TableHead>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Delivery Day</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Order Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedOrders.has(order.id)}
                                onCheckedChange={() => handleSelectOrder(order.id)}
                                data-testid={`checkbox-order-${order.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-mono">
                              #{order.orderNumber || order.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium" data-testid={`customer-name-${order.id}`}>
                                  {order.customer?.fullName || "Unknown"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {order.customer?.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {order.items.map((item) => (
                                  <div key={item.id} className="text-sm">
                                    <span className="font-medium">{item.lunchbox?.name || "Item"}</span>
                                    <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                                    <span className="ml-2">${parseFloat(item.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${parseFloat(order.total).toFixed(2)}
                            </TableCell>
                            <TableCell>{order.deliveryLocation}</TableCell>
                            <TableCell className="capitalize">
                              {order.deliveryDay || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(parseISO(order.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={order.status}
                                onValueChange={(status) => 
                                  updateOrderStatusMutation.mutate({ orderId: order.id, status })
                                }
                                data-testid={`select-status-${order.id}`}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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