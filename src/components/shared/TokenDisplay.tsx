
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const TokenDisplay = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    // Show warning if tokens are low
    if (state.user?.tokens !== undefined && state.user.tokens < 10 && state.user.tokens > 0) {
      setShowWarning(true);
      
      // Show toast notification for low tokens
      toast({
        title: "Atenție!",
        description: "Stocul tău de tokenuri e pe terminate!",
        duration: 5000,
      });
    } else {
      setShowWarning(false);
    }
  }, [state.user?.tokens]);
  
  if (state.user?.role === 'barman') return null;
  
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant={showWarning ? "destructive" : "outline"} 
        size="sm" 
        onClick={() => navigate('/tokens')}
        className={`flex items-center gap-2 ${showWarning ? 'animate-pulse' : ''}`}
      >
        <CreditCard size={16} />
        <span className="font-bold">{state.user?.tokens || 0}</span>
      </Button>
    </div>
  );
};
