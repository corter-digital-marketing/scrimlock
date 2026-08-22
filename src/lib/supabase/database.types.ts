/**
 * Hand-maintained until a live Supabase project exists to generate from
 * (`supabase gen types typescript --linked > src/lib/supabase/database.types.ts`).
 * Only covers tables created so far (Phase 1: `ranks`, `heroes`; Phase 2:
 * `profiles`; Phase 3: `teams`, `team_members`; Phase 5: `scrims`,
 * `scrim_responses`; Phase 6: `tournaments`, `tournament_registrations`)
 * — extend this as each phase's migration adds tables, or regenerate
 * wholesale once linked.
 */
export type TeamRole = "owner" | "captain" | "player" | "sub";
export type TeamMemberStatus = "pending" | "active";
export type ScrimStatus = "open" | "matched" | "cancelled";
export type ScrimResponseStatus = "pending" | "accepted" | "declined";
export type TournamentEntryType = "solo" | "team";
export type TournamentStatus = "draft" | "open" | "closed" | "in_progress" | "completed";
export type RegistrationStatus = "pending" | "confirmed" | "withdrawn";

export type Database = {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string;
          title: string;
          organizer_id: string;
          description: string;
          format: string | null;
          region: string;
          prize_pool: string | null;
          entry_type: TournamentEntryType;
          max_participants: number;
          min_rank_id: number | null;
          max_rank_id: number | null;
          starts_at: string;
          registration_closes_at: string;
          status: TournamentStatus;
          banner_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          organizer_id: string;
          description?: string;
          format?: string | null;
          region: string;
          prize_pool?: string | null;
          entry_type?: TournamentEntryType;
          max_participants: number;
          min_rank_id?: number | null;
          max_rank_id?: number | null;
          starts_at: string;
          registration_closes_at: string;
          status?: TournamentStatus;
          banner_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          organizer_id?: string;
          description?: string;
          format?: string | null;
          region?: string;
          prize_pool?: string | null;
          entry_type?: TournamentEntryType;
          max_participants?: number;
          min_rank_id?: number | null;
          max_rank_id?: number | null;
          starts_at?: string;
          registration_closes_at?: string;
          status?: TournamentStatus;
          banner_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tournament_registrations: {
        Row: {
          id: string;
          tournament_id: string;
          user_id: string | null;
          team_id: string | null;
          status: RegistrationStatus;
          registered_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          user_id?: string | null;
          team_id?: string | null;
          status?: RegistrationStatus;
          registered_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          user_id?: string | null;
          team_id?: string | null;
          status?: RegistrationStatus;
          registered_at?: string;
        };
        Relationships: [];
      };
      scrims: {
        Row: {
          id: string;
          posted_by: string;
          team_id: string | null;
          region: string;
          min_rank_id: number | null;
          max_rank_id: number | null;
          scheduled_for: string;
          notes: string | null;
          status: ScrimStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          posted_by: string;
          team_id?: string | null;
          region: string;
          min_rank_id?: number | null;
          max_rank_id?: number | null;
          scheduled_for: string;
          notes?: string | null;
          status?: ScrimStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          posted_by?: string;
          team_id?: string | null;
          region?: string;
          min_rank_id?: number | null;
          max_rank_id?: number | null;
          scheduled_for?: string;
          notes?: string | null;
          status?: ScrimStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      scrim_responses: {
        Row: {
          id: string;
          scrim_id: string;
          responder_id: string;
          team_id: string | null;
          message: string | null;
          status: ScrimResponseStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          scrim_id: string;
          responder_id: string;
          team_id?: string | null;
          message?: string | null;
          status?: ScrimResponseStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          scrim_id?: string;
          responder_id?: string;
          team_id?: string | null;
          message?: string | null;
          status?: ScrimResponseStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          tag: string;
          region: string | null;
          logo_url: string | null;
          description: string | null;
          owner_id: string;
          is_recruiting: boolean;
          recruiting_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tag: string;
          region?: string | null;
          logo_url?: string | null;
          description?: string | null;
          owner_id: string;
          is_recruiting?: boolean;
          recruiting_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tag?: string;
          region?: string | null;
          logo_url?: string | null;
          description?: string | null;
          owner_id?: string;
          is_recruiting?: boolean;
          recruiting_note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role_on_team: TeamRole;
          status: TeamMemberStatus;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role_on_team?: TeamRole;
          status?: TeamMemberStatus;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role_on_team?: TeamRole;
          status?: TeamMemberStatus;
          joined_at?: string;
        };
        Relationships: [];
      };
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
