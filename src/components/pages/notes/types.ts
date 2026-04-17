export interface Note {
  id: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  pinned: boolean;
  path?: string;
}

export interface FileSystemItem {
  name: string;
  is_dir: boolean;
  path: string;
  note?: Note;
}
