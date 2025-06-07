export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          phone?: string | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          group_name: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_name: string
          description?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          group_name?: string
          description?: string | null
          created_by?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          title: string
          amount: number
          category: string | null
          created_by: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          amount: number
          category?: string | null
          created_by: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          amount?: number
          category?: string | null
          created_by?: string
          date?: string
          created_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          paid_amount: number
          owed_amount: number
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          paid_amount?: number
          owed_amount?: number
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          paid_amount?: number
          owed_amount?: number
        }
      }
    }
  }
}