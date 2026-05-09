export interface Note {
  id: number;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  pinned: boolean;
  path?: string;
  color?: string;
}

export interface FileSystemItem {
  name: string;
  isDir: boolean;
  path: string;
  note?: Note;
}
