import axios from 'axios';
import { getCookie, setCookie, removeCookie, extendCookie, getPartnerCookie, removePartnerCookie } from './cookie';

// API client for SHM backend
export const api = axios.create({
  baseURL: '/shm/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getCookie();
    if (token) {
      config.headers['session-id'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Extend cookie on each successful response
    extendCookie();
    return response;
  },
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth');
    if (error.response?.status === 401 && !isAuthRequest) {
      removeCookie();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: async (username: string, password: string, otpToken?: string) => {
    const response = await api.post('/user/auth', {
      login: username,
      password,
      ...(otpToken ? { otp_token: otpToken } : {})
    });

    // Проверяем, требуется ли OTP
    if (response.data?.otp_required) {
      return { otpRequired: true };
    }

    const sessionId = response.data?.session_id || response.data?.id;
    if (sessionId) {
      setCookie(sessionId);
    }
    return { otpRequired: false };
  },

  getCurrentUser: () => api.get('/user'),

  logout: () => {
    removeCookie();
    window.location.href = '/login';
  },

  telegramWidgetAuth: async (userData: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  }) => {
    const partnerId = getPartnerCookie();
    const response = await api.post('/telegram/web/auth', {
      ...userData,
      register_if_not_exists: 1,
      ...(partnerId && { partner_id: partnerId }),
    });
    const sessionId = response.data?.session_id || response.data?.id;
    if (sessionId) {
      setCookie(sessionId);
      // Remove partner cookie after successful auth/registration
      if (partnerId) {
        removePartnerCookie();
      }
    }
    return response;
  },

  register: async (username: string, password: string) => {
    const partnerId = getPartnerCookie();
    const data: Record<string, string> = { login: username, password };
    if (partnerId) {
      data.partner_id = partnerId;
    }
    const response = await api.put('/user', data);
    // Remove partner cookie after successful registration
    if (partnerId) {
      removePartnerCookie();
    }
    return response;
  },
};

// User API
export const userApi = {
  getProfile: () => api.get('/user'),
  updateProfile: (data: Record<string, unknown>) => api.post('/user', data),
  changePassword: (password: string) => api.post('/user/passwd', { password }),
  getServices: () => api.get('/user/service'),
  stopService: (userServiceId: number) => api.post('/user/service/stop', { user_service_id: userServiceId }),
  getPayments: () => api.get('/user/pay'),
  getPaySystems: () => api.get('/user/pay/paysystems'),
  getForecast: () => api.get('/user/pay/forecast'),
  deleteAutopayment: (paySystem: string) => api.delete('/user/autopayment', { params: { pay_system: paySystem } }),
};

export const storageApi = {
  get: (name: string) => api.get(`/storage/manage/${name}`),
  list: () => api.get('/storage/manage'),
};

// Services API
export const servicesApi = {
  list: () => api.get('/service'),
  order_list: () => api.get('/service/order'),
  order: (serviceId: number) => api.put('/service/order', { service_id: serviceId }),
  getOrderList: () => api.get('/service/order'),
};

// Telegram API
export const telegramApi = {
  getSettings: () => api.get('/telegram/user'),
  updateSettings: (data: Record<string, unknown>) => api.post('/telegram/user', data),
};

// Promo API
export const promoApi = {
  apply: (code: string) => api.get(`/promo/apply/${code}`),
  list: () => api.get('/promo'),
};

// Passkey API
export interface PasskeyCredential {
  id: string;
  name: string;
  created_at: string;
}

export interface PasskeyRegisterOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout: number;
  attestation: string;
  excludeCredentials: Array<{ id: string; type: string }>;
  authenticatorSelection: {
    authenticatorAttachment: string;
    residentKey: string;
    userVerification: string;
  };
}

export interface PasskeyAuthOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  userVerification: string;
}

export const passkeyApi = {
  list: () => api.get<{ data: { credentials: PasskeyCredential[]; enabled: boolean } }>('/user/passkey'),
  rename: (credentialId: string, name: string) => api.post('/user/passkey', { credential_id: credentialId, name }),
  delete: (credentialId: string) => api.delete('/user/passkey?credential_id=' + encodeURIComponent(credentialId)),
  registerOptions: () => api.get<{ data: PasskeyRegisterOptions }>('/user/passkey/register'),
  registerComplete: (data: {
    credential_id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      attestationObject: string;
    };
    name?: string;
  }) => api.post('/user/passkey/register', data),
  authOptionsPublic: () => api.get<{ data: PasskeyAuthOptions }>('/user/auth/passkey', {}),
  authPublic: (data: {
    credential_id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      authenticatorData: string;
      signature: string;
      userHandle?: string;
    };
  }) => api.post<{ data: { id: string } }>('/user/auth/passkey', data),
};

// Tickets API
export const ticketApi = {
  list: (status?: string) => api.get('/user/ticket', { params: status ? { status } : {} }),
  get: (ticketId: number) => api.get(`/user/ticket/${ticketId}`),
  create: (data: {
    subject: string;
    message: string;
    priority?: string;
    ticket_type?: string;
    user_service_id?: number;
  }) => api.put('/user/ticket', data),
  sendMessage: (
    ticketId: number,
    message: string,
    media?: Array<{
      name: string;
      type: string;
      size: number;
      data: string
    }>) => api.post(`/user/ticket/${ticketId}`, { message, media }),
  close: (ticketId: number) => api.delete(`/user/ticket/${ticketId}`),
};

// OTP (2FA) API
export interface OtpStatus {
  enabled: boolean;
  verified: boolean;
  required: boolean;
  last_verified?: string;
}

export interface OtpSetupResponse {
  qr_url: string;
  secret: string;
  backup_codes: string[];
}

export const otpApi = {
  status: () => api.get<{ data: OtpStatus }>('/user/otp'),
  setup: () => api.post<{ data: OtpSetupResponse }>('/user/otp/setup'),
  enable: (token: string) => api.put('/user/otp', { token }),
  disable: (token: string) => api.delete('/user/otp', { params: { token } }),
  verify: (token: string) => api.post('/user/otp', { token }),
};

// Password Auth API
export interface PasswordAuthStatus {
  password_auth_disabled: number;
  passkey_enabled: number;
  otp_enabled: number;
}

export const passwordAuthApi = {
  status: () => api.get<{ data: PasswordAuthStatus }>('/user/password-auth'),
  disable: () => api.delete('/user/password-auth'),
  enable: () => api.post('/user/password-auth'),
};