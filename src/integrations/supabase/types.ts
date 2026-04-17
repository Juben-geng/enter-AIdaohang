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
      agencies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_members: {
        Row: {
          agency_id: string | null
          created_at: string | null
          id: string
          permissions: Json | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_forms: {
        Row: {
          config: Json
          created_at: string | null
          form_type: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          form_type: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          form_type?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          course: string
          created_at: string | null
          email: string
          id: string
          name: string
          reject_reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          course: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          reject_reason?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          course?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          reject_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          category: string
          content: string
          cover_image: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          published_at: string | null
          slug: string
          status: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          content: string
          cover_image?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          slug: string
          status?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_custom: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_trips: {
        Row: {
          budget: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          destination: string
          end_date: string | null
          id: string
          notes: string | null
          people_count: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          destination: string
          end_date?: string | null
          id?: string
          notes?: string | null
          people_count?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          destination?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          people_count?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_trips_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          agency_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string | null
          wechat: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          wechat?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          wechat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_logs: {
        Row: {
          category_id: string | null
          created_at: string | null
          export_count: number | null
          export_type: string
          file_name: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          export_count?: number | null
          export_type: string
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          export_count?: number | null
          export_type?: string
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_logs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_links: {
        Row: {
          admin_note: string | null
          category: string | null
          click_count: number | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          logo_url: string | null
          name: string
          status: string
          submitter_id: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          admin_note?: string | null
          category?: string | null
          click_count?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          name: string
          status?: string
          submitter_id?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          admin_note?: string | null
          category?: string | null
          click_count?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          name?: string
          status?: string
          submitter_id?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          category_id: string | null
          click_count: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          link_type: string | null
          miniprogram_path: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          link_type?: string | null
          miniprogram_path?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          link_type?: string | null
          miniprogram_path?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          ai_quota: number | null
          created_at: string | null
          discount_rate: number | null
          display_order: number | null
          duration_months: number
          features: string[] | null
          id: string
          is_active: boolean | null
          membership_type: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          ai_quota?: number | null
          created_at?: string | null
          discount_rate?: number | null
          display_order?: number | null
          duration_months: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          membership_type: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          ai_quota?: number | null
          created_at?: string | null
          discount_rate?: number | null
          display_order?: number | null
          duration_months?: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          membership_type?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      navigation_square: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_approved: boolean | null
          title: string
          updated_at: string | null
          url: string
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          title: string
          updated_at?: string | null
          url: string
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_approved?: boolean | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_square_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_history: {
        Row: {
          can_restore: boolean | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
          operation_type: string
          user_id: string | null
        }
        Insert: {
          can_restore?: boolean | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation_type: string
          user_id?: string | null
        }
        Update: {
          can_restore?: boolean | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          item_type: string
          notes: string | null
          order_id: string | null
          quantity: number | null
          subtotal: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          item_type: string
          notes?: string | null
          order_id?: string | null
          quantity?: number | null
          subtotal?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          item_type?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number | null
          subtotal?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "travel_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          billing_cycle: string | null
          commission_amount: number | null
          commission_paid: boolean | null
          created_at: string | null
          duration_months: number
          id: string
          membership_type: string
          order_no: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string | null
          referrer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          billing_cycle?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          created_at?: string | null
          duration_months: number
          id?: string
          membership_type: string
          order_no: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          referrer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing_cycle?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          created_at?: string | null
          duration_months?: number
          id?: string
          membership_type?: string
          order_no?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          referrer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          error_message: string | null
          id: string
          order_id: string | null
          payment_method: string
          raw_response: Json | null
          status: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          payment_method: string
          raw_response?: Json | null
          status?: string
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          raw_response?: Json | null
          status?: string
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      preset_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          industry: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          industry?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          industry?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      preset_links: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          link_type: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          link_type?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          link_type?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "preset_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "preset_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profession_popup_history: {
        Row: {
          action: string
          created_at: string | null
          id: string
          shown_at: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          shown_at?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          shown_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profession_tags: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string | null
          has_seen_tutorial: boolean | null
          id: string
          ip_address: string | null
          last_location_check: string | null
          location_count: number | null
          membership_expires_at: string | null
          membership_type: string | null
          phone: string | null
          profession_selected: boolean | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          has_seen_tutorial?: boolean | null
          id: string
          ip_address?: string | null
          last_location_check?: string | null
          location_count?: number | null
          membership_expires_at?: string | null
          membership_type?: string | null
          phone?: string | null
          profession_selected?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          has_seen_tutorial?: boolean | null
          id?: string
          ip_address?: string | null
          last_location_check?: string | null
          location_count?: number | null
          membership_expires_at?: string | null
          membership_type?: string | null
          phone?: string | null
          profession_selected?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referee_id: string | null
          referral_type: string | null
          referrer_id: string | null
          reward_applied: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referee_id?: string | null
          referral_type?: string | null
          referrer_id?: string | null
          reward_applied?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referee_id?: string | null
          referral_type?: string | null
          referrer_id?: string | null
          reward_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tracking: {
        Row: {
          click_count: number | null
          conversion_count: number | null
          created_at: string | null
          id: string
          revenue_amount: number | null
          share_code: string
          share_url: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          revenue_amount?: number | null
          share_code: string
          share_url: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          revenue_amount?: number | null
          share_code?: string
          share_url?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configs: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      travel_orders: {
        Row: {
          agency_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
          order_no: string
          paid_amount: number | null
          payment_method: string | null
          status: string | null
          total_amount: number | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_no: string
          paid_amount?: number | null
          payment_method?: string | null
          status?: string | null
          total_amount?: number | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_no?: string
          paid_amount?: number | null
          payment_method?: string | null
          status?: string | null
          total_amount?: number | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_orders_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_orders_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "customer_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_steps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          sort_order: number | null
          step_number: number
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          step_number: number
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          step_number?: number
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          actions_count: number | null
          activity_date: string
          created_at: string | null
          id: string
          page_views: number | null
          user_id: string | null
        }
        Insert: {
          actions_count?: number | null
          activity_date: string
          created_at?: string | null
          id?: string
          page_views?: number | null
          user_id?: string | null
        }
        Update: {
          actions_count?: number | null
          activity_date?: string
          created_at?: string | null
          id?: string
          page_views?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profession_tags: {
        Row: {
          id: string
          profession_tag_id: string | null
          selected_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          profession_tag_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          profession_tag_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profession_tags_profession_tag_id_fkey"
            columns: ["profession_tag_id"]
            isOneToOne: false
            referencedRelation: "profession_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      user_professions: {
        Row: {
          id: string
          profession_id: string | null
          selected_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          profession_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          profession_id?: string | null
          selected_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_professions_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "profession_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_professions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelabel_configs: {
        Row: {
          agency_id: string | null
          brand_name: string | null
          created_at: string | null
          custom_domain: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          slogan: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          brand_name?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slogan?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          brand_name?: string | null
          created_at?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slogan?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_configs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      content_stats: {
        Row: {
          content_type: string | null
          published_count: number | null
          total_count: number | null
          total_views: number | null
        }
        Relationships: []
      }
      revenue_stats: {
        Row: {
          alipay_count: number | null
          date: string | null
          order_count: number | null
          total_revenue: number | null
          wechat_count: number | null
        }
        Relationships: []
      }
      user_growth_stats: {
        Row: {
          date: string | null
          new_users: number | null
          paid_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      upgrade_user_to_basic: {
        Args: { months?: number; user_email: string }
        Returns: undefined
      }
      upgrade_user_to_city_agent: {
        Args: { user_email: string }
        Returns: undefined
      }
      upgrade_user_to_vip: { Args: { user_email: string }; Returns: undefined }
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
