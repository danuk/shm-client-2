import { ActionIcon, Menu, useDirection } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { config } from '../config';
import { BUILT_IN_LANGS, CUSTOM_LANGS } from '../i18n';

const RTL_LANGUAGES = ['ar'];

function countLeafKeys(obj: unknown): number {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return 1;
  return Object.values(obj as Record<string, unknown>).reduce<number>(
    (sum, v) => sum + countLeafKeys(v),
    0,
  );
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { toggleDirection, dir } = useDirection();

  if (config.SINGLE_LANGUAGE === 'true') return null;

  const refKeyCount = countLeafKeys(i18n.getResourceBundle('en', 'translation'));

  const builtInLanguages = BUILT_IN_LANGS.map(code => {
    const cfg = i18n.getResource(code, 'translation', 'config') as
      | { code: string; label: string; flag: string }
      | undefined;
    return cfg?.label && cfg?.flag ? { code, label: cfg.label, flag: cfg.flag } : null;
  }).filter(Boolean) as { code: string; label: string; flag: string }[];

  const customLanguages = CUSTOM_LANGS.map(code => {
    const cfg = i18n.getResource(code, 'translation', 'config') as
      | { code: string; label: string; flag: string }
      | undefined;
    if (!cfg?.label || !cfg?.flag) return null;

    const keyCount = countLeafKeys(i18n.getResourceBundle(code, 'translation'));
    const completeness = refKeyCount > 0 ? keyCount / refKeyCount : 0;
    if (completeness < 0.5) {
      console.warn(`[i18n] Custom language "${code}" is only ${Math.round(completeness * 100)}% complete (${keyCount}/${refKeyCount} keys), skipping.`);
      return null;
    }

    return { code, label: cfg.label, flag: cfg.flag };
  }).filter(Boolean) as { code: string; label: string; flag: string }[];

  const languages = [...builtInLanguages, ...customLanguages];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    const shouldBeRtl = RTL_LANGUAGES.includes(code);
    if (shouldBeRtl && dir === 'ltr') toggleDirection();
    if (!shouldBeRtl && dir === 'rtl') toggleDirection();
  };

  return (
    <Menu shadow="md" width={150}>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label="Change language" title={`Current language: ${currentLang?.label}`}>
          <IconLanguage size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {languages.map((lang) => (
          <Menu.Item
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            style={{
              fontWeight: i18n.language === lang.code ? 600 : 400,
              backgroundColor: i18n.language === lang.code ? 'var(--mantine-color-blue-light)' : undefined,
            }}
          >
            {lang.flag} {lang.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
