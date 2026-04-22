import { useEffect, useRef, useState } from 'react';
import { Card, Text, Stack, Button, ActionIcon, TextInput, PasswordInput, Divider, Title, Center, Modal, Group, Loader, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useForm, isEmail, hasLength } from '@mantine/form';
import { IconLogin, IconUserPlus, IconHeadset, IconFingerprint, IconShieldLock, IconBrandTelegram, IconMailForward, IconLock, IconMoon, IconSun} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { auth, passkeyApi, userApi } from '../api/client';
import { setCookie, getResetTokenCookie, removeResetTokenCookie, parseAndSaveResetToken } from '../api/cookie';
import { useStore } from '../store/useStore';
import TelegramLoginButton, { TelegramUser } from '../components/TelegramLoginButton';
import { config } from '../config';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { hasTelegramWebAppAutoAuth, hasTelegramWidget, hasTelegramWebAppAuth } from '../constants/webapp';

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

function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </ActionIcon>
  );
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('register')) {
      setMode('register');
    }
  }, [location.search]);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [loginOrEmail, setLoginOrEmail] = useState('');
  const requireEmailRegister = config.EMAIL_REQUIRED === 'true';
  const [captcha, setCaptcha] = useState<{ image?: string; question?: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPasswordData, setNewPasswordData] = useState({ password: '', confirmPassword: '' });
  const [verifyingToken, setVerifyingToken] = useState(false);
  const { setUser, setTelegramPhoto } = useStore();
  const { t } = useTranslation();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const form = useForm({
    mode: 'controlled',
    validateInputOnBlur: true,
    initialValues: { login: '', password: '', confirmPassword: '' },
    validate: {
      login: (value) => {
        if (modeRef.current === 'register') {
          if (requireEmailRegister) {
            return isEmail(t('auth.invalidEmail'))(value);
          }
          return hasLength({ min: 6 }, t('auth.loginTooShort'))(value);
        }
        return null;
      },
      password: (value) => {
        if (modeRef.current !== 'register') return null;
        return hasLength({ min: 6 }, t('auth.passwordTooShort'))(value);
      },
      confirmPassword: (value, values) => {
        if (modeRef.current !== 'register') return null;
        return value === values.password ? null : t('auth.passwordsMismatch');
      },
    },
  });
  const isWebAuthnSupported = !!window.PublicKeyCredential;
  const { telegramWebApp } = useTelegramWebApp();
  const autoAuthTriggeredRef = useRef(false);
  const autoAuthAttemptKey = 'tg_webapp_auto_auth_attempted';
  const autoAuthCooldownMs = 60 * 1000;

  const fetchCaptcha = async () => {
    try {
      const res = await auth.getCaptcha();
      const raw = res.data?.data;
      setCaptcha(Array.isArray(raw) ? raw[0] : raw);
      setCaptchaAnswer('');
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (mode === 'register' && config.CAPTCHA_ENABLED === 'true') {
      void fetchCaptcha();
    } else {
      setCaptcha(null);
      setCaptchaAnswer('');
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasTelegramWebAppAutoAuth || autoAuthTriggeredRef.current || !telegramWebApp?.initData) {
      return;
    }

    const lastAttempt = Number(sessionStorage.getItem(autoAuthAttemptKey) || 0);
    if (lastAttempt && Date.now() - lastAttempt < autoAuthCooldownMs) {
      return;
    }

    autoAuthTriggeredRef.current = true;
    sessionStorage.setItem(autoAuthAttemptKey, String(Date.now()));
    setShowLoginForm(false);
    void handleTelegramWebAppAuth();
  }, [hasTelegramWebAppAutoAuth, telegramWebApp?.initData]);

  useEffect(() => {
    const checkResetToken = async () => {
      const urlToken = parseAndSaveResetToken();
      const token = urlToken || getResetTokenCookie();

      if (!token) return;

      setVerifyingToken(true);
      setResetToken(token);

      try {
        const response = await userApi.verifyResetToken(token);
        const msg = response.data?.data?.[0]?.msg || response.data?.data?.msg;

        if (msg === 'Successful') {
          setShowNewPasswordForm(true);
        } else {
          notifications.show({ title: t('common.error'), message: t('auth.invalidResetToken'), color: 'red' });
          removeResetTokenCookie();
          setResetToken(null);
        }
      } catch {
        notifications.show({ title: t('common.error'), message: t('auth.invalidResetToken'), color: 'red' });
        removeResetTokenCookie();
        setResetToken(null);
      } finally {
        setVerifyingToken(false);
      }
    };

    checkResetToken();
  }, []);

  const handleNewPasswordSubmit = async () => {
    if (!newPasswordData.password || !newPasswordData.confirmPassword) {
      notifications.show({ title: t('common.error'), message: t('auth.fillAllFields'), color: 'red' });
      return;
    }

    if (newPasswordData.password !== newPasswordData.confirmPassword) {
      notifications.show({ title: t('common.error'), message: t('auth.passwordsMismatch'), color: 'red' });
      return;
    }

    if (!resetToken) {
      notifications.show({ title: t('common.error'), message: t('auth.invalidResetToken'), color: 'red' });
      return;
    }

    setResetLoading(true);
    try {
      const response = await userApi.resetPasswordWithToken(resetToken, newPasswordData.password);
      const msg = response.data?.data?.[0]?.msg || response.data?.data?.msg;

      if (msg === 'Password reset successful') {
        notifications.show({ title: t('common.success'), message: t('auth.passwordResetSuccess'), color: 'green' });
      } else {
        notifications.show({ title: t('common.error'), message: t('auth.invalidResetToken'), color: 'red' });
      }
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.invalidResetToken'), color: 'red' });
    } finally {
      removeResetTokenCookie();
      setResetToken(null);
      setShowNewPasswordForm(false);
      setNewPasswordData({ password: '', confirmPassword: '' });
      setResetLoading(false);
    }
  };

  const handleLogin = async (otpTokenParam?: string) => {
    if (!form.values.login || !form.values.password) {
      notifications.show({ title: t('common.error'), message: t('auth.fillAllFields'), color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const result = await auth.login(form.values.login, form.values.password, otpTokenParam);

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
      if (axiosError.response?.status === 429) {
        notifications.show({ title: t('common.error'), message: t('auth.tooManyRequests'), color: 'red' });
      } else if (axiosError.response?.status === 403 && axiosError.response?.data?.error?.includes('Password authentication is disabled')) {
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
    const { hasErrors } = form.validate();
    if (hasErrors) return;

    const { login, password } = form.values;
    if (!login || !password) {
      notifications.show({ title: t('common.error'), message: t('auth.fillAllFields'), color: 'red' });
      return;
    }

    if (config.CAPTCHA_ENABLED === 'true' && (!captcha || !captchaAnswer.trim())) {
      notifications.show({ title: t('common.error'), message: t('auth.captchaRequired'), color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await auth.register(login, password, captcha?.token, captchaAnswer || undefined);
      notifications.show({ title: t('common.success'), message: t('auth.registerSuccess'), color: 'green' });
      setMode('login');
      form.setValues({ confirmPassword: '' });
      setCaptchaAnswer('');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errMsg = axiosError.response?.data?.error || '';
      const axiosStatus = (error as { response?: { status?: number } }).response?.status;
      if (axiosStatus === 429) {
        notifications.show({ title: t('common.error'), message: t('auth.tooManyRequests'), color: 'red' });
      } else if (errMsg === 'Invalid captcha') {
        notifications.show({ title: t('common.error'), message: t('auth.captchaInvalid'), color: 'red' });
      } else if (errMsg === 'Captcha required') {
        notifications.show({ title: t('common.error'), message: t('auth.captchaRequired'), color: 'red' });
      } else if (errMsg === 'Login already in use' || errMsg === 'Email already in use') {
        notifications.show({ title: t('common.error'), message: t('auth.loginAlreadyInUse'), color: 'red' });
      } else {
        notifications.show({ title: t('common.error'), message: t('auth.registerError'), color: 'red' });
      }
      if (config.CAPTCHA_ENABLED === 'true') void fetchCaptcha();
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

  const handleTelegramWidgetAuth = async (telegramUser: TelegramUser) => {
    setLoading(true);
    try {
      await auth.telegramWidgetAuth({
          ...telegramUser,
          register_if_not_exists: 1,
        });
      const userResponse = await auth.getCurrentUser();
      const responseData = userResponse.data.data;
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      setUser(userData);

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

  const handleTelegramWebAppAuth = async () => {
    if (!telegramWebApp?.initData) {
      notifications.show({ title: t('common.error'), message: t('auth.telegramAuthError'), color: 'red' });
      setShowLoginForm(true);
      return;
    }

    setLoading(true);
    try {
      const profile = config.TELEGRAM_WEBAPP_PROFILE || '';
      const authResponse = await auth.telegramWebAppAuth(telegramWebApp.initData, profile);
      const sessionId = authResponse.data?.session_id || authResponse.data?.id;
      if (!sessionId) {
        notifications.show({ title: t('common.error'), message: t('auth.telegramAuthError'), color: 'red' });
        setShowLoginForm(true);
        return;
      }

      const userResponse = await auth.getCurrentUser();
      const responseData = userResponse.data.data;
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      setUser(userData);

      if (telegramWebApp.initDataUnsafe?.user?.photo_url) {
        setTelegramPhoto(telegramWebApp.initDataUnsafe.user.photo_url);
      }

      notifications.show({ title: t('common.success'), message: t('auth.telegramAuth'), color: 'green' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.telegramAuthError'), color: 'red' });
      setShowLoginForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!loginOrEmail) {
      notifications.show({ title: t('common.error'), message: t('auth.resetEnterLogin'), color: 'red' });
      return;
    }

    setResetLoading(true);
    try {
      const loginResponse = await userApi.resetPassword({ login: loginOrEmail });
      const loginMsg = loginResponse.data?.data?.[0]?.msg || loginResponse.data?.data?.msg;
      if (loginMsg === 'Successful') {
        notifications.show({ title: t('common.success'), message: t('auth.resetSuccess'), color: 'green' });
        setShowResetPassword(false);
        setResetLoading(false);
        return;
      }

      const emailResponse = await userApi.resetPassword({ email: loginOrEmail });
      const emailMsg = emailResponse.data?.data?.[0]?.msg || emailResponse.data?.data?.msg;
      if (emailMsg === 'Successful') {
        notifications.show({ title: t('common.success'), message: t('auth.resetSuccess'), color: 'green' });
        setShowResetPassword(false);
        setResetLoading(false);
        return;
      }

      notifications.show({ title: t('common.error'), message: t('auth.resetNotFound'), color: 'red' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.resetNotFound'), color: 'red' });
    }
    setResetLoading(false);
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

  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      window.open(config.SUPPORT_LINK, '_blank');
    }
  };

  return (
    <Center h="80vh" style={{ position: 'relative' }}>
      <Card withBorder radius="md" p="xl" w={400}>
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <ThemeToggle />
            </div>
            <Group gap="xs" align="center" style={{ flex: 'auto', justifyContent: 'center' }}>
              {config.LOGO_URL && (
                <img
                  src={config.LOGO_URL}
                  alt=""
                  style={{ height: 28, width: 28, objectFit: 'contain', flexShrink: 0 }}
                />
              )}
              <Title order={2} ta="center">{config.APP_NAME}</Title>
            </Group>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <LanguageSwitcher />
            </div>

          </Group>
          {config.APP_DESCRIPTION && (
            <Text size="sm" c="dimmed" ta="center" style={{ flex: 'auto' }}>{config.APP_DESCRIPTION}</Text>
          )}
          <Text size="sm" c="dimmed" ta="center">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </Text>

          {hasTelegramWebAppAuth && !showLoginForm && (
            <>
              <Button
                color="blue"
                leftSection={<IconBrandTelegram size={18} />}
                onClick={handleTelegramWebAppAuth}
                fullWidth
                loading={loading}
              >
                {t('auth.loginWithTelegram')}
              </Button>

              <Divider label={t('common.or')} labelPosition="center" />

              <Button
                variant="light"
                onClick={() => setShowLoginForm(true)}
                fullWidth
              >
                {t('auth.useLoginPassword')}
              </Button>
            </>
          )}

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

          {(!hasTelegramWebAppAuth || showLoginForm) && (
            <>
              <form onSubmit={handleSubmit}>
                <Stack gap="sm">
                  {mode === 'register' && requireEmailRegister ? (
                    <TextInput
                      label={t('auth.emailLabel')}
                      placeholder={t('auth.emailPlaceholder')}
                      autoComplete="email"
                      name="email"
                      type="email"
                      {...form.getInputProps('login')}
                    />
                  ) : (
                    <TextInput
                      label={t('auth.loginLabel')}
                      placeholder={t('auth.loginPlaceholder')}
                      autoComplete="username"
                      name="username"
                      {...form.getInputProps('login')}
                    />
                  )}
                  <PasswordInput
                    label={t('auth.passwordLabel')}
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    name="password"
                    {...form.getInputProps('password')}
                  />
                  {mode === 'register' && (
                    <PasswordInput
                      label={t('auth.confirmPasswordLabel')}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      autoComplete="new-password"
                      name="confirm-password"
                      {...form.getInputProps('confirmPassword')}
                    />
                  )}
                  {mode === 'register' && config.CAPTCHA_ENABLED === 'true' && (
                    <Group gap="xs" align="center">
                      {captcha?.image ? (
                        <img
                          src={`data:image/svg+xml;base64,${captcha.image}`}
                          alt="captcha"
                          width={150}
                          style={{ borderRadius: 4, border: '1px solid #ddd' }}
                        />
                      ) : captcha?.question ? (
                        <Text size="lg" fw={500}>{captcha.question} =</Text>
                      ) : null}
                      <Button variant="subtle" size="compact-sm" px={8} onClick={fetchCaptcha} title={t('auth.captchaRefresh')}>
                        ↻
                      </Button>
                      <TextInput
                        style={{ width: 130 }}
                        placeholder={t('auth.captchaPlaceholder')}
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        maxLength={2}
                        disabled={!captcha}
                      />
                    </Group>
                  )}
                  <Button
                    type="submit"
                    leftSection={mode === 'login' ? <IconLogin size={18} /> : <IconUserPlus size={18} />}
                    loading={loading}
                  >
                    {mode === 'login' ? t('auth.login') : t('auth.register')}
                  </Button>
                  {mode === 'login' && isWebAuthnSupported && config.PASSKEY_AUTH_DISABLED === 'false' && (
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
                    <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => { setMode('register'); form.clearErrors(); }}>
                      {t('auth.register')}
                    </Text>
                  </>
                ) : (
                  <>
                    {t('auth.hasAccount')}{' '}
                    <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => { setMode('login'); form.clearErrors(); }}>
                      {t('auth.login')}
                    </Text>
                  </>
                )}
              </Text>

              {mode === 'login' && (
                <Text size="sm" ta="center">
                  <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => setShowResetPassword(true)}>
                    {t('auth.forgotPassword')}
                  </Text>
                </Text>
              )}

              {hasTelegramWebAppAuth && showLoginForm && (
                <>
                  <Divider label={t('common.or')} labelPosition="center" />
                  <Button
                    variant="outline"
                    color="blue"
                    leftSection={<IconBrandTelegram size={18} />}
                    onClick={handleTelegramWebAppAuth}
                    fullWidth
                    loading={loading}
                  >
                    {t('auth.loginWithTelegram')}
                  </Button>
                </>
              )}
            </>
          )}
        </Stack>
      </Card>

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

      <Modal
        opened={showResetPassword}
        onClose={() => {
          setShowResetPassword(false);
          setResetLoading(false);
        }}
        title={t('auth.resetPasswordTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">{t('auth.resetPasswordDescription')}</Text>
          <TextInput
            label={t('auth.loginOrEmail')}
            placeholder={t('auth.loginOrEmailPlaceholder')}
            value={loginOrEmail}
            onChange={(e) => setLoginOrEmail(e.target.value)}
            autoFocus
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => {
              setShowResetPassword(false);
              setResetLoading(false);
            }}>
              {t('common.cancel')}
            </Button>
            <Button
              leftSection={<IconMailForward size={16} />}
              onClick={handleResetPassword}
              loading={resetLoading}
              disabled={!loginOrEmail}
            >
              {t('auth.resetPasswordSend')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showNewPasswordForm}
        onClose={() => {
          setShowNewPasswordForm(false);
          removeResetTokenCookie();
          setResetToken(null);
          setNewPasswordData({ password: '', confirmPassword: '' });
        }}
        title={
          <Group gap="xs">
            <IconLock size={20} />
            <Text fw={500}>{t('auth.newPasswordTitle')}</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">{t('auth.newPasswordDescription')}</Text>
          <PasswordInput
            label={t('auth.newPasswordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            value={newPasswordData.password}
            onChange={(e) => setNewPasswordData({ ...newPasswordData, password: e.target.value })}
            autoFocus
          />
          <PasswordInput
            label={t('auth.confirmNewPasswordLabel')}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={newPasswordData.confirmPassword}
            onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => {
              setShowNewPasswordForm(false);
              removeResetTokenCookie();
              setResetToken(null);
              setNewPasswordData({ password: '', confirmPassword: '' });
            }}>
              {t('common.cancel')}
            </Button>
            <Button
              leftSection={<IconLock size={16} />}
              onClick={handleNewPasswordSubmit}
              loading={resetLoading}
              disabled={!newPasswordData.password || !newPasswordData.confirmPassword}
            >
              {t('auth.resetPasswordButton')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {verifyingToken && (
        <Modal opened={true} onClose={() => {}} withCloseButton={false} centered>
          <Stack align="center" gap="md">
            <Loader />
            <Text>{t('auth.verifyingToken')}</Text>
          </Stack>
        </Modal>
      )}

      {config.SUPPORT_LINK && (
        <Button
          onClick={handleSupportLink}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 200,
          }}
          leftSection={<IconHeadset size={20} />}
          radius="xl"
          size="md"
        >
          {t('common.support')}
        </Button>
      )}
    </Center>
  );
}