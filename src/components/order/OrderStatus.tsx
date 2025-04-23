
import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/services/api";
import { GlassMorphicCard } from "../shared/GlassMorphicCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingButton } from "../shared/LoadingButton";

export const OrderStatus = () => {
  const { state, dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentOrder = state.currentOrder;

  useEffect(() => {
    // Load active orders on mount if there's no current order
    if (!currentOrder && state.user?.id) {
      loadActiveOrders();
    }
  }, [state.user?.id]);

  const loadActiveOrders = async () => {
    if (!state.user?.id) return;

    setIsRefreshing(true);
    try {
      const response = await api.orders.getOrders(
        ["pending", "preparing", "ready"],
        state.user.id
      );

      if (response.success && response.orders.length > 0) {
        // Sort by timestamp, most recent first
        const sortedOrders = [...response.orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Set most recent as current order
        dispatch({
          type: "SET_CURRENT_ORDER",
          payload: sortedOrders[0],
        });
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder) return;

    setIsLoading(true);
    try {
      const response = await api.orders.updateStatus(currentOrder.id, "cancelled");
      if (response.success) {
        toast.success("Comanda a fost anulată");
        dispatch({
          type: "UPDATE_ORDER",
          payload: {
            id: currentOrder.id,
            updates: { status: "cancelled" },
          },
        });
        dispatch({ type: "SET_CURRENT_ORDER", payload: null });
      } else {
        toast.error(response.error || "Eroare la anularea comenzii");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("A apărut o eroare la anularea comenzii");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!currentOrder) return null;

    const statusMessages = {
      pending: "Comanda ta a fost trimisă. Așteptăm ca barmanul să o accepte.",
      preparing: "Barmanul pregătește băutura ta în acest moment.",
      ready: "Băutura ta este gata! Arată codul de ridicare barmanului.",
      picked: "Ai ridicat comanda. Sperăm că îți place!",
      cancelled: "Comanda a fost anulată.",
    };

    const statusColors = {
      pending: "bg-yellow-500",
      preparing: "bg-blue-500",
      ready: "bg-green-500",
      picked: "bg-purple-500",
      cancelled: "bg-red-500",
    };

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${statusColors[currentOrder.status]} animate-pulse`}
          ></div>
          <span className="font-medium">
            {statusMessages[currentOrder.status]}
          </span>
        </div>

        {currentOrder.status === "ready" && (
          <div className="flex flex-col items-center space-y-2 my-4">
            <span className="text-lg font-medium">Cod de ridicare:</span>
            <div className="text-3xl font-bold tracking-wide bg-white/10 px-6 py-2 rounded-lg neon-glow-blue">
              {currentOrder.pickupCode}
            </div>
          </div>
        )}

        {(currentOrder.status === "pending" || currentOrder.status === "preparing") && (
          <Button
            variant="destructive"
            onClick={handleCancelOrder}
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? "Se anulează..." : "Anulează comanda"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <GlassMorphicCard
      variant={
        !currentOrder
          ? "default"
          : currentOrder.status === "ready"
          ? "blue"
          : currentOrder.status === "pending"
          ? "purple"
          : currentOrder.status === "preparing"
          ? "blue"
          : "default"
      }
      className="mb-4"
    >
      <div className="flex flex-col items-center p-4 text-center">
        <h3 className="text-xl font-bold mb-4">Status comandă</h3>

        {currentOrder ? (
          <>
            <div className="mb-4">
              <h4 className="text-lg">{currentOrder.drink}</h4>
              <div className="text-sm text-gray-300">
                {currentOrder.options.size === "large"
                  ? "Mărime: Mare"
                  : currentOrder.options.size === "small"
                  ? "Mărime: Mică"
                  : "Mărime: Medie"}
                {currentOrder.options.ice === false
                  ? " • Fără gheață"
                  : " • Cu gheață"}
              </div>
            </div>

            {getStatusDisplay()}
          </>
        ) : (
          <>
            <p className="mb-4">Nu ai nicio comandă activă în acest moment.</p>
            <LoadingButton
              isLoading={isRefreshing}
              loadingText="Se verifică..."
              onClick={loadActiveOrders}
              variant="outline"
            >
              Verifică comenzi
            </LoadingButton>
          </>
        )}
      </div>
    </GlassMorphicCard>
  );
};
