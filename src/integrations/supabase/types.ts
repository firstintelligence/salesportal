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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_profiles: {
        Row: {
          agent_id: string
          created_at: string
          first_name: string
          id: string
          is_super_admin: boolean | null
          last_name: string | null
          phone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          first_name: string
          id?: string
          is_super_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          first_name?: string
          id?: string
          is_super_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_photos: {
        Row: {
          category: string
          checklist_id: string
          created_at: string
          id: string
          item_name: string
          photo_url: string
        }
        Insert: {
          category: string
          checklist_id: string
          created_at?: string
          id?: string
          item_name: string
          photo_url: string
        }
        Update: {
          category?: string
          checklist_id?: string
          created_at?: string
          id?: string
          item_name?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_photos_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "installation_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string
          agent_id: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string
          postal_code: string | null
          province: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          agent_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone: string
          postal_code?: string | null
          province?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          agent_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string
          postal_code?: string | null
          province?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          agent_id: string
          city: string | null
          country: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          document_id: string
          document_type: string
          document_url: string | null
          id: string
          ip_address: string | null
          isp: string | null
          latitude: number | null
          location_string: string | null
          longitude: number | null
          postal_code: string | null
          region: string | null
          signature_type: string | null
          signed_at: string
          tenant_id: string | null
          timezone: string | null
          user_agent: string | null
        }
        Insert: {
          agent_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          document_id: string
          document_type: string
          document_url?: string | null
          id?: string
          ip_address?: string | null
          isp?: string | null
          latitude?: number | null
          location_string?: string | null
          longitude?: number | null
          postal_code?: string | null
          region?: string | null
          signature_type?: string | null
          signed_at?: string
          tenant_id?: string | null
          timezone?: string | null
          user_agent?: string | null
        }
        Update: {
          agent_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          document_id?: string
          document_type?: string
          document_url?: string | null
          id?: string
          ip_address?: string | null
          isp?: string | null
          latitude?: number | null
          location_string?: string | null
          longitude?: number | null
          postal_code?: string | null
          region?: string | null
          signature_type?: string | null
          signed_at?: string
          tenant_id?: string | null
          timezone?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_checklists: {
        Row: {
          agent_id: string
          created_at: string
          customer_id: string | null
          id: string
          status: string
          submitted_at: string | null
          tpv_request_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          status?: string
          submitted_at?: string | null
          tpv_request_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          status?: string
          submitted_at?: string | null
          tpv_request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installation_checklists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_checklists_tpv_request_id_fkey"
            columns: ["tpv_request_id"]
            isOneToOne: true
            referencedRelation: "tpv_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tpv_requests: {
        Row: {
          agent_id: string
          amortization: string | null
          call_duration_seconds: number | null
          city: string | null
          created_at: string | null
          customer_address: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string
          email: string | null
          ended_reason: string | null
          first_name: string | null
          id: string
          interest_rate: string | null
          items_json: Json | null
          last_name: string | null
          monthly_payment: string | null
          postal_code: string | null
          products: string | null
          promotional_term: string | null
          province: string | null
          recording_url: string | null
          sales_price: string | null
          status: string
          tenant_id: string | null
          updated_at: string | null
          vapi_call_id: string | null
        }
        Insert: {
          agent_id: string
          amortization?: string | null
          call_duration_seconds?: number | null
          city?: string | null
          created_at?: string | null
          customer_address: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone: string
          email?: string | null
          ended_reason?: string | null
          first_name?: string | null
          id?: string
          interest_rate?: string | null
          items_json?: Json | null
          last_name?: string | null
          monthly_payment?: string | null
          postal_code?: string | null
          products?: string | null
          promotional_term?: string | null
          province?: string | null
          recording_url?: string | null
          sales_price?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          vapi_call_id?: string | null
        }
        Update: {
          agent_id?: string
          amortization?: string | null
          call_duration_seconds?: number | null
          city?: string | null
          created_at?: string | null
          customer_address?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string
          email?: string | null
          ended_reason?: string | null
          first_name?: string | null
          id?: string
          interest_rate?: string | null
          items_json?: Json | null
          last_name?: string | null
          monthly_payment?: string | null
          postal_code?: string | null
          products?: string | null
          promotional_term?: string | null
          province?: string | null
          recording_url?: string | null
          sales_price?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          vapi_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tpv_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tpv_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_agent: { Args: { agent_id: string }; Returns: boolean }
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
