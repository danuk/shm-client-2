import { ActionIcon, Menu, useDirection } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'uz', label: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const RTL_LANGUAGES = ['ar'];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { toggleDirection, dir } = useDirection();

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
        <ActionIcon variant="default" size="lg" aria-label="Change language" title={`Current language: ${currentLang.label}`}>
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
