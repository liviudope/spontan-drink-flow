import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { LoadingButton } from "../shared/LoadingButton";
import { GlassMorphicCard } from "../shared/GlassMorphicCard";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const Step1Schema = z.object({
  name: z.string().min(2, {
    message: "Numele trebuie să aibă cel puțin 2 caractere",
  }),
  email: z.string().email({
    message: "Adresă de email invalidă",
  }),
});

const Step2Schema = z.object({
  phone: z.string().min(9, {
    message: "Numărul de telefon trebuie să aibă cel puțin 9 caractere",
  }),
});

const OtpSchema = z.object({
  otp: z.string().length(4, {
    message: "Codul OTP trebuie să aibă 4 cifre",
  }),
});

const Step3Schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, {
    message: "Numărul cardului trebuie să aibă 16 cifre",
  }),
  cardName: z.string().min(3, {
    message: "Numele trebuie să aibă cel puțin 3 caractere",
  }),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: "Format data expirare invalid (MM/YY)",
  }),
  cardCvv: z.string().regex(/^\d{3}$/, {
    message: "CVV trebuie să aibă 3 cifre",
  }),
});

export const AuthForm = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const step1Form = useForm<z.infer<typeof Step1Schema>>({
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      name: state.tempUserData.name || "",
      email: state.tempUserData.email || "",
    },
  });

  const step2Form = useForm<z.infer<typeof Step2Schema>>({
    resolver: zodResolver(Step2Schema),
    defaultValues: {
      phone: state.tempUserData.phone || "",
    },
  });

  const otpForm = useForm<z.infer<typeof OtpSchema>>({
    resolver: zodResolver(OtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const step3Form = useForm<z.infer<typeof Step3Schema>>({
    resolver: zodResolver(Step3Schema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvv: "",
    },
  });

  const onSubmitStep1 = async (data: z.infer<typeof Step1Schema>) => {
    setIsLoading(true);
    try {
      const response = await api.auth.start({
        name: data.name,
        email: data.email,
      });

      if (response.success) {
        dispatch({
          type: "UPDATE_TEMP_USER_DATA",
          payload: {
            name: data.name,
            email: data.email,
            ...(response.user || {}),
          },
        });
        dispatch({ type: "SET_AUTH_STEP", payload: 2 });
      } else {
        step1Form.setError("root", { message: response.error });
      }
    } catch (error) {
      step1Form.setError("root", { message: "A apărut o eroare. Încercați din nou." });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitStep2 = async (data: z.infer<typeof Step2Schema>) => {
    if (!otpSent) {
      setIsLoading(true);
      try {
        const response = await api.auth.sendOtp(data.phone);
        if (response.success) {
          dispatch({
            type: "UPDATE_TEMP_USER_DATA",
            payload: { phone: data.phone },
          });
          setOtpSent(true);
        } else {
          step2Form.setError("root", { message: response.error });
        }
      } catch (error) {
        step2Form.setError("root", { message: "A apărut o eroare. Încercați din nou." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onSubmitOtp = async (data: z.infer<typeof OtpSchema>) => {
    setIsLoading(true);
    try {
      const response = await api.auth.verifyOtp(
        state.tempUserData.phone || "",
        data.otp
      );

      if (response.success) {
        dispatch({
          type: "UPDATE_TEMP_USER_DATA",
          payload: { verified: true },
        });
        dispatch({ type: "SET_AUTH_STEP", payload: 3 });
      } else {
        otpForm.setError("otp", { message: response.error });
      }
    } catch (error) {
      otpForm.setError("root", { message: "A apărut o eroare. Încercați din nou." });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitStep3 = async (data: z.infer<typeof Step3Schema>) => {
    setIsLoading(true);
    try {
      const response = await api.auth.addPaymentMethod(
        state.tempUserData.id || "",
        {
          number: data.cardNumber,
          name: data.cardName,
          expiry: data.cardExpiry,
          cvv: data.cardCvv,
        }
      );

      if (response.success) {
        dispatch({
          type: "SET_USER",
          payload: {
            id: state.tempUserData.id || "",
            name: state.tempUserData.name || "",
            email: state.tempUserData.email || "",
            phone: state.tempUserData.phone || "",
            verified: true,
            role: state.tempUserData.role || "client",
            paymentVerified: true,
          },
        });
        navigate("/");
      } else {
        step3Form.setError("root", { message: response.error });
      }
    } catch (error) {
      step3Form.setError("root", { message: "A apărut o eroare. Încercați din nou." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarmanLogin = async () => {
    setIsLoading(true);
    try {
      const response = await api.auth.start({
        email: "barman@spontan.app",
        name: "Alex Barman"
      });
      
      if (response.success && response.user) {
        dispatch({
          type: "SET_USER",
          payload: {
            id: response.user.id || "barman-1",
            name: response.user.name || "Alex Barman",
            email: response.user.email || "barman@spontan.app",
            phone: response.user.phone || "0700000000",
            verified: true,
            role: "barman",
            paymentVerified: true
          }
        });
        navigate("/barman");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-6 py-8">
      <img 
        src="/lovable-uploads/7f8228c7-4e7c-4a0e-8699-522a2c37c47a.png" 
        alt="Spontan" 
        className="h-20 mb-4"
      />
      
      {state.authStep === 1 && (
        <GlassMorphicCard variant="purple" className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Bine ai venit!</CardTitle>
            <CardDescription>
              Introdu numele și email-ul tău pentru a începe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="space-y-4">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nume</FormLabel>
                      <FormControl>
                        <Input placeholder="Numele tău" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={step1Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplu.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <LoadingButton 
                  isLoading={isLoading} 
                  loadingText="Se verifică..."
                  type="submit"
                  className="w-full"
                >
                  Continuă
                </LoadingButton>
                {step1Form.formState.errors.root && (
                  <p className="text-red-500 text-sm mt-2">
                    {step1Form.formState.errors.root.message}
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-xs text-muted-foreground text-center">
              Demo: Poți continua direct ca barman pentru a vedea dashboard-ul
            </div>
            <Button variant="outline" onClick={handleBarmanLogin} size="sm" className="w-full">
              Login ca barman (demo)
            </Button>
          </CardFooter>
        </GlassMorphicCard>
      )}

      {state.authStep === 2 && (
        <GlassMorphicCard variant="blue" className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Verificare telefon</CardTitle>
            <CardDescription>
              {otpSent
                ? "Introdu codul primit prin SMS"
                : "Adaugă numărul tău de telefon pentru verificare"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!otpSent ? (
              <Form {...step2Form}>
                <form onSubmit={step2Form.handleSubmit(onSubmitStep2)} className="space-y-4">
                  <FormField
                    control={step2Form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="07xxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <LoadingButton 
                    isLoading={isLoading} 
                    loadingText="Se trimite..."
                    type="submit"
                    className="w-full"
                  >
                    Trimite cod
                  </LoadingButton>
                  {step2Form.formState.errors.root && (
                    <p className="text-red-500 text-sm mt-2">
                      {step2Form.formState.errors.root.message}
                    </p>
                  )}
                </form>
              </Form>
            ) : (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cod OTP</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={4} {...field} value={field.value}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <LoadingButton 
                    isLoading={isLoading} 
                    loadingText="Se verifică..."
                    type="submit"
                    className="w-full"
                  >
                    Verifică codul
                  </LoadingButton>
                  <Button
                    variant="ghost"
                    type="button"
                    className="w-full mt-2"
                    onClick={() => {
                      setOtpSent(false);
                      otpForm.reset();
                    }}
                  >
                    Retrimite cod
                  </Button>
                  {otpForm.formState.errors.root && (
                    <p className="text-red-500 text-sm mt-2">
                      {otpForm.formState.errors.root.message}
                    </p>
                  )}
                </form>
              </Form>
            )}
          </CardContent>
        </GlassMorphicCard>
      )}

      {state.authStep === 3 && (
        <GlassMorphicCard variant="pink" className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Detalii plată</CardTitle>
            <CardDescription>
              Adaugă detaliile cardului pentru a finaliza înregistrarea
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step3Form}>
              <form onSubmit={step3Form.handleSubmit(onSubmitStep3)} className="space-y-4">
                <FormField
                  control={step3Form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Număr card</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1234 5678 9012 3456" 
                          maxLength={16} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={step3Form.control}
                  name="cardName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nume titular</FormLabel>
                      <FormControl>
                        <Input placeholder="NUME PRENUME" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={step3Form.control}
                    name="cardExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data expirare</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/YY" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step3Form.control}
                    name="cardCvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input placeholder="123" maxLength={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <LoadingButton 
                  isLoading={isLoading} 
                  loadingText="Se procesează..."
                  type="submit"
                  className="w-full"
                >
                  Finalizează
                </LoadingButton>
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Acest formular este doar pentru demonstrație. Nu introduce date reale!
                </div>
                {step3Form.formState.errors.root && (
                  <p className="text-red-500 text-sm mt-2">
                    {step3Form.formState.errors.root.message}
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </GlassMorphicCard>
      )}
    </div>
  );
};
