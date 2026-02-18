export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null;
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          type: string;
          user_id: string;
        };
        Insert: {
          balance?: number | null;
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          type: string;
          user_id: string;
        };
        Update: {
          balance?: number | null;
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      bills: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          description: string;
          due_date: string;
          id: string;
          is_recurring: boolean | null;
          recurrence: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          description: string;
          due_date: string;
          id?: string;
          is_recurring?: boolean | null;
          recurrence?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string;
          id?: string;
          is_recurring?: boolean | null;
          recurrence?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      credit_cards: {
        Row: {
          closing_day: number;
          color: string | null;
          created_at: string;
          due_day: number;
          id: string;
          last_four_digits: string | null;
          limit_amount: number;
          name: string;
          user_id: string;
        };
        Insert: {
          closing_day: number;
          color?: string | null;
          created_at?: string;
          due_day: number;
          id?: string;
          last_four_digits?: string | null;
          limit_amount: number;
          name: string;
          user_id: string;
        };
        Update: {
          closing_day?: number;
          color?: string | null;
          created_at?: string;
          due_day?: number;
          id?: string;
          last_four_digits?: string | null;
          limit_amount?: number;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      installments: {
        Row: {
          created_at: string;
          credit_card_id: string | null;
          current_installment: number | null;
          description: string;
          id: string;
          installment_amount: number | null;
          start_date: string | null;
          status: string | null;
          total_amount: number | null;
          total_installments: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          credit_card_id?: string | null;
          current_installment?: number | null;
          description: string;
          id?: string;
          installment_amount?: number | null;
          start_date?: string | null;
          status?: string | null;
          total_amount?: number | null;
          total_installments?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          credit_card_id?: string | null;
          current_installment?: number | null;
          description?: string;
          id?: string;
          installment_amount?: number | null;
          start_date?: string | null;
          status?: string | null;
          total_amount?: number | null;
          total_installments?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      time_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          clock_in: string | null;
          lunch_start: string | null;
          lunch_end: string | null;
          clock_out: string | null;
          expected_hours: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          clock_in?: string | null;
          lunch_start?: string | null;
          lunch_end?: string | null;
          clock_out?: string | null;
          expected_hours?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          clock_in?: string | null;
          lunch_start?: string | null;
          lunch_end?: string | null;
          clock_out?: string | null;
          expected_hours?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      time_work_schedules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          daily_hours: number;
          work_days: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          daily_hours: number;
          work_days: number[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          daily_hours?: number;
          work_days?: number[];
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string | null;
          amount: number | null;
          category_id: string | null;
          created_at: string;
          credit_card_id: string | null;
          date: string;
          description: string | null;
          id: string;
          notes: string | null;
          reference_date: string | null;
          status: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount?: number | null;
          category_id?: string | null;
          created_at?: string;
          credit_card_id?: string | null;
          date: string;
          description?: string | null;
          id?: string;
          notes?: string | null;
          reference_date?: string | null;
          status?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number | null;
          category_id?: string | null;
          created_at?: string;
          credit_card_id?: string | null;
          date?: string;
          description?: string | null;
          id?: string;
          notes?: string | null;
          reference_date?: string | null;
          status?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
