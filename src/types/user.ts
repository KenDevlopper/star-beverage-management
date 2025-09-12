
export interface User {
  id: string | number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'agents_vente' | 'agents_stock';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  last_login?: string;
  created_at?: string;
}

export interface UserSettings {
  theme_mode?: 'light' | 'dark';
  language?: string;
  notifications_enabled?: boolean;
  [key: string]: any;
}

export interface SystemSettings {
  company: {
    company_name: string;
    company_email: string;
    company_phone: string;
    company_address: string;
    company_logo: string;
  };
  appearance: {
    theme_primary_color: string;
    theme_mode: 'light' | 'dark';
  };
  general: {
    language: string;
  };
  security: {
    session_timeout: string;
    max_login_attempts: string;
  };
  [key: string]: any;
}
