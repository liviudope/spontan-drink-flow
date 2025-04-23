
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { GlassMorphicCard } from "@/components/shared/GlassMorphicCard";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/shared/Layout";
import { MessageSquare, Check, QrCode } from "lucide-react";

const Index = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated, redirect to auth
    if (!state.isAuthenticated) {
      navigate("/auth");
    } else if (state.user?.role === "barman") {
      // Barman redirects to barman dashboard
      navigate("/barman");
    }
  }, [state.isAuthenticated, state.user?.role, navigate]);

  // For client users - show landing page
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Bine ai venit la Spontan!
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Cea mai rapidă cale să comanzi băuturi și să te bucuri de momentele spontane.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <GlassMorphicCard variant="purple" className="text-center p-6">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 bg-neon-purple/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-neon-purple" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">Comandă prin chat</h3>
            <p className="text-sm text-gray-300 mb-4">
              Scrie în chat ce dorești să bei și lasă AI-ul să se ocupe de restul.
            </p>
            <Button onClick={() => navigate("/order")} className="w-full">
              Comandă acum
            </Button>
          </GlassMorphicCard>

          <GlassMorphicCard variant="blue" className="text-center p-6">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 bg-neon-blue/20 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-neon-blue" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">Istoric comenzi</h3>
            <p className="text-sm text-gray-300 mb-4">
              Vezi toate băuturile comandate și statusul lor actual.
            </p>
            <Button 
              onClick={() => navigate("/history")} 
              variant="outline" 
              className="w-full"
            >
              Vezi istoricul
            </Button>
          </GlassMorphicCard>

          <GlassMorphicCard variant="pink" className="text-center p-6">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 bg-neon-pink/20 rounded-full flex items-center justify-center">
                <QrCode className="h-6 w-6 text-neon-pink" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">Check-in evenimente</h3>
            <p className="text-sm text-gray-300 mb-4">
              Scanează codul QR pentru a te înregistra la evenimentele Spontan.
            </p>
            <Button 
              onClick={() => navigate("/checkin")}
              variant="outline" 
              className="w-full"
            >
              Scanează QR
            </Button>
          </GlassMorphicCard>
        </div>

        <GlassMorphicCard className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Cum funcționează?</h2>
          <ol className="list-decimal list-inside space-y-4 ml-4">
            <li className="text-gray-200">
              <span className="font-medium">Comandă băutura preferată</span>
              <p className="text-gray-300 ml-6 mt-1">
                Folosește chatbot-ul pentru a comanda exact ce dorești. Poți specifica mărimea, cantitatea de gheață sau tăria băuturii.
              </p>
            </li>
            <li className="text-gray-200">
              <span className="font-medium">Primești cod de ridicare</span>
              <p className="text-gray-300 ml-6 mt-1">
                După confirmarea comenzii, primești un cod unic pe care îl vei arăta barmanului.
              </p>
            </li>
            <li className="text-gray-200">
              <span className="font-medium">Urmărești statusul în timp real</span>
              <p className="text-gray-300 ml-6 mt-1">
                Vezi în orice moment dacă băutura ta este în așteptare, în preparare sau gata de ridicare.
              </p>
            </li>
            <li className="text-gray-200">
              <span className="font-medium">Ridici băutura și te bucuri de ea</span>
              <p className="text-gray-300 ml-6 mt-1">
                Arată codul barmanului și ridică băutura atunci când este gata. Simplu și rapid!
              </p>
            </li>
          </ol>
        </GlassMorphicCard>
      </div>
    </Layout>
  );
};

export default Index;
