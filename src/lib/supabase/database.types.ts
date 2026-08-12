/**
 * Hand-maintained until a live Supabase project exists to generate from
 * (`supabase gen types typescript --linked > src/lib/supabase/database.types.ts`).
 * Only covers tables created so far (Phase 1: `ranks`, `heroes`; Phase 2:
 * `profiles`) — extend this as each phase's migration adds tables, or
 * regenerate wholesale once linked.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          discord_handle: string | null;
          region: string | null;
          timezone: string | null;
          rank_id: number | null;
          rank_subrank: number | null;
          preferred_heroes: string[];
          playstyle_note: string | null;
          is_lft: boolean;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          discord_handle?: string | null;
          region?: string | null;
          timezone?: string | null;
          rank_id?: number | null;
          rank_subrank?: number | null;
          preferred_heroes?: string[];
          playstyle_note?: string | null;
          is_lft?: boolean;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          discord_handle?: string | null;
          region?: string | null;
          timezone?: string | null;
          rank_id?: number | null;
          rank_subrank?: number | null;
          preferred_heroes?: string[];
          playstyle_note?: string | null;
          is_lft?: boolean;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ranks: {
        Row: {
          id: number;
          name: string;
          is_placement: boolean;
        };
        Insert: {
          id: number;
          name: string;
          is_placement?: boolean;
        };
        Update: {
          id?: number;
          name?: string;
          is_placement?: boolean;
        };
        Relationships: [];
      };
      heroes: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
