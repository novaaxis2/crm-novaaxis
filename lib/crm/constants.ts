import { GatewayCard, ServiceCatalogItem, ServiceType } from '@/lib/crm/types';

export const SERVICE_LABELS: Record<ServiceType, string> = {
  visa_form: 'Visa Form Filling',
  online_registration: 'Online Registration',
  documentation_support: 'Documentation Support',
  embassy_appointment: 'Embassy Appointment',
  general_form: 'General Form Service',
};

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'visa_form',
    label: 'Visa Form Filling',
    basePrice: 4500,
    description: 'Complete visa application preparation and submission support.',
  },
  {
    id: 'online_registration',
    label: 'Online Registration',
    basePrice: 2500,
    description: 'Admission, exam, and portal registration with accurate data entry.',
  },
  {
    id: 'documentation_support',
    label: 'Documentation Support',
    basePrice: 3000,
    description: 'Document checklist review, formatting, and readiness checks.',
  },
  {
    id: 'embassy_appointment',
    label: 'Embassy Appointment',
    basePrice: 5200,
    description: 'Booking assistance with scheduling and required form guidance.',
  },
  {
    id: 'general_form',
    label: 'General Form Service',
    basePrice: 1800,
    description: 'General digital form completion service for local and international needs.',
  },
];

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Unpaid',
  half_paid: 'Half Paid',
  fully_paid: 'Fully Paid',
} as const;

export const WORK_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
} as const;

export const NEPAL_GATEWAYS: GatewayCard[] = [
  {
    id: 'esewa',
    name: 'eSewa',
    accent: '#60BB46',
    description: 'Most widely used wallet for everyday online transactions in Nepal.',
    settlement: 'T+1 settlement',
    charges: 'Estimated 2.5% + VAT',
  },
  {
    id: 'khalti',
    name: 'Khalti',
    accent: '#5C2D91',
    description: 'Fast API-friendly wallet payment experience for modern web flows.',
    settlement: 'T+1 settlement',
    charges: 'Estimated 2.0% + VAT',
  },
  {
    id: 'fonepay',
    name: 'Fonepay',
    accent: '#00ADEF',
    description: 'Connects with bank accounts and mobile banking apps for QR checkout.',
    settlement: 'T+2 settlement',
    charges: 'Estimated 1.8% + VAT',
  },
];

export const CURRENCY_FORMATTER = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
});

export const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-NP', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const DATE_FORMATTER = new Intl.DateTimeFormat('en-NP', {
  dateStyle: 'medium',
});

