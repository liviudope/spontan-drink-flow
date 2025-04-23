
import { Layout } from "@/components/shared/Layout";
import { OrdersManagement } from "@/components/barman/OrdersManagement";

const BarmanPage = () => {
  return (
    <Layout role="barman">
      <OrdersManagement />
    </Layout>
  );
};

export default BarmanPage;
