import {
  BarChart3,
  LayoutDashboard,
  Settings2,
  Users2,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  hidden?: boolean;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Daily command center',
  },
  {
    href: '/dashboard/clients',
    label: 'Clients',
    icon: Users2,
    description: 'Profiles and workflow details',
    hidden: true,
  },
  {
    href: '/dashboard/database',
    label: 'Database',
    icon: Users2,
    description: 'Profiles, files, and statuses',
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Revenue and operations',
  },
  {
    href: '/dashboard/payments',
    label: 'Payments',
    icon: WalletCards,
    description: 'Nepal gateway preview',
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings2,
    description: 'Business configuration',
  },
];

export const dashboardVisibleNavItems = dashboardNavItems.filter((item) => !item.hidden);

export function isDashboardItemActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function resolveCurrentDashboardPage(pathname: string) {
  return [...dashboardNavItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isDashboardItemActive(pathname, item.href));
}
