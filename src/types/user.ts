export type UserRole = 'admin' | 'staff' | 'user';
export type AccountStatus = 'active' | 'disabled' | 'suspended';

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
}

export interface UserProfile {
  id?: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  role?: UserRole;
  status?: AccountStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionRecord {
  id?: string;
  userId: string;
  planId: string;
  status: string;
  provider: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt?: string;
  updatedAt?: string;
}
