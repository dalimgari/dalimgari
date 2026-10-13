export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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
  description: string | null;
  url: string | null;
  content: string | null;
  media: Json | null;
  visibility: string;
  created_at: string | null;
};

type WidgetRow = {
  id: string;
  widget_type: string;
  title: string | null;
  is_visible: boolean;
  settings: Json | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  bio: string | null;
};

type SiteCustomizationRow = {
  key: string;
  value: Json | null;
  description: string | null;
  updated_at: string | null;
};

/**
 * Minimal definitions for columns referenced by the migration preview.
 * This is not a generated representation of the entire live schema.
 * Regenerate using the Supabase CLI before production cutover.
 */
export interface Database {
  public: {
    Tables: {
      albums: TableShape<AlbumRow>;
      post: TableShape<PublicContentRow>;
      pages: TableShape<PublicContentRow>;
      hero_items: TableShape<PublicContentRow>;
      site_customizations: TableShape<SiteCustomizationRow>;
      profiles: TableShape<ProfileRow>;
      widgets: TableShape<WidgetRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
