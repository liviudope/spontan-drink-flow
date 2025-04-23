
import { useState, useEffect } from "react";
import { Layout } from "@/components/shared/Layout";
import { GlassMorphicCard } from "@/components/shared/GlassMorphicCard";
import { useApp, Order } from "@/contexts/AppContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { History } from "lucide-react";

const HistoryPage = () => {
  const { state } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOrders = async () => {
    if (!state.user?.id) return;

    setIsLoading(true);
    try {
      const response = await api.orders.getOrders(
        ["pending", "preparing", "ready", "picked", "cancelled"],
        state.user.id
      );

      if (response.success) {
        // Sort by timestamp, most recent first
        const sortedOrders = [...response.orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error("Error loading order history:", error);
      toast.error("A apărut o eroare la încărcarea istoricului de comenzi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [state.user?.id]);

  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ro-RO', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      preparing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      ready: "bg-green-500/20 text-green-300 border-green-500/30",
      picked: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    };

    const statusLabels = {
      pending: "În așteptare",
      preparing: "În preparare",
      ready: "Gata",
      picked: "Ridicată",
      cancelled: "Anulată",
    };

    const classes = statusClasses[status as keyof typeof statusClasses] || "bg-gray-500/20 text-gray-300";
    const label = statusLabels[status as keyof typeof statusLabels] || status;

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${classes}`}>
        {label}
      </span>
    );
  };

  return (
    <Layout role="client">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Istoricul comenzilor</h2>
          <LoadingButton
            isLoading={isLoading}
            loadingText="Se încarcă..."
            onClick={loadOrders}
            variant="outline"
            size="sm"
          >
            <History className="h-4 w-4 mr-1" /> Actualizează
          </LoadingButton>
        </div>

        {orders.length === 0 ? (
          <GlassMorphicCard className="p-8 text-center">
            <div className="text-muted-foreground">
              Nu ai încă nicio comandă în istoric.
            </div>
          </GlassMorphicCard>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <GlassMorphicCard key={order.id} className="p-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{order.drink}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-gray-300 mb-1">
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
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 md:mt-0">
                    {formatDateTime(order.createdAt)}
                  </div>
                </div>
              </GlassMorphicCard>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
