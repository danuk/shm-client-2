import { useEffect, useRef } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write' | undefined;
  showUserPhoto?: boolean;
  label?: string;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramUser) => void;
    };
  }
}

export default function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = 'write',
  showUserPhoto = true,
  label,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);
  onAuthRef.current = onAuth;

  useEffect(() => {
    if (!botName || !containerRef.current) return;

    // Callback для виджета
    const callbackName = 'TelegramLoginWidget_' + Math.random().toString(36).substring(7);
    (window as unknown as Record<string, unknown>)[callbackName] = (user: TelegramUser) => {
      onAuthRef.current(user);
    };

    // Создаём скрипт виджета
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', String(cornerRadius));
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    script.setAttribute('data-userpic', String(showUserPhoto));
    if (requestAccess) {
      script.setAttribute('data-request-access', requestAccess);
    }
    script.async = true;

    // Очищаем контейнер и добавляем скрипт
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, showUserPhoto]);

  if (!botName) return null;

  if (label) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: cornerRadius,
            border: '1px solid #0088cc',
            background: '#0088cc',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            pointerEvents: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
          {label}
        </button>
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.01,
            overflow: 'hidden',
          }}
        />
      </div>
    );
  }

  return <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }} />;
}
