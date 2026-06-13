import { useState } from 'react';
import { Paper, Group, Box, Text, Button, CloseButton } from '@mantine/core';
import { IconShare2 } from '@tabler/icons-react';
import { useTranslation, Trans } from 'react-i18next';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallBanner() {
  const { canInstall, isIOSInstall, install } = usePWAInstall();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!canInstall && !isIOSInstall)) return null;

  return (
    <Paper
      withBorder
      shadow="sm"
      p="sm"
      style={{
        position: 'fixed',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        width: 'min(380px, calc(100vw - 32px))',
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group wrap="nowrap" gap="sm" style={{ flex: 1, minWidth: 0 }}>
          <img src="/icon-192.png" alt="" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={600}>{t('common.installApp')}</Text>
            {isIOSInstall && !canInstall ? (
              <Text size="xs" c="dimmed" lineClamp={3}>
                <Trans i18nKey="common.installAppIOSDesc" components={{ icon: <IconShare2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> }} />
              </Text>
            ) : (
              <Text size="xs" c="dimmed" lineClamp={2}>{t('common.installAppDesc')}</Text>
            )}
          </Box>

        </Group>
        <Group gap={4} wrap="nowrap">
          {canInstall && (
            <Button size="xs" onClick={() => install()}>{t('common.installAppBtn')}</Button>
          )}
          <CloseButton size="sm" onClick={() => setDismissed(true)} aria-label={t('common.installAppDismiss')} />
        </Group>
      </Group>
    </Paper>
  );
}
