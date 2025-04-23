
import { useState, useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader } from "lucide-react";
import { api } from "@/services/api";
import { v4 as uuidv4 } from "uuid";
import { GlassMorphicCard } from "../shared/GlassMorphicCard";
import { LoadingButton } from "../shared/LoadingButton";
import { toast } from "sonner";

export const ChatInterface = () => {
  const { state, dispatch } = useApp();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [currentDrink, setCurrentDrink] = useState<{ name: string; options: any } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (state.chatHistory.length === 0) {
      // Add welcome message if chat is empty
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: uuidv4(),
          sender: "ai",
          content: "Bun venit la Spontan! Ce băutură dorești să comanzi astăzi?",
          timestamp: new Date().toISOString(),
        },
      });
    }
    scrollToBottom();
  }, [state.chatHistory.length, dispatch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessageId = uuidv4();
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: userMessageId,
        sender: "user",
        content: message,
        timestamp: new Date().toISOString(),
      },
    });

    setMessage("");
    setIsTyping(true);

    try {
      // Parse the message for drink order
      const response = await api.chat.parseMessage(message);

      if (response.success && response.drink) {
        setCurrentDrink({
          name: response.drink,
          options: response.options,
        });

        // Generate price for demo
        const basePrice = 20;
        let sizeMultiplier = 1;
        if (response.options?.size === 'large') sizeMultiplier = 1.5;
        if (response.options?.size === 'small') sizeMultiplier = 0.8;
        
        const price = Math.round(basePrice * sizeMultiplier);

        // Respond with confirmation
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: uuidv4(),
            sender: "ai",
            content: `Am primit comanda ta:\n\n🍹 **${response.drink}**\n\n**Opțiuni:**\n${
              response.options?.size === 'large' ? '- Mărime: Mare\n' : 
              response.options?.size === 'small' ? '- Mărime: Mică\n' : 
              '- Mărime: Medie\n'
            }${
              response.options?.ice === false ? '- Fără gheață\n' : '- Cu gheață\n'
            }${
              response.options?.strength ? `- Tărie: ${
                response.options.strength === 'strong' ? 'Tare' : 
                response.options.strength === 'light' ? 'Slabă' : 'Normală'
              }\n` : ''
            }\n**Preț:** ${price} RON\n\nConfirmi comanda?`,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Couldn't understand the order
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: uuidv4(),
            sender: "ai",
            content: response.error || "Nu am înțeles ce băutură dorești. Poți să reformulezi?",
            timestamp: new Date().toISOString(),
          },
        });
        setCurrentDrink(null);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: uuidv4(),
          sender: "ai",
          content: "A apărut o eroare. Te rog încearcă din nou.",
          timestamp: new Date().toISOString(),
        },
      });
      setCurrentDrink(null);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!currentDrink || !state.user?.id) return;
    
    setIsProcessingOrder(true);
    
    try {
      const response = await api.orders.create(
        state.user.id,
        currentDrink.name,
        currentDrink.options
      );

      if (response.success && response.order) {
        // Add confirmation message
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: uuidv4(),
            sender: "ai",
            content: `✅ Comanda a fost plasată cu succes!\n\nCodul tău de ridicare: **${response.order.pickupCode}**\n\nVei primi o notificare când băutura ta este gata.`,
            timestamp: new Date().toISOString(),
          },
        });
        
        // Add the order to state
        dispatch({
          type: "ADD_ORDER",
          payload: response.order
        });
        
        // Set as current order
        dispatch({
          type: "SET_CURRENT_ORDER",
          payload: response.order
        });
        
        toast.success("Comandă plasată cu succes!");
        
        // Reset current drink
        setCurrentDrink(null);
      } else {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: uuidv4(),
            sender: "ai",
            content: response.error || "A apărut o eroare la plasarea comenzii. Te rog încearcă din nou.",
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: uuidv4(),
          sender: "ai",
          content: "A apărut o eroare la plasarea comenzii. Te rog încearcă din nou.",
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    setCurrentDrink(null);
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: uuidv4(),
        sender: "ai",
        content: "Comandă anulată. Cu ce altceva te pot ajuta?",
        timestamp: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-160px)]">
      <div className="flex-1 overflow-y-auto scrollbar-none p-4">
        <div className="space-y-4">
          {state.chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 ${
                  msg.sender === "user"
                    ? "bg-neon-purple/20 text-white"
                    : "glass-effect"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {msg.content.split("\n").map((line, i) => {
                    // Handle markdown-like bold text
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={i} className="mb-1">
                        {parts.map((part, j) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong key={j}>
                                {part.substring(2, part.length - 2)}
                              </strong>
                            );
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="glass-effect rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse delay-75" />
                  <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {currentDrink ? (
        <GlassMorphicCard variant="blue" className="mb-4 p-4">
          <div className="flex flex-col space-y-4">
            <h3 className="font-medium text-lg">Confirmare comandă</h3>
            <div className="flex justify-between">
              <LoadingButton
                isLoading={isProcessingOrder}
                loadingText="Se procesează..."
                onClick={handleConfirmOrder}
                className="flex-1 mr-2"
              >
                Confirmă comanda
              </LoadingButton>
              <Button
                variant="outline"
                onClick={handleCancelOrder}
                disabled={isProcessingOrder}
                className="flex-1 ml-2"
              >
                Anulează
              </Button>
            </div>
          </div>
        </GlassMorphicCard>
      ) : (
        <form onSubmit={handleSendMessage} className="mt-4">
          <div className="flex">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrie ce băutură dorești..."
              className="rounded-r-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0 border-r-0"
            />
            <Button
              type="submit"
              className="rounded-l-none"
              disabled={!message.trim() || isTyping}
            >
              {isTyping ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
