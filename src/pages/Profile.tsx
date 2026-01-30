import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Button, TextInput, Avatar, Title, Modal, PasswordInput, Loader, Center, Collapse, useMantineColorScheme } from '@mantine/core';
import { IconUser, IconPhone, IconBrandTelegram, IconLock, IconWallet, IconCreditCard, IconChevronDown, IconChevronUp, IconCreditCardPay, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { userApi, telegramApi } from '../api/client';
import PayModal from '../components/PayModal';
import PromoModal from '../components/PromoModal';
import ConfirmModal from '../components/ConfirmModal';
import PasskeySettings from '../components/PasskeySettings';
import OtpSettings from '../components/OtpSettings';
import PasswordAuthSettings from '../components/PasswordAuthSettings';
import { useStore } from '../store/useStore';

interface UserProfile {
  user_id: number;
  login: string;
  full_name?: string;
  phone?: string;
  balance: number;
  credit?: number;
  bonus?: number;
  gid: number;
  telegram_user_id?: number;
  settings?: {
    telegram?: {
      username?: string;
      chat_id?: number;
    };
  };
}

interface ForecastItem {
  name: string;
  cost: number;
  total: number;
  status: string;
  service_id: string;
  user_service_id: string;
  months: number;
  discount: number;
  qnt: number;
}

interface ForecastData {
  balance: number;
  bonuses: number;
  total: number;
  items: ForecastItem[];
}

interface AutoPayment {
  paysystem: string;
  name: string;
  allow_deletion: number;
  recurring?: number;
}

export default function Profile() {
  const { telegramPhoto } = useStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramInput, setTelegramInput] = useState('');
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastOpen, setForecastOpen] = useState(false);
  const [autopayments, setAutopayments] = useState<AutoPayment[]>([]);
  const [autopaymentsOpen, setAutopaymentsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [autopaymentToDelete, setAutopaymentToDelete] = useState<{ paysystem: string; name: string } | null>(null);
  const [deletingAutopayment, setDeletingAutopayment] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile();
        const responseData = response.data.data;
        const data = Array.isArray(responseData) ? responseData[0] : responseData;
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
        });
        try {
          const telegramResponse = await telegramApi.getSettings();
          setTelegramUsername(telegramResponse.data.username || null);
        } catch {
          // Telegram не настроен
        }
        try {
          const forecastResponse = await userApi.getForecast();
          const forecastData = forecastResponse.data.data;
          if (Array.isArray(forecastData) && forecastData.length > 0) {
            setForecast(forecastData[0]);
          }
        } catch {
          // Прогноз не доступен
        }
        try {
          const paySystems = await userApi.getPaySystems();
          const paySystemsData = paySystems.data.data;
          if (Array.isArray(paySystemsData)) {
            const savedPayments = paySystemsData.filter((ps: AutoPayment) => ps.allow_deletion === 1);
            setAutopayments(savedPayments);
          }
        } catch {
          // Платёжные системы не доступны
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await userApi.updateProfile(formData);
      setProfile((prev) => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      notifications.show({
        title: t('common.success'),
        message: t('profile.profileUpdated'),
        color: 'green',
      });
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('profile.profileUpdateError'),
        color: 'red',
      });
    }
  };

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

  const refreshProfile = async () => {
    const profileResponse = await userApi.getProfile();
    const profileData = profileResponse.data.data;
    const data = Array.isArray(profileData) ? profileData[0] : profileData;
    setProfile(data);
  };

  const refreshAutopayments = async () => {
    try {
      const paySystems = await userApi.getPaySystems();
      const paySystemsData = paySystems.data.data;
      if (Array.isArray(paySystemsData)) {
        const savedPayments = paySystemsData.filter((ps: AutoPayment) => ps.allow_deletion === 1);
        setAutopayments(savedPayments);
      }
    } catch {
      // Ignore
    }
  };

  const openDeleteConfirm = (paysystem: string, name: string) => {
    setAutopaymentToDelete({ paysystem, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAutopayment = async () => {
    if (!autopaymentToDelete) return;
    setDeletingAutopayment(true);
    try {
      await userApi.deleteAutopayment(autopaymentToDelete.paysystem);
      setDeleteConfirmOpen(false);
      setAutopaymentToDelete(null);
      notifications.show({
        title: t('common.success'),
        message: t('payments.paymentMethodDeleted', { name: autopaymentToDelete.name }),
        color: 'green',
      });
      // Обновляем список с сервера
      refreshAutopayments();
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('payments.paymentMethodDeleteError'),
        color: 'red',
      });
    } finally {
      setDeletingAutopayment(false);
    }
  };

  const openTelegramModal = () => {
    setTelegramInput(telegramUsername || '');
    setTelegramModalOpen(true);
  };

  const handleSaveTelegram = async () => {
    setTelegramSaving(true);
    try {
      await telegramApi.updateSettings({ username: telegramInput.trim().replace('@', '') });
      setTelegramUsername(telegramInput.trim().replace('@', '') || null);
      setTelegramModalOpen(false);
      notifications.show({
        title: t('common.success'),
        message: t('profile.telegramSaved'),
        color: 'green',
      });
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('profile.telegramSaveError'),
        color: 'red',
      });
    } finally {
      setTelegramSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={2}>{t('profile.title')}</Title>

      <Card withBorder radius="md" p="lg">
        <Group>
          <Avatar
            size={80}
            radius="xl"
            color="blue"
            src={telegramPhoto || undefined}
          >
            {!telegramPhoto && (profile.full_name?.charAt(0) || profile.login?.charAt(0)?.toUpperCase() || '?')}
          </Avatar>
          <div>
            <Text fw={500} size="lg">{profile.full_name || profile.login || t('profile.user')}</Text>
            <Text size="sm" c="dimmed">{profile.login || '-'}</Text>
          </div>
        </Group>
      </Card>

      {forecast && forecast.items && forecast.items.length > 0 && (
        <Card withBorder radius="md" p="lg">
          <Group
            justify="space-between"
            style={{ cursor: 'pointer' }}
            onClick={() => setForecastOpen(!forecastOpen)}
          >
            <div>
              <Text fw={500}>{t('profile.forecast')}</Text>
              <Text size="sm" c={forecast.total > 0 ? 'red' : 'green'} fw={600}>
                {t('profile.toPay')}: {forecast.total.toFixed(2)} {t('common.currency')}
              </Text>
            </div>
            {forecastOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </Group>
          <Collapse in={forecastOpen}>
            <Stack gap="sm" mt="md">
              {forecast.items.map((item, index) => (
                <Card
                  key={index}
                  withBorder
                  radius="sm"
                  p="sm"
                  bg={item.status === 'NOT PAID'
                    ? (colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'red.0')
                    : undefined
                  }
                >
                  <Group justify="space-between" wrap="nowrap">
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>{item.name}</Text>
                      <Text size="xs" c="dimmed">
                        {item.months} {t('common.months')} × {item.qnt} {t('common.pieces')}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text size="sm" fw={600} c={item.status === 'NOT PAID' ? 'red' : 'green'}>
                        {item.total.toFixed(2)} {t('common.currency')}
                      </Text>
                      <Text size="xs" c={item.status === 'NOT PAID' ? 'red' : 'green'}>
                        {item.status === 'NOT PAID' ? t('profile.notPaid') : item.status}
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Collapse>
        </Card>
      )}

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" c="dimmed">{t('profile.balance')}</Text>
            <Group gap="xs" align="baseline">
              <IconWallet size={24} />
              <Text size="xl" fw={700}>{profile.balance?.toFixed(2) || '0.00'} {t('common.currency')}</Text>
            </Group>
            { profile.credit && profile.credit > 0 ? ( <Text size="xm" c="dimmed">{t('profile.credit')}: {profile.credit}</Text>) : undefined}
          </div>
          <Button leftSection={<IconCreditCard size={18} />} onClick={() => setPayModalOpen(true)}>
            {t('profile.topUp')}
          </Button>
        </Group>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" align="center">
          <div>
              <Text size="xm" c="dimmed">{t('profile.bonus')}: {profile.bonus}</Text>
          </div>
          <Button onClick={() => setPromoModalOpen(true)}>
            {t('profile.enterPromo')}
          </Button>
        </Group>
      </Card>

      {autopayments.length > 0 && (
        <Card withBorder radius="md" p="lg">
          <Group
            justify="space-between"
            style={{ cursor: 'pointer' }}
            onClick={() => setAutopaymentsOpen(!autopaymentsOpen)}
          >
            <div>
              <Text fw={500}>
                <IconCreditCardPay size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                {t('profile.savedPaymentMethods')}
              </Text>
              <Text size="sm" c="dimmed">
                {autopayments.length} {autopayments.length === 1 ? t('profile.method') : t('profile.methods')}
              </Text>
            </div>
            {autopaymentsOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </Group>
          <Collapse in={autopaymentsOpen}>
            <Stack gap="sm" mt="md">
              {autopayments.map((ap) => (
                <Card key={ap.paysystem} withBorder radius="sm" p="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Text size="sm" fw={500}>{ap.name}</Text>
                      {ap.recurring === 1 && (
                        <Text size="xs" c="dimmed">{t('profile.autopaymentEnabled')}</Text>
                      )}
                    </div>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(ap.paysystem, ap.name);
                      }}
                    >
                      {t('common.delete')}
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Collapse>
        </Card>
      )}

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Text fw={500}>{t('profile.personalData')}</Text>
          {!editing ? (
            <Button variant="light" size="xs" onClick={() => setEditing(true)}>
              {t('common.edit')}
            </Button>
          ) : (
            <Group gap="xs">
              <Button variant="light" size="xs" color="gray" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
              <Button size="xs" onClick={handleSave}>
                {t('common.save')}
              </Button>
            </Group>
          )}
        </Group>

        <Stack gap="md">
          <TextInput
            label={t('profile.fullName')}
            leftSection={<IconUser size={16} />}
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            disabled={!editing}
          />
          <TextInput
            label={t('profile.phone')}
            leftSection={<IconPhone size={16} />}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!editing}
          />
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Text fw={500}>{t('profile.telegram')}</Text>
          <Button variant="light" size="xs" onClick={openTelegramModal}>
            {telegramUsername ? t('profile.change') : t('profile.link')}
          </Button>
        </Group>
        <Group>
          <IconBrandTelegram size={24} color="#0088cc" />
          {telegramUsername ? (
            <div>
              <Text size="sm">@{telegramUsername}</Text>
              <Text size="xs" c="dimmed">{t('profile.telegramLinked')}</Text>
            </div>
          ) : (
            <Text size="sm" c="dimmed">{t('profile.telegramNotLinked')}</Text>
          )}
        </Group>
          <Text size="xs" c="dimmed" mt="md">
            {t('profile.telegramDescription')}
          </Text>
      </Card>

      <PasskeySettings />

      <OtpSettings />

      <PasswordAuthSettings />

      <Card withBorder radius="md" p="lg">
        <Text fw={500} mb="md">{t('profile.security')}</Text>
        <Stack gap="md">
          <Button variant="light" leftSection={<IconLock size={16} />} onClick={() => setPasswordModalOpen(true)}>
            {t('profile.changePassword')}
          </Button>
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

      <PayModal opened={payModalOpen} onClose={() => setPayModalOpen(false)} />

      <PromoModal
        opened={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        onSuccess={refreshProfile}
      />

      <Modal
        opened={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        title={t('profile.linkTelegram')}
      >
        <Stack gap="md">
          <TextInput
            label={t('profile.telegramLogin')}
            placeholder="@username"
            value={telegramInput}
            onChange={(e) => setTelegramInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTelegram()}
          />
          <Text size="xs" c="dimmed">
            {t('profile.telegramLoginHint')}
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setTelegramModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveTelegram} loading={telegramSaving}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmModal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAutopayment}
        title={t('payments.deletePaymentMethod')}
        message={t('payments.deletePaymentMethodConfirm', { name: autopaymentToDelete?.name || '' })}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        loading={deletingAutopayment}
      />
    </Stack>
  );
}