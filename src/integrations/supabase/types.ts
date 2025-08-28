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
      agent_knowledge_files: {
        Row: {
          agent_category: Database["public"]["Enums"]["product_category"]
          content_embedding: string | null
          created_at: string
          extracted_content: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          processed_at: string | null
          processing_status: string | null
          storage_path: string
          updated_at: string
        }
        Insert: {
          agent_category: Database["public"]["Enums"]["product_category"]
          content_embedding?: string | null
          created_at?: string
          extracted_content?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_status?: string | null
          storage_path: string
          updated_at?: string
        }
        Update: {
          agent_category?: Database["public"]["Enums"]["product_category"]
          content_embedding?: string | null
          created_at?: string
          extracted_content?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          processing_status?: string | null
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_prompt_history: {
        Row: {
          agent_prompt_id: string | null
          change_description: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          prompt_data: Json
          version: number
        }
        Insert: {
          agent_prompt_id?: string | null
          change_description?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          prompt_data: Json
          version: number
        }
        Update: {
          agent_prompt_id?: string | null
          change_description?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          prompt_data?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_prompt_history_agent_prompt_id_fkey"
            columns: ["agent_prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_prompts: {
        Row: {
          agent_type: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          knowledge_base: string | null
          llm_model: string | null
          name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          agent_type?: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          llm_model?: string | null
          name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          agent_type?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_base?: string | null
          llm_model?: string | null
          name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
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
      classification_keywords: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      classification_logs: {
        Row: {
          classified_category: string | null
          confidence_score: number | null
          conversation_id: string | null
          created_at: string | null
          id: string
          message_text: string
          metadata: Json | null
          processing_time_ms: number | null
          status: string | null
        }
        Insert: {
          classified_category?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_text: string
          metadata?: Json | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Update: {
          classified_category?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_text?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          status?: string | null
        }
        Relationships: []
      }
      classification_rules: {
        Row: {
          action_type: string
          action_value: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          action_value: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          action_value?: string
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_analytics: {
        Row: {
          avg_response_time_seconds: number | null
          by_category: Json | null
          conversion_rate: number | null
          date: string | null
          hot_leads: number | null
          id: string
          messages_received: number | null
          messages_sent: number | null
          qualified_leads: number | null
          total_conversations: number | null
        }
        Insert: {
          avg_response_time_seconds?: number | null
          by_category?: Json | null
          conversion_rate?: number | null
          date?: string | null
          hot_leads?: number | null
          id?: string
          messages_received?: number | null
          messages_sent?: number | null
          qualified_leads?: number | null
          total_conversations?: number | null
        }
        Update: {
          avg_response_time_seconds?: number | null
          by_category?: Json | null
          conversion_rate?: number | null
          date?: string | null
          hot_leads?: number | null
          id?: string
          messages_received?: number | null
          messages_sent?: number | null
          qualified_leads?: number | null
          total_conversations?: number | null
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
          profile_pic_url: string | null
          source: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          updated_at: string | null
          whatsapp_name: string | null
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
          profile_pic_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          whatsapp_name?: string | null
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
          profile_pic_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          updated_at?: string | null
          whatsapp_name?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          agent_category: Database["public"]["Enums"]["product_category"]
          chunk_index: number
          content: string
          content_embedding: string | null
          created_at: string | null
          file_id: string
          id: string
          metadata: Json | null
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          agent_category: Database["public"]["Enums"]["product_category"]
          chunk_index: number
          content: string
          content_embedding?: string | null
          created_at?: string | null
          file_id: string
          id?: string
          metadata?: Json | null
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_category?: Database["public"]["Enums"]["product_category"]
          chunk_index?: number
          content?: string
          content_embedding?: string | null
          created_at?: string | null
          file_id?: string
          id?: string
          metadata?: Json | null
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "agent_knowledge_files"
            referencedColumns: ["id"]
          },
        ]
      }
      message_buffers: {
        Row: {
          buffer_started_at: string | null
          conversation_id: string | null
          id: string
          messages: Json
          processed: boolean | null
          processed_at: string | null
          should_process_at: string | null
        }
        Insert: {
          buffer_started_at?: string | null
          conversation_id?: string | null
          id?: string
          messages?: Json
          processed?: boolean | null
          processed_at?: string | null
          should_process_at?: string | null
        }
        Update: {
          buffer_started_at?: string | null
          conversation_id?: string | null
          id?: string
          messages?: Json
          processed?: boolean | null
          processed_at?: string | null
          should_process_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_buffers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
          status: Database["public"]["Enums"]["message_status"] | null
          whatsapp_message_id: string | null
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
          status?: Database["public"]["Enums"]["message_status"] | null
          whatsapp_message_id?: string | null
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
          status?: Database["public"]["Enums"]["message_status"] | null
          whatsapp_message_id?: string | null
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
      prompt_variables: {
        Row: {
          category: string | null
          description: string | null
          example_value: string | null
          id: string
          variable_name: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          example_value?: string | null
          id?: string
          variable_name: string
        }
        Update: {
          category?: string | null
          description?: string | null
          example_value?: string | null
          id?: string
          variable_name?: string
        }
        Relationships: []
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
      webhook_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          payload: Json
          processed: boolean | null
          webhook_type: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload: Json
          processed?: boolean | null
          webhook_type?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          webhook_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      search_knowledge_chunks: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
          target_agent_category: Database["public"]["Enums"]["product_category"]
        }
        Returns: {
          chunk_index: number
          content: string
          file_name: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_knowledge_files: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
          target_agent_category: Database["public"]["Enums"]["product_category"]
        }
        Returns: {
          content: string
          file_name: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      message_status: "sending" | "sent" | "delivered" | "read" | "failed"
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
      message_status: ["sending", "sent", "delivered", "read", "failed"],
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
