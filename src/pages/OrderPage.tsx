
import { Layout } from "@/components/shared/Layout";
import { ChatInterface } from "@/components/order/ChatInterface";
import { OrderStatus } from "@/components/order/OrderStatus";
import { GlassMorphicCard } from "@/components/shared/GlassMorphicCard";
import { useApp } from "@/contexts/AppContext";

const OrderPage = () => {
  const { state } = useApp();

  return (
    <Layout role="client">
      <div className="flex flex-col md:flex-row h-full gap-4">
        <div className="w-full md:w-3/4">
          <GlassMorphicCard className="h-full">
            <ChatInterface />
          </GlassMorphicCard>
        </div>
        <div className="w-full md:w-1/4">
          <OrderStatus />
          <GlassMorphicCard className="p-4">
            <h3 className="font-medium mb-2">Sfaturi</h3>
            <ul className="list-disc list-inside text-sm space-y-2 text-gray-300">
              <li>Poți cere băuturi precum "Cuba Libre", "Mojito", "Gin Tonic" etc.</li>
              <li>Specifică opțiunile: mărime, gheață, tărie</li>
              <li>Urmărește statusul comenzii aici</li>
            </ul>
          </GlassMorphicCard>
        </div>
      </div>
    </Layout>
  );
};

export default OrderPage;
