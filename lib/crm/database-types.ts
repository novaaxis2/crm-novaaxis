export type ServiceType = 'CV' | 'Loksewa form 2026' | 'Documentation' | 'Visa Prep' | 'Interview Coaching';
export type ProfileStatus = 'Ready' | 'Not ready' | 'In Progress';
export type PaymentStatus = 'Pending' | 'Done' | 'Cancelled';
export type AppliedStatus = 'Yes' | 'No';

export interface DatabaseRecord {
  id: number;
  serialNumber: number;
  name: string;
  email: string;
  address: string;
  contact: string;
  service: ServiceType;
  profileStatus: ProfileStatus;
  paymentStatus: PaymentStatus;
  applied: AppliedStatus;
  joinedDate: string;
}
