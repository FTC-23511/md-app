export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      award_criteria_snapshot: {
        Row: {
          award_name: string;
          created_at: string;
          criterion_label: string;
          criterion_text: string;
          deleted_at: string | null;
          id: string;
          season_year: number;
          updated_at: string;
        };
        Insert: {
          award_name: string;
          created_at?: string;
          criterion_label: string;
          criterion_text: string;
          deleted_at?: string | null;
          id?: string;
          season_year: number;
          updated_at?: string;
        };
        Update: {
          award_name?: string;
          created_at?: string;
          criterion_label?: string;
          criterion_text?: string;
          deleted_at?: string | null;
          id?: string;
          season_year?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      classification_index: {
        Row: {
          award_name: string;
          classified_at: string;
          classifier_member_id: string | null;
          confidence: string;
          created_at: string;
          criterion: string;
          deleted_at: string | null;
          entry_id: string;
          entry_type: string;
          id: string;
          prompt_version: string | null;
          rationale: string | null;
          updated_at: string;
        };
        Insert: {
          award_name: string;
          classified_at?: string;
          classifier_member_id?: string | null;
          confidence: string;
          created_at?: string;
          criterion: string;
          deleted_at?: string | null;
          entry_id: string;
          entry_type: string;
          id?: string;
          prompt_version?: string | null;
          rationale?: string | null;
          updated_at?: string;
        };
        Update: {
          award_name?: string;
          classified_at?: string;
          classifier_member_id?: string | null;
          confidence?: string;
          created_at?: string;
          criterion?: string;
          deleted_at?: string | null;
          entry_id?: string;
          entry_type?: string;
          id?: string;
          prompt_version?: string | null;
          rationale?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'classification_index_classifier_member_id_fkey';
            columns: ['classifier_member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
        ];
      };
      comp_recaps: {
        Row: {
          auto_reliability_pct: number | null;
          comp_end_date: string | null;
          comp_start_date: string;
          competition_name: string;
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          entry_state: string;
          extras: Json;
          id: string;
          outcome: string | null;
          updated_at: string;
        };
        Insert: {
          auto_reliability_pct?: number | null;
          comp_end_date?: string | null;
          comp_start_date: string;
          competition_name: string;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          outcome?: string | null;
          updated_at?: string;
        };
        Update: {
          auto_reliability_pct?: number | null;
          comp_end_date?: string | null;
          comp_start_date?: string;
          competition_name?: string;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          outcome?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_logs: {
        Row: {
          contact_date: string;
          contact_id: string;
          contact_method: string | null;
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          entry_state: string;
          extras: Json;
          id: string;
          updated_at: string;
        };
        Insert: {
          contact_date: string;
          contact_id: string;
          contact_method?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          updated_at?: string;
        };
        Update: {
          contact_date?: string;
          contact_id?: string;
          contact_method?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_logs_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      contacts: {
        Row: {
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          display_name: string;
          entry_state: string;
          extras: Json;
          id: string;
          relationship_status_option_id: string | null;
          relationship_type_option_id: string | null;
          role_org: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          display_name: string;
          entry_state?: string;
          extras?: Json;
          id?: string;
          relationship_status_option_id?: string | null;
          relationship_type_option_id?: string | null;
          role_org?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          display_name?: string;
          entry_state?: string;
          extras?: Json;
          id?: string;
          relationship_status_option_id?: string | null;
          relationship_type_option_id?: string | null;
          role_org?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_relationship_status_option_id_fkey';
            columns: ['relationship_status_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_relationship_type_option_id_fkey';
            columns: ['relationship_type_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      decision_logs: {
        Row: {
          created_at: string;
          created_by: string | null;
          created_via: string;
          decision_date: string;
          deleted_at: string | null;
          entry_state: string;
          extras: Json;
          id: string;
          parent_entry_id: string | null;
          parent_entry_type: string | null;
          subsystem_option_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          decision_date: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          parent_entry_id?: string | null;
          parent_entry_type?: string | null;
          subsystem_option_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          decision_date?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          parent_entry_id?: string | null;
          parent_entry_type?: string | null;
          subsystem_option_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'decision_logs_subsystem_option_id_fkey';
            columns: ['subsystem_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      flags: {
        Row: {
          closed_at: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          opened_at: string;
          owner_member_id: string | null;
          parent_entry_id: string;
          parent_entry_type: string;
          resolved_entry_id: string | null;
          status: string;
          subject: string;
          target_entry_type: string;
          updated_at: string;
        };
        Insert: {
          closed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          opened_at?: string;
          owner_member_id?: string | null;
          parent_entry_id: string;
          parent_entry_type: string;
          resolved_entry_id?: string | null;
          status?: string;
          subject: string;
          target_entry_type: string;
          updated_at?: string;
        };
        Update: {
          closed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          opened_at?: string;
          owner_member_id?: string | null;
          parent_entry_id?: string;
          parent_entry_type?: string;
          resolved_entry_id?: string | null;
          status?: string;
          subject?: string;
          target_entry_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'flags_owner_member_id_fkey';
            columns: ['owner_member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
        ];
      };
      hw_change_logs: {
        Row: {
          change_date: string;
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          entry_state: string;
          extras: Json;
          id: string;
          parent_decision_id: string | null;
          replaces_version: number | null;
          subsystem_option_id: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          change_date: string;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          parent_decision_id?: string | null;
          replaces_version?: number | null;
          subsystem_option_id?: string | null;
          updated_at?: string;
          version: number;
        };
        Update: {
          change_date?: string;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          parent_decision_id?: string | null;
          replaces_version?: number | null;
          subsystem_option_id?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'hw_change_logs_subsystem_option_id_fkey';
            columns: ['subsystem_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      media_links: {
        Row: {
          caption: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          drive_file_id: string | null;
          entry_id: string;
          entry_type: string;
          id: string;
          ingest_status: string;
          last_checked_at: string | null;
          last_checked_ok: boolean | null;
          media_type: string | null;
          permission_status: string;
          provider: string;
          role: string | null;
          source_provider: string | null;
          thumbnail_url: string | null;
          updated_at: string;
          url: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          drive_file_id?: string | null;
          entry_id: string;
          entry_type: string;
          id?: string;
          ingest_status?: string;
          last_checked_at?: string | null;
          last_checked_ok?: boolean | null;
          media_type?: string | null;
          permission_status?: string;
          provider: string;
          role?: string | null;
          source_provider?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string;
          url: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          drive_file_id?: string | null;
          entry_id?: string;
          entry_type?: string;
          id?: string;
          ingest_status?: string;
          last_checked_at?: string | null;
          last_checked_ok?: boolean | null;
          media_type?: string | null;
          permission_status?: string;
          provider?: string;
          role?: string | null;
          source_provider?: string | null;
          thumbnail_url?: string | null;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      meeting_notes: {
        Row: {
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          entry_state: string;
          extras: Json;
          id: string;
          meeting_date: string;
          meeting_type_option_id: string;
          next_meeting_date: string | null;
          scribe_member_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          meeting_date: string;
          meeting_type_option_id: string;
          next_meeting_date?: string | null;
          scribe_member_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          meeting_date?: string;
          meeting_type_option_id?: string;
          next_meeting_date?: string | null;
          scribe_member_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meeting_notes_meeting_type_option_id_fkey';
            columns: ['meeting_type_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meeting_notes_scribe_member_id_fkey';
            columns: ['scribe_member_id'];
            isOneToOne: false;
            referencedRelation: 'members';
            referencedColumns: ['id'];
          },
        ];
      };
      members: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          display_name: string;
          email: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          display_name: string;
          email: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string;
          email?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      option_lists: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          is_seed: boolean;
          label: string;
          sort_order: number;
          updated_at: string;
          value: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_seed?: boolean;
          label: string;
          sort_order?: number;
          updated_at?: string;
          value: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_seed?: boolean;
          label?: string;
          sort_order?: number;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      outreach_logs: {
        Row: {
          age_range: string | null;
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          entry_state: string;
          event_date: string;
          event_name: string;
          event_type_option_id: string;
          extras: Json;
          follow_up_type_option_id: string | null;
          host_org: string | null;
          id: string;
          location_city: string | null;
          location_state: string | null;
          our_role_option_id: string | null;
          outreach_reporter: string;
          total_attendees: number | null;
          updated_at: string;
          what_to_change: string | null;
          what_worked: string | null;
          zero_first_count: number | null;
        };
        Insert: {
          age_range?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          event_date: string;
          event_name: string;
          event_type_option_id: string;
          extras?: Json;
          follow_up_type_option_id?: string | null;
          host_org?: string | null;
          id?: string;
          location_city?: string | null;
          location_state?: string | null;
          our_role_option_id?: string | null;
          outreach_reporter: string;
          total_attendees?: number | null;
          updated_at?: string;
          what_to_change?: string | null;
          what_worked?: string | null;
          zero_first_count?: number | null;
        };
        Update: {
          age_range?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          event_date?: string;
          event_name?: string;
          event_type_option_id?: string;
          extras?: Json;
          follow_up_type_option_id?: string | null;
          host_org?: string | null;
          id?: string;
          location_city?: string | null;
          location_state?: string | null;
          our_role_option_id?: string | null;
          outreach_reporter?: string;
          total_attendees?: number | null;
          updated_at?: string;
          what_to_change?: string | null;
          what_worked?: string | null;
          zero_first_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'outreach_logs_event_type_option_id_fkey';
            columns: ['event_type_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'outreach_logs_follow_up_type_option_id_fkey';
            columns: ['follow_up_type_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'outreach_logs_our_role_option_id_fkey';
            columns: ['our_role_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      session_logs: {
        Row: {
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          duration_hours: number | null;
          entry_state: string;
          extras: Json;
          id: string;
          session_date: string;
          session_lead: string;
          updated_at: string;
          what_didnt_work: string | null;
          what_worked: string | null;
          what_worked_on: string;
          whats_next: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          duration_hours?: number | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          session_date: string;
          session_lead: string;
          updated_at?: string;
          what_didnt_work?: string | null;
          what_worked?: string | null;
          what_worked_on: string;
          whats_next?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          duration_hours?: number | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          session_date?: string;
          session_lead?: string;
          updated_at?: string;
          what_didnt_work?: string | null;
          what_worked?: string | null;
          what_worked_on?: string;
          whats_next?: string | null;
        };
        Relationships: [];
      };
      sw_change_logs: {
        Row: {
          branch: string | null;
          change_date: string;
          change_type_option_id: string | null;
          commit_hash: string | null;
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          entry_state: string;
          extras: Json;
          id: string;
          parent_decision_id: string | null;
          updated_at: string;
        };
        Insert: {
          branch?: string | null;
          change_date: string;
          change_type_option_id?: string | null;
          commit_hash?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          parent_decision_id?: string | null;
          updated_at?: string;
        };
        Update: {
          branch?: string | null;
          change_date?: string;
          change_type_option_id?: string | null;
          commit_hash?: string | null;
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          parent_decision_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sw_change_logs_change_type_option_id_fkey';
            columns: ['change_type_option_id'];
            isOneToOne: false;
            referencedRelation: 'option_lists';
            referencedColumns: ['id'];
          },
        ];
      };
      test_logs: {
        Row: {
          created_at: string;
          created_by: string | null;
          created_via: string;
          deleted_at: string | null;
          entry_state: string;
          extras: Json;
          id: string;
          robot_version_hw_id: string | null;
          test_date: string;
          test_label: string;
          test_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          robot_version_hw_id?: string | null;
          test_date: string;
          test_label: string;
          test_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          created_via?: string;
          deleted_at?: string | null;
          entry_state?: string;
          extras?: Json;
          id?: string;
          robot_version_hw_id?: string | null;
          test_date?: string;
          test_label?: string;
          test_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_read_entry: { Args: { p_entry_id: string }; Returns: boolean };
      can_write_entry: { Args: { p_entry_id: string }; Returns: boolean };
      current_can_write: { Args: never; Returns: boolean };
      current_is_captain: { Args: never; Returns: boolean };
      current_is_captain_or_deputy: { Args: never; Returns: boolean };
      current_member_id: { Args: never; Returns: string };
      current_member_role: { Args: never; Returns: string };
      current_team_id: { Args: never; Returns: string };
      mark_overdue_flags: { Args: { p_team_id: string }; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
