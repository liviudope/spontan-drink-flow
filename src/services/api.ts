import { User, Order, OrderStatus, Message, TokenPurchase } from '../contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const api = {
  auth: {
    async start(userData: Partial<User>): Promise<{ success: boolean; user?: Partial<User>; error?: string }> {
      try {
        // Check if user exists by phone number
        const { data: existingUser } = await supabase
          .from('users_meta')
          .select('*')
          .eq('phone', userData.phone)
          .single();
        
        if (existingUser) {
          return { 
            success: true, 
            user: { 
              ...existingUser,
              verified: existingUser.verified,
              role: (existingUser.role as User['role']) || 'client'
            }
          };
        }
        
        // Create new unverified user
        const { data: { user }, error: authError } = await supabase.auth.signUp({
          phone: userData.phone,
          password: crypto.randomUUID(), // Generate random password as we'll use phone auth
        });

        if (authError) throw authError;

        if (user) {
          const { data: newUser, error: insertError } = await supabase
            .from('users_meta')
            .insert({
              id: user.id,
              name: userData.name,
              phone: userData.phone,
              verified: false,
              role: 'client',
              tokens: 0
            })
            .select()
            .single();

          if (insertError) throw insertError;
          
          return { success: true, user: {
            ...newUser,
            role: 'client' as User['role']
          }};
        }
        
        return { success: false, error: 'Could not create user' };
      } catch (error) {
        console.error('Error in auth.start:', error);
        return { success: false, error: error.message };
      }
    },
    
    async sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
        });
        
        if (error) throw error;
        
        return { success: true };
      } catch (error) {
        console.error('Error sending OTP:', error);
        return { success: false, error: error.message };
      }
    },
    
    async verifyOtp(phone: string, otp: string): Promise<{ 
      success: boolean; 
      sessionToken?: string; 
      error?: string 
    }> {
      try {
        const { data: { session }, error } = await supabase.auth.verifyOtp({
          phone: phone,
          token: otp,
          type: 'sms'
        });
        
        if (error) throw error;
        
        if (session) {
          const { error: updateError } = await supabase
            .from('users_meta')
            .update({ verified: true })
            .eq('id', session.user.id);
          
          if (updateError) throw updateError;
          
          return { 
            success: true, 
            sessionToken: session.access_token 
          };
        }
        
        return { success: false, error: 'No session created' };
      } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, error: error.message };
      }
    },
    
    async verifySession(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
    
        if (error) {
          console.error('Error verifying session:', error);
          return { success: false, error: 'Sesiune invalidă' };
        }
    
        if (!user) {
          return { success: false, error: 'Utilizator negăsit' };
        }
    
        const { data: userMeta, error: userError } = await supabase
          .from('users_meta')
          .select('*')
          .eq('id', user.id)
          .single();
    
        if (userError) {
          console.error('Error fetching user metadata:', userError);
          return { success: false, error: 'Utilizator negăsit' };
        }
    
        if (!userMeta) {
          return { success: false, error: 'Utilizator negăsit' };
        }
    
        const userData: User = {
          id: userMeta.id,
          name: userMeta.name || undefined,
          phone: userMeta.phone || undefined,
          verified: userMeta.verified || false,
          tokens: userMeta.tokens || 0,
          role: (userMeta.role as User['role']) || 'client'
        };
    
        return { success: true, user: userData };
      } catch (error) {
        console.error('Error in verifySession:', error);
        return { success: false, error: 'Sesiune invalidă' };
      }
    },
    
    async addPaymentMethod(userId: string, cardData: any): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (!cardData.number || !cardData.name || !cardData.cvv || !cardData.expiry) {
        return { success: false, error: 'Toate câmpurile cardului sunt necesare' };
      }
      
      return { success: true };
    }
  },

  tokens: {
    async getUserTokens(userId: string): Promise<{
      success: boolean;
      tokens?: number;
      error?: string;
    }> {
      try {
        const { data: userMeta, error } = await supabase
          .from('users_meta')
          .select('tokens')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        
        return { success: true, tokens: userMeta?.tokens || 0 };
      } catch (error) {
        console.error('Error getting user tokens:', error);
        return { success: false, error: error.message };
      }
    },
    
    async purchaseTokens(userId: string, packageId: string): Promise<{
      success: boolean;
      purchase?: TokenPurchase;
      error?: string;
    }> {
      try {
        const packages = {
          '50': { tokens: 50, price: 50, bonus: 0 },
          '100': { tokens: 100, price: 100, bonus: 0 },
          '300': { tokens: 300, price: 300, bonus: 0 },
          '500': { tokens: 500, price: 500, bonus: 25 }
        };
        
        const selectedPackage = packages[packageId as keyof typeof packages];
        
        if (!selectedPackage) {
          return { success: false, error: 'Pachet invalid' };
        }
        
        const { error: updateError } = await supabase
          .from('users_meta')
          .update({ tokens: () => `tokens + ${selectedPackage.tokens + selectedPackage.bonus}` })
          .eq('id', userId);
        
        if (updateError) throw updateError;
        
        const purchase: TokenPurchase = {
          id: crypto.randomUUID(),
          userId,
          amount: selectedPackage.tokens,
          price: selectedPackage.price,
          bonusTokens: selectedPackage.bonus,
          timestamp: new Date().toISOString()
        };
        
        return { success: true, purchase };
      } catch (error) {
        console.error('Error purchasing tokens:', error);
        return { success: false, error: error.message };
      }
    },
    
    async getPurchaseHistory(userId: string): Promise<{
      success: boolean;
      purchases?: TokenPurchase[];
      error?: string;
    }> {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { success: true, purchases: [] };
    }
  },
  
  chat: {
    async parseMessage(message: string, userId: string): Promise<{ 
      success: boolean; 
      drink?: string; 
      options?: any;
      error?: string;
      insufficientTokens?: boolean;
    }> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: userMeta, error: userError } = await supabase
        .from('users_meta')
        .select('tokens')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error getting user tokens:', userError);
        return { success: false, error: userError.message };
      }
      
      if (!userMeta || !userMeta.tokens || userMeta.tokens <= 0) {
        return { 
          success: false, 
          insufficientTokens: true,
          error: 'Nu ai suficienți tokenuri pentru a plasa o comandă'
        };
      }
      
      const drinkKeywords: {[key: string]: string} = {
        'cuba libre': 'Cuba Libre',
        'mojito': 'Mojito',
        'gin tonic': 'Gin Tonic',
        'gin & tonic': 'Gin Tonic',
        'whisky': 'Whisky',
        'vodka': 'Vodka',
        'bere': 'Bere',
        'beer': 'Bere',
        'vin': 'Vin',
        'wine': 'Vin',
        'martini': 'Martini',
        'cosmopolitan': 'Cosmopolitan',
        'margarita': 'Margarita'
      };
      
      const messageLower = message.toLowerCase();
      
      let detectedDrink: string | undefined;
      
      for (const [keyword, drink] of Object.entries(drinkKeywords)) {
        if (messageLower.includes(keyword)) {
          detectedDrink = drink;
          break;
        }
      }
      
      if (!detectedDrink) {
        return { 
          success: false, 
          error: 'Nu am putut identifica băutura. Vă rugăm să specificați ce doriți să comandați.'
        };
      }
      
      const options: any = {
        size: 'medium',
        ice: true,
      };
      
      if (messageLower.includes('mare') || messageLower.includes('large')) {
        options.size = 'large';
      } else if (messageLower.includes('mic') || messageLower.includes('small')) {
        options.size = 'small';
      }
      
      if (messageLower.includes('fără gheață') || messageLower.includes('no ice')) {
        options.ice = false;
      }
      
      if (messageLower.includes('tare') || messageLower.includes('strong')) {
        options.strength = 'strong';
      } else if (messageLower.includes('slab') || messageLower.includes('light')) {
        options.strength = 'light';
      }
      
      return { 
        success: true, 
        drink: detectedDrink,
        options
      };
    }
  },
  
  orders: {
    async create(userId: string, drink: string, options: any): Promise<{ 
      success: boolean; 
      order?: Order; 
      error?: string;
      insufficientTokens?: boolean;
    }> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: userMeta, error: userError } = await supabase
        .from('users_meta')
        .select('tokens')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error getting user tokens:', userError);
        return { success: false, error: userError.message };
      }
      
      if (!userMeta || !userMeta.tokens || userMeta.tokens <= 0) {
        return {
          success: false,
          insufficientTokens: true,
          error: 'Nu ai suficienți tokenuri pentru a plasa o comandă'
        };
      }
      
      const { error: updateError } = await supabase
        .from('users_meta')
        .update({ tokens: userMeta.tokens - 1 })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error deducting tokens:', updateError);
        return { success: false, error: updateError.message };
      }
      
      const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newOrder: Order = {
        id: crypto.randomUUID(),
        userId,
        drink,
        options,
        status: 'pending',
        pickupCode,
        createdAt: new Date().toISOString()
      };
      
      return { success: true, order: newOrder };
    },
    
    async getOrders(status?: OrderStatus[], userId?: string): Promise<{ 
      success: boolean; 
      orders: Order[];
      error?: string
    }> {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockOrders: Order[] = [];
      
      return { success: true, orders: mockOrders };
    },
    
    async updateStatus(orderId: string, status: OrderStatus): Promise<{ 
      success: boolean; 
      order?: Order; 
      error?: string 
    }> {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    },
    
    async verifyPickupCode(code: string): Promise<{ 
      success: boolean; 
      order?: Order; 
      error?: string 
    }> {
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return { success: false, error: 'Cod invalid sau comandă indisponibilă' };
    }
  },
  
  events: {
    async checkIn(qrCode: string, userId: string): Promise<{ 
      success: boolean; 
      eventName?: string; 
      error?: string;
      insufficientTokens?: boolean;
    }> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: userMeta, error: userError } = await supabase
        .from('users_meta')
        .select('tokens')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error getting user tokens:', userError);
        return { success: false, error: userError.message };
      }
      
      if (!userMeta || !userMeta.tokens || userMeta.tokens <= 0) {
        return {
          success: false,
          insufficientTokens: true,
          error: 'Nu ai suficienți tokenuri pentru check-in'
        };
      }
      
      if (qrCode.startsWith('EVT')) {
        const { error: updateError } = await supabase
          .from('users_meta')
          .update({ tokens: userMeta.tokens - 1 })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error deducting tokens:', updateError);
          return { success: false, error: updateError.message };
        }
        
        return { 
          success: true,
          eventName: "Summer Vibes Party @ Club Spontan"
        };
      }
      
      return { success: false, error: 'Cod QR invalid sau eveniment expirat' };
    }
  }
};
