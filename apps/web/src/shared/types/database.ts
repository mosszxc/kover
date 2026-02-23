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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value?: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      changelog: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          type: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string
          id?: string
          type: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          type?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          category: string | null
          client_notes: Json
          contact_name: string | null
          contact_phone: string | null
          contract_date: string | null
          contract_number: string | null
          created_at: string
          custom_monthly_price: number | null
          day_replacements: Json
          days: number[]
          frequency: number
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          mats: Json
          name: string
          notes: string
          original_name: string
          paused_until: string | null
          updated_at: string
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string
          category?: string | null
          client_notes?: Json
          contact_name?: string | null
          contact_phone?: string | null
          contract_date?: string | null
          contract_number?: string | null
          created_at?: string
          custom_monthly_price?: number | null
          day_replacements?: Json
          days?: number[]
          frequency?: number
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          mats?: Json
          name: string
          notes?: string
          original_name?: string
          paused_until?: string | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string
          category?: string | null
          client_notes?: Json
          contact_name?: string | null
          contact_phone?: string | null
          contract_date?: string | null
          contract_number?: string | null
          created_at?: string
          custom_monthly_price?: number | null
          day_replacements?: Json
          days?: number[]
          frequency?: number
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          mats?: Json
          name?: string
          notes?: string
          original_name?: string
          paused_until?: string | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      day_routes: {
        Row: {
          created_at: string
          day: number
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day: number
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      debt_contacts: {
        Row: {
          client_id: string
          id: string
          last_contacted_at: string | null
          notes: Json
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          id?: string
          last_contacted_at?: string | null
          notes?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          id?: string
          last_contacted_at?: string | null
          notes?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
          updated_at: string
          work_days: number[]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string
          updated_at?: string
          work_days?: number[]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          updated_at?: string
          work_days?: number[]
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          notes: string
          quantity: number
          size_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          quantity?: number
          size_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          quantity?: number
          size_id?: string
          type?: string
        }
        Relationships: []
      }
      mat_batches: {
        Row: {
          created_at: string
          id: string
          max_wash_cycles: number
          purchased_at: string
          quantity: number
          remaining: number
          size_id: string
          wash_cycles: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_wash_cycles?: number
          purchased_at?: string
          quantity?: number
          remaining?: number
          size_id: string
          wash_cycles?: number
        }
        Update: {
          created_at?: string
          id?: string
          max_wash_cycles?: number
          purchased_at?: string
          quantity?: number
          remaining?: number
          size_id?: string
          wash_cycles?: number
        }
        Relationships: []
      }
      mat_inventory: {
        Row: {
          created_at: string
          damaged: number
          id: string
          in_laundry: number
          max_wash_cycles: number
          total_owned: number
          updated_at: string
          wash_cycles: number
        }
        Insert: {
          created_at?: string
          damaged?: number
          id: string
          in_laundry?: number
          max_wash_cycles?: number
          total_owned?: number
          updated_at?: string
          wash_cycles?: number
        }
        Update: {
          created_at?: string
          damaged?: number
          id?: string
          in_laundry?: number
          max_wash_cycles?: number
          total_owned?: number
          updated_at?: string
          wash_cycles?: number
        }
        Relationships: []
      }
      mat_sizes: {
        Row: {
          area: number
          created_at: string
          id: string
          label: string
          max_wash_cycles: number
          rental_price: number
          updated_at: string
        }
        Insert: {
          area: number
          created_at?: string
          id?: string
          label: string
          max_wash_cycles?: number
          rental_price?: number
          updated_at?: string
        }
        Update: {
          area?: number
          created_at?: string
          id?: string
          label?: string
          max_wash_cycles?: number
          rental_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_config: {
        Row: {
          created_at: string
          daily_summary_cron: string
          id: string
          is_active: boolean
          notify_daily_summary: boolean
          notify_new_client: boolean
          notify_route_complete: boolean
          telegram_bot_token: string
          telegram_chat_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_summary_cron?: string
          id?: string
          is_active?: boolean
          notify_daily_summary?: boolean
          notify_new_client?: boolean
          notify_route_complete?: boolean
          telegram_bot_token: string
          telegram_chat_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_summary_cron?: string
          id?: string
          is_active?: boolean
          notify_daily_summary?: boolean
          notify_new_client?: boolean
          notify_route_complete?: boolean
          telegram_bot_token?: string
          telegram_chat_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          client_id: string
          created_at: string
          expected_amount: number
          id: string
          notes: string
          paid_amount: number
          paid_at: string | null
          period: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string
          paid_amount?: number
          paid_at?: string | null
          period: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string
          paid_amount?: number
          paid_at?: string | null
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      route_exceptions: {
        Row: {
          client_id: string
          created_at: string
          date: string
          day: number
          id: string
          reason: string | null
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          day: number
          id?: string
          reason?: string | null
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          day?: number
          id?: string
          reason?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_exceptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          client_id: string
          created_at: string
          day_route_id: string
          driver_id: string | null
          id: string
          is_completed: boolean
          position: number
          skipped_until: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          day_route_id: string
          driver_id?: string | null
          id?: string
          is_completed?: boolean
          position?: number
          skipped_until?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          day_route_id?: string
          driver_id?: string | null
          id?: string
          is_completed?: boolean
          position?: number
          skipped_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_day_route_id_fkey"
            columns: ["day_route_id"]
            isOneToOne: false
            referencedRelation: "day_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_log: {
        Row: {
          client_id: string
          created_at: string
          day: number | null
          details: string | null
          driver_id: string | null
          id: string
          target_day: number | null
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          day?: number | null
          details?: string | null
          driver_id?: string | null
          id?: string
          target_day?: number | null
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          day?: number | null
          details?: string | null
          driver_id?: string | null
          id?: string
          target_day?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_log_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reports: {
        Row: {
          client_id: string
          created_at: string
          date: string
          day: number
          has_discrepancy: boolean
          id: string
          mats: Json
          notes: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          day: number
          has_discrepancy?: boolean
          id?: string
          mats?: Json
          notes?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          day?: number
          has_discrepancy?: boolean
          id?: string
          mats?: Json
          notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_url: { Args: never; Returns: string }
      get_supabase_anon_key: { Args: never; Returns: string }
      invoke_kover_notify: {
        Args: { event_type: string; payload?: Json }
        Returns: undefined
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
