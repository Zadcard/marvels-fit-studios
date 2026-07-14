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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Client: {
        Row: {
          createdAt: string
          dateOfBirth: string | null
          fullName: string
          groupId: string | null
          id: string
          isPaid: boolean
          membershipType: string
          paymentStatus: Database["public"]["Enums"]["ClientPaymentStatus"]
          phone: string | null
          sessionsLeft: number
          status: Database["public"]["Enums"]["ClientLifecycleStatus"]
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          dateOfBirth?: string | null
          fullName: string
          groupId?: string | null
          id?: string
          isPaid?: boolean
          membershipType?: string
          paymentStatus?: Database["public"]["Enums"]["ClientPaymentStatus"]
          phone?: string | null
          sessionsLeft?: number
          status?: Database["public"]["Enums"]["ClientLifecycleStatus"]
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          dateOfBirth?: string | null
          fullName?: string
          groupId?: string | null
          id?: string
          isPaid?: boolean
          membershipType?: string
          paymentStatus?: Database["public"]["Enums"]["ClientPaymentStatus"]
          phone?: string | null
          sessionsLeft?: number
          status?: Database["public"]["Enums"]["ClientLifecycleStatus"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Client_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Client_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ClientPreferences: {
        Row: {
          clientId: string
          createdAt: string
          goalLabel: string
          id: string
          preferredSessionTime: string
          updatedAt: string
        }
        Insert: {
          clientId: string
          createdAt?: string
          goalLabel?: string
          id?: string
          preferredSessionTime?: string
          updatedAt?: string
        }
        Update: {
          clientId?: string
          createdAt?: string
          goalLabel?: string
          id?: string
          preferredSessionTime?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ClientPreferences_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
      ClientSubscription: {
        Row: {
          clientId: string
          createdAt: string
          customPrice: number | null
          endsAt: string | null
          id: string
          isAutoRenew: boolean
          planId: string
          renewsAt: string | null
          sessionsTotal: number | null
          sessionsUsed: number
          startsAt: string
          status: Database["public"]["Enums"]["SubscriptionStatus"]
          updatedAt: string
        }
        Insert: {
          clientId: string
          createdAt?: string
          customPrice?: number | null
          endsAt?: string | null
          id?: string
          isAutoRenew?: boolean
          planId: string
          renewsAt?: string | null
          sessionsTotal?: number | null
          sessionsUsed?: number
          startsAt: string
          status?: Database["public"]["Enums"]["SubscriptionStatus"]
          updatedAt?: string
        }
        Update: {
          clientId?: string
          createdAt?: string
          customPrice?: number | null
          endsAt?: string | null
          id?: string
          isAutoRenew?: boolean
          planId?: string
          renewsAt?: string | null
          sessionsTotal?: number | null
          sessionsUsed?: number
          startsAt?: string
          status?: Database["public"]["Enums"]["SubscriptionStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ClientSubscription_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClientSubscription_planId_fkey"
            columns: ["planId"]
            isOneToOne: false
            referencedRelation: "SubscriptionPlan"
            referencedColumns: ["id"]
          },
        ]
      }
      Coach: {
        Row: {
          createdAt: string
          fullName: string
          id: string
          phone: string | null
          specialization: Database["public"]["Enums"]["CoachSpecialization"]
          userId: string
        }
        Insert: {
          createdAt?: string
          fullName: string
          id?: string
          phone?: string | null
          specialization?: Database["public"]["Enums"]["CoachSpecialization"]
          userId: string
        }
        Update: {
          createdAt?: string
          fullName?: string
          id?: string
          phone?: string | null
          specialization?: Database["public"]["Enums"]["CoachSpecialization"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Coach_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      File: {
        Row: {
          clientId: string | null
          createdAt: string
          data: string | null
          deletedAt: string | null
          downloadedAt: string | null
          expiresAt: string
          groupId: string | null
          id: string
          mimeType: string | null
          name: string
          note: string | null
          path: string
          size: number
          updatedAt: string
          uploadedById: string | null
        }
        Insert: {
          clientId?: string | null
          createdAt?: string
          data?: string | null
          deletedAt?: string | null
          downloadedAt?: string | null
          expiresAt?: string
          groupId?: string | null
          id?: string
          mimeType?: string | null
          name: string
          note?: string | null
          path?: string
          size?: number
          updatedAt?: string
          uploadedById?: string | null
        }
        Update: {
          clientId?: string | null
          createdAt?: string
          data?: string | null
          deletedAt?: string | null
          downloadedAt?: string | null
          expiresAt?: string
          groupId?: string | null
          id?: string
          mimeType?: string | null
          name?: string
          note?: string | null
          path?: string
          size?: number
          updatedAt?: string
          uploadedById?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "File_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "File_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "File_uploadedById_fkey"
            columns: ["uploadedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Group: {
        Row: {
          coachId: string
          createdAt: string
          id: string
          name: string
          type: Database["public"]["Enums"]["GroupType"]
        }
        Insert: {
          coachId: string
          createdAt?: string
          id?: string
          name: string
          type?: Database["public"]["Enums"]["GroupType"]
        }
        Update: {
          coachId?: string
          createdAt?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["GroupType"]
        }
        Relationships: [
          {
            foreignKeyName: "Group_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
        ]
      }
      Lead: {
        Row: {
          consentAccepted: boolean
          createdAt: string
          email: string | null
          fullName: string
          id: string
          message: string | null
          passwordHash: string | null
          phone: string
          source: string
          status: Database["public"]["Enums"]["LeadStatus"]
          updatedAt: string
        }
        Insert: {
          consentAccepted?: boolean
          createdAt?: string
          email?: string | null
          fullName: string
          id?: string
          message?: string | null
          passwordHash?: string | null
          phone: string
          source?: string
          status?: Database["public"]["Enums"]["LeadStatus"]
          updatedAt?: string
        }
        Update: {
          consentAccepted?: boolean
          createdAt?: string
          email?: string | null
          fullName?: string
          id?: string
          message?: string | null
          passwordHash?: string | null
          phone?: string
          source?: string
          status?: Database["public"]["Enums"]["LeadStatus"]
          updatedAt?: string
        }
        Relationships: []
      }
      Payment: {
        Row: {
          amount: number
          clientId: string
          clientSubscriptionId: string | null
          createdAt: string
          currency: string
          date: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          clientId: string
          clientSubscriptionId?: string | null
          createdAt?: string
          currency?: string
          date?: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          clientId?: string
          clientSubscriptionId?: string | null
          createdAt?: string
          currency?: string
          date?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Payment_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Payment_clientSubscriptionId_fkey"
            columns: ["clientSubscriptionId"]
            isOneToOne: false
            referencedRelation: "ClientSubscription"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id?: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SessionBooking: {
        Row: {
          attendedAt: string | null
          bookedAt: string
          canceledAt: string | null
          clientId: string
          createdAt: string
          id: string
          source: Database["public"]["Enums"]["BookingSource"]
          status: Database["public"]["Enums"]["BookingStatus"]
          trainingSessionId: string
          updatedAt: string
        }
        Insert: {
          attendedAt?: string | null
          bookedAt?: string
          canceledAt?: string | null
          clientId: string
          createdAt?: string
          id?: string
          source?: Database["public"]["Enums"]["BookingSource"]
          status?: Database["public"]["Enums"]["BookingStatus"]
          trainingSessionId: string
          updatedAt?: string
        }
        Update: {
          attendedAt?: string | null
          bookedAt?: string
          canceledAt?: string | null
          clientId?: string
          createdAt?: string
          id?: string
          source?: Database["public"]["Enums"]["BookingSource"]
          status?: Database["public"]["Enums"]["BookingStatus"]
          trainingSessionId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "SessionBooking_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SessionBooking_trainingSessionId_fkey"
            columns: ["trainingSessionId"]
            isOneToOne: false
            referencedRelation: "TrainingSession"
            referencedColumns: ["id"]
          },
        ]
      }
      SessionCompensation: {
        Row: {
          approvedById: string
          clientId: string
          createdAt: string
          id: string
          reason: string
          sessions: number
        }
        Insert: {
          approvedById: string
          clientId: string
          createdAt?: string
          id?: string
          reason: string
          sessions?: number
        }
        Update: {
          approvedById?: string
          clientId?: string
          createdAt?: string
          id?: string
          reason?: string
          sessions?: number
        }
        Relationships: [
          {
            foreignKeyName: "SessionCompensation_approvedById_fkey"
            columns: ["approvedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SessionCompensation_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
      SessionNote: {
        Row: {
          authorId: string
          content: string
          createdAt: string
          id: string
          trainingSessionId: string
          updatedAt: string
        }
        Insert: {
          authorId: string
          content: string
          createdAt?: string
          id?: string
          trainingSessionId: string
          updatedAt?: string
        }
        Update: {
          authorId?: string
          content?: string
          createdAt?: string
          id?: string
          trainingSessionId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "SessionNote_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SessionNote_trainingSessionId_fkey"
            columns: ["trainingSessionId"]
            isOneToOne: false
            referencedRelation: "TrainingSession"
            referencedColumns: ["id"]
          },
        ]
      }
      StudioSettings: {
        Row: {
          cancellationWindow: string
          createdAt: string
          defaultSessionLength: string
          id: string
          intakeLeadTime: string
          overbookWaitlist: boolean
          privateSessionBuffer: string
          scheduleStartDay: string
          studioName: string
          supportEmail: string
          supportPhone: string
          timezone: string
          updatedAt: string
        }
        Insert: {
          cancellationWindow?: string
          createdAt?: string
          defaultSessionLength?: string
          id: string
          intakeLeadTime?: string
          overbookWaitlist?: boolean
          privateSessionBuffer?: string
          scheduleStartDay?: string
          studioName?: string
          supportEmail?: string
          supportPhone?: string
          timezone?: string
          updatedAt?: string
        }
        Update: {
          cancellationWindow?: string
          createdAt?: string
          defaultSessionLength?: string
          id?: string
          intakeLeadTime?: string
          overbookWaitlist?: boolean
          privateSessionBuffer?: string
          scheduleStartDay?: string
          studioName?: string
          supportEmail?: string
          supportPhone?: string
          timezone?: string
          updatedAt?: string
        }
        Relationships: []
      }
      SubscriptionPlan: {
        Row: {
          billingCycle: Database["public"]["Enums"]["BillingCycle"]
          createdAt: string
          currency: string
          description: string | null
          id: string
          isActive: boolean
          name: string
          price: number
          sessionsIncluded: number | null
          slug: string
          updatedAt: string
        }
        Insert: {
          billingCycle: Database["public"]["Enums"]["BillingCycle"]
          createdAt?: string
          currency?: string
          description?: string | null
          id?: string
          isActive?: boolean
          name: string
          price: number
          sessionsIncluded?: number | null
          slug: string
          updatedAt?: string
        }
        Update: {
          billingCycle?: Database["public"]["Enums"]["BillingCycle"]
          createdAt?: string
          currency?: string
          description?: string | null
          id?: string
          isActive?: boolean
          name?: string
          price?: number
          sessionsIncluded?: number | null
          slug?: string
          updatedAt?: string
        }
        Relationships: []
      }
      TrainingSession: {
        Row: {
          capacity: number | null
          coachId: string
          createdAt: string
          createdById: string
          description: string | null
          endsAt: string
          groupId: string | null
          id: string
          location: string | null
          startsAt: string
          status: Database["public"]["Enums"]["TrainingSessionStatus"]
          title: string
          type: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt: string
        }
        Insert: {
          capacity?: number | null
          coachId: string
          createdAt?: string
          createdById: string
          description?: string | null
          endsAt: string
          groupId?: string | null
          id?: string
          location?: string | null
          startsAt: string
          status?: Database["public"]["Enums"]["TrainingSessionStatus"]
          title: string
          type: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt?: string
        }
        Update: {
          capacity?: number | null
          coachId?: string
          createdAt?: string
          createdById?: string
          description?: string | null
          endsAt?: string
          groupId?: string | null
          id?: string
          location?: string | null
          startsAt?: string
          status?: Database["public"]["Enums"]["TrainingSessionStatus"]
          title?: string
          type?: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "TrainingSession_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TrainingSession_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TrainingSession_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          clientId: string | null
          createdAt: string
          email: string | null
          emailVerified: string | null
          id: string
          image: string | null
          lastLoginAt: string | null
          mustChangePassword: boolean
          name: string | null
          password: string | null
          passwordResetExpires: string | null
          passwordResetToken: string | null
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
        }
        Insert: {
          clientId?: string | null
          createdAt?: string
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          lastLoginAt?: string | null
          mustChangePassword?: boolean
          name?: string | null
          password?: string | null
          passwordResetExpires?: string | null
          passwordResetToken?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Update: {
          clientId?: string | null
          createdAt?: string
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          lastLoginAt?: string | null
          mustChangePassword?: boolean
          name?: string | null
          password?: string | null
          passwordResetExpires?: string | null
          passwordResetToken?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Relationships: []
      }
      VerificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      WorkoutNote: {
        Row: {
          authorId: string | null
          clientId: string
          content: string
          createdAt: string
          date: string
          id: string
          isPrivate: boolean
          updatedAt: string
        }
        Insert: {
          authorId?: string | null
          clientId: string
          content: string
          createdAt?: string
          date?: string
          id?: string
          isPrivate?: boolean
          updatedAt?: string
        }
        Update: {
          authorId?: string | null
          clientId?: string
          content?: string
          createdAt?: string
          date?: string
          id?: string
          isPrivate?: boolean
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkoutNote_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkoutNote_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_client: {
        Args: {
          p_client_id: string
          p_email: string
          p_full_name: string
          p_group_id: string
          p_password_hash: string
          p_phone: string
        }
        Returns: {
          clientId: string
          userId: string
        }[]
      }
    }
    Enums: {
      BillingCycle: "MONTHLY" | "WEEKLY" | "CUSTOM"
      BookingSource: "BLOCK" | "MANUAL"
      BookingStatus: "BOOKED" | "ATTENDED" | "MISSED" | "CANCELED" | "WAITLIST"
      ClientLifecycleStatus: "ACTIVE" | "PENDING" | "PAUSED"
      ClientPaymentStatus: "PAID" | "UNPAID" | "DUE_SOON"
      CoachSpecialization:
        | "STRENGTH"
        | "CONDITIONING"
        | "MOBILITY"
        | "PRIVATE_COACHING"
      GroupType: "GROUP" | "PRIVATE"
      LeadStatus: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED"
      SubscriptionStatus: "ACTIVE" | "TRIAL" | "PAUSED" | "EXPIRED" | "CANCELED"
      TrainingSessionStatus: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED"
      TrainingSessionType: "GROUP" | "PRIVATE"
      UserRole: "ADMIN" | "COACH" | "CLIENT"
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
      BillingCycle: ["MONTHLY", "WEEKLY", "CUSTOM"],
      BookingSource: ["BLOCK", "MANUAL"],
      BookingStatus: ["BOOKED", "ATTENDED", "MISSED", "CANCELED", "WAITLIST"],
      ClientLifecycleStatus: ["ACTIVE", "PENDING", "PAUSED"],
      ClientPaymentStatus: ["PAID", "UNPAID", "DUE_SOON"],
      CoachSpecialization: [
        "STRENGTH",
        "CONDITIONING",
        "MOBILITY",
        "PRIVATE_COACHING",
      ],
      GroupType: ["GROUP", "PRIVATE"],
      LeadStatus: ["NEW", "CONTACTED", "CONVERTED", "CLOSED"],
      SubscriptionStatus: ["ACTIVE", "TRIAL", "PAUSED", "EXPIRED", "CANCELED"],
      TrainingSessionStatus: ["DRAFT", "SCHEDULED", "COMPLETED", "CANCELED"],
      TrainingSessionType: ["GROUP", "PRIVATE"],
      UserRole: ["ADMIN", "COACH", "CLIENT"],
    },
  },
} as const
