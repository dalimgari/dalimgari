export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableShape<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type AlbumRow = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  cover_path: string | null;
  media: Json | null;
  visibility: string;
  created_at: string | null;
};

type PublicContentRow = {
  id: string;
  title: string;
  media: Json | null;
  visibility: string;
  created_at: string | null;
};

/**
 * Minimal definitions for columns verified in the existing frontend queries.
 * Regenerate with Supabase CLI from the live schema before expanding mutations
 * or relying on additional columns/relationships.
 */
export interface Database {
  public: {
    Tables: {
      albums: TableShape<AlbumRow>;
      post: TableShape<PublicContentRow>;
      pages: TableShape<PublicContentRow>;
      hero_items: TableShape<PublicContentRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
