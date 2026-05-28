import { Modal } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';

interface DocumentModalProps {
  opened: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export default function DocumentModal({ opened, onClose, url, title }: DocumentModalProps) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 992px)');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title || t('common.document')}
      size={isDesktop ? '90%' : 'xl'}
      styles={{
        body: { padding: 0, height: '80vh', display: 'flex', flexDirection: 'column' },
      }}
    >
      <iframe
        src={url}
        style={{ width: '100%', flex: 1, border: 'none', display: 'block' }}
        title={title || t('common.document')}
      />
    </Modal>
  );
}
