import { useState } from 'react';
import { Card, Text, Stack, Group, Button, Modal, Divider, PasswordInput } from '@mantine/core';
import { IconShieldLock, IconLock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { userApi } from '../api/client';
import PasskeySettings from './PasskeySettings';
import OtpSettings from './OtpSettings';
import PasswordAuthSettings from './PasswordAuthSettings';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

export default function SecuritySettings() {
  const { t } = useTranslation();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const { isInsideTelegramWebApp } = useTelegramWebApp();

  const handleChangePassword = async () => {
    if (!newPassword) {
      notifications.show({
        title: t('common.error'),
        message: t('profile.enterNewPassword'),
        color: 'red',
      });
      return;
    }
    try {
      await userApi.changePassword(newPassword);
      setPasswordModalOpen(false);
      setNewPassword('');
      notifications.show({
        title: t('common.success'),
        message: t('profile.passwordChanged'),
        color: 'green',
      });
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('profile.passwordChangeError'),
        color: 'red',
      });
    }
  };

  const hasTelegramWidget = !isInsideTelegramWebApp;


  return (
    <>
      <Card withBorder radius="md" p="lg">
        <Group gap="xs" mb="lg">
          <IconShieldLock size={24} />
          <Text fw={600} size="lg">{t('profile.security')}</Text>
        </Group>

        <Stack gap="lg">

          <OtpSettings embedded />

          {hasTelegramWidget && (
            <>
              <Divider />

              <PasskeySettings embedded />

              <Divider />

              <PasswordAuthSettings embedded />
            </>
          )}

          <Stack gap="xs">
            <Group gap="xs">
              <IconLock size={18} />
              <Text fw={500}>{t('profile.changePassword')}</Text>
            </Group>
            <Text size="sm" c="dimmed">
              {t('security.changePasswordDescription')}
            </Text>
            <Button
              variant="light"
              leftSection={<IconLock size={16} />}
              onClick={() => setPasswordModalOpen(true)}
              mt="xs"
            >
              {t('profile.changePassword')}
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Modal
        opened={passwordModalOpen}
        onClose={() => { setPasswordModalOpen(false); setNewPassword(''); }}
        title={t('profile.changePassword')}
      >
        <Stack gap="md">
          <PasswordInput
            label={t('profile.newPassword')}
            placeholder={t('profile.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setPasswordModalOpen(false); setNewPassword(''); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleChangePassword}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
