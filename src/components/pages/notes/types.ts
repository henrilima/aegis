export interface Note {
  id?: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;

  status: string;
  pinned: boolean;
}
