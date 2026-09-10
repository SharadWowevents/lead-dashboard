export interface LeadData {
  id: number;
  siteName: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  createdAt?: string;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AdminUser;
}

export interface LeadsApiResponse {
  success: boolean;
  count: number;
  filter: string | null;
  data: LeadData[];
}

export type SortKey = 'id' | 'siteName' | 'name' | 'email' | 'mobile' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}
