/**
 * Hand-maintained until a live Supabase project exists to generate from
 * (`supabase gen types typescript --linked > src/lib/supabase/database.types.ts`).
 * Only covers tables created so far (Phase 1: `ranks`, `heroes`; Phase 2:
 * `profiles`; Phase 3: `teams`, `team_members`; Phase 5: `scrims`,
 * `scrim_responses`; Phase 6: `tournaments`, `tournament_registrations`;
 * ScrimLock: `friendships`, `conversations`, `messages`, `pug_parties`,
 * `pug_party_members`, `pug_matches`, `pug_match_players`,
 * `pug_match_votes`, `pug_queue_entries`) — extend this as each
 * migration adds tables, or regenerate wholesale once linked.
 */
export type TeamRole = "owner" | "captain" | "player" | "sub";
export type TeamMemberStatus = "pending" | "invited" | "active";
export type ScrimStatus = "open" | "matched" | "cancelled";
export type ScrimResponseStatus = "pending" | "accepted" | "declined";
export type TournamentEntryType = "solo" | "team";
export type TournamentStatus = "draft" | "open" | "closed" | "in_progress" | "completed";
export type RegistrationStatus = "pending" | "confirmed" | "withdrawn";
export type FriendshipStatus = "pending" | "accepted";
export type PugPartyMemberStatus = "invited" | "active";
export type PugMatchStatus = "lobby_pending" | "in_progress" | "completed" | "cancelled";
export type PugQueueStatus = "queued" | "matched";

export type Database = {
  public: {
    Tables: {
      pug_parties: {
        Row: {
          id: string;
          leader_id: string;
          region: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          leader_id: string;
          region: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          leader_id?: string;
          region?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      pug_party_members: {
        Row: {
          id: string;
          party_id: string;
          user_id: string;
          status: PugPartyMemberStatus;
          joined_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          user_id: string;
          status?: PugPartyMemberStatus;
          joined_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          user_id?: string;
          status?: PugPartyMemberStatus;
          joined_at?: string;
        };
        Relationships: [];
      };
      pug_matches: {
        Row: {
          id: string;
          region: string;
          status: PugMatchStatus;
          lobby_maker_id: string;
          lobby_code: string | null;
          lobby_opened_at: string | null;
          winning_team: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          region: string;
          status?: PugMatchStatus;
          lobby_maker_id: string;
          lobby_code?: string | null;
          lobby_opened_at?: string | null;
          winning_team?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          region?: string;
          status?: PugMatchStatus;
          lobby_maker_id?: string;
          lobby_code?: string | null;
          lobby_opened_at?: string | null;
          winning_team?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      pug_match_players: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          team: number;
          elo_before: number;
          elo_after: number | null;
          checked_in_at: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id: string;
          team: number;
          elo_before: number;
          elo_after?: number | null;
          checked_in_at?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          user_id?: string;
          team?: number;
          elo_before?: number;
          elo_after?: number | null;
          checked_in_at?: string | null;
        };
        Relationships: [];
      };
      pug_match_messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      pug_match_votes: {
        Row: {
          id: string;
          match_id: string;
          voter_id: string;
          voted_team: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          voter_id: string;
          voted_team: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          voter_id?: string;
          voted_team?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      pug_queue_entries: {
        Row: {
          id: string;
          region: string;
          leader_id: string;
          party_id: string | null;
          user_ids: string[];
          size: number;
          elo: number;
          status: PugQueueStatus;
          matched_into: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          region: string;
          leader_id: string;
          party_id?: string | null;
          user_ids: string[];
          size: number;
          elo: number;
          status?: PugQueueStatus;
          matched_into?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          region?: string;
          leader_id?: string;
          party_id?: string | null;
          user_ids?: string[];
          size?: number;
          elo?: number;
          status?: PugQueueStatus;
          matched_into?: string | null;
          joined_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a_id?: string;
          user_b_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: FriendshipStatus;
          created_at?: string;
        };
        Relationships: [];
      };
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
          youtube_url: string | null;
          twitch_url: string | null;
          statlocker_url: string | null;
          x_url: string | null;
          instagram_url: string | null;
          region: string | null;
          timezone: string | null;
          rank_id: number | null;
          rank_subrank: number | null;
          preferred_heroes: string[];
          playstyle_note: string | null;
          is_lft: boolean;
          is_admin: boolean;
          pug_elo: number;
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
          youtube_url?: string | null;
          twitch_url?: string | null;
          statlocker_url?: string | null;
          x_url?: string | null;
          instagram_url?: string | null;
          region?: string | null;
          timezone?: string | null;
          rank_id?: number | null;
          rank_subrank?: number | null;
          preferred_heroes?: string[];
          playstyle_note?: string | null;
          is_lft?: boolean;
          is_admin?: boolean;
          pug_elo?: number;
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
          youtube_url?: string | null;
          twitch_url?: string | null;
          statlocker_url?: string | null;
          x_url?: string | null;
          instagram_url?: string | null;
          region?: string | null;
          timezone?: string | null;
          rank_id?: number | null;
          rank_subrank?: number | null;
          preferred_heroes?: string[];
          playstyle_note?: string | null;
          is_lft?: boolean;
          is_admin?: boolean;
          pug_elo?: number;
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
