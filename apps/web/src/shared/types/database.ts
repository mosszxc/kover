export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          created_at: string
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
        }
        Insert: {
          address?: string
          created_at?: string
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
        }
        Update: {
          address?: string
          created_at?: string
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
      mat_sizes: {
        Row: {
          area: number
          created_at: string
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          area: number
          created_at?: string
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          area?: number
          created_at?: string
          id?: string
          label?: string
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
          day: number
          driver_id: string | null
          id: string
          target_day: number | null
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          day: number
          driver_id?: string | null
          id?: string
          target_day?: number | null
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          day?: number
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
