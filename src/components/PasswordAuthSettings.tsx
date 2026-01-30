import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Button, Badge, Alert } from '@mantine/core';
import { IconLock, IconLockOpen, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { passwordAuthApi, PasswordAuthStatus } from '../api/client';
import ConfirmModal from './ConfirmModal';

export default function PasswordAuthSettings() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PasswordAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  const loadStatus = async () => {
    try {
      const response = await passwordAuthApi.status();
      const data = response.data.data;
      const statusData = Array.isArray(data) ? data[0] : data;
      setStatus(statusData);
    } catch {
      // Ошибка загрузки статуса - скрываем компонент
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleDisable = async () => {
    setDisabling(true);
    try {
      await passwordAuthApi.disable();
      notifications.show({
        title: t('common.success'),
        message: t('passwordAuth.disableSuccess'),
        color: 'green',
      });
      setConfirmDisableOpen(false);
      loadStatus();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('passwordAuth.disableError'),
        color: 'red',
      });
    } finally {
      setDisabling(false);
    }
  };

  const handleEnable = async () => {
    setEnabling(true);
    try {
      await passwordAuthApi.enable();
      notifications.show({
        title: t('common.success'),
        message: t('passwordAuth.enableSuccess'),
        color: 'green',
      });
      loadStatus();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('passwordAuth.enableError'),
        color: 'red',
      });
    } finally {
      setEnabling(false);
    }
  };

  // Не показываем компонент пока загружается или если не удалось загрузить статус
  if (loading || !status) {
    return null;
  }

  // Не показываем если passkey не настроен
  if (!status.passkey_enabled) {
    return null;
  }

  const isDisabled = status.password_auth_disabled === 1;

  return (
    <>
      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            {isDisabled ? <IconLock size={20} /> : <IconLockOpen size={20} />}
            <Text fw={500}>{t('passwordAuth.title')}</Text>
          </Group>
          <Badge color={isDisabled ? 'green' : 'yellow'}>
            {isDisabled ? t('passwordAuth.disabled') : t('passwordAuth.enabled')}
          </Badge>
        </Group>

        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('passwordAuth.description')}
          </Text>

          {isDisabled ? (
            <>
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                {t('passwordAuth.disabledInfo')}
              </Alert>
              <Button
                variant="light"
                color="green"
                leftSection={<IconLockOpen size={16} />}
                onClick={handleEnable}
                loading={enabling}
              >
                {t('passwordAuth.enable')}
              </Button>
            </>
          ) : (
            <Button
              variant="light"
              color="red"
              leftSection={<IconLock size={16} />}
              onClick={() => setConfirmDisableOpen(true)}
            >
              {t('passwordAuth.disable')}
            </Button>
          )}
        </Stack>
      </Card>

      <ConfirmModal
        opened={confirmDisableOpen}
        onClose={() => setConfirmDisableOpen(false)}
        onConfirm={handleDisable}
        title={t('passwordAuth.disableTitle')}
        message={t('passwordAuth.disableConfirm')}
        confirmLabel={t('passwordAuth.disable')}
        confirmColor="red"
        loading={disabling}
      />
    </>
  );
}
