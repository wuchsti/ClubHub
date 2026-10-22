export type AppRole = "owner" | "admin" | "captain" | "member";
export type TenantStatus = "trialing" | "active" | "past_due" | "canceled";
export type TenantPlan = "starter" | "pro" | "allin";
export type TeamRole = "captain" | "member";
export type EventType = "training" | "game" | "event";
export type RsvpStatus = "yes" | "no" | "maybe";
export type LedgerStatus = "open" | "paid" | "void";

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: TenantPlan;
          status: TenantStatus;
          member_limit: number;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_connect_account_id: string | null;
          stripe_connect_charges_enabled: boolean;
          is_suspended: boolean;
          suspended_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: TenantPlan;
          status?: TenantStatus;
          member_limit?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_connect_account_id?: string | null;
          stripe_connect_charges_enabled?: boolean;
          is_suspended?: boolean;
          suspended_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_platform_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: AppRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "teams_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: TeamRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: TeamRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          team_id: string;
          type: EventType;
          title: string;
          location: string | null;
          starts_at: string;
          rsvp_deadline: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          type?: EventType;
          title: string;
          location?: string | null;
          starts_at: string;
          rsvp_deadline?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: RsvpStatus;
          decline_reason: string | null;
          carpool_seats: number | null;
          responded_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status: RsvpStatus;
          decline_reason?: string | null;
          carpool_seats?: number | null;
          responded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_rsvps"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          id: string;
          tenant_id: string;
          team_id: string | null;
          token: string;
          role: AppRole;
          max_uses: number;
          use_count: number;
          expires_at: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          team_id?: string | null;
          token?: string;
          role?: AppRole;
          max_uses?: number;
          use_count?: number;
          expires_at?: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invites_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      penalty_catalog: {
        Row: {
          id: string;
          tenant_id: string;
          label: string;
          default_amount_cents: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          label: string;
          default_amount_cents: number;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["penalty_catalog"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "penalty_catalog_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ledger_entries: {
        Row: {
          id: string;
          tenant_id: string;
          team_id: string | null;
          member_id: string;
          catalog_id: string | null;
          label: string;
          amount_cents: number;
          currency: string;
          status: LedgerStatus;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          team_id?: string | null;
          member_id: string;
          catalog_id?: string | null;
          label: string;
          amount_cents: number;
          currency?: string;
          status?: LedgerStatus;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ledger_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ledger_entries_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      sponsors: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          logo_path: string;
          link_url: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          logo_path: string;
          link_url?: string | null;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sponsors"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sponsors_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_sponsors: {
        Row: {
          id: string;
          name: string;
          logo_path: string;
          link_url: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_path: string;
          link_url?: string | null;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_sponsors"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      redeem_invite: {
        Args: { p_token: string };
        Returns: { tenant_id: string; team_id: string | null; tenant_slug: string | null }[];
      };
      invite_preview: {
        Args: { p_token: string };
        Returns: { valid: boolean; tenant_name: string; team_name: string | null }[];
      };
    };
    Enums: {
      app_role: AppRole;
      tenant_status: TenantStatus;
      tenant_plan: TenantPlan;
      team_role: TeamRole;
      event_type: EventType;
      rsvp_status: RsvpStatus;
      ledger_status: LedgerStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
