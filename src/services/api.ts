
import { User, Order, OrderStatus, Message } from '../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';

// Mock data
let users: User[] = [];
let orders: Order[] = [];
let otpStore: Record<string, { otp: string; expires: number }> = {};

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
        role: 'client'
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
    
    async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
      await delay(1000); // Simulate network delay
      
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
      }
      
      // Clear OTP
      delete otpStore[phone];
      
      return { success: true };
    },
    
    async addPaymentMethod(userId: string, cardData: any): Promise<{ success: boolean; error?: string }> {
      await delay(1000); // Simulate network delay
      
      // Validate card data (mock)
      if (!cardData.number || !cardData.name || !cardData.cvv || !cardData.expiry) {
        return { success: false, error: 'Toate câmpurile cardului sunt necesare' };
      }
      
      // Update user payment verification
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex >= 0) {
        users[userIndex].paymentVerified = true;
      } else {
        return { success: false, error: 'Utilizator negăsit' };
      }
      
      return { success: true };
    }
  },
  
  chat: {
    async parseMessage(message: string): Promise<{ 
      success: boolean; 
      drink?: string; 
      options?: any;
      error?: string 
    }> {
      await delay(1000); // Simulate NLP processing
      
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
      error?: string 
    }> {
      await delay(1000); // Simulate network delay
      
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
      error?: string 
    }> {
      await delay(1000);
      
      // Mock validation - in a real app, would validate against actual events
      if (qrCode.startsWith('EVT')) {
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
