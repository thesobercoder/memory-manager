export interface OpenMemoryItem {
  id: string;
  content: string;
  created_at: number;
  state: string;
  app_id: string;
  app_name: string;
  categories: string[];
  metadata_: Record<string, unknown>;
}

export interface OpenMemoryFilterResponse {
  items: OpenMemoryItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface OpenMemoryFilterRequest {
  page?: number;
  size?: number;
  sort_column?: string;
  sort_direction?: "asc" | "desc";
}
