
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import { api } from "@/services/api";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  message: z.string().min(2, {
    message: "Mesajul trebuie să conțină cel puțin 2 caractere.",
  }),
});

export const ChatInterface = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatHistory]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleClearChat = () => {
    dispatch({ type: "CLEAR_CHAT_HISTORY" });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isLoading) return;

    const userMessage = {
      id: uuidv4(),
      sender: "user" as const,
      content: values.message,
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat
    dispatch({ type: "ADD_MESSAGE", payload: userMessage });
    form.reset();

    setIsLoading(true);

    try {
      // Process message with AI
      const response = await api.chat.parseMessage(values.message, state.user?.id || '');

      if (response.success) {
        // If successful, add response to chat
        const aiMessage = {
          id: uuidv4(),
          sender: "ai" as const,
          content: `Am înțeles că dorești ${response.drink}. Confirm acest lucru?`,
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: "ADD_MESSAGE", payload: aiMessage });

        // Create order
        const orderResponse = await api.orders.create(
          state.user?.id!,
          response.drink!,
          response.options
        );

        if (orderResponse.success && orderResponse.order) {
          dispatch({ type: "ADD_ORDER", payload: orderResponse.order });
          dispatch({ type: "SET_CURRENT_ORDER", payload: orderResponse.order });
          
          // Update tokens count
          if (state.user?.tokens !== undefined) {
            dispatch({ type: "UPDATE_USER_TOKENS", payload: state.user.tokens - 1 });
          }
          
          // Confirmation message
          const confirmMessage = {
            id: uuidv4(),
            sender: "ai" as const,
            content: `Comanda ta pentru ${response.drink} a fost creată! Poți urmări statusul comenzii în secțiunea de mai jos.`,
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: "ADD_MESSAGE", payload: confirmMessage });
        } else {
          // Error handling
          let errorMessage = orderResponse.error || "A apărut o eroare la crearea comenzii.";
          
          // Handle insufficient tokens
          if (orderResponse.insufficientTokens) {
            errorMessage = "Nu ai suficienți tokenuri pentru a plasa o comandă.";
            
            toast({
              title: "Tokenuri insuficiente",
              description: "Nu ai suficienți tokenuri pentru a plasa o comandă.",
              variant: "destructive",
            });
            
            // Redirect to tokens page
            setTimeout(() => navigate("/tokens"), 2000);
          }
          
          const errorAiMessage = {
            id: uuidv4(),
            sender: "ai" as const,
            content: errorMessage,
            timestamp: new Date().toISOString(),
          };
          dispatch({ type: "ADD_MESSAGE", payload: errorAiMessage });
        }
      } else {
        // Handle error from AI parsing
        let errorContent = response.error || "Nu am putut procesa cererea ta. Te rog încearcă din nou.";
        
        // Handle insufficient tokens
        if (response.insufficientTokens) {
          errorContent = "Nu ai suficienți tokenuri pentru a plasa o comandă.";
          
          toast({
            title: "Tokenuri insuficiente",
            description: "Nu ai suficienți tokenuri pentru a plasa o comandă.",
            variant: "destructive",
          });
          
          // Redirect to tokens page
          setTimeout(() => navigate("/tokens"), 2000);
        }
        
        const aiErrorMessage = {
          id: uuidv4(),
          sender: "ai" as const,
          content: errorContent,
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: "ADD_MESSAGE", payload: aiErrorMessage });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Add error message to chat
      const errorMessage = {
        id: uuidv4(),
        sender: "ai" as const,
        content: "A apărut o eroare la procesarea mesajului tău. Te rog încearcă din nou.",
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_MESSAGE", payload: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-opacity-30 backdrop-blur-md bg-gray-900 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-primary/10 p-4 flex justify-between items-center">
        <h3 className="font-semibold">Comandă o băutură</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearChat}
        >
          Șterge conversația
        </Button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {state.chatHistory.length === 0 ? (
          <div className="text-center text-gray-400 my-8">
            <p>Spune-i barmanului virtual ce băutură dorești.</p>
            <p className="mt-2 text-sm">Exemplu: "Aș dori un mojito cu gheață, te rog."</p>
          </div>
        ) : (
          state.chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none"
                }`}
              >
                <p className="break-words">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-700">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Spune ce băutură dorești..."
                      className="min-h-24 resize-none"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Se trimite..."
              >
                Trimite
              </LoadingButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
