import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { userEmailApi } from '../api/client';
import { config } from '../config';
import { useStore } from '../store/useStore';


const RESEND_STORAGE_KEY = 'email_verify_last_sent';
const RESEND_COOLDOWN_MS = 3 * 60 * 1000;

export function useEmailRequired() {
  const { user, userEmail, isEmailLoaded, setUserEmail, setUserEmailVerified, setIsEmailLoaded, openVerifyModal, setOpenVerifyModal, openEmailModal, setOpenEmailModal } = useStore();
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySending, setVerifySending] = useState(false);
  const [verifyConfirming, setVerifyConfirming] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!user || isEmailLoaded) return;
    userEmailApi.getEmail()
      .then((resp) => {
        const emailData = resp.data.data;
        const emailObj = Array.isArray(emailData) ? emailData[0] : emailData;
        const email = emailObj?.email || null;
        setUserEmail(email);
        setUserEmailVerified(emailObj?.email_verified ?? 0);
        if (config.EMAIL_REQUIRED === 'true' && !email) {
          setEmailInput('');
          setModalOpen(true);
        }
      })
      .catch(() => {
        setUserEmail(null);
      })
      .finally(() => {
        setIsEmailLoaded(true);
      });
  }, [user, isEmailLoaded]);

  useEffect(() => {
    if (!verifyModalOpen) return;
    const update = () => {
      const lastSent = localStorage.getItem(RESEND_STORAGE_KEY);
      if (lastSent) {
        const remaining = Math.max(0, RESEND_COOLDOWN_MS - (Date.now() - parseInt(lastSent, 10)));
        setResendCooldown(Math.ceil(remaining / 1000));
      } else {
        setResendCooldown(0);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [verifyModalOpen]);

  const sendVerifyCode = async (email: string) => {
    setVerifySending(true);
    try {
      const response = await userEmailApi.sendVerifyCode(email);
      const data = response.data?.data;
      if (Array.isArray(data) && data[0]?.msg && data[0].msg !== 'Verification code sent') {
        notifications.show({ title: t('common.error'), message: data[0].msg, color: 'red' });
        return;
      }
      localStorage.setItem(RESEND_STORAGE_KEY, Date.now().toString());
      setPendingEmail(email);
      setVerifyCode('');
      setVerifyModalOpen(true);
      notifications.show({ title: t('common.success'), message: t('profile.verifyCodeSent'), color: 'green' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('profile.verifyCodeError'), color: 'red' });
    } finally {
      setVerifySending(false);
    }
  };

  useEffect(() => {
    if (!openVerifyModal || !userEmail) return;
    setOpenVerifyModal(false);
    const lastSent = localStorage.getItem(RESEND_STORAGE_KEY);
    const cooldownRemaining = lastSent
      ? Math.max(0, RESEND_COOLDOWN_MS - (Date.now() - parseInt(lastSent, 10)))
      : 0;
    if (cooldownRemaining > 0) {
      setPendingEmail(userEmail);
      setVerifyCode('');
      setVerifyModalOpen(true);
    } else {
      sendVerifyCode(userEmail);
    }
  }, [openVerifyModal, userEmail]);

  useEffect(() => {
    if (!openEmailModal) return;
    setOpenEmailModal(false);
    setEmailInput('');
    setModalOpen(true);
  }, [openEmailModal]);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    const email = emailInput.trim();
    if (userEmail && email === userEmail) {
      notifications.show({
        title: t('common.error'),
        message: t('profile.isCurrentEmail'),
        color: 'red',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await userEmailApi.setEmail(email);
      const data = response.data?.data;
      if (Array.isArray(data) && data[0]?.msg && data[0].msg !== 'Successful') {
        const errorMap: Record<string, string> = {
          'is not email': t('profile.invalidEmail'),
          'Email mismatch. Use the email shown in your profile.': t('profile.emailMismatch'),
        };
        notifications.show({
          title: t('common.error'),
          message: errorMap[data[0].msg] || data[0].msg,
          color: 'red',
        });
        return;
      }
      setUserEmail(email);
      setModalOpen(false);
      notifications.show({
        title: t('common.success'),
        message: t('profile.emailSaved'),
        color: 'green',
      });
      if (config.EMAIL_VERIFY_REQUIRED === 'true') {
        await sendVerifyCode(email);
      }
    } catch {
      notifications.show({
        title: t('common.error'),
        message: t('profile.emailSaveError'),
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmEmail = async () => {
    if (!verifyCode.trim() || !pendingEmail) return;
    setVerifyConfirming(true);
    try {
      const response = await userEmailApi.confirmEmail(pendingEmail, verifyCode.trim());
      const data = response.data?.data;
      if (Array.isArray(data) && data[0]?.msg && data[0].msg !== 'Email verified successfully') {
        notifications.show({ title: t('common.error'), message: data[0].msg, color: 'red' });
        return;
      }
      setUserEmailVerified(1);
      setVerifyModalOpen(false);
      notifications.show({ title: t('common.success'), message: t('profile.emailVerifiedSuccess'), color: 'green' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('profile.emailVerifyError'), color: 'red' });
    } finally {
      setVerifyConfirming(false);
    }
  };

  return {
    modalOpen,
    setModalOpen,
    emailInput,
    setEmailInput,
    saving,
    handleSave,
    isValidEmail,
    verifyModalOpen,
    setVerifyModalOpen,
    verifyCode,
    setVerifyCode,
    verifySending,
    verifyConfirming,
    resendCooldown,
    pendingEmail,
    handleConfirmEmail,
    handleResendCode: () => pendingEmail && sendVerifyCode(pendingEmail),
  };
}
