import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

export function useAuthCallbackStatus() {
  const { t } = useTranslation();
  const { isLoading, isAuthenticated } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tgStatus = params.get('tg_status');
    const oauth2Status = params.get('oauth2_status');
    if (!tgStatus && !oauth2Status) return;
    if (isLoading) return;

    if (window.opener) {
      window.close();
      return;
    }

    const errorMsg = params.get('error');
    params.delete('tg_status');
    params.delete('oauth2_status');
    params.delete('session_id');
    params.delete('msg');
    params.delete('error');
    const nextSearch = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (nextSearch ? `?${nextSearch}` : '') + window.location.hash);

    if (tgStatus === 'success' && isAuthenticated) {
      notifications.show({ title: t('common.success'), message: t('auth.loginSuccess'), color: 'green' });
    } else if (tgStatus) {
      notifications.show({ title: t('common.error'), message: t('auth.telegramAuthError'), color: 'red' });
    }

    if (oauth2Status === 'success' && isAuthenticated) {
      notifications.show({ title: t('common.success'), message: t('auth.loginSuccess'), color: 'green' });
    } else if (oauth2Status && errorMsg && /not linked/i.test(errorMsg)) {
      notifications.show({ title: t('common.error'), message: t('auth.oauth2AccountExists'), color: 'orange', autoClose: 8000 });
    } else if (oauth2Status) {
      notifications.show({ title: t('common.error'), message: t('auth.oauth2AuthError'), color: 'red' });
    }
  }, [t, isLoading, isAuthenticated]);
}
