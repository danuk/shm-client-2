import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { useEffect, useState } from 'react';
import { MantineProvider, createTheme, AppShell, Group, Text, ActionIcon, useMantineColorScheme, useComputedColorScheme, Center, Loader, Box, Button, Modal, TextInput, Stack, DirectionProvider, Indicator } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useMediaQuery, useHotkeys, useLongPress } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { IconSun, IconMoon, IconLogout, IconHeadset } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { NAV_ITEMS } from './constants/navigation';
import { auth } from './api/client';
import { getCookie, removeCookie, parseAndSavePartnerId, parseAndSaveSessionId } from './api/cookie';
import { config } from './config';
import LanguageSwitcher from './components/LanguageSwitcher';
import { hasTelegramWebAppAutoAuth, isTelegramWebApp } from './constants/webapp';
import { useEmailRequired } from './hooks/useEmailRequired';
import { useTicketPoller } from './hooks/useTicketPoller';
import PayHistoryModal from './components/PayHistoryModal';
import WithdrawHistoryModal from './components/WithdrawHistoryModal';

parseAndSaveSessionId();
parseAndSavePartnerId();

import Services from './pages/Services';
import Profile from './pages/Profile';
import Tickets from './pages/Tickets.tsx';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function LegalLinks() {
  const { t } = useTranslation();

  const legalLinks = [
    { href: config.PRIVACY_POLICY_URL, label: t('common.privacyPolicy') },
    { href: config.TERMS_OF_USE_URL, label: t('common.termsOfUse') },
    { href: config.PUBLIC_OFFER_URL, label: t('common.publicOffer') },
  ].filter((link) => Boolean(link.href));

  const contactLinks = [
    config.CONTACT_EMAIL ? { href: `mailto:${config.CONTACT_EMAIL}`, label: config.CONTACT_EMAIL } : null,
    config.CONTACT_PHONE ? { href: `tel:${config.CONTACT_PHONE}`, label: config.CONTACT_PHONE } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  const hasContacts = contactLinks.length > 0;
  const hasLegal = legalLinks.length > 0;

  if (!hasLegal && !hasContacts) return null;

  return (
    <Stack gap={0}>
      {hasLegal && (
        <Group justify="center" gap="md" wrap="wrap" py="sm">
          {legalLinks.map((link) => (
            <Text
              key={link.href}
              component="a"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="dimmed"
              td="underline"
            >
              {link.label}
            </Text>
          ))}
        </Group>
      )}
      {hasContacts && (
        <Group justify="center" gap="md" wrap="wrap" py="xs">
          <Text size="xs" c="dimmed">{t('common.contacts')}:</Text>
          {contactLinks.map((link) => (
            <Text
              key={link.href}
              component="a"
              href={link.href}
              size="xs"
              c="dimmed"
              td="underline"
            >
              {link.label}
            </Text>
          ))}
        </Group>
      )}
    </Stack>
  );
}

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  components: {
    Modal: {
      defaultProps: {
        lockScroll: false,
      },
    },
  },
});

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

function WebAppHeader() {
  const navigate = useNavigate();
  const { logout } = useStore();
  const computedColorScheme = useComputedColorScheme('light');
  const { setColorScheme } = useMantineColorScheme();

  const handleThemeToggle = () => {
    setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light');
  };

  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && config.SUPPORT_LINK.includes('t.me')) {
        tgWebApp.openTelegramLink(config.SUPPORT_LINK);
      } else {
        window.open(config.SUPPORT_LINK, '_blank');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Group justify="flex-end" p="sm" gap="xs">
     { config.SUPPORT_LINK &&  <ActionIcon
        onClick={handleSupportLink}
        variant="subtle"
        size="lg"
        color="blue"
      >
        <IconHeadset size={20} />
      </ActionIcon> }
      <LanguageSwitcher />
      <ActionIcon
        onClick={handleThemeToggle}
        variant="subtle"
        size="lg"
        color={computedColorScheme === 'dark' ? 'gray' : 'gray'}
      >
        {computedColorScheme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
      </ActionIcon>
      {!hasTelegramWebAppAutoAuth && (
        <ActionIcon
          onClick={handleLogout}
          variant="subtle"
          size="lg"
          color="red"
        >
          <IconLogout size={20} />
        </ActionIcon>
      )}
    </Group>
  );
}

function BottomNavigation({ onPayments, onWithdrawals }: { onPayments: () => void; onWithdrawals: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const computedColorScheme = useComputedColorScheme('light');
  const { t } = useTranslation();
  const hasNewTicketMessages = useStore((s) => s.hasNewTicketMessages);
  const { userEmail, isEmailLoaded, setOpenEmailModal } = useStore();
  const emailBlocked = config.EMAIL_REQUIRED === 'true' && isEmailLoaded && !userEmail;

  const handleClick = (path: string) => {
    if (emailBlocked && (path === '/payments' || path === '/withdrawals')) { setOpenEmailModal(true); return; }
    if (path === '/payments') { onPayments(); }
    else if (path === '/withdrawals') { onWithdrawals(); }
    else { navigate(path); }
  };

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 100,
      }}
    >
      <Box
        style={{
          background: computedColorScheme === 'dark'
            ? 'rgba(40, 40, 45, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: computedColorScheme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: computedColorScheme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          padding: '8px 12px',
        }}
      >
        <Group justify="space-around" gap={4}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showDot = (item.path as string) === '/tickets' && hasNewTicketMessages;
            const isItemBlocked = emailBlocked && (item.path === '/payments' || item.path === '/withdrawals');
            return (
              <Box
                key={item.path}
                onClick={() => handleClick(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: 14,
                  cursor: isItemBlocked ? 'not-allowed' : 'pointer',
                  opacity: isItemBlocked ? 0.4 : 1,
                  background: isActive
                    ? (computedColorScheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                    : 'transparent',
                  color: isActive ? 'var(--mantine-color-blue-6)' : (computedColorScheme === 'dark' ? '#9ca3af' : '#6b7280'),
                  transition: 'all 0.2s ease',
                }}
              >
                <Indicator disabled={!showDot} color="blue" size={8} offset={2}>
                  <Icon size={20} />
                </Indicator>
                <Text size="xs" mt={4} fw={isActive ? 600 : 400}>{t(item.labelKey)}</Text>
              </Box>
            );
          })}
        </Group>
      </Box>
    </Box>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, setUser, setIsLoading, logout, hasNewTicketMessages, userEmail, isEmailLoaded, setOpenEmailModal } = useStore();
  const emailBlocked = config.EMAIL_REQUIRED === 'true' && isEmailLoaded && !userEmail;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useTranslation();
  const {
    modalOpen: globalEmailModalOpen,
    setModalOpen: setGlobalEmailModalOpen,
    emailInput: globalEmailInput,
    setEmailInput: setGlobalEmailInput,
    saving: globalEmailSaving,
    handleSave: handleGlobalSaveEmail,
    isValidEmail,
    verifyModalOpen: globalVerifyModalOpen,
    setVerifyModalOpen: setGlobalVerifyModalOpen,
    verifyCode: globalVerifyCode,
    setVerifyCode: setGlobalVerifyCode,
    verifySending: globalVerifySending,
    verifyConfirming: globalVerifyConfirming,
    resendCooldown: globalResendCooldown,
    pendingEmail: globalPendingEmail,
    handleConfirmEmail: handleGlobalConfirmEmail,
    handleResendCode: handleGlobalResendCode,
  } = useEmailRequired();

  // useTicketPoller(isAuthenticated);
  useTicketPoller(false); // TODO: включить когда бэкенд будет готов

  const [payHistoryOpen, setPayHistoryOpen] = useState(false);
  const [withdrawHistoryOpen, setWithdrawHistoryOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const showVersion = () => setVersionOpen(true);
  const longPressProps = useLongPress(showVersion);

  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && isTelegramWebApp && config.SUPPORT_LINK.includes('t.me')) {
        tgWebApp.openTelegramLink(config.SUPPORT_LINK);
      } else {
        window.open(config.SUPPORT_LINK, '_blank');
      }
    }
  };

  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (tgWebApp && isTelegramWebApp) {
      tgWebApp.ready();
      tgWebApp.expand();

      if (tgWebApp.setHeaderColor) {
        tgWebApp.setHeaderColor('secondary_bg_color');
      }
      if (tgWebApp.setBackgroundColor) {
        tgWebApp.setBackgroundColor('secondary_bg_color');
      }
    }
  }, [isTelegramWebApp]);

  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (!tgWebApp || !isTelegramWebApp) return;

    const backButton = tgWebApp.BackButton;
    if (!backButton) return;

    const isMainPage = location.pathname === '/' || location.pathname === '';

    if (isMainPage) {
      backButton.hide();
    } else {
      backButton.show();
      backButton.onClick(() => {
        navigate('/');
      });
    }

    return () => {
      backButton.hide();
      backButton.offClick(() => {});
    };
  }, [location.pathname, navigate, isTelegramWebApp]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getCookie();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await auth.getCurrentUser();
        const responseData = response.data.data;
        const userData: any = Array.isArray(responseData) ? responseData[0] : responseData;
        setUser(userData);
      } catch {
        removeCookie();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setIsLoading]);

  useHotkeys([
    ['shift + V', () => setVersionOpen(true)],
  ]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box style={{ flex: 1 }}>
          <Login />
          <LegalLinks />
        </Box>
      </Box>
    );
  }

  const emailRequiredModal = (
    <Modal
      opened={globalEmailModalOpen}
      onClose={() => setGlobalEmailModalOpen(false)}
      title={t('profile.linkEmail')}
      closeOnClickOutside
      closeOnEscape
      withCloseButton
    >
      <Stack gap="md">
        <TextInput
          label={t('profile.emailAddress')}
          placeholder="example@email.com"
          withAsterisk
          error={globalEmailInput.length > 0 && !isValidEmail(globalEmailInput)}
          type="email"
          value={globalEmailInput}
          onChange={(e) => setGlobalEmailInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGlobalSaveEmail()}
        />
        <Text size="xs" c="dimmed">
          {t('profile.emailHint')}
        </Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setGlobalEmailModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleGlobalSaveEmail} loading={globalEmailSaving} disabled={!isValidEmail(globalEmailInput)}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  const verifyRequiredModal = (
    <Modal
      opened={globalVerifyModalOpen}
      onClose={() => setGlobalVerifyModalOpen(false)}
      title={t('profile.verifyEmail')}
    >
      <Stack gap="md">
        <Text size="sm">
          {t('profile.verifyEmailDescription', { email: globalPendingEmail })}
        </Text>
        <TextInput
          label={t('profile.verifyCode')}
          placeholder="123456"
          value={globalVerifyCode}
          onChange={(e) => setGlobalVerifyCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGlobalConfirmEmail()}
          maxLength={6}
        />
        <Group justify="space-between">
          <Button
            variant="subtle"
            size="xs"
            onClick={handleGlobalResendCode}
            loading={globalVerifySending}
            disabled={globalResendCooldown > 0}
          >
            {globalResendCooldown > 0 ? `${t('profile.resendCode')} (${globalResendCooldown}s)` : t('profile.resendCode')}
          </Button>
          <Group gap="xs">
            <Button variant="light" onClick={() => setGlobalVerifyModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleGlobalConfirmEmail}
              loading={globalVerifyConfirming}
              disabled={!globalVerifyCode.trim()}
            >
              {t('profile.confirmEmail')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );

  const versionModal = (
    <Modal opened={versionOpen} onClose={() => setVersionOpen(false)} title="Version" size="xs" centered>
      <Text size="sm" ff="monospace" ta="center" py="xs">{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'} {  }</Text>
    </Modal>
  );

  if (isTelegramWebApp || isMobile) {
    return (
      <>
        {emailRequiredModal}
        {verifyRequiredModal}
        {versionModal}
        <Box style={{ minHeight: '100vh', paddingBottom: 150 }}>
          <WebAppHeader />
          <Box px="md">
            <Routes>
              <Route path="/" element={<Services />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          <LegalLinks />
          <BottomNavigation onPayments={() => setPayHistoryOpen(true)} onWithdrawals={() => setWithdrawHistoryOpen(true)} />
        </Box>
        <PayHistoryModal opened={payHistoryOpen} onClose={() => setPayHistoryOpen(false)} />
        <WithdrawHistoryModal opened={withdrawHistoryOpen} onClose={() => setWithdrawHistoryOpen(false)} />
      </>
    );
  }

  const appShellMaxWidth = 1200;
  const appShellOffset = `max(0px, calc(50% - ${appShellMaxWidth / 2}px))`;
  const hasLegalLinks = [config.PRIVACY_POLICY_URL, config.TERMS_OF_USE_URL, config.PUBLIC_OFFER_URL, config.CONTACT_EMAIL, config.CONTACT_PHONE].some(Boolean);

  return (
    <>
      {emailRequiredModal}
      {verifyRequiredModal}
      {versionModal}
      <AppShell
        header={{ height: 60 }}
        footer={hasLegalLinks ? { height: 'auto' } : undefined}
        padding="md"
        styles={{
          header: {
            left: appShellOffset,
            right: appShellOffset,
            borderBottom: 0,
            opacity: 100,
          },
          main: {
            paddingLeft: `calc(var(--app-shell-padding) + var(--app-shell-navbar-offset, 0px) + ${appShellOffset})`,
            paddingRight: `calc(var(--app-shell-padding) + ${appShellOffset})`,
          },
        }}
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="xs" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} {...longPressProps}>
              {config.LOGO_URL && (
                <img
                  src={config.LOGO_URL}
                  alt=""
                  style={{ height: 32, width: 32, objectFit: 'contain', flexShrink: 0 }}
                />
              )}
              <Text
                size="lg"
                fw={700}
                visibleFrom={config.APP_NAME.length > 10 ? 'sm' : undefined}
              >
                {config.APP_NAME}
              </Text>
            </Group>
            <Group gap="xs" visibleFrom="sm" wrap="nowrap">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const showDot = (item.path as string) === '/tickets' && hasNewTicketMessages;
                if (item.path === '/payments') {
                  return (
                    <Button key={item.path} leftSection={<Icon size={16} />} variant="subtle" size="xs" radius="md" disabled={emailBlocked} onClick={() => emailBlocked ? setOpenEmailModal(true) : setPayHistoryOpen(true)}>
                      {t(item.labelKey)}
                    </Button>
                  );
                }
                if (item.path === '/withdrawals') {
                  return (
                    <Button key={item.path} leftSection={<Icon size={16} />} variant="subtle" size="xs" radius="md" disabled={emailBlocked} onClick={() => emailBlocked ? setOpenEmailModal(true) : setWithdrawHistoryOpen(true)}>
                      {t(item.labelKey)}
                    </Button>
                  );
                }
                return (
                  <Indicator key={item.path} disabled={!showDot} color="blue" size={8} offset={4}>
                    <Button
                      component={Link}
                      to={item.path}
                      leftSection={<Icon size={16} />}
                      variant={isActive ? 'light' : 'subtle'}
                      size="xs"
                      radius="md"
                    >
                      {t(item.labelKey)}
                    </Button>
                  </Indicator>
                );
              })}
            </Group>
            <Group>
              { config.SUPPORT_LINK &&  <ActionIcon
                onClick={handleSupportLink}
                variant="subtle"
                size="lg"
                color="blue"
              >
              <IconHeadset size={20} />
              </ActionIcon> }
              <LanguageSwitcher />
              <ThemeToggle />
              {!hasTelegramWebAppAutoAuth && (
              <ActionIcon
                onClick={logout}
                variant="default"
                size="lg"
                aria-label="Logout"
              >
                <IconLogout size={18} />
              </ActionIcon>
            )}
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Services />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell.Main>
        <AppShell.Footer withBorder={false}>
          <LegalLinks />
        </AppShell.Footer>
      </AppShell>
      <PayHistoryModal opened={payHistoryOpen} onClose={() => setPayHistoryOpen(false)} />
      <WithdrawHistoryModal opened={withdrawHistoryOpen} onClose={() => setWithdrawHistoryOpen(false)} />
    </>
  );
}

function App() {
  const basePath = config.SHM_BASE_PATH && config.SHM_BASE_PATH !== '/' ? config.SHM_BASE_PATH : undefined;
  const { i18n } = useTranslation();

  useEffect(() => {
    if (config.BITRIX_WIDGET_SCRIPT_URL) {
      const script = document.createElement('script');
      script.async = true;
      script.src = config.BITRIX_WIDGET_SCRIPT_URL + '?' + (Date.now() / 60000 | 0);
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);

      return () => {
        script.remove();
      };
    }
  }, []);

  const isRtl = i18n.language === 'ar';

  return (
    <DirectionProvider initialDirection={isRtl ? 'rtl' : 'ltr'}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <Notifications position="top-right" />
        <BrowserRouter basename={basePath}>
          <AppContent />
        </BrowserRouter>
      </MantineProvider>
    </DirectionProvider>
  );
}

export default App;
