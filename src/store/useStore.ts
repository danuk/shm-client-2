import { create } from 'zustand';
import { removeCookie } from '../api/cookie';

interface User {
  user_id: number;
  login: string;
  full_name?: string;
  phone?: string;
  balance: number;
  credit: number;
  discount: number;
  bonus: number;
  gid: number;
  telegram_user_id?: number;
}

interface AppState {
  user: User | null;
  userEmail: string | null;
  userEmailVerified: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailLoaded: boolean;
  telegramPhoto: string | null;
  hasNewTicketMessages: boolean;
  lastTicketCheck: number;

  setUser: (user: User | null) => void;
  setUserEmail: (email: string | null) => void;
  setUserEmailVerified: (verified: number | 0) => void;
  setIsLoading: (loading: boolean) => void;
  setIsEmailLoaded: (loaded: boolean) => void;
  setTelegramPhoto: (photo: string | null) => void;
  setHasNewTicketMessages: (hasNew: boolean) => void;
  setLastTicketCheck: (timestamp: number) => void;
  openVerifyModal: boolean;
  setOpenVerifyModal: (open: boolean) => void;
  openEmailModal: boolean;
  setOpenEmailModal: (open: boolean) => void;
  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  userEmail: null,
  userEmailVerified: null,
  isAuthenticated: false,
  isLoading: true,
  isEmailLoaded: false,
  telegramPhoto: localStorage.getItem('shm_telegram_photo'),
  hasNewTicketMessages: false,
  lastTicketCheck: parseInt(localStorage.getItem('shm_last_ticket_check') || '0'),
  openVerifyModal: false,
  openEmailModal: false,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
  }),
  setUserEmail: (email) => set({ userEmail: email }),
  setUserEmailVerified: (verified) => set({ userEmailVerified: verified }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsEmailLoaded: (loaded) => set({ isEmailLoaded: loaded }),
  setTelegramPhoto: (photo) => {
    if (photo) {
      localStorage.setItem('shm_telegram_photo', photo);
    } else {
      localStorage.removeItem('shm_telegram_photo');
    }
    set({ telegramPhoto: photo });
  },
  setHasNewTicketMessages: (hasNew) => set({ hasNewTicketMessages: hasNew }),
  setLastTicketCheck: (timestamp) => {
    localStorage.setItem('shm_last_ticket_check', String(timestamp));
    set({ lastTicketCheck: timestamp });
  },
  setOpenVerifyModal: (open) => set({ openVerifyModal: open }),
  setOpenEmailModal: (open) => set({ openEmailModal: open }),
  logout: async () => {
    try {
      const response = await fetch('/shm/v1/user/logout', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Logout HTTP ${response.status}`);
    } catch (error) {
    }
    removeCookie();
    localStorage.removeItem('shm_telegram_photo');
    set({ user: null, isAuthenticated: false, telegramPhoto: null, hasNewTicketMessages: false, userEmail: null, userEmailVerified: null, isEmailLoaded: false });
  },
}));