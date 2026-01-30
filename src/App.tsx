import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { useEffect, useState } from 'react';
import { MantineProvider, createTheme, AppShell, Burger, Group, Text, NavLink, ActionIcon, useMantineColorScheme, useComputedColorScheme, Center, Loader, Box } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { IconSun, IconMoon, IconLogout, IconHeadset } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { NAV_ITEMS } from './constants/navigation';
import { auth, otpApi } from './api/client';
import { getCookie, removeCookie, parseAndSavePartnerId, parseAndSaveSessionId } from './api/cookie';
import { config } from './config';
import LanguageSwitcher from './components/LanguageSwitcher';
import OtpVerifyModal from './components/OtpVerifyModal';

parseAndSaveSessionId();
parseAndSavePartnerId();

import Services from './pages/Services';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Tickets from './pages/Tickets';

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
});

const isInsideTelegramWebApp = (): boolean => {
  const tgWebApp = window.Telegram?.WebApp;
  // initData непустая строка ИЛИ есть данные пользователя в initDataUnsafe
  return !!(tgWebApp && (
    (tgWebApp.initData && tgWebApp.initData.length > 0) ||
    tgWebApp.initDataUnsafe?.user?.id
  ));
};

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

// Верхняя панель для WebApp
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
      window.open(config.SUPPORT_LINK, '_blank');
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
      <ActionIcon
        onClick={handleLogout}
        variant="subtle"
        size="lg"
        color="red"
      >
        <IconLogout size={20} />
      </ActionIcon>
    </Group>
  );
}

// Нижняя навигация для WebApp
function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const computedColorScheme = useComputedColorScheme('light');
  const { t } = useTranslation();

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 1000,
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
            return (
              <Box
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  background: isActive
                    ? (computedColorScheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                    : 'transparent',
                  color: isActive ? 'var(--mantine-color-blue-6)' : (computedColorScheme === 'dark' ? '#9ca3af' : '#6b7280'),
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={20} />
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
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, setUser, setIsLoading, logout } = useStore();
  const [isTelegramWebApp] = useState(isInsideTelegramWebApp);
  const [otpRequired, setOtpRequired] = useState(false);
  const { t } = useTranslation();

  const handleSupportLink = () => {
    if (config.SUPPORT_LINK) {
      window.open(config.SUPPORT_LINK, '_blank');
    }
  };

  // Инициализация Telegram WebApp
  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (tgWebApp && isTelegramWebApp) {
      tgWebApp.ready();
      tgWebApp.expand();

      // Устанавливаем цвета
      if (tgWebApp.setHeaderColor) {
        tgWebApp.setHeaderColor('secondary_bg_color');
      }
      if (tgWebApp.setBackgroundColor) {
        tgWebApp.setBackgroundColor('secondary_bg_color');
      }
    }
  }, [isTelegramWebApp]);

  // BackButton для Telegram WebApp
  useEffect(() => {
    const tgWebApp = window.Telegram?.WebApp;
    if (!tgWebApp || !isTelegramWebApp) return;

    const backButton = tgWebApp.BackButton;
    if (!backButton) return;

    // Показываем BackButton если не на главной странице (профиль)
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

      // Обычная проверка токена
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await auth.getCurrentUser();
        const responseData = response.data.data;
        const userData = Array.isArray(responseData) ? responseData[0] : responseData;
        setUser(userData);

        // Проверяем статус OTP
        try {
          const otpResponse = await otpApi.status();
          const otpData = otpResponse.data.data;
          const otpStatus = Array.isArray(otpData) ? otpData[0] : otpData;
          if (otpStatus?.required) {
            setOtpRequired(true);
          }
        } catch {
          // OTP не настроен или ошибка - продолжаем без проверки
        }
      } catch {
        removeCookie();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setIsLoading]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Handle OTP verification
  const handleOtpVerified = () => {
    setOtpRequired(false);
  };

  const handleOtpCancel = () => {
    logout();
    setOtpRequired(false);
  };

  // WebApp layout - без боковой панели, с нижней навигацией
  if (isTelegramWebApp) {
    return (
      <>
        <OtpVerifyModal
          opened={otpRequired}
          onClose={handleOtpCancel}
          onVerified={handleOtpVerified}
        />
        <Box style={{ minHeight: '100vh', paddingBottom: 100 }}>
          <WebAppHeader />
          <Box px="md">
            <Routes>
            <Route path="/services" element={<Services />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/withdrawals" element={<Withdrawals />} />
            <Route path="*" element={<Profile />} />
          </Routes>
        </Box>
        <BottomNavigation />
      </Box>
      </>
    );
  }

  // Обычный desktop layout
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text
              size="lg"
              fw={700}
              c="blue"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
              visibleFrom={config.APP_NAME.length > 10 ? 'sm' : undefined}
            >
              {config.APP_NAME}
            </Text>
          </Group>
          <Group>
            <Text size="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{user?.login}</Text>
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
            <ActionIcon
              onClick={logout}
              variant="default"
              size="lg"
              aria-label="Logout"
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                component={Link}
                to={item.path}
                label={t(item.labelKey)}
                leftSection={<Icon size={16} />}
                active={location.pathname === item.path}
                variant="light"
                style={{ borderRadius: 8, marginBottom: 4 }}
                onClick={close}
              />
            );
          })}
        </AppShell.Section>
        <AppShell.Section>
          <Center py="md">
            <Text
              component="a"
              href="https://myshm.ru"
              target="_blank"
              size="sm"
              c="dimmed"
              style={{ textDecoration: 'none' }}
            >
              Powered by MySHM.ru
            </Text>
          </Center>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/services" element={<Services />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/withdrawals" element={<Withdrawals />} />
          <Route path="*" element={<Profile />} />
        </Routes>
      </AppShell.Main>

      <OtpVerifyModal
        opened={otpRequired}
        onClose={handleOtpCancel}
        onVerified={handleOtpVerified}
      />
    </AppShell>
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
