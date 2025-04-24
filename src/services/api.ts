
import { User, Order, OrderStatus, Message, TokenPurchase } from '../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';

// Mock data
let users: User[] = [];
let orders: Order[] = [];
let otpStore: Record<string, { otp: string; expires: number }> = {};
let sessions: Record<string, { userId: string; expires: number }> = {};
let tokenPurchases: TokenPurchase[] = [];

// Helper to simulate async API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    async start(userData: Partial<User>): Promise<{ success: boolean; user?: Partial<User>; error?: string }> {
      await delay(1000); // Simulate network delay
      
      // Validate email/name
      if (!userData.email || !userData.name) {
        return { success: false, error: 'Email și numele sunt obligatorii' };
      }
      
      // Check if user exists
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        return { 
          success: true, 
          user: { ...existingUser, verified: existingUser.verified }
        };
      }
      
      // Create new user (unverified)
      const newUser: User = {
        id: uuidv4(),
        name: userData.name,
        email: userData.email,
        verified: false,
        role: 'client',
        tokens: 0
      };
      
      users.push(newUser);
      return { success: true, user: newUser };
    },
    
    async sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
      await delay(1000); // Simulate network delay
      
      if (!phone || phone.length < 9) {
        return { success: false, error: 'Număr de telefon invalid' };
      }
      
      // Generate OTP (in real app, would be sent via SMS)
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(`[DEBUG] OTP for ${phone}: ${otp}`);
      
      // Store OTP with 5 minute expiry
      otpStore[phone] = {
        otp,
        expires: Date.now() + 5 * 60 * 1000
      };
      
      return { success: true };
    },
    
    async verifyOtp(phone: string, otp: string): Promise<{ 
      success: boolean; 
      sessionToken?: string; 
      error?: string 
    }> {
      await delay(1000); // Simulate network delay
      
      console.log(`Verifying OTP: ${otp} for phone: ${phone}`);
      console.log(`Stored OTPs:`, otpStore);
      
      const storedData = otpStore[phone];
      
      if (!storedData) {
        return { success: false, error: 'Nu a fost generat niciun cod pentru acest număr' };
      }
      
      if (Date.now() > storedData.expires) {
        return { success: false, error: 'Codul a expirat. Vă rugăm să solicitați unul nou' };
      }
      
      if (storedData.otp !== otp) {
        return { success: false, error: 'Cod incorect' };
      }
      
      // Update user as verified
      const userIndex = users.findIndex(u => u.phone === phone);
      if (userIndex >= 0) {
        users[userIndex].verified = true;
        users[userIndex].phone = phone;
        
        // Create a session token
        const sessionToken = uuidv4();
        const userId = users[userIndex].id!;
        
        // Store session with 30 day expiry
        sessions[sessionToken] = {
          userId,
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        };
        
        return { success: true, sessionToken };
      }
      
      // Clear OTP
      delete otpStore[phone];
      
      return { success: true };
    },
    
    async verifySession(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
      await delay(500);
      
      const session = sessions[token];
      
      if (!session) {
        return { success: false, error: 'Sesiune invalidă' };
      }
      
      if (Date.now() > session.expires) {
        delete sessions[token];
        return { success: false, error: 'Sesiunea a expirat' };
      }
      
      const user = users.find(u => u.id === session.userId);
      
      if (!user) {
        delete sessions[token];
        return { success: false, error: 'Utilizator negăsit' };
      }
      
      return { success: true, user };
    },
    
    async addPaymentMethod(userId: string, cardData: any): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
      await delay(1000); // Simulate network delay
      
      // Validate card data (mock)
      if (!cardData.number || !cardData.name || !cardData.cvv || !cardData.expiry) {
        return { success: false, error: 'Toate câmpurile cardului sunt necesare' };
      }
      
      // Update user payment verification
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex >= 0) {
        users[userIndex].paymentVerified = true;
        
        // Create a session token
        const sessionToken = uuidv4();
        
        // Store session with 30 day expiry
        sessions[sessionToken] = {
          userId,
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        };
        
        return { success: true, sessionToken };
      } else {
        return { success: false, error: 'Utilizator negăsit' };
      }
    }
  },
  
  tokens: {
    async getUserTokens(userId: string): Promise<{
      success: boolean;
      tokens?: number;
      error?: string;
    }> {
      await delay(500);
      
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return { success: false, error: 'Utilizator negăsit' };
      }
      
      return { success: true, tokens: user.tokens || 0 };
    },
    
    async purchaseTokens(userId: string, packageId: string): Promise<{
      success: boolean;
      purchase?: TokenPurchase;
      error?: string;
    }> {
      await delay(1500); // Simulate payment processing
      
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return { success: false, error: 'Utilizator negăsit' };
      }
      
      // Define packages
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
      
      // Create purchase record
      const purchase: TokenPurchase = {
        id: uuidv4(),
        userId,
        amount: selectedPackage.tokens,
        price: selectedPackage.price,
        bonusTokens: selectedPackage.bonus,
        timestamp: new Date().toISOString()
      };
      
      // Update user tokens
      const userIndex = users.findIndex(u => u.id === userId);
      users[userIndex].tokens = (users[userIndex].tokens || 0) + selectedPackage.tokens + selectedPackage.bonus;
      
      // Save purchase history
      tokenPurchases.push(purchase);
      
      return { success: true, purchase };
    },
    
    async getPurchaseHistory(userId: string): Promise<{
      success: boolean;
      purchases?: TokenPurchase[];
      error?: string;
    }> {
      await delay(800);
      
      const userPurchases = tokenPurchases.filter(p => p.userId === userId);
      
      return { success: true, purchases: userPurchases };
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
      await delay(1000); // Simulate NLP processing
      
      // Check if user has tokens
      const user = users.find(u => u.id === userId);
      if (!user || !user.tokens || user.tokens <= 0) {
        return { 
          success: false, 
          insufficientTokens: true,
          error: 'Nu ai suficienți tokenuri pentru a plasa o comandă'
        };
      }
      
      // Very simple drink detection for the mock
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
      
      // Simple option detection
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
      await delay(1000); // Simulate network delay
      
      // Find the user
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, error: 'Utilizator negăsit' };
      }
      
      // Check if user has tokens
      if (!users[userIndex].tokens || users[userIndex].tokens <= 0) {
        return {
          success: false,
          insufficientTokens: true,
          error: 'Nu ai suficienți tokenuri pentru a plasa o comandă'
        };
      }
      
      // Deduct one token for the order
      users[userIndex].tokens = users[userIndex].tokens! - 1;
      
      // Generate pickup code
      const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newOrder: Order = {
        id: uuidv4(),
        userId,
        drink,
        options,
        status: 'pending',
        pickupCode,
        createdAt: new Date().toISOString()
      };
      
      orders.push(newOrder);
      
      return { success: true, order: newOrder };
    },
    
    async getOrders(status?: OrderStatus[], userId?: string): Promise<{ 
      success: boolean; 
      orders: Order[];
      error?: string
    }> {
      await delay(800);
      
      let filteredOrders = [...orders];
      
      if (status && status.length > 0) {
        filteredOrders = filteredOrders.filter(order => status.includes(order.status));
      }
      
      if (userId) {
        filteredOrders = filteredOrders.filter(order => order.userId === userId);
      }
      
      return { success: true, orders: filteredOrders };
    },
    
    async updateStatus(orderId: string, status: OrderStatus): Promise<{ 
      success: boolean; 
      order?: Order; 
      error?: string 
    }> {
      await delay(500);
      
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        return { success: false, error: 'Comandă negăsită' };
      }
      
      // Validate state transition
      const currentStatus = orders[orderIndex].status;
      const validTransitions: {[key in OrderStatus]: OrderStatus[]} = {
        'pending': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['picked', 'cancelled'],
        'picked': [],
        'cancelled': []
      };
      
      if (!validTransitions[currentStatus].includes(status)) {
        return { success: false, error: `Tranziție invalidă de la ${currentStatus} la ${status}` };
      }
      
      // Update order
      orders[orderIndex].status = status;
      
      return { success: true, order: orders[orderIndex] };
    },
    
    async verifyPickupCode(code: string): Promise<{ 
      success: boolean; 
      order?: Order; 
      error?: string 
    }> {
      await delay(700);
      
      const order = orders.find(o => 
        o.pickupCode === code && (o.status === 'ready' || o.status === 'pending')
      );
      
      if (!order) {
        return { success: false, error: 'Cod invalid sau comandă indisponibilă' };
      }
      
      return { success: true, order };
    }
  },
  
  events: {
    async checkIn(qrCode: string, userId: string): Promise<{ 
      success: boolean; 
      eventName?: string; 
      error?: string;
      insufficientTokens?: boolean;
    }> {
      await delay(1000);
      
      // Find the user
      const user = users.find(u => u.id === userId);
      if (!user) {
        return { success: false, error: 'Utilizator negăsit' };
      }
      
      // Check if user has tokens
      if (!user.tokens || user.tokens <= 0) {
        return {
          success: false,
          insufficientTokens: true,
          error: 'Nu ai suficienți tokenuri pentru check-in'
        };
      }
      
      // Mock validation - in a real app, would validate against actual events
      if (qrCode.startsWith('EVT')) {
        // Deduct one token for check-in
        const userIndex = users.findIndex(u => u.id === userId);
        users[userIndex].tokens = users[userIndex].tokens! - 1;
        
        return { 
          success: true,
          eventName: "Summer Vibes Party @ Club Spontan"
        };
      }
      
      return { success: false, error: 'Cod QR invalid sau eveniment expirat' };
    }
  }
};

// For demo purposes, pre-populate with a barman account
users.push({
  id: 'barman-1',
  name: 'Alex Barman',
  email: 'barman@spontan.app',
  phone: '0700000000',
  verified: true,
  role: 'barman'
});
