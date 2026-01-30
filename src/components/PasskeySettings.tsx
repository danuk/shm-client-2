import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Button, TextInput, ActionIcon, Badge, Loader, Box, Modal } from '@mantine/core';
import { IconFingerprint, IconTrash, IconEdit, IconPlus, IconDeviceMobile } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { passkeyApi, PasskeyCredential } from '../api/client';
import ConfirmModal from './ConfirmModal';

// Утилиты для работы с WebAuthn
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

export default function PasskeySettings() {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<PasskeyCredential | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [credentialToRename, setCredentialToRename] = useState<PasskeyCredential | null>(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Проверяем поддержку WebAuthn
  const isWebAuthnSupported = !!window.PublicKeyCredential;

  const loadCredentials = async () => {
    try {
      const response = await passkeyApi.list();
      const data = response.data.data;
      const passkeyData = Array.isArray(data) ? data[0] : data;
      setCredentials(passkeyData?.credentials || []);
    } catch {
      // Passkey не настроен
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWebAuthnSupported) {
      loadCredentials();
    } else {
      setLoading(false);
    }
  }, [isWebAuthnSupported]);

  const handleRegister = async () => {
    if (!isWebAuthnSupported) {
      notifications.show({
        title: t('common.error'),
        message: t('passkey.notSupported'),
        color: 'red',
      });
      return;
    }

    setRegistering(true);
    try {
      // Получаем опции регистрации
      const optionsResponse = await passkeyApi.registerOptions();
      const optionsData = optionsResponse.data.data;
      const options = Array.isArray(optionsData) ? optionsData[0] : optionsData;

      // Преобразуем данные для WebAuthn API
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64UrlToArrayBuffer(options.challenge),
        rp: {
          name: options.rp.name,
          id: options.rp.id,
        },
        user: {
          id: base64UrlToArrayBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams.map((p: { type: string; alg: number }) => ({
          type: p.type as PublicKeyCredentialType,
          alg: p.alg,
        })),
        timeout: options.timeout,
        attestation: options.attestation as AttestationConveyancePreference,
        excludeCredentials: (options.excludeCredentials || []).map((c: { id: string; type: string }) => ({
          id: base64UrlToArrayBuffer(c.id),
          type: c.type as PublicKeyCredentialType,
        })),
        authenticatorSelection: {
          authenticatorAttachment: options.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment,
          residentKey: options.authenticatorSelection.residentKey as ResidentKeyRequirement,
          userVerification: options.authenticatorSelection.userVerification as UserVerificationRequirement,
        },
      };

      // Создаём credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Отправляем на сервер
      await passkeyApi.registerComplete({
        credential_id: arrayBufferToBase64Url(credential.rawId),
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
          attestationObject: arrayBufferToBase64Url(response.attestationObject),
        },
      });

      notifications.show({
        title: t('common.success'),
        message: t('passkey.registerSuccess'),
        color: 'green',
      });

      // Обновляем список
      loadCredentials();
    } catch (error: any) {
      console.error('Passkey registration error:', error);

      let errorMessage = t('passkey.registerError');
      if (error?.name === 'InvalidStateError') {
        errorMessage = t('passkey.alreadyRegistered');
      } else if (error?.name === 'NotAllowedError') {
        errorMessage = t('passkey.cancelled');
      }

      notifications.show({
        title: t('common.error'),
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setRegistering(false);
    }
  };

  const openDeleteModal = (credential: PasskeyCredential) => {
    setCredentialToDelete(credential);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!credentialToDelete) return;

    setDeleting(true);
    try {
      await passkeyApi.delete(credentialToDelete.id);
      notifications.show({
        title: t('common.success'),
        message: t('passkey.deleteSuccess'),
        color: 'green',
      });
      setDeleteModalOpen(false);
      setCredentialToDelete(null);
      loadCredentials();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('passkey.deleteError'),
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openRenameModal = (credential: PasskeyCredential) => {
    setCredentialToRename(credential);
    setNewName(credential.name);
    setRenameModalOpen(true);
  };

  const handleRename = async () => {
    if (!credentialToRename || !newName.trim()) return;

    setRenaming(true);
    try {
      await passkeyApi.rename(credentialToRename.id, newName.trim());
      notifications.show({
        title: t('common.success'),
        message: t('passkey.renameSuccess'),
        color: 'green',
      });
      setRenameModalOpen(false);
      setCredentialToRename(null);
      setNewName('');
      loadCredentials();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('passkey.renameError'),
        color: 'red',
      });
    } finally {
      setRenaming(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (!isWebAuthnSupported) {
    return (
      <Card withBorder radius="md" p="lg">
        <Group mb="md">
          <IconFingerprint size={24} />
          <Text fw={500}>{t('passkey.title')}</Text>
        </Group>
        <Text size="sm" c="dimmed">
          {t('passkey.notSupported')}
        </Text>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg">
        <Group mb="md">
          <IconFingerprint size={24} />
          <Text fw={500}>{t('passkey.title')}</Text>
        </Group>
        <Loader size="sm" />
      </Card>
    );
  }

  return (
    <>
      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <IconFingerprint size={24} />
            <Text fw={500}>{t('passkey.title')}</Text>
            {credentials.length > 0 && (
              <Badge color="green" variant="light" size="sm">
                {t('passkey.enabled')}
              </Badge>
            )}
          </Group>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={handleRegister}
            loading={registering}
          >
            {t('passkey.add')}
          </Button>
        </Group>

        {credentials.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t('passkey.noPasskeys')}
          </Text>
        ) : (
          <Stack gap="sm">
            {credentials.map((credential) => (
              <Box
                key={credential.id}
                p="sm"
                style={(theme) => ({
                  border: `1px solid ${theme.colors.gray[3]}`,
                  borderRadius: theme.radius.sm,
                })}
              >
                <Group justify="space-between">
                  <Group>
                    <IconDeviceMobile size={20} />
                    <div>
                      <Text size="sm" fw={500}>{credential.name}</Text>
                      <Text size="xs" c="dimmed">
                        {t('passkey.createdAt')}: {formatDate(credential.created_at)}
                      </Text>
                    </div>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => openRenameModal(credential)}
                      title={t('passkey.rename')}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => openDeleteModal(credential)}
                      title={t('common.delete')}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Box>
            ))}
          </Stack>
        )}

        <Text size="xs" c="dimmed" mt="md">
          {t('passkey.description')}
        </Text>
      </Card>

      <ConfirmModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('passkey.deleteTitle')}
        message={t('passkey.deleteConfirm', { name: credentialToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        loading={deleting}
      />

      <Modal
        opened={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title={t('passkey.renameTitle')}
      >
        <Stack gap="md">
          <TextInput
            label={t('passkey.name')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setRenameModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleRename} loading={renaming}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
