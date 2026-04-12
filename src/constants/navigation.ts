import { IconUser, IconServer, IconCreditCard, IconReceipt, IconGift } from '@tabler/icons-react';

export const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.services', icon: IconServer },
  { path: '/profile', labelKey: 'profile.title', icon: IconUser },
  { path: '/payments', labelKey: 'nav.payments', icon: IconCreditCard },
  { path: '/withdrawals', labelKey: 'nav.withdrawals', icon: IconReceipt },
  { path: '/bonuses', labelKey: 'nav.bonuses', icon: IconGift },
] as const;
