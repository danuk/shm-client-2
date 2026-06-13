import { useState } from 'react';
import { Group, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { config } from '../config';
import DocumentModal from './DocumentModal';

function isPdf(value: string) {
  return value.toLowerCase().endsWith('.pdf');
}

export function LegalLinks() {
  const { t } = useTranslation();
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');

  const legalLinks = [
    { href: config.PRIVACY_POLICY_URL, label: t('common.privacyPolicy') },
    { href: config.RETURN_POLICY_URL, label: t('common.returnPolicy') },
    { href: config.TERMS_OF_USE_URL, label: t('common.termsOfUse') },
    { href: config.PUBLIC_OFFER_URL, label: t('common.publicOffer') },
    { href: config.USER_AGREEMENT_URL, label: t('common.userAgreement') },
  ].filter((link) => Boolean(link.href));

  const contactLinks = [
    config.CONTACT_EMAIL ? { href: `mailto:${config.CONTACT_EMAIL}`, label: config.CONTACT_EMAIL } : null,
    config.CONTACT_PHONE ? { href: `tel:${config.CONTACT_PHONE}`, label: config.CONTACT_PHONE } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  const hasContacts = contactLinks.length > 0;
  const hasLegal = legalLinks.length > 0;

  if (!hasLegal && !hasContacts) return null;

  return (
    <>
      <DocumentModal
        opened={!!docUrl}
        onClose={() => setDocUrl(null)}
        url={docUrl || ''}
        title={docTitle}
      />
      <Stack gap={0}>
        {hasLegal && (
          <Group justify="center" gap="md" wrap="wrap" py="sm">
            {legalLinks.map((link) =>
              isPdf(link.href) ? (
                <Text
                  key={link.href}
                  component="a"
                  href={link.href}
                  size="xs"
                  c="dimmed"
                  td="underline"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setDocTitle(link.label);
                    setDocUrl(link.href);
                  }}
                >
                  {link.label}
                </Text>
              ) : (
                <Text
                  key={link.href}
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  c="dimmed"
                  td="underline"
                >
                  {link.label}
                </Text>
              )
            )}
          </Group>
        )}
        {hasContacts && (
          <Group justify="center" gap="md" wrap="wrap" py="xs">
            <Text size="xs" c="dimmed">{t('common.contacts')}:</Text>
            {contactLinks.map((link) => (
              <Text
                key={link.href}
                component="a"
                href={link.href}
                size="xs"
                c="dimmed"
                td="underline"
              >
                {link.label}
              </Text>
            ))}
          </Group>
        )}
      </Stack>
    </>
  );
}
