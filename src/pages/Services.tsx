import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Timeline, Text, Stack, Group, Badge, Button, Divider, Modal, ActionIcon, Loader, Center, Paper, Title, Tabs, Code, Tooltip, Accordion, Box, Select, NumberInput, Pagination } from '@mantine/core';
import { IconQrcode, IconCopy, IconCheck, IconDownload, IconRefresh, IconTrash, IconPlus, IconPlayerStop, IconExchange, IconCreditCard, IconWallet, IconDeviceMobileCog } from '@tabler/icons-react';
import { useDisclosure, useClipboard } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { api, servicesApi, userApi } from '../api/client';
import { notifications } from '@mantine/notifications';
import QrModal from '../components/QrModal';
import OrderServiceModal from '../components/OrderServiceModal';
import ConfirmModal from '../components/ConfirmModal';
import AppDownloadBlock from '../components/AppDownloadBlock';
import { config } from '../config';
import { useStore } from '../store/useStore';
import { isTelegramWebApp } from '../constants/webapp';

interface ForecastItem {
  name: string;
  cost: number;
  real_cost?: number;
  total: number;
  status: string;
  user_service_id: string;
}

interface PaySystem {
  name: string;
  shm_url: string;
  internal?: number;
  recurring?: number;
  weight?: number;
}

interface ServiceInfo {
  category: string;
  cost: number;
  name: string;
}

interface UserService {
  user_service_id: number;
  service_id: number;
  name?: string;
  service: ServiceInfo;
  status: string;
  expire: string | null;
  next: number | null;
  created: string;
  parent: number | null;
  settings?: Record<string, unknown>;
  children?: UserService[];
}

const statusColors: Record<string, string> = {
  'ACTIVE': 'green',
  'NOT PAID': 'blue',
  'BLOCK': 'red',
  'PROGRESS': 'yellow',
  'ERROR': 'orange',
  'INIT': 'gray',
};

function normalizeCategory(category: string): string {
  const proxyCategories = new Set(config.PROXY_CATEGORY.split(','));
  const vpnCategories = new Set(config.VPN_CATEGORY.split(','));

  if (proxyCategories.has(category)) {
    return 'proxy';
  }
  if (vpnCategories.has(category)) {
    return 'vpn';
  }

  if (category.match(/remna|remnawave|marzban|marz|mz/i)) {
    return 'proxy';
  }
  if (category.match(/^(vpn|wg|awg)/i)) {
    return 'vpn';
  }
  if (['web_tariff', 'web', 'mysql', 'mail', 'hosting'].includes(category)) {
    return category;
  }
  return 'other';
}

interface ServiceDetailProps {
  service: UserService;
  onDelete?: () => void;
  onChangeTariff?: (service: UserService) => void;
}

function ServiceDetail({ service, onDelete, onChangeTariff }: ServiceDetailProps) {
  const [storageData, setStorageData] = useState<string | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [nextServiceInfo, setNextServiceInfo] = useState<{ name: string; cost: number } | null>(null);
  const [nextServiceLoading, setNextServiceLoading] = useState(false);
  const [, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('info');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { t, i18n } = useTranslation();
  const clipboard = useClipboard({ timeout: 1000 });

  const [forecastTotal, setForecastTotal] = useState<number | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [paySystems, setPaySystems] = useState<PaySystem[]>([]);
  const [selectedPaySystem, setSelectedPaySystem] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [paySystemsLoading, setPaySystemsLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const downloadConfig = async () => {
    if (!storageData) return;
    setDownloading(true);
    try {
      const blob = new Blob([storageData], { type: 'application/octet-stream' });
      const prefix = config.VPN_STORAGE_PREFIX ? config.VPN_STORAGE_PREFIX : 'vpn';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prefix}${service.user_service_id}.conf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const canDelete = config.ALLOW_SERVICE_DELETE === 'true' && ['BLOCK', 'NOT PAID', 'ERROR'].includes(service.status);
  const canStop = config.ALLOW_SERVICE_BLOCKED === 'true' && service.status === 'ACTIVE';
  const canChange = config.ALLOW_SERVICE_CHANGE === 'true' && ['BLOCK', 'ACTIVE'].includes(service.status);
  const isNotPaid = service.status === 'NOT PAID';

  useEffect(() => {
    if (!isNotPaid) return;
    const fetchForecast = async () => {
      setForecastLoading(true);
      try {
        const response = await userApi.getForecast();
        const forecastData = response.data.data;
        if (Array.isArray(forecastData) && forecastData.length > 0) {
          const forecast = forecastData[0];
          const balance = forecast.balance || 0;
          const item = forecast.items?.find(
            (it: ForecastItem) => String(it.user_service_id) === String(service.user_service_id)
          );
          if (item) {
            const needToPay = Math.max(0, Math.ceil((item.total - balance) * 100) / 100);
            setForecastTotal(needToPay);
            setPayAmount(needToPay);
          } else if (forecast.total > 0) {
            setForecastTotal(forecast.total);
            setPayAmount(Math.max(0, Math.ceil(forecast.total * 100) / 100));
          }
        }
      } catch {
      } finally {
        setForecastLoading(false);
      }
    };
    fetchForecast();
  }, [service.user_service_id, isNotPaid]);

  const loadPaySystems = async () => {
    if (paySystems.length > 0) return;
    setPaySystemsLoading(true);
    try {
      const response = await userApi.getPaySystems();
      const data: PaySystem[] = response.data.data || [];
      const sorted = data.sort((a, b) => (b.weight || 0) - (a.weight || 0));
      setPaySystems(sorted);
      if (sorted.length > 0) {
        setSelectedPaySystem(sorted[0].shm_url);
      }
    } catch {
    } finally {
      setPaySystemsLoading(false);
    }
  };

  useEffect(() => {
    if (isNotPaid && forecastTotal !== null && forecastTotal > 0) {
      loadPaySystems();
    }
  }, [isNotPaid, forecastTotal]);

  const handlePay = async () => {
    const paySystem = paySystems.find(ps => ps.shm_url === selectedPaySystem);
    if (!paySystem) return;
    setPaying(true);
    try {
      if (paySystem.internal || paySystem.recurring) {
        const response = await fetch(paySystem.shm_url + payAmount, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.status === 200 || response.status === 204) {
          notifications.show({ title: t('common.success'), message: t('payments.paymentSuccess'), color: 'green' });
          onDelete?.();
        } else {
          const data = await response.json().catch(() => ({}));
          notifications.show({ title: t('common.error'), message: data.msg_ru || data.msg || t('payments.paymentError'), color: 'red' });
        }
      } else {
        window.open(paySystem.shm_url + payAmount, '_blank');
      }
    } catch {
      notifications.show({ title: t('common.error'), message: t('payments.paymentError'), color: 'red' });
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/user/service?user_service_id=${service.user_service_id}`);
      notifications.show({
        title: t('common.success'),
        message: t('services.serviceDeleted'),
        color: 'green',
      });
      setConfirmDelete(false);
      onDelete?.();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('services.serviceDeleteError'),
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await userApi.stopService(service.user_service_id);
      notifications.show({
        title: t('common.success'),
        message: t('services.serviceStopped'),
        color: 'green',
      });
      setConfirmStop(false);
      onDelete?.();
    } catch (error) {
      notifications.show({
        title: t('common.error'),
        message: t('services.serviceStopError'),
        color: 'red',
      });
    } finally {
      setStopping(false);
    }
  };

  const handleConfigure = () => {
    const link = subscriptionUrl;
    if ( link ) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && isTelegramWebApp) {
        tgWebApp.openLink(link);
      } else {
        window.open(link, '_blank');
      }
    }
  };


  function detectPlatform(): string {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return 'IOS';
    if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'ANDROID';
    if (/Windows NT/i.test(ua)) return 'WINDOWS';
    if (/Linux/i.test(ua)) return 'LINUX';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'MAC';
    return '';
  }

  const handleOpenUrlSchema = async () => {
    const urlSchema = config[`${detectPlatform()}_PROXY_URL_SCHEMA` as keyof typeof config];
    let link = `${urlSchema}${subscriptionUrl}`;
    if ( config.SHOW_HAPP_CRYPTOLINK === 'true' && urlSchema === 'happ://add/' ) {
      try {
        const response = await fetch(`https://crypto.happ.su/api-v2.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: subscriptionUrl }),
        });
        const data = await response.json();
        if (data && data.encrypted_link) {
          link = data.encrypted_link;
        }
      } catch {
      }
    }
    if ( link ) {
      const tgWebApp = window.Telegram?.WebApp;
      if (tgWebApp && isTelegramWebApp) {
        tgWebApp.openLink(link);
      } else {
        window.open(link, '_blank');
      }
    }
  };

  const category = normalizeCategory(service.service.category);

  useEffect(() => {
    const fetchData = async () => {
      if (category === 'proxy') {
        const prefix = config.PROXY_STORAGE_PREFIX ? config.PROXY_STORAGE_PREFIX : 'vpn_mrzb_';
        try {
          const mzResponse = await api.get(`/storage/manage/${prefix}${service.user_service_id}?format=json`);
          const url = mzResponse.data.subscription_url || mzResponse.data.response?.subscriptionUrl;
          if (url) {
            setSubscriptionUrl(url);
          }
          setActiveTab('config');
        } catch {
        }
        if (!subscriptionUrl ) {
          try {
            const remnaResponse = await api.get(`/storage/manage/vpn_remna_${service.user_service_id}?format=json`);
            const url = remnaResponse.data.subscription_url || remnaResponse.data.response?.subscriptionUrl;
            if (url) {
              setSubscriptionUrl(url);
            }
          } catch {
          }
        }
      } else if (category === 'vpn') {
        const prefix = config.VPN_STORAGE_PREFIX ? config.VPN_STORAGE_PREFIX : 'vpn';
        try {
          const vpnResponse = await api.get(`/storage/manage/${prefix}${service.user_service_id}`);
          const configData = vpnResponse.data;
          if (configData) {
            setStorageData(configData);
          }
          setActiveTab('config');
        } catch {
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [service.user_service_id, category]);

  useEffect(() => {
    const fetchNextService = async () => {
      if (!service.next) {
        setNextServiceInfo(null);
        return;
      }
      setNextServiceLoading(true);
      try {
        const response = await servicesApi.order_list({ service_id: String(service.next) });
        const data = response.data.data || [];
        const nextService = Array.isArray(data) ? data[0] : data;
        if (nextService?.name && typeof nextService.cost === 'number') {
          setNextServiceInfo({ name: nextService.name, cost: nextService.cost });
        } else {
          setNextServiceInfo(null);
        }
      } catch {
        setNextServiceInfo(null);
      } finally {
        setNextServiceLoading(false);
      }
    };

    fetchNextService();
  }, [service.next]);

  const isVpn = category === 'vpn';
  const isProxy = category === 'proxy';
  const isVpnOrProxy = isVpn || isProxy;
  const statusColor = statusColors[service.status] || 'gray';
  const statusLabel = t(`status.${service.status}`, service.status);
  const urlSchema = isProxy && config[`${detectPlatform()}_PROXY_URL_SCHEMA` as keyof typeof config];
  const hasProxyAppUrls = [
    config.PROXY_APP_WINDOWS_URL, config.PROXY_APP_LINUX_URL, config.PROXY_APP_MAC_URL, config.PROXY_APP_IOS_URL, config.PROXY_APP_ANDROID_URL,
  ].some(Boolean);
  const hasVpnAppUrls = [
    config.VPN_APP_WINDOWS_URL, config.VPN_APP_LINUX_URL, config.VPN_APP_MAC_URL, config.VPN_APP_IOS_URL, config.VPN_APP_ANDROID_URL,
  ].some(Boolean);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text fw={700} size="lg">#{service.user_service_id} - {service.service.name}</Text>
          <Badge color={statusColor} variant="light">
            {statusLabel}
          </Badge>
        </div>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="info">{t('services.info')}</Tabs.Tab>
          {isVpnOrProxy && service.status === 'ACTIVE' && <Tabs.Tab value="config">{t('services.connection')}</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t('services.status')}:</Text>
              <Badge color={statusColor} variant="light">{statusLabel}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{t('services.cost')}:</Text>
              <Text size="sm">{service.service.cost} {t('common.currency')}</Text>
            </Group>
            {service.expire && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{t('services.validUntil')}:</Text>
                <Text size="sm">{new Date(service.expire as string).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}</Text>
              </Group>
            )}
            {service.next && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{t('services.validUntilNext')}:</Text>
                {nextServiceLoading ? (
                  <Text size="sm">{t('common.loading')}</Text>
                ) : nextServiceInfo ? (
                  <Text size="sm">{nextServiceInfo.name} - {nextServiceInfo.cost} {t('common.currency')}</Text>
                ) : (
                  <Text size="sm">{service.next}</Text>
                )}
              </Group>
            )}
            {service.children && service.children.length > 0 && (
              <>
                <Text size="sm" c="dimmed" mt="md">{t('services.includedServices')}:</Text>
                {service.children.map((child) => {
                  const childStatusColor = statusColors[child.status] || 'gray';
                  const childStatusLabel = t(`status.${child.status}`, child.status);
                  return (
                    <Group key={child.user_service_id} justify="space-between" ml="md">
                      <Text size="sm">{child.service.name}</Text>
                      <Badge size="sm" color={childStatusColor} variant="light">{childStatusLabel}</Badge>
                    </Group>
                  );
                })}
              </>
            )}
          </Stack>
        </Tabs.Panel>

        { service.status === 'ACTIVE' && (
          <Tabs.Panel value="config" pt="md">
            <Stack gap="md">
              {isProxy && subscriptionUrl && (
                <Paper withBorder p="md" radius="md">
                  { config.SHOW_PROXY_SUB_LINK === 'true' && (
                    <>
                    <Text size="sm" fw={500} mb="xs">{t('services.subscriptionLink')}</Text>
                    <Group gap="xs">
                      <Code style={{ flex: 1, wordBreak: 'break-all' }}>{subscriptionUrl}</Code>
                      <Tooltip label={clipboard.copied ? t('common.copied') : t('common.copy')}>
                        <ActionIcon color={clipboard.copied ? 'teal' : 'gray'} variant="subtle" onClick={() => clipboard.copy(subscriptionUrl)}>
                          {clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                    <Divider my="xs" />
                    </>
                  )}

                  <Group gap="xs">
                    {hasProxyAppUrls ? (
                      <Timeline active={1} bulletSize={24} lineWidth={2}>
                        <Timeline.Item bullet={<IconDownload size={12} />} title={t('services.stepDownloadApp')}>
                          <AppDownloadBlock type="proxy" />
                        </Timeline.Item>
                        <Timeline.Item bullet={<IconDeviceMobileCog size={12} />} title={t('services.stepConfigureApp') + ' ' + (urlSchema ? t('services.deviceConfig') : t('services.openSubLink'))}>
                          <Group gap="xs" mt="xs">
                            { config.SHOW_PROXY_QR === 'true' && (
                              <Button
                                leftSection={<IconQrcode size={16} />}
                                variant="light"
                                onClick={() => setQrModalOpen(true)}
                              >
                                {t('services.qrCode')}
                            </Button>
                            )}
                            <Button
                              component="a"
                              color="green"
                              onClick={() => urlSchema ? handleOpenUrlSchema() : handleConfigure()}
                              leftSection={<IconDeviceMobileCog size={16} />}
                              variant="light"
                            >
                              {urlSchema ? t('services.deviceConfig') : t('services.openSubLink')}
                            </Button>
                          </Group>
                        </Timeline.Item>
                      </Timeline>
                    ) : (
                    <Group gap="xs" mt="xs">
                      {config.SHOW_PROXY_QR === 'true' && (
                        <Button
                          leftSection={<IconQrcode size={16} />}
                          variant="light"
                          onClick={() => setQrModalOpen(true)}
                        >
                          {t('services.qrCode')}
                        </Button>
                      )}
                      <Button
                        component="a"
                        color="green"
                        onClick={() => handleConfigure()}
                        leftSection={<IconDeviceMobileCog size={16} />}
                        variant="light"
                      >
                        {t('services.openSubLink')}
                      </Button>
                    </Group>
                    )}
                  </Group>
                </Paper>
              )}
              { isVpn && storageData && (
                <Paper withBorder p="md" radius="md">
                  {hasVpnAppUrls ? (
                    <Timeline active={1} bulletSize={24} lineWidth={2}>
                      <Timeline.Item bullet={<IconDownload size={12} />} title={t('services.stepDownloadApp')}>
                        <AppDownloadBlock type="vpn" />
                      </Timeline.Item>
                      <Timeline.Item bullet={<IconDeviceMobileCog size={12} />} title={t('services.stepConfigureApp') + ' ' +  (t('services.downloadConfig'))}>
                        <Group gap="xs" mt="xs">
                          <Button
                            leftSection={<IconQrcode size={16} />}
                            variant="light"
                            onClick={() => setQrModalOpen(true)}
                            >
                              {t('services.qrCode')}
                            </Button>
                          <Button
                            leftSection={<IconDownload size={16} />}
                            variant="light"
                            onClick={downloadConfig}
                            loading={downloading}
                          >
                            {t('services.downloadConfig')}
                          </Button>
                        </Group>
                      </Timeline.Item>
                    </Timeline>
                    ) : (
                    <Group gap="xs" mt="xs">
                      <Button
                        leftSection={<IconQrcode size={16} />}
                        variant="light"
                        onClick={() => setQrModalOpen(true)}
                      >
                        {t('services.qrCode')}
                      </Button>
                      <Button
                        leftSection={<IconDownload size={16} />}
                        variant="light"
                        onClick={downloadConfig}
                        loading={downloading}
                      >
                        {t('services.downloadConfig')}
                      </Button>
                    </Group>
                  )}
                </Paper>
              )}

              <QrModal
                opened={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                data={isVpn ? (storageData || '') : (subscriptionUrl || '')}
                title={isVpn ? t('services.vpnQrTitle') : t('services.subscriptionQrTitle')}
                onDownload={isVpn ? downloadConfig : undefined}
              />
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>

      {isNotPaid && (
        <Paper withBorder p="md" radius="md" mt="md">
          <Stack gap="sm">
            {forecastLoading ? (
              <Group justify="center" py="xs">
                <Loader size="sm" />
                <Text size="sm">{t('common.loading')}</Text>
              </Group>
            ) : forecastTotal !== null && forecastTotal > 0 ? (
              <>
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconWallet size={18} />
                    <Text fw={500}>{t('services.amountToPay')}</Text>
                  </Group>
                  <Text fw={700} size="lg" c="red">{forecastTotal.toFixed(2)} {t('common.currency')}</Text>
                </Group>
                {paySystemsLoading ? (
                  <Group justify="center" py="xs">
                    <Loader size="sm" />
                  </Group>
                ) : paySystems.length > 0 ? (
                  <>
                    <Select
                      label={t('payments.paymentSystem')}
                      data={paySystems.map(ps => ({ value: ps.shm_url, label: ps.name }))}
                      value={selectedPaySystem}
                      onChange={setSelectedPaySystem}
                      size="sm"
                    />
                    <NumberInput
                      label={t('payments.amount')}
                      value={payAmount}
                      onChange={setPayAmount}
                      min={1}
                      step={10}
                      decimalScale={2}
                      suffix=" ₽"
                      size="sm"
                    />
                    <Button
                      fullWidth
                      leftSection={<IconCreditCard size={18} />}
                      onClick={handlePay}
                      loading={paying}
                      disabled={!selectedPaySystem}
                    >
                      {t('services.payService', { amount: payAmount })}
                    </Button>
                  </>
                ) : null}
              </>
            ) : null}
          </Stack>
        </Paper>
      )}

      {canChange && (
        <Button
          color="blue"
          variant="light"
          leftSection={<IconExchange size={16} />}
          onClick={() => onChangeTariff?.(service)}
          mt="md"
          fullWidth
        >
          {t('services.changeService')}
        </Button>
      )}

      {canStop && (
        <Button
          color="orange"
          variant="light"
          leftSection={<IconPlayerStop size={16} />}
          onClick={() => setConfirmStop(true)}
          mt="md"
          fullWidth
        >
          {t('services.stopService')}
        </Button>
      )}

      {canDelete && (
        <Button
          color="red"
          variant="light"
          leftSection={<IconTrash size={16} />}
          onClick={() => setConfirmDelete(true)}
          mt="md"
          fullWidth
        >
          {t('services.deleteService')}
        </Button>
      )}

      <ConfirmModal
        opened={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={handleStop}
        title={t('services.stopServiceTitle')}
        message={t('services.stopServiceMessage')}
        confirmLabel={t('services.stop')}
        confirmColor="orange"
        loading={stopping}
      />

      <ConfirmModal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('services.deleteServiceTitle')}
        message={t('services.deleteServiceMessage')}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        loading={deleting}
      />
    </Stack>
  );
}

function ServiceCard({ service, onClick, isChild = false, isLastChild = false }: { service: UserService; onClick: () => void; isChild?: boolean; isLastChild?: boolean }) {
  const { t, i18n } = useTranslation();
  const statusColor = statusColors[service.status] || 'gray';
  const statusLabel = t(`status.${service.status}`, service.status);

  if (isChild) {
    return (
      <Group gap={0} wrap="nowrap" align="stretch">
        <Box
          style={{
            width: 24,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Box
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: isLastChild ? '50%' : 0,
              width: 2,
              backgroundColor: 'var(--mantine-color-gray-4)',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              width: 14,
              height: 2,
              backgroundColor: 'var(--mantine-color-gray-4)',
            }}
          />
        </Box>
        <Card
          withBorder
          radius="md"
          p="sm"
          style={{ cursor: 'pointer', flex: 1 }}
          onClick={onClick}
        >
          <Group justify="space-between">
            <div>
              <Text fw={500} size="sm">#{service.user_service_id} - {service.service.name}</Text>
              {service.expire && (
                <Text size="xs" c="dimmed">
                  {new Date(service.expire as string).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
                </Text>
              )}
            </div>
            <Group gap="sm">
              {service.service.cost > 0 && (
                <Text size="sm" c="dimmed">{service.service.cost} {t('common.currency')}</Text>
              )}
              <Badge color={statusColor} variant="light" size="sm">
                {statusLabel}
              </Badge>
            </Group>
          </Group>
        </Card>
      </Group>
    );
  }

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <Group justify="space-between">
        <div>
          <Text fw={500}>#{service.user_service_id} - {service.service.name}</Text>
          {service.expire && (
            <Text size="xs" c="dimmed">
              {new Date(service.expire as string).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
            </Text>
          )}
        </div>
        <Group gap="sm">
          {service.service.cost > 0 && (
            <Text size="sm" c="dimmed">{service.service.cost} {t('common.currency')}</Text>
          )}
          <Badge color={statusColor} variant="light">
            {statusLabel}
          </Badge>
        </Group>
      </Group>
    </Card>
  );
}

export default function Services() {
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<UserService | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);
  const [changeModalOpened, { open: openChangeModal, close: closeChangeModal }] = useDisclosure(false);
  const [changeService, setChangeService] = useState<UserService | null>(null);
  const refreshAttemptsRef = useRef(0);
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});
  const perPage = 5;
  const { t } = useTranslation();
  const { userEmailVerified, setOpenVerifyModal } = useStore();
  const [confirmEmailNotVerified, setConfirmEmailNotVerified] = useState(false);
  const navigate = useNavigate();

  const handleEmailNotVerified = async () => {
    setOpenVerifyModal(true);
    navigate('/');
  };

  const fetchServices = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const response = await api.get('/user/service', { params: { limit: 1000 } });
      const raw: UserService[] = response.data.data || [];
      const data: UserService[] = raw.map((item: UserService & { category?: string; cost?: string | number; name?: string }) => ({
        ...item,
        service: item.service ?? {
          category: item.category ?? '',
          cost: typeof item.cost === 'string' ? parseFloat(item.cost) || 0 : (item.cost ?? 0),
          name: item.name ?? '',
        },
      }));

      const serviceMap = new Map<number, UserService>();
      data.forEach(s => serviceMap.set(s.user_service_id, { ...s, children: [] }));

      const rootServices: UserService[] = [];
      serviceMap.forEach(service => {
        if (service.parent && serviceMap.has(service.parent)) {
          const parent = serviceMap.get(service.parent)!;
          parent.children = parent.children || [];
          parent.children.push(service);
        } else if (!service.parent) {
          rootServices.push(service);
        }
      });

      setServices(rootServices);
      return rootServices;
    } catch (error) {
      console.error('Failed to fetch services:', error);
      return [];
    } finally {
      if (!background) setLoading(false);
    }
  };

  const hasProgressServices = (serviceList: UserService[]): boolean => {
    for (const service of serviceList) {
      if (service.status === 'PROGRESS') return true;
      if (service.children && hasProgressServices(service.children)) return true;
    }
    return false;
  };

  const hasNotPaidServices = (serviceList: UserService[]): boolean => {
    for (const service of serviceList) {
      if (service.status === 'NOT PAID') return true;
      if (service.children && hasNotPaidServices(service.children)) return true;
    }
    return false;
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (!services.length || loading) return;

    const hasProgress = hasProgressServices(services);

    if (hasProgress && refreshAttemptsRef.current < 2) {
      const delay = refreshAttemptsRef.current === 0 ? 1000 : 3000;
      const timer = setTimeout(async () => {
        refreshAttemptsRef.current += 1;
        await fetchServices(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!hasProgress) {
      refreshAttemptsRef.current = 0;
    }
  }, [services, loading]);

  useEffect(() => {
    if (!services.length || loading) return;

    const hasNotPaid = hasNotPaidServices(services);
    if (!hasNotPaid) return;

    const interval = setInterval(() => {
      fetchServices(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [services, loading]);

  const handleServiceClick = (service: UserService) => {
    setSelectedService(service);
    open();
  };

  const handleChangeTariff = (service: UserService) => {
    setChangeService(service);
    close();
    openChangeModal();
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = normalizeCategory(service.service.category);

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, UserService[]>);

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{t('services.title')}</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={ config.EMAIL_VERIFY_REQUIRED === "true" && !userEmailVerified ? () => setConfirmEmailNotVerified(true) : openOrderModal}>
            {t('services.orderService')}
          </Button>
          <Button leftSection={<IconRefresh size={16} />} variant="light" color="cyan" onClick={() => fetchServices()}>
            {t('common.refresh')}
          </Button>
        </Group>
      </Group>

      {Object.keys(groupedServices).length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Stack align="center" gap="md">
              <Text c="dimmed">{t('services.noServices')}</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={ config.EMAIL_VERIFY_REQUIRED === "true"  && !userEmailVerified ? () => setConfirmEmailNotVerified(true) : openOrderModal}>
                {t('services.orderService')}
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Accordion variant="separated" radius="md" multiple defaultValue={Object.keys(groupedServices)}>
          {Object.entries(groupedServices).map(([category, categoryServices]) => {
            const page = categoryPages[category] || 1;
            const totalPages = Math.ceil(categoryServices.length / perPage);
            const paginatedServices = categoryServices.slice((page - 1) * perPage, page * perPage);
            let categoryTitle;
            if ( category === 'vpn' && config.VPN_CATEGORY_TITLE ) {
              categoryTitle = config.VPN_CATEGORY_TITLE
            } else if ( category === 'proxy' && config.PROXY_CATEGORY_TITLE ) {
              categoryTitle = config.PROXY_CATEGORY_TITLE
            } else {
              categoryTitle = t(`categories.${category}`, category);
            }
            return (
            <Accordion.Item key={category} value={category}>
              <Accordion.Control>
                <Group>
                  <Text fw={500}>{ categoryTitle }</Text>
                  <Badge variant="light" size="sm">{categoryServices.length}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  {paginatedServices.map((service) => (
                    <Box key={service.user_service_id}>
                      <ServiceCard
                        service={service}
                        onClick={() => handleServiceClick(service)}
                      />
                      {service.children && service.children.length > 0 && (
                        <Stack gap="xs" mt="xs" ml="md">
                          {service.children.map((child, index) => (
                            <ServiceCard
                              key={child.user_service_id}
                              service={child}
                              onClick={() => handleServiceClick(child)}
                              isChild
                              isLastChild={index === service.children!.length - 1}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  ))}
                  {totalPages > 1 && (
                    <Center mt="xs">
                      <Pagination
                        total={totalPages}
                        value={page}
                        onChange={(p) => setCategoryPages(prev => ({ ...prev, [category]: p }))}
                        size="sm"
                      />
                    </Center>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            );
          })}
        </Accordion>
      )}

      <Modal opened={opened} onClose={close} title={t('services.serviceDetails')} size="lg">
        {selectedService && (
          <ServiceDetail
            service={selectedService}
            onDelete={() => {
              close();
              refreshAttemptsRef.current = 0;
              fetchServices();
            }}
            onChangeTariff={handleChangeTariff}
          />
        )}
      </Modal>

      <OrderServiceModal
        opened={orderModalOpened}
        onClose={closeOrderModal}
        onOrderSuccess={() => {
          refreshAttemptsRef.current = 0;
          fetchServices();
        }}
      />

      <OrderServiceModal
        opened={changeModalOpened}
        onClose={() => {
          setChangeService(null);
          closeChangeModal();
        }}
        mode="change"
        currentService={
          changeService
            ? {
                user_service_id: changeService.user_service_id,
                service_id: changeService.service_id,
                status: changeService.status,
                category: changeService.service.category,
                name: changeService.service.name,
              }
            : undefined
        }
        onChangeSuccess={() => {
          refreshAttemptsRef.current = 0;
          fetchServices();
        }}
      />

      <ConfirmModal
        opened={confirmEmailNotVerified}
        onClose={() => setConfirmEmailNotVerified(false)}
        onConfirm={handleEmailNotVerified}
        title={t('services.emailNotVerifiedtitle')}
        message={t('services.emailNotVerifiedDesc')}
        confirmLabel={t('services.emailNotVerifiedAction')}
        confirmColor="orange"
      />

    </Stack>
  );
}