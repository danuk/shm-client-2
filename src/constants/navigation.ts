import { IconUser, IconServer, IconCreditCard, IconReceipt } from '@tabler/icons-react';

export const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.services', icon: IconServer },
  // { path: '/tickets', labelKey: 'nav.tickets', icon: IconMessages },
  { path: '/profile', labelKey: 'profile.title', icon: IconUser },
  { path: '/payments', labelKey: 'nav.payments', icon: IconCreditCard },
  { path: '/withdrawals', labelKey: 'nav.withdrawals', icon: IconReceipt },
] as const;
