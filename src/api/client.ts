import axios from 'axios';
import { getCookie, setCookie, removeCookie, extendCookie, getPartnerCookie, removePartnerCookie } from './cookie';
import { config } from '../config';

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
      config.headers['session_id'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
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
    bind_to_profile?: number;
    uid?: number;
    register_if_not_exists?: number;
  }) => {
    const partnerId = getPartnerCookie();
    const response = await api.post('/telegram/web/auth', {
      ...userData,
      profile: config.TELEGRAM_BOT_AUTH_PROFILE,
      ...(partnerId && { partner_id: partnerId }),
      ...(userData.bind_to_profile && { bind_to_profile: userData.bind_to_profile }),
      ...(userData.uid && { uid: userData.uid }),
      ...(userData.register_if_not_exists && { register_if_not_exists: userData.register_if_not_exists }),
    });
    const sessionId = response.data?.session_id || response.data?.id;
    if (sessionId) {
      setCookie(sessionId);
      if (partnerId) {
        removePartnerCookie();
      }
    }
    return response;
  },

  register: async (username: string, password: string, captchaToken?: string, captchaAnswer?: string) => {
    const partnerId = getPartnerCookie();
    const data: Record<string, string> = { login: username, password };
    if (partnerId) {
      data.partner_id = partnerId;
    }
    if (captchaToken && captchaAnswer !== undefined) {
      data.captcha_token = captchaToken;
      data.captcha_answer = captchaAnswer;
    }
    const response = await api.put('/user', data);
    if (partnerId) {
      removePartnerCookie();
    }
    return response;
  },
  getCaptcha: () => api.get<{ data: { image?: string; question?: string; token: string } }>('/user/captcha'),

  telegramWebAppAuth: async (initData: string, profile: string) => {
    const partnerId = getPartnerCookie();
    const params = new URLSearchParams({
      initData,
      profile,
      ...(partnerId && { partner_id: partnerId }),
    });
    const response = await api.get(`/telegram/webapp/auth?${params.toString()}`);
    const sessionId = response.data?.session_id || response.data?.id;
    if (sessionId) {
      setCookie(sessionId);
      if (partnerId) {
        removePartnerCookie();
      }
    }
    return response;
  },

  telegramOidcInit: (params?: {
    profile?: string;
    register_if_not_exists?: number;
    return_url?: string;
  }) => {
    const queryParams = {
      profile: params?.profile || config.TELEGRAM_BOT_AUTH_PROFILE,
      register_if_not_exists: params?.register_if_not_exists ?? 1,
      ...(params?.return_url ? { return_url: params.return_url } : {}),
    };
    return api.get('/telegram/web/auth/init', { params: queryParams });
  },
};

export const userApi = {
  getProfile: () => api.get('/user'),
  updateProfile: (data: Record<string, unknown>) => api.post('/user', data),
  changePassword: (password: string) => api.post('/user/passwd', { password }),
  resetPassword: (params: { login?: string; email?: string }) => api.post('/user/passwd/reset', params),
  verifyResetToken: (token: string) => api.get('/user/passwd/reset/verify', { params: { token } }),
  resetPasswordWithToken: (token: string, password: string) => api.post('/user/passwd/reset/verify', { token, password }),
  getServices: () => api.get('/user/service', { params: { limit: 1000 } }),
  stopService: (userServiceId: number) => api.post('/user/service/stop', { user_service_id: userServiceId }),
  changeService: (userServiceId: number, serviceId: number, finish_active: number, partial_renew: number) => api.post('/user/service/change', {
    user_service_id: userServiceId,
    service_id: serviceId,
    finish_active: finish_active,
    allow_partial_period: partial_renew,
  }),
  getPayments: (params?: { limit?: number; offset?: number; sort_field?: string; sort_direction?: string; filter?: Record<string, unknown> }) => {
    const { filter, ...rest } = params || {};
    return api.get('/user/pay', { params: { ...rest, ...(filter ? { filter: JSON.stringify(filter) } : {}) } });
  },
  getPaySystems: () => api.get('/user/pay/paysystems'),
  getForecast: () => api.get('/user/pay/forecast'),
  deleteAutopayment: (paySystem: string) => api.delete('/user/autopayment', { params: { pay_system: paySystem } }),
  getWithdrawals: (params?: { limit?: number; offset?: number; sort_field?: string; sort_direction?: string; filter?: Record<string, unknown> }) => {
    const { filter, ...rest } = params || {};
    return api.get('/user/withdraw', { params: { ...rest, ...(filter ? { filter: JSON.stringify(filter) } : {}) } });
  },
};

export const userEmailApi = {
  getEmail: () => api.get<{ data: { email: string, email_verified: number } }>('/user/email'),
  setEmail: (email: string) => api.put('/user/email', { email: email }),
  sendVerifyCode: (email: string) => api.post('/user/email/verify', { email: email }),
  confirmEmail: (code: string) => api.post('/user/email/verify', { code: code }),
  deleteEmail: () => api.delete('/user/email'),
};

export const storageApi = {
  get: (name: string) => api.get(`/storage/manage/${name}`),
  list: () => api.get('/storage/manage'),
};

export const servicesApi = {
  list: () => api.get('/service'),
  order_list: (filter?: { category?: string; service_id?: number | string }) => api.get('/service/order', {
    params: filter ? { filter: JSON.stringify(filter) } : {},
  }),
  order: (serviceId: number) => api.put('/service/order', { service_id: serviceId }),
  getOrderList: () => api.get('/service/order'),
};

export const telegramApi = {
  getSettings: () => api.get('/telegram/user'),
  updateSettings: (data: Record<string, unknown>) => api.post('/telegram/user', data),
  unbindAccount: () => api.delete('/telegram/user'),
  initOidc: (params: { uid: number; return_url: string; profile?: string }) => api.get('/telegram/web/auth/init', {
    params: {
      bind_to_profile: 1,
      register_if_not_exists: 0,
      ...params,
    },
  }),
};

export const promoApi = {
  apply: (code: string) => api.get(`/promo/apply/${code}`),
  list: () => api.get('/promo'),
};

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
  delete: (credentialId: string) => api.delete('/user/passkey', { params: { credential_id: credentialId } }),
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