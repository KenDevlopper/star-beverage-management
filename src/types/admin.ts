
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Array of permission IDs
  isSystem: boolean;
  createdAt: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  value?: string | number | boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed: string;
  createdAt: string;
  expiresAt: string;
}
