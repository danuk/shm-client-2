const COOKIE_NAME = 'session_id';
const COOKIE_DAYS = 3;

export function setCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(): string | null {
  const name = COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removeCookie(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function extendCookie(): void {
  const value = getCookie();
  if (value) {
    setCookie(value);
  }
}

const PARTNER_COOKIE_NAME = 'partner_id';
const PARTNER_COOKIE_DAYS = 30;

export function encodePartnerIdBase64url(id: number): string {
  return btoa(String(id)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodePartnerIdBase64url(value: string): string {
  // Обратная совместимость: если уже пришло просто число — используем как есть
  if (/^\d+$/.test(value)) {
    return value;
  }
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (padded.length % 4)) % 4;
    return atob(padded + '='.repeat(padding));
  } catch {
    return value;
  }
}

export function setPartnerCookie(value: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + PARTNER_COOKIE_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${PARTNER_COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getPartnerCookie(): string | null {
  const name = PARTNER_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function removePartnerCookie(): void {
  document.cookie = `${PARTNER_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function parseAndSavePartnerId(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('partner_id');
  if (partnerId) {
    const decoded = decodePartnerIdBase64url(partnerId);
    setPartnerCookie(decoded);
    urlParams.delete('partner_id');
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
}

export function parseAndSaveSessionId(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  if (sessionId) {
    setCookie(sessionId);
    urlParams.delete('session_id');
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
}

const RESET_TOKEN_COOKIE_NAME = 'reset_token';
const RESET_LOGIN_COOKIE_NAME = 'reset_login';
const RESET_TOKEN_COOKIE_MINUTES = 60;

function setSimpleCookie(name: string, value: string, minutes: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + minutes * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getSimpleCookie(name: string): string | null {
  const prefix = name + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(prefix) === 0) {
      return c.substring(prefix.length, c.length);
    }
  }
  return null;
}

function removeSimpleCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

export function setResetTokenCookie(value: string): void {
  setSimpleCookie(RESET_TOKEN_COOKIE_NAME, value, RESET_TOKEN_COOKIE_MINUTES);
}

export function getResetTokenCookie(): string | null {
  return getSimpleCookie(RESET_TOKEN_COOKIE_NAME);
}

export function removeResetTokenCookie(): void {
  removeSimpleCookie(RESET_TOKEN_COOKIE_NAME);
}

export function setResetLoginCookie(value: string): void {
  setSimpleCookie(RESET_LOGIN_COOKIE_NAME, value, RESET_TOKEN_COOKIE_MINUTES);
}

export function getResetLoginCookie(): string | null {
  return getSimpleCookie(RESET_LOGIN_COOKIE_NAME);
}

export function removeResetLoginCookie(): void {
  removeSimpleCookie(RESET_LOGIN_COOKIE_NAME);
}

export function parseAndSaveResetToken(): { token: string; login: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const login = urlParams.get('login');
  if (token && login) {
    setResetTokenCookie(token);
    setResetLoginCookie(login);
    urlParams.delete('token');
    urlParams.delete('login');
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
    return { token, login };
  }
  return null;
}