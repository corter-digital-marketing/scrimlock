/**
 * Hand-maintained until a live Supabase project exists to generate from
 * (`supabase gen types typescript --linked > src/lib/supabase/database.types.ts`).
 * Only covers tables created so far (Phase 1: `ranks`, `heroes`) — extend this
 * as each phase's migration adds tables, or regenerate wholesale once linked.
 */
export type Database = {
  public: {
    Tables: {
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
