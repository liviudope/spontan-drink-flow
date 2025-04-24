
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { QrScanner } from "@/components/checkin/QrScanner";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { GlassMorphicCard } from "@/components/shared/GlassMorphicCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const CheckinPage = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventName, setEventName] = useState<string | null>(null);

  const handleScan = async (data: string | null) => {
    if (!data || isLoading || !state.user?.id) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.events.checkIn(data, state.user.id);
      
      if (response.success) {
        // Successful check-in
        setIsCheckedIn(true);
        setEventName(response.eventName || "Eveniment");
        
        // Update token count
        if (state.user.tokens !== undefined) {
          dispatch({ type: "UPDATE_USER_TOKENS", payload: state.user.tokens - 1 });
        }
        
        toast({
          title: "Check-in reușit!",
          description: `Ai făcut check-in la ${response.eventName}`,
        });
      } else {
        // Failed check-in
        let errorMessage = response.error || "Cod QR invalid sau expirat";
        
        // Handle insufficient tokens
        if (response.insufficientTokens) {
          errorMessage = "Nu ai suficienți tokenuri pentru check-in";
          
          toast({
            title: "Tokenuri insuficiente",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Redirect to tokens page
          navigate("/tokens");
        } else {
          toast({
            title: "Eroare",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la check-in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout requireAuth={true}>
      <div className="container max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mr-4">
            <ChevronLeft size={16} />
            Înapoi
          </Button>
          <h1 className="text-2xl font-bold">Check-in</h1>
        </div>
        
        <GlassMorphicCard variant={isCheckedIn ? "green" : "purple"} className="mb-6">
          <div className="p-6 text-center">
            {isCheckedIn ? (
              <div className="space-y-4">
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold">Check-in reușit!</h2>
                <p className="mb-4">Ai făcut check-in la:</p>
                <div className="text-xl font-bold">{eventName}</div>
                <p className="mt-4 text-sm">
                  Ai folosit 1 token pentru acest check-in.
                  <br />
                  Tokenuri rămase: {state.user?.tokens || 0}
                </p>
                <Button onClick={() => navigate("/")} className="mt-4">
                  Înapoi la aplicație
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">
                  Scanează codul QR al evenimentului
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Acest check-in va costa 1 token. Verifică că ai suficiente tokenuri.
                </p>
                <div className="rounded-lg overflow-hidden">
                  <QrScanner onScan={handleScan} isProcessing={isLoading} />
                </div>
                {isLoading && (
                  <p className="text-center animate-pulse">Se procesează...</p>
                )}
                <div className="text-sm text-muted-foreground">
                  Tokenuri disponibile: <span className="font-bold">{state.user?.tokens || 0}</span>
                </div>
              </div>
            )}
          </div>
        </GlassMorphicCard>
      </div>
    </Layout>
  );
};

export default CheckinPage;
