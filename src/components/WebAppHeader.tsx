import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, ActionIcon, useMantineColorScheme, useComputedColorScheme, Tooltip, Indicator, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSun, IconMoon, IconLogout, IconHeadset, IconBell, IconBellOff, IconWallet } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { config } from '../config';
import { hasTelegramWebAppAutoAuth } from '../constants/webapp';
import { usePushNotifications } from '../hooks/usePushNotifications';
import LanguageSwitcher from './LanguageSwitcher';
import PayModal from './PayModal';

export function WebAppHeader() {
  const navigate = useNavigate();
  const { logout, user } = useStore();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const computedColorScheme = useComputedColorScheme('light');
  const { setColorScheme } = useMantineColorScheme();
  const { isSupported, isSubscribed, isLoading: pushLoading, error: pushError, subscribe, unsubscribe } = usePushNotifications();
  const { t } = useTranslation();

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
    <>
    <Group justify="flex-end" p="sm" gap="xs">
      {user && (
        <Button
          leftSection={<IconWallet size={16} />}
          variant="light"
          color="cyan"
          size="xs"
          onClick={() => setPayModalOpen(true)}
        >
          {user.balance} {t('common.currency')}
        </Button>
      )}
      {isSupported && (
        <Tooltip
          label={isSubscribed ? t('profile.pushDisableHint') : t('profile.pushEnableHint')}
          position="bottom"
          withArrow
        >
          <Indicator color="green" size={8} disabled={isSubscribed} offset={4}>
            <ActionIcon
              onClick={async () => {
                if (isSubscribed) {
                  const ok = await unsubscribe();
                  if (ok) notifications.show({ message: t('profile.pushDisabled'), color: 'gray' });
                } else {
                  const ok = await subscribe();
                  if (ok) notifications.show({ message: t('profile.pushEnabled'), color: 'green' });
                  else if (pushError) notifications.show({ message: pushError, color: 'red' });
                }
              }}
              variant={isSubscribed ? 'subtle' : 'light'}
              color={isSubscribed ? undefined : 'green'}
              size="lg"
              loading={pushLoading}
              aria-label="Push notifications"
            >
              {isSubscribed ? <IconBellOff size={20} /> : <IconBell size={20} />}
            </ActionIcon>
          </Indicator>
        </Tooltip>
      )}
      {config.SUPPORT_LINK && (
        <ActionIcon onClick={handleSupportLink} variant="subtle" size="lg" color="blue">
          <IconHeadset size={20} />
        </ActionIcon>
      )}
      <LanguageSwitcher />
      <ActionIcon
        onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
        variant="subtle"
        size="lg"
        color="gray"
      >
        {computedColorScheme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
      </ActionIcon>
      {!hasTelegramWebAppAutoAuth && (
        <ActionIcon onClick={handleLogout} variant="subtle" size="lg" color="red">
          <IconLogout size={20} />
        </ActionIcon>
      )}
    </Group>
    <PayModal opened={payModalOpen} onClose={() => setPayModalOpen(false)} />
    </>
  );
}
