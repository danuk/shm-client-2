import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Group, Text, Indicator, useComputedColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { config } from '../config';
import { NAV_ITEMS } from '../constants/navigation';

interface BottomNavigationProps {
  onPayments: () => void;
  onWithdrawals: () => void;
}

export function BottomNavigation({ onPayments, onWithdrawals }: BottomNavigationProps) {
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
          padding: '6px 8px',
        }}
      >
        <Group justify="space-around" gap={0}>
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
                  padding: '6px 8px',
                  borderRadius: 12,
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
