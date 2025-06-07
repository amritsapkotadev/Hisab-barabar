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
      users: {
        Row: {
          id: string  // Changed from UUID to TEXT for Clerk compatibility
          name: string
          email: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string  // Changed from UUID to TEXT for Clerk compatibility
          name: string
          email: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string  // Changed from UUID to TEXT for Clerk compatibility
          name?: string
          email?: string
          phone?: string | null
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          group_name: string
          description: string | null
          created_by: string  // Changed to TEXT to reference users.id
          created_at: string
        }
        Insert: {
          id?: string
          group_name: string
          description?: string | null
          created_by: string  // Changed to TEXT to reference users.id
          created_at?: string
        }
        Update: {
          id?: string
          group_name?: string
          description?: string | null
          created_by?: string  // Changed to TEXT to reference users.id
          created_at?: string
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string  // Changed to TEXT to reference users.id
        }
        Insert: {
          group_id: string
          user_id: string  // Changed to TEXT to reference users.id
        }
        Update: {
          group_id?: string
          user_id?: string  // Changed to TEXT to reference users.id
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          title: string
          amount: number
          created_by: string  // Changed to TEXT to reference users.id
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          amount: number
          created_by: string  // Changed to TEXT to reference users.id
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          amount?: number
          created_by?: string  // Changed to TEXT to reference users.id
          date?: string
          created_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string  // Changed to TEXT to reference users.id
          paid_amount: number
          owed_amount: number
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string  // Changed to TEXT to reference users.id
          paid_amount?: number
          owed_amount?: number
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string  // Changed to TEXT to reference users.id
          paid_amount?: number
          owed_amount?: number
        }
      }
    }
  }
}