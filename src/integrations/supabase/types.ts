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
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          can_add_admins: boolean | null
          can_approve_grades: boolean | null
          can_manage_students: boolean | null
          can_manage_teachers: boolean | null
          can_upload_bulk_data: boolean | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_add_admins?: boolean | null
          can_approve_grades?: boolean | null
          can_manage_students?: boolean | null
          can_manage_teachers?: boolean | null
          can_upload_bulk_data?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_add_admins?: boolean | null
          can_approve_grades?: boolean | null
          can_manage_students?: boolean | null
          can_manage_teachers?: boolean | null
          can_upload_bulk_data?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          address: string
          application_id: string
          applying_for_grade: number
          created_at: string
          date_of_birth: string
          email: string
          first_name: string
          gender: string
          generated_student_id: string | null
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string
          guardian_relation: string
          id: string
          last_grade_completed: string
          last_name: string
          nationality: string | null
          phone: string
          previous_school: string
          programme: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string
          village: string | null
        }
        Insert: {
          address: string
          application_id: string
          applying_for_grade: number
          created_at?: string
          date_of_birth: string
          email: string
          first_name: string
          gender: string
          generated_student_id?: string | null
          guardian_email?: string | null
          guardian_name: string
          guardian_phone: string
          guardian_relation: string
          id?: string
          last_grade_completed: string
          last_name: string
          nationality?: string | null
          phone: string
          previous_school: string
          programme: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          address?: string
          application_id?: string
          applying_for_grade?: number
          created_at?: string
          date_of_birth?: string
          email?: string
          first_name?: string
          gender?: string
          generated_student_id?: string | null
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string
          guardian_relation?: string
          id?: string
          last_grade_completed?: string
          last_name?: string
          nationality?: string | null
          phone?: string
          previous_school?: string
          programme?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          capacity: number | null
          created_at: string
          grade_level: number
          id: string
          name: string
          school_type: string | null
          section: string
          specialization: string | null
        }
        Insert: {
          academic_year_id: string
          capacity?: number | null
          created_at?: string
          grade_level: number
          id?: string
          name: string
          school_type?: string | null
          section: string
          specialization?: string | null
        }
        Update: {
          academic_year_id?: string
          capacity?: number | null
          created_at?: string
          grade_level?: number
          id?: string
          name?: string
          school_type?: string | null
          section?: string
          specialization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          approved_by: string | null
          class_id: string | null
          continuous_assessment: number | null
          created_at: string
          entered_by: string | null
          exam_score: number | null
          id: string
          letter_grade: string | null
          remark: string | null
          status: Database["public"]["Enums"]["grade_status"] | null
          student_id: string
          subject_id: string
          term_id: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          class_id?: string | null
          continuous_assessment?: number | null
          created_at?: string
          entered_by?: string | null
          exam_score?: number | null
          id?: string
          letter_grade?: string | null
          remark?: string | null
          status?: Database["public"]["Enums"]["grade_status"] | null
          student_id: string
          subject_id: string
          term_id: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          class_id?: string | null
          continuous_assessment?: number | null
          created_at?: string
          entered_by?: string | null
          exam_score?: number | null
          id?: string
          letter_grade?: string | null
          remark?: string | null
          status?: Database["public"]["Enums"]["grade_status"] | null
          student_id?: string
          subject_id?: string
          term_id?: string
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          start_time: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          start_time: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          last_name: string
          phone: string | null
          programme_id: string | null
          status: string | null
          student_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name: string
          phone?: string | null
          programme_id?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          programme_id?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          programme_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          programme_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          programme_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          department: string | null
          email: string
          employee_id: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          employee_id: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          employee_id?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      term_results: {
        Row: {
          class_id: string | null
          class_position: number | null
          class_size: number | null
          created_at: string
          gpa: number | null
          id: string
          is_published: boolean | null
          principal_comment: string | null
          student_id: string
          teacher_comment: string | null
          term_id: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          class_position?: number | null
          class_size?: number | null
          created_at?: string
          gpa?: number | null
          id?: string
          is_published?: boolean | null
          principal_comment?: string | null
          student_id: string
          teacher_comment?: string | null
          term_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          class_position?: number | null
          class_size?: number | null
          created_at?: string
          gpa?: number | null
          id?: string
          is_published?: boolean | null
          principal_comment?: string | null
          student_id?: string
          teacher_comment?: string | null
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_results_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_results_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          start_date: string
          term_number: number
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          start_date: string
          term_number: number
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string
          term_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_student_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected"
      grade_status: "draft" | "submitted" | "approved" | "locked"
      user_role: "student" | "teacher" | "admin"
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
      application_status: ["pending", "accepted", "rejected"],
      grade_status: ["draft", "submitted", "approved", "locked"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
