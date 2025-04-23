
import { Layout } from "@/components/shared/Layout";
import { QrScanner } from "@/components/checkin/QrScanner";

const CheckinPage = () => {
  return (
    <Layout role="client">
      <QrScanner />
    </Layout>
  );
};

export default CheckinPage;
