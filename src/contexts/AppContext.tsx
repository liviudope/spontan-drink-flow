
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

// Types
export type UserRole = 'client' | 'barman' | 'admin';

export type User = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  verified: boolean;
  role: UserRole;
  paymentVerified?: boolean;
  tokens?: number;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked' | 'cancelled';

export type OrderOption = {
  size?: 'small' | 'medium' | 'large';
  ice?: boolean;
  strength?: 'light' | 'normal' | 'strong';
  extras?: string[];
};

export type Order = {
  id: string;
  userId: string;
  drink: string;
  options: OrderOption;
  status: OrderStatus;
  pickupCode?: string;
  createdAt: string;
};

export type Message = {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
};

export type TokenPurchase = {
  id: string;
  userId: string;
  amount: number;
  price: number;
  bonusTokens: number;
  timestamp: string;
};

export type AppMode = 'client' | 'barman';

// Context state
type AppState = {
  user: User | null;
  isAuthenticated: boolean;
  currentOrder: Order | null;
  chatHistory: Message[];
  orders: Order[];
  mode: AppMode;
  authStep: number;
  tempUserData: Partial<User> & { otp?: string };
  sessionToken?: string;
  tokenPurchases: TokenPurchase[];
};

// Actions
type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_AUTH_STEP'; payload: number }
  | { type: 'UPDATE_TEMP_USER_DATA'; payload: Partial<User> }
  | { type: 'SET_CURRENT_ORDER'; payload: Order }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: { id: string; updates: Partial<Order> } }
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'CLEAR_CHAT_HISTORY' }
  | { type: 'SET_SESSION_TOKEN'; payload: string }
  | { type: 'UPDATE_USER_TOKENS'; payload: number }
  | { type: 'ADD_TOKEN_PURCHASE'; payload: TokenPurchase };

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  currentOrder: null,
  chatHistory: [],
  orders: [],
  mode: 'client',
  authStep: 1,
  tempUserData: { verified: false, role: 'client' },
  tokenPurchases: [],
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      localStorage.removeItem('spontanSession');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        currentOrder: null,
        authStep: 1,
        sessionToken: undefined,
        tempUserData: { verified: false, role: 'client' },
      };
    case 'SET_AUTH_STEP':
      return {
        ...state,
        authStep: action.payload,
      };
    case 'UPDATE_TEMP_USER_DATA':
      return {
        ...state,
        tempUserData: {
          ...state.tempUserData,
          ...action.payload,
        },
      };
    case 'SET_CURRENT_ORDER':
      return {
        ...state,
        currentOrder: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
      };
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.payload],
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order => 
          order.id === action.payload.id 
            ? { ...order, ...action.payload.updates } 
            : order
        ),
        currentOrder: state.currentOrder?.id === action.payload.id 
          ? { ...state.currentOrder, ...action.payload.updates } 
          : state.currentOrder,
      };
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
      };
    case 'CLEAR_CHAT_HISTORY':
      return {
        ...state,
        chatHistory: [],
      };
    case 'SET_SESSION_TOKEN':
      return {
        ...state,
        sessionToken: action.payload,
      };
    case 'UPDATE_USER_TOKENS':
      return {
        ...state,
        user: state.user ? { ...state.user, tokens: action.payload } : null,
      };
    case 'ADD_TOKEN_PURCHASE':
      return {
        ...state,
        tokenPurchases: [...state.tokenPurchases, action.payload],
        user: state.user ? {
          ...state.user,
          tokens: (state.user.tokens || 0) + action.payload.amount + action.payload.bonusTokens
        } : null,
      };
    default:
      return state;
  }
};

// Context
type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      const storedSession = localStorage.getItem('spontanSession');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          const response = await fetch('/api/verify-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: sessionData.token }),
          }).then(r => r.json());
          
          if (response.success && response.user) {
            dispatch({ type: 'SET_SESSION_TOKEN', payload: sessionData.token });
            dispatch({ type: 'SET_USER', payload: response.user });
          }
        } catch (error) {
          console.error('Error verifying session:', error);
          localStorage.removeItem('spontanSession');
        }
      }
    };
    checkSession();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
