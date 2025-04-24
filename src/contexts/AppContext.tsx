import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';

// Types
export type UserRole = 'client' | 'barman';

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

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userMeta, error: userError } = await supabase
          .from('users_meta')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userMeta) {
          dispatch({ 
            type: 'SET_USER', 
            payload: {
              id: session.user.id,
              name: userMeta.name,
              phone: userMeta.phone,
              verified: userMeta.verified,
              tokens: userMeta.tokens,
              role: userMeta.role || 'client'
            }
          });
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: userMeta } = await supabase
            .from('users_meta')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userMeta) {
            dispatch({ 
              type: 'SET_USER', 
              payload: {
                id: session.user.id,
                name: userMeta.name,
                phone: userMeta.phone,
                verified: userMeta.verified,
                tokens: userMeta.tokens,
                role: userMeta.role || 'client'
              }
            });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
