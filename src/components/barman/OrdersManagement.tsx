
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useApp, Order } from "@/contexts/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassMorphicCard } from "../shared/GlassMorphicCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingButton } from "../shared/LoadingButton";
import { Clock, Coffee, CheckCircle } from "lucide-react";

export const OrdersManagement = () => {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const statuses: ("pending" | "preparing" | "ready")[] = ["pending", "preparing", "ready"];
      const response = await api.orders.getOrders(statuses);

      if (response.success) {
        // Sort by creation time, newest first
        const sortedOrders = response.orders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPendingOrders(sortedOrders.filter(order => order.status === "pending"));
        setPreparingOrders(sortedOrders.filter(order => order.status === "preparing"));
        setReadyOrders(sortedOrders.filter(order => order.status === "ready"));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("A apărut o eroare la încărcarea comenzilor");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Refresh orders every 10 seconds instead of 30
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, status: "preparing" | "ready" | "picked") => {
    setProcessingOrder(orderId);
    try {
      const response = await api.orders.updateStatus(orderId, status);

      if (response.success && response.order) {
        // Show different toast messages based on status
        if (status === "preparing") {
          toast.success("Comandă acceptată și în preparare");
        } else if (status === "ready") {
          toast.success("Comandă marcată ca gata pentru ridicare");
        } else {
          toast.success(`Comandă actualizată: ${status}`);
        }
        
        // Update local state
        dispatch({
          type: "UPDATE_ORDER",
          payload: {
            id: orderId,
            updates: { status },
          },
        });
        
        // Refresh orders immediately
        loadOrders();
      } else {
        toast.error(response.error || "Eroare la actualizarea comenzii");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("A apărut o eroare la actualizarea comenzii");
    } finally {
      setProcessingOrder(null);
    }
  };

  const verifyPickupCode = async (orderId: string, inputCode: string) => {
    setProcessingOrder(orderId);
    try {
      const order = readyOrders.find(o => o.id === orderId);
      
      if (!order) {
        toast.error("Comandă negăsită");
        return;
      }
      
      if (order.pickupCode === inputCode) {
        await updateOrderStatus(orderId, "picked");
        toast.success("Cod valid! Comandă marcată ca ridicată");
      } else {
        toast.error("Cod incorect!");
      }
    } catch (error) {
      console.error("Error verifying pickup code:", error);
      toast.error("A apărut o eroare la verificarea codului");
    } finally {
      setProcessingOrder(null);
    }
  };

  const handlePickupVerification = (orderId: string) => {
    // In a real app, we might scan the code or have a dedicated input
    // For this demo, we'll use a simple prompt
    const inputCode = prompt("Introdu codul de ridicare:");
    if (inputCode) {
      verifyPickupCode(orderId, inputCode);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const renderOrderCard = (order: Order) => {
    const isProcessing = processingOrder === order.id;

    return (
      <GlassMorphicCard 
        key={order.id} 
        className="mb-4"
        variant={
          order.status === "pending" ? "purple" : 
          order.status === "preparing" ? "blue" : "pink"
        }
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-lg">{order.drink}</h4>
            <div className="text-sm text-gray-300 mt-1">
              {order.options.size === "large"
                ? "Mărime: Mare"
                : order.options.size === "small"
                ? "Mărime: Mică"
                : "Mărime: Medie"}
              {order.options.ice === false ? " • Fără gheață" : " • Cu gheață"}
              {order.options.strength && ` • Tărie: ${
                order.options.strength === "strong" ? "Tare" : 
                order.options.strength === "light" ? "Slabă" : "Normală"
              }`}
            </div>
            {order.pickupCode && (
              <div className="mt-2 flex items-center">
                <span className="text-sm font-medium mr-2">Cod:</span>
                <span className="bg-white/10 px-2 py-1 rounded text-sm font-mono">
                  {order.pickupCode}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              Comandat la {formatTime(order.createdAt)}
            </div>
          </div>
          <div className="space-y-2">
            {order.status === "pending" && (
              <LoadingButton
                size="sm"
                isLoading={isProcessing}
                loadingText="Se procesează..."
                onClick={() => updateOrderStatus(order.id, "preparing")}
              >
                <Coffee className="h-4 w-4 mr-1" />
                Începe prepararea
              </LoadingButton>
            )}
            {order.status === "preparing" && (
              <LoadingButton
                size="sm"
                variant="outline"
                isLoading={isProcessing}
                loadingText="Se procesează..."
                onClick={() => updateOrderStatus(order.id, "ready")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Gata de ridicat
              </LoadingButton>
            )}
            {order.status === "ready" && (
              <LoadingButton
                size="sm"
                variant="outline"
                isLoading={isProcessing}
                loadingText="Se verifică..."
                onClick={() => handlePickupVerification(order.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Verifică ridicare
              </LoadingButton>
            )}
          </div>
        </div>
      </GlassMorphicCard>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Comenzi</h2>
        <LoadingButton
          isLoading={isLoading}
          loadingText="Se reîmprospătează..."
          onClick={loadOrders}
          variant="outline"
          size="sm"
        >
          <Clock className="h-4 w-4 mr-1" /> Actualizează
        </LoadingButton>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="pending" className="relative">
            În așteptare
            {pendingOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-neon-purple text-white text-xs rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="relative">
            În preparare
            {preparingOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-neon-blue text-white text-xs rounded-full">
                {preparingOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="relative">
            Gata
            {readyOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-neon-pink text-white text-xs rounded-full">
                {readyOrders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-0">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nu există comenzi în așteptare
            </div>
          ) : (
            pendingOrders.map(renderOrderCard)
          )}
        </TabsContent>
        
        <TabsContent value="preparing" className="mt-0">
          {preparingOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nu există comenzi în curs de preparare
            </div>
          ) : (
            preparingOrders.map(renderOrderCard)
          )}
        </TabsContent>
        
        <TabsContent value="ready" className="mt-0">
          {readyOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nu există comenzi gata pentru ridicare
            </div>
          ) : (
            readyOrders.map(renderOrderCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
