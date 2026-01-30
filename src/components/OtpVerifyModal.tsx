import { useState } from 'react';
import { Modal, Stack, Text, TextInput, Button, Group } from '@mantine/core';
import { IconShieldLock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { otpApi } from '../api/client';

interface OtpVerifyModalProps {
  opened: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export default function OtpVerifyModal({ opened, onClose, onVerified }: OtpVerifyModalProps) {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!token) {
      notifications.show({
        title: t('common.error'),
        message: t('otp.enterValidCode'),
        color: 'red',
      });
      return;
    }

    setVerifying(true);
    try {
      await otpApi.verify(token);
      onVerified();
      setToken('');
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('otp.invalidCode'),
        color: 'red',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setToken('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconShieldLock size={20} />
          <span>{t('otp.verifyTitle')}</span>
        </Group>
      }
      size="sm"
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('otp.verifyDescription')}
        </Text>

        <TextInput
          label={t('otp.enterCode')}
          placeholder="000000"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 8))}
          maxLength={8}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          autoFocus
        />

        <Text size="xs" c="dimmed">
          {t('otp.enterCodeOrBackup')}
        </Text>

        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleVerify}
            loading={verifying}
            disabled={!token}
          >
            {t('otp.verify')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
