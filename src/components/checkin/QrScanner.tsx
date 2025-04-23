
import { useState, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { GlassMorphicCard } from "../shared/GlassMorphicCard";
import { Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { LoadingButton } from "../shared/LoadingButton";

export const QrScanner = () => {
  const { state } = useApp();
  const [scanning, setScanning] = useState(false);
  const [scannedEvent, setScannedEvent] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerIntervalRef = useRef<number | null>(null);

  // In a real app, this would use a QR scanning library
  // For demo purposes, we'll simulate scanning with a timeout and mock code
  const startScanning = async () => {
    setScanning(true);
    
    // In a real app, this would initialize camera
    // For demo, we'll simulate camera access
    setTimeout(() => {
      toast.info("Camera activată (simulare)");
    }, 500);
    
    // Simulate QR scanning after a delay
    setTimeout(() => {
      handleCodeDetection("EVT-SUMMER-2025");
    }, 5000);
  };

  const stopScanning = () => {
    setScanning(false);
    
    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
    
    // In a real app, this would stop the camera stream
    toast.info("Scanare oprită");
  };

  const handleCodeDetection = async (code: string) => {
    setIsProcessing(true);
    stopScanning();
    
    try {
      // Call check-in API
      const response = await api.events.checkIn(code, state.user?.id || "");
      
      if (response.success) {
        setScannedEvent(response.eventName || "Eveniment");
        toast.success("Check-in realizat cu succes!");
      } else {
        toast.error(response.error || "Cod QR invalid");
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast.error("A apărut o eroare la procesarea codului QR");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScannedEvent(null);
  };

  const simulateManualCheckIn = async () => {
    // For demo purposes - allows testing without camera access
    setIsProcessing(true);
    
    try {
      const mockQRCode = "EVT-SUMMER-2025";
      const response = await api.events.checkIn(mockQRCode, state.user?.id || "");
      
      if (response.success) {
        setScannedEvent(response.eventName || "Eveniment");
        toast.success("Check-in realizat cu succes!");
      } else {
        toast.error(response.error || "Cod QR invalid");
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast.error("A apărut o eroare la procesarea codului QR");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Check-in Eveniment</h2>

      {scannedEvent ? (
        <GlassMorphicCard variant="purple" className="p-8 text-center">
          <div className="animate-float">
            <div className="w-16 h-16 bg-neon-purple/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-12 h-12 bg-neon-purple/50 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-8 h-8 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">Check-in reușit!</h3>
            <p className="mb-6 text-lg">{scannedEvent}</p>
            <div className="text-sm opacity-75 mb-6">
              Te-ai înregistrat cu succes la eveniment.
            </div>
            <Button onClick={resetScanner}>Scanează alt cod</Button>
          </div>
        </GlassMorphicCard>
      ) : (
        <GlassMorphicCard className="w-full">
          <div className="text-center p-4">
            {scanning ? (
              <>
                <div className="relative bg-black/80 rounded-lg overflow-hidden mb-4">
                  {/* In a real app, this would show camera feed */}
                  <div className="aspect-video w-full flex items-center justify-center bg-black">
                    <div className="relative animate-pulse">
                      <div className="absolute inset-0 border-4 border-neon-purple/40 rounded-lg"></div>
                    </div>
                    <div className="text-white/70">Scanare în curs...</div>
                  </div>
                  
                  {/* Simulated targeting overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-neon-purple/30 rounded-lg"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32">
                      <div className="absolute top-0 left-0 w-8 h-2 border-t-2 border-l-2 border-neon-purple"></div>
                      <div className="absolute top-0 right-0 w-8 h-2 border-t-2 border-r-2 border-neon-purple"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-2 border-b-2 border-l-2 border-neon-purple"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-2 border-b-2 border-r-2 border-neon-purple"></div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={stopScanning}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <CameraOff className="mr-2 h-4 w-4" />
                  Oprește scanarea
                </Button>
                
                <p className="mt-4 text-sm text-muted-foreground">
                  Poziționează codul QR în cadrul camerei pentru a te înregistra la eveniment.
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <p className="mb-4">
                    Scanează un cod QR pentru a te înregistra la un eveniment
                  </p>
                  <LoadingButton
                    isLoading={isProcessing}
                    loadingText="Se procesează..."
                    onClick={startScanning}
                    className="w-full mb-2"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Începe scanarea
                  </LoadingButton>
                  
                  <Button
                    variant="outline"
                    onClick={simulateManualCheckIn}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Demo: Simulează scanare
                  </Button>
                </div>
              </>
            )}
          </div>
        </GlassMorphicCard>
      )}
    </div>
  );
};
