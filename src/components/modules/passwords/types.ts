export interface PasswordEntry {
  id: number;
  name: string;
  url: string;
  username: string;
  createdAt: string;
}

export interface DecryptedEntry {
  id: number;
  name: string;
  url: string;
  username: string;
  password: string;
  note: string;
}

export interface PasswordAuditEntry {
  id: number;
  name: string;
  username: string;
  url: string;
  isWeak: boolean;
  isReused: boolean;
  isOld: boolean;
  daysSinceUpdate: number;
  weaknessReasons: string[];
}

export interface VaultAuditReport {
  healthScore: number;
  totalCount: number;
  weakCount: number;
  reusedCount: number;
  oldCount: number;
  entries: PasswordAuditEntry[];
}
