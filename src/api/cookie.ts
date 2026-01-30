// Cookie utilities for session management

const COOKIE_NAME = 'session-id';
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

// Extend cookie expiration (call on each API request)
export function extendCookie(): void {
  const value = getCookie();
  if (value) {
    setCookie(value);
  }
}

const PARTNER_COOKIE_NAME = 'partner_id';
const PARTNER_COOKIE_DAYS = 30;

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

// Parse and save partner_id from URL, then remove from URL
export function parseAndSavePartnerId(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('partner_id');
  if (partnerId) {
    setPartnerCookie(partnerId);
    // Remove partner_id from URL
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
    // Remove session_id from URL
    urlParams.delete('session_id');
    const newSearch = urlParams.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
}
