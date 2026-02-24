export interface PasswordEntry {
  id: number;
  name: string;
  url: string;
  username: string;
  created_at: string;
}

export interface DecryptedEntry {
  id: number;
  name: string;
  url: string;
  username: string;
  password: string;
  note: string;
}
