import { useState, useEffect } from 'react';
import { Card, Text, Stack, Button, TextInput, PasswordInput, Divider, Title, Center, Modal, Group } from '@mantine/core';
import { IconLogin, IconUserPlus, IconFingerprint, IconShieldLock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { auth, passkeyApi } from '../api/client';
import { setCookie } from '../api/cookie';
import { useStore } from '../store/useStore';
import TelegramLoginButton, { TelegramUser } from '../components/TelegramLoginButton';
import { config } from '../config';

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Telegram Web App integration
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [formData, setFormData] = useState({ login: '', password: '', confirmPassword: '' });
  const [isInsideTelegramWebApp, setIsInsideTelegramWebApp] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const { setUser, setTelegramPhoto } = useStore();
  const { t } = useTranslation();
  const isWebAuthnSupported = !!window.PublicKeyCredential;

  // Проверяем Telegram WebApp при монтировании и после загрузки скрипта
  useEffect(() => {
    const checkTelegramWebApp = () => {
      const tgWebApp = window.Telegram?.WebApp;
      const isInside = !!(tgWebApp && (
        (tgWebApp.initData && tgWebApp.initData.length > 0) ||
        tgWebApp.initDataUnsafe?.user?.id
      ));
      setIsInsideTelegramWebApp(isInside);
    };

    // Проверяем сразу
    checkTelegramWebApp();

    // И ещё раз через небольшую задержку (скрипт мог не успеть загрузиться)
    const timer = setTimeout(checkTelegramWebApp, 100);
    return () => clearTimeout(timer);
  }, []);

  // Виджет показываем только если НЕ внутри WebApp
  const hasTelegramWidget = !isInsideTelegramWebApp && !!config.TELEGRAM_BOT_NAME && config.TELEGRAM_BOT_AUTH_ENABLE === 'true';

  const handleLogin = async (otpTokenParam?: string) => {
    if (!formData.login || !formData.password) {
      notifications.show({ title: t('common.error'), message: t('auth.fillAllFields'), color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const result = await auth.login(formData.login, formData.password, otpTokenParam);

      if (result.otpRequired) {
        setShowOtp(true);
        setLoading(false);
        return;
      }

      const userResponse = await auth.getCurrentUser();
      const responseData = userResponse.data.data;
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      setUser(userData);
      setShowOtp(false);
      setOtpToken('');
      notifications.show({ title: t('common.success'), message: t('auth.loginSuccess'), color: 'green' });
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
      if (axiosError.response?.status === 403 && axiosError.response?.data?.error?.includes('Password authentication is disabled')) {
        notifications.show({ title: t('common.error'), message: t('auth.passwordAuthDisabled'), color: 'red' });
      } else {
        notifications.show({ title: t('common.error'), message: t('auth.loginError'), color: 'red' });
      }
      setOtpToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otpToken) {
      notifications.show({ title: t('common.error'), message: t('otp.enterValidCode'), color: 'red' });
      return;
    }
    await handleLogin(otpToken);
  };

  const handleRegister = async () => {
    if (!formData.login || !formData.password) {
      notifications.show({ title: t('common.error'), message: t('auth.fillAllFields'), color: 'red' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      notifications.show({ title: t('common.error'), message: t('auth.passwordsMismatch'), color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await auth.register(formData.login, formData.password);
      notifications.show({ title: t('common.success'), message: t('auth.registerSuccess'), color: 'green' });
      // Переключаемся на авторизацию, сохраняя логин
      setMode('login');
      setFormData({ ...formData, confirmPassword: '' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.registerError'), color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  // Авторизация через Telegram Login Widget
  const handleTelegramWidgetAuth = async (telegramUser: TelegramUser) => {
    setLoading(true);
    try {
      // Отправляем данные виджета на бэкенд
      await auth.telegramWidgetAuth(telegramUser);
      const userResponse = await auth.getCurrentUser();
      const responseData = userResponse.data.data;
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      setUser(userData);

      // Сохраняем фото из данных Telegram виджета
      if (telegramUser.photo_url) {
        setTelegramPhoto(telegramUser.photo_url);
      }

      notifications.show({ title: t('common.success'), message: t('auth.telegramAuth'), color: 'green' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.telegramAuthError'), color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    if (!isWebAuthnSupported) {
      notifications.show({ title: t('common.error'), message: t('passkey.notSupported'), color: 'red' });
      return;
    }

    setPasskeyLoading(true);
    try {
      const optionsResponse = await passkeyApi.authOptionsPublic();
      const optionsData = optionsResponse.data.data;
      const options = Array.isArray(optionsData) ? optionsData[0] : optionsData;
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64UrlToArrayBuffer(options.challenge),
        timeout: options.timeout,
        rpId: options.rpId,
        userVerification: options.userVerification as UserVerificationRequirement,
      };
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to get credential');
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      const authResponse = await passkeyApi.authPublic({
        credential_id: arrayBufferToBase64Url(credential.rawId),
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
          authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
          signature: arrayBufferToBase64Url(response.signature),
          userHandle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : undefined,
        },
      });
      const authData = authResponse.data.data;
      const sessionData = Array.isArray(authData) ? authData[0] : authData;
      if (sessionData?.id) {
        setCookie(sessionData.id);
      }

      const userResponse = await auth.getCurrentUser();
      const responseData = userResponse.data.data;
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      setUser(userData);

      notifications.show({ title: t('common.success'), message: t('auth.loginSuccess'), color: 'green' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('passkey.authError'), color: 'red' });
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <Center h="80vh">
      <Card withBorder radius="md" p="xl" w={400}>
        <Stack gap="lg">
          <div>
            <Title order={2} ta="center">{config.APP_NAME}</Title>
            <Text size="sm" c="dimmed" ta="center">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </Text>
          </div>

          {hasTelegramWidget && (
            <>
              <Center>
                <TelegramLoginButton
                  botName={config.TELEGRAM_BOT_NAME}
                  onAuth={handleTelegramWidgetAuth}
                  buttonSize="large"
                  requestAccess="write"
                />
              </Center>

              <Divider label={t('common.or')} labelPosition="center" />
            </>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label={t('auth.loginLabel')}
                placeholder={t('auth.loginPlaceholder')}
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                autoComplete="username"
                name="username"
              />
              <PasswordInput
                label={t('auth.passwordLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                name="password"
              />
              {mode === 'register' && (
                <PasswordInput
                  label={t('auth.confirmPasswordLabel')}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  name="confirm-password"
                />
              )}
              <Button
                type="submit"
                leftSection={mode === 'login' ? <IconLogin size={18} /> : <IconUserPlus size={18} />}
                loading={loading}
              >
                {mode === 'login' ? t('auth.login') : t('auth.register')}
              </Button>
              {mode === 'login' && isWebAuthnSupported && (
                <Button
                  variant="light"
                  leftSection={<IconFingerprint size={18} />}
                  loading={passkeyLoading}
                  onClick={handlePasskeyAuth}
                >
                  {t('passkey.loginWithPasskey')}
                </Button>
              )}
            </Stack>
          </form>

          <Text size="sm" ta="center">
            {mode === 'login' ? (
              <>
                {t('auth.noAccount')}{' '}
                <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => setMode('register')}>
                  {t('auth.register')}
                </Text>
              </>
            ) : (
              <>
                {t('auth.hasAccount')}{' '}
                <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => setMode('login')}>
                  {t('auth.login')}
                </Text>
              </>
            )}
          </Text>
        </Stack>
      </Card>

      {/* OTP Modal */}
      <Modal
        opened={showOtp}
        onClose={() => {
          setShowOtp(false);
          setOtpToken('');
        }}
        title={
          <Group gap="xs">
            <IconShieldLock size={20} />
            <Text fw={500}>{t('otp.title')}</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">{t('otp.verifyDescription')}</Text>
          <TextInput
            label={t('otp.enterCode')}
            placeholder="000000"
            value={otpToken}
            onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
            maxLength={8}
            autoFocus
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => {
              setShowOtp(false);
              setOtpToken('');
            }}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleOtpSubmit} 
              loading={loading}
              disabled={!otpToken}
            >
              {t('otp.verify')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Center>
  );
}