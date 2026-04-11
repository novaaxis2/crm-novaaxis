export type WorkStatus = 'pending' | 'completed';

export type PaymentStatus = 'unpaid' | 'half_paid' | 'fully_paid';

export type ClientSource = 'whatsapp' | 'website_chat' | 'referral';

export type ServiceType =
  | 'visa_form'
  | 'online_registration'
  | 'documentation_support'
  | 'embassy_appointment'
  | 'general_form';

export type AssetKind = 'image' | 'document';

export interface ClientAsset {
  id: string;
  clientId: string;
  name: string;
  size: number;
  mimeType: string;
  kind: AssetKind;
  previewUrl: string;
  uploadedAt: string;
}

export interface TimelineEntry {
  id: string;
  clientId: string;
  title: string;
  description: string;
  timestamp: string;
  tone: 'info' | 'success' | 'warning';
}

export interface ServiceRecord {
  type: ServiceType;
  fee: number;
  workStatus: WorkStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  startedAt: string;
  completedAt?: string;
}

export interface CrmClient {
  id: string;
  name: string;
  gmail: string;
  contactNumber: string;
  source: ClientSource;
  notes: string;
  createdAt: string;
  lastUpdatedAt: string;
  service: ServiceRecord;
  assets: ClientAsset[];
  timeline: TimelineEntry[];
}

export interface IntakeFormValues {
  name: string;
  gmail: string;
  contactNumber: string;
}

export interface UploadAssetInput {
  name: string;
  size: number;
  mimeType: string;
  kind: AssetKind;
  previewUrl: string;
}

export interface ServiceCatalogItem {
  id: ServiceType;
  label: string;
  basePrice: number;
  description: string;
}

export interface GatewayCard {
  id: 'esewa' | 'khalti' | 'fonepay';
  name: string;
  accent: string;
  description: string;
  settlement: string;
  charges: string;
}

export interface PaymentBreakdownItem {
  status: PaymentStatus;
  label: string;
  count: number;
}

export interface ServiceDistributionItem {
  serviceType: ServiceType;
  label: string;
  count: number;
  revenue: number;
}

export interface MonthlyEarningPoint {
  monthKey: string;
  monthLabel: string;
  expected: number;
  collected: number;
}

export interface DashboardMetrics {
  totalClients: number;
  pendingJobs: number;
  completedJobs: number;
  totalExpectedRevenue: number;
  totalCollectedRevenue: number;
  completionRate: number;
  collectionRate: number;
  paymentBreakdown: PaymentBreakdownItem[];
  serviceDistribution: ServiceDistributionItem[];
  monthlyEarnings: MonthlyEarningPoint[];
  recentActivities: TimelineEntry[];
}
