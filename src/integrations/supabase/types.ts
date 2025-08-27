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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bot_templates: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          id: string
          intent: string
          is_active: boolean | null
          language: string | null
          next_intents: string[] | null
          quick_replies: Json | null
          template_text: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          intent: string
          is_active?: boolean | null
          language?: string | null
          next_intents?: string[] | null
          quick_replies?: Json | null
          template_text: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          id?: string
          intent?: string
          is_active?: boolean | null
          language?: string | null
          next_intents?: string[] | null
          quick_replies?: Json | null
          template_text?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          created_at: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_state: string | null
          first_message_at: string | null
          id: string
          last_message_at: string | null
          lead_score: number | null
          lead_temperature:
            | Database["public"]["Enums"]["lead_temperature"]
            | null
          metadata: Json | null
          product_group: Database["public"]["Enums"]["product_category"] | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          updated_at: string | null
          whatsapp_number: string
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_state?: string | null
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_score?: number | null
          lead_temperature?:
            | Database["public"]["Enums"]["lead_temperature"]
            | null
          metadata?: Json | null
          product_group?: Database["public"]["Enums"]["product_category"] | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          whatsapp_number: string
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_state?: string | null
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          lead_score?: number | null
          lead_temperature?:
            | Database["public"]["Enums"]["lead_temperature"]
            | null
          metadata?: Json | null
          product_group?: Database["public"]["Enums"]["product_category"] | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          delivered_at: string | null
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          read_at: string | null
          sender_name: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_name?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_name?: string | null
          sender_type?: Database["public"]["Enums"]["sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contexts: {
        Row: {
          budget_range: string | null
          construction_size_m2: number | null
          conversation_id: string
          created_at: string | null
          desired_product: string | null
          energy_bill_value: number | null
          energy_consumption: string | null
          floor_quantity_m2: number | null
          floor_rooms: string | null
          has_architectural_project: boolean | null
          has_energy_backups: boolean | null
          id: string
          materials_list: string[] | null
          notes: string | null
          project_status: string | null
          roof_size_m2: number | null
          roof_status: string | null
          timeline: string | null
          updated_at: string | null
          urgency: string | null
          whatsapp_confirmed: string | null
        }
        Insert: {
          budget_range?: string | null
          construction_size_m2?: number | null
          conversation_id: string
          created_at?: string | null
          desired_product?: string | null
          energy_bill_value?: number | null
          energy_consumption?: string | null
          floor_quantity_m2?: number | null
          floor_rooms?: string | null
          has_architectural_project?: boolean | null
          has_energy_backups?: boolean | null
          id?: string
          materials_list?: string[] | null
          notes?: string | null
          project_status?: string | null
          roof_size_m2?: number | null
          roof_status?: string | null
          timeline?: string | null
          updated_at?: string | null
          urgency?: string | null
          whatsapp_confirmed?: string | null
        }
        Update: {
          budget_range?: string | null
          construction_size_m2?: number | null
          conversation_id?: string
          created_at?: string | null
          desired_product?: string | null
          energy_bill_value?: number | null
          energy_consumption?: string | null
          floor_quantity_m2?: number | null
          floor_rooms?: string | null
          has_architectural_project?: boolean | null
          has_energy_backups?: boolean | null
          id?: string
          materials_list?: string[] | null
          notes?: string | null
          project_status?: string | null
          roof_size_m2?: number | null
          roof_status?: string | null
          timeline?: string | null
          updated_at?: string | null
          urgency?: string | null
          whatsapp_confirmed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_contexts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configs: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          level: string
          message: string
          source: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          level: string
          message: string
          source: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          level?: string
          message?: string
          source?: string
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
      conversation_status:
        | "waiting"
        | "active"
        | "in_bot"
        | "with_agent"
        | "qualified"
        | "transferred"
        | "closed"
      lead_temperature: "cold" | "warm" | "hot"
      product_category:
        | "telha_shingle"
        | "energia_solar"
        | "steel_frame"
        | "drywall_divisorias"
        | "ferramentas"
        | "pisos"
        | "acabamentos"
        | "forros"
        | "saudacao"
        | "institucional"
        | "indefinido"
      sender_type: "customer" | "bot" | "agent" | "system"
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
    Enums: {
      conversation_status: [
        "waiting",
        "active",
        "in_bot",
        "with_agent",
        "qualified",
        "transferred",
        "closed",
      ],
      lead_temperature: ["cold", "warm", "hot"],
      product_category: [
        "telha_shingle",
        "energia_solar",
        "steel_frame",
        "drywall_divisorias",
        "ferramentas",
        "pisos",
        "acabamentos",
        "forros",
        "saudacao",
        "institucional",
        "indefinido",
      ],
      sender_type: ["customer", "bot", "agent", "system"],
    },
  },
} as const
