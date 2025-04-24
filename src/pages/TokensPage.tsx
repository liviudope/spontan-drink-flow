
import { useState, useEffect } from "react";
import { Layout } from "@/components/shared/Layout";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassMorphicCard } from "@/components/shared/GlassMorphicCard";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const TokenPackage = ({ 
  amount, 
  price, 
  bonus, 
  onSelect, 
  selected, 
  disabled 
}: { 
  amount: number; 
  price: number; 
  bonus: number; 
  onSelect: () => void; 
  selected: boolean;
  disabled: boolean;
}) => {
  return (
    <Card 
      className={`relative border-2 transition-all ${selected ? 'border-primary bg-primary/10' : 'border-muted'}`}
      onClick={disabled ? undefined : onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{amount} tokenuri</CardTitle>
        {bonus > 0 && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            +{bonus} BONUS
          </span>
        )}
        <CardDescription>Cost: {price} lei</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-xl font-bold">{price} LEI</div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={selected ? "default" : "outline"} 
          className="w-full"
          disabled={disabled}
        >
          {selected ? "Pachet Selectat" : "Selectează"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const TokensPage = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const packages = [
    { id: '50', amount: 50, price: 50, bonus: 0 },
    { id: '100', amount: 100, price: 100, bonus: 0 },
    { id: '300', amount: 300, price: 300, bonus: 0 },
    { id: '500', amount: 500, price: 500, bonus: 25 },
  ];

  useEffect(() => {
    if (state.user?.id) {
      loadPurchaseHistory();
    }
  }, [state.user?.id]);

  const loadPurchaseHistory = async () => {
    if (!state.user?.id) return;
    
    try {
      const response = await api.tokens.getPurchaseHistory(state.user.id);
      if (response.success && response.purchases) {
        setPurchaseHistory(response.purchases);
      }
    } catch (error) {
      console.error("Error loading purchase history:", error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !state.user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await api.tokens.purchaseTokens(state.user.id, selectedPackage);
      
      if (response.success && response.purchase) {
        dispatch({ 
          type: 'ADD_TOKEN_PURCHASE', 
          payload: response.purchase 
        });

        toast({
          title: "Achiziție reușită!",
          description: `Ai cumpărat ${response.purchase.amount} tokenuri.`,
          variant: "default",
        });
        
        if (response.purchase.bonusTokens > 0) {
          toast({
            title: "Felicitări!",
            description: `Ai primit ${response.purchase.bonusTokens} tokenuri bonus!`,
            variant: "default",
          });
        }
        
        loadPurchaseHistory();
        navigate('/');
      } else {
        toast({
          title: "Eroare",
          description: response.error || "Eroare la achiziționarea tokenurilor.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error purchasing tokens:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la achiziționarea tokenurilor.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  const tokensWarningLevel = (state.user?.tokens || 0) < 10;

  return (
    <Layout requireAuth={true}>
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mr-4">
            <ChevronLeft size={16} />
            Înapoi
          </Button>
          <h1 className="text-2xl font-bold flex-grow">Tokens Spontan</h1>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Ascunde Istoric" : "Arată Istoric"}
          </Button>
        </div>
        
        <GlassMorphicCard variant="blue" className="mb-6">
          <CardHeader>
            <CardTitle>Contul tău de tokenuri</CardTitle>
            <CardDescription>
              Folosește tokenurii pentru a comanda băuturi și a face check-in la evenimente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span>Tokenuri disponibile:</span>
              <span className={`text-xl font-bold ${tokensWarningLevel ? 'text-red-500' : 'text-green-500'}`}>
                {state.user?.tokens || 0} tokenuri
              </span>
            </div>
            <Progress value={(state.user?.tokens || 0) * 100 / 500} className="mb-4" />
            
            {tokensWarningLevel && (
              <div className="bg-red-500/20 border border-red-500 rounded-md p-3 text-sm my-4">
                <strong>Atenție:</strong> Stocul tău de tokenuri este pe terminate! Achiziționează mai multe tokenuri pentru a continua să folosești aplicația.
              </div>
            )}
          </CardContent>
        </GlassMorphicCard>
        
        {showHistory && purchaseHistory.length > 0 && (
          <GlassMorphicCard className="mb-6">
            <CardHeader>
              <CardTitle>Istoricul achizițiilor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {purchaseHistory.map(purchase => (
                  <div key={purchase.id} className="flex justify-between items-center bg-card/50 p-3 rounded-md">
                    <div>
                      <div className="font-medium">
                        {purchase.amount} tokenuri {purchase.bonusTokens > 0 ? `(+${purchase.bonusTokens} bonus)` : ''}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(purchase.timestamp).toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{purchase.price} LEI</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassMorphicCard>
        )}
        
        <h2 className="text-xl font-bold mb-4">Achiziționează tokenuri</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {packages.map(pkg => (
            <TokenPackage
              key={pkg.id}
              amount={pkg.amount}
              price={pkg.price}
              bonus={pkg.bonus}
              onSelect={() => setSelectedPackage(pkg.id)}
              selected={selectedPackage === pkg.id}
              disabled={isLoading}
            />
          ))}
        </div>
        
        <div className="flex justify-center">
          <LoadingButton 
            isLoading={isLoading}
            loadingText="Se procesează..."
            onClick={handlePurchase}
            disabled={!selectedPackage}
            className="w-full max-w-xs"
          >
            Achiziționează Tokenuri
          </LoadingButton>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground text-center">
          <p>1 token = 1 leu</p>
          <p>Tokenurile nu expiră și pot fi folosite oricând</p>
          <p>Pentru asistență, contactați support@spontan.app</p>
        </div>
      </div>
    </Layout>
  );
};

export default TokensPage;
