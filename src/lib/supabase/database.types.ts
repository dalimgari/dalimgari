export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          cover_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          description_en: string | null
          id: string
          media: Json
          title: string
          title_bn: string | null
          title_en: string | null
          updated_at: string
          url: string
          visibility: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url: string
          visibility?: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title?: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url?: string
          visibility?: string
        }
        Relationships: []
      }
      edge_function_secrets: {
        Row: {
          created_at: string
          name: string
          secret_value: string
        }
        Insert: {
          created_at?: string
          name: string
          secret_value: string
        }
        Update: {
          created_at?: string
          name?: string
          secret_value?: string
        }
        Relationships: []
      }
      hero_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          description_en: string | null
          id: string
          media: Json
          title: string
          title_bn: string | null
          title_en: string | null
          updated_at: string
          url: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title?: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url?: string | null
          visibility?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          alt_text_bn: string | null
          alt_text_en: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          description_en: string | null
          id: string
          mime_type: string | null
          original_filename: string
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          tags: string[]
          tags_bn: string[]
          tags_en: string[]
          title: string
          title_bn: string | null
          title_en: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          alt_text_bn?: string | null
          alt_text_en?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          mime_type?: string | null
          original_filename: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          tags?: string[]
          tags_bn?: string[]
          tags_en?: string[]
          title: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          alt_text_bn?: string | null
          alt_text_en?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          mime_type?: string | null
          original_filename?: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          tags?: string[]
          tags_bn?: string[]
          tags_en?: string[]
          title?: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_links: {
        Row: {
          created_at: string
          id: string
          media_id: string
          sort_order: number
          source_id: string
          source_table: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          sort_order?: number
          source_id: string
          source_table: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          sort_order?: number
          source_id?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          album_id: string | null
          content: string
          content_bn: string | null
          content_en: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          description_en: string | null
          id: string
          media: Json
          title: string
          title_bn: string | null
          title_en: string | null
          updated_at: string
          url: string
          visibility: string
        }
        Insert: {
          album_id?: string | null
          content?: string
          content_bn?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url: string
          visibility?: string
        }
        Update: {
          album_id?: string | null
          content?: string
          content_bn?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title?: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      post: {
        Row: {
          album_id: string | null
          caption: string | null
          caption_bn: string | null
          caption_en: string | null
          content: string | null
          content_bn: string | null
          content_en: string | null
          created_at: string
          created_by: string | null
          custom_url: string | null
          description: string | null
          description_bn: string | null
          description_en: string | null
          id: string
          media: Json
          title: string
          title_bn: string | null
          title_en: string | null
          updated_at: string
          url: string
          visibility: string
        }
        Insert: {
          album_id?: string | null
          caption?: string | null
          caption_bn?: string | null
          caption_en?: string | null
          content?: string | null
          content_bn?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          custom_url?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url: string
          visibility?: string
        }
        Update: {
          album_id?: string | null
          caption?: string | null
          caption_bn?: string | null
          caption_en?: string | null
          content?: string | null
          content_bn?: string | null
          content_en?: string | null
          created_at?: string
          created_by?: string | null
          custom_url?: string | null
          description?: string | null
          description_bn?: string | null
          description_en?: string | null
          id?: string
          media?: Json
          title?: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          url?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bio_bn: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          full_name_bn: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bio_bn?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          full_name_bn?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bio_bn?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          full_name_bn?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recycle_bin: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          id: string
          original_id: string
          original_table: string
          purge_after: string
          record_data: Json
          related_data: Json
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          original_id: string
          original_table: string
          purge_after?: string
          record_data: Json
          related_data?: Json
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          original_id?: string
          original_table?: string
          purge_after?: string
          record_data?: Json
          related_data?: Json
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_customizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string | null
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          settings: Json
          title: string
          title_bn: string | null
          title_en: string | null
          updated_at: string
          updated_by: string | null
          widget_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          settings?: Json
          title: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          widget_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          settings?: Json
          title?: string
          title_bn?: string | null
          title_en?: string | null
          updated_at?: string
          updated_by?: string | null
          widget_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_registered_users: {
        Args: never
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      get_my_permissions: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
