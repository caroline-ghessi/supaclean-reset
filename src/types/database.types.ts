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
      bot_templates: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          id: string
          intent: string
          is_active: boolean
          language: string
          next_intents: string[] | null
          quick_replies: Json | null
          template_text: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          intent: string
          is_active?: boolean
          language?: string
          next_intents?: string[] | null
          quick_replies?: Json | null
          template_text: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          intent?: string
          is_active?: boolean
          language?: string
          next_intents?: string[] | null
          quick_replies?: Json | null
          template_text?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          created_at: string
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_state: string | null
          first_message_at: string
          id: string
          last_message_at: string
          lead_score: number
          lead_temperature: Database["public"]["Enums"]["lead_temperature"]
          metadata: Json
          product_group: Database["public"]["Enums"]["product_category"]
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_state?: string | null
          first_message_at?: string
          id?: string
          last_message_at?: string
          lead_score?: number
          lead_temperature?: Database["public"]["Enums"]["lead_temperature"]
          metadata?: Json
          product_group?: Database["public"]["Enums"]["product_category"]
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_state?: string | null
          first_message_at?: string
          id?: string
          last_message_at?: string
          lead_score?: number
          lead_temperature?: Database["public"]["Enums"]["lead_temperature"]
          metadata?: Json
          product_group?: Database["public"]["Enums"]["product_category"]
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          is_read: boolean
          media_type: string | null
          media_url: string | null
          metadata: Json
          read_at: string | null
          sender_name: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          metadata?: Json
          read_at?: string | null
          sender_name?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          metadata?: Json
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
          created_at: string
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
          updated_at: string
          urgency: string | null
          whatsapp_confirmed: string | null
        }
        Insert: {
          budget_range?: string | null
          construction_size_m2?: number | null
          conversation_id: string
          created_at?: string
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
          updated_at?: string
          urgency?: string | null
          whatsapp_confirmed?: string | null
        }
        Update: {
          budget_range?: string | null
          construction_size_m2?: number | null
          conversation_id?: string
          created_at?: string
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
          updated_at?: string
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
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          level: string
          message: string
          source: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          level: string
          message: string
          source: string
        }
        Update: {
          created_at?: string
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
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
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