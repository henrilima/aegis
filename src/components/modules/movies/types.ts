export type MovieStatus = "Watched" | "WantToWatch" | "Dropped";

export interface Movie {
  id?: number;
  userId: string;
  title: string;
  director?: string;
  year?: number;
  status: MovieStatus;
  review?: string;
  stars: number;
  thumbnail?: string;
  category: string;
  createdAt?: string;
  isFavorite?: boolean;
}

export type MovieTabId = "all" | "wishlist" | "library" | "favorites";
