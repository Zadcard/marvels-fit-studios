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
      AuthThrottle: {
        Row: {
          blockedUntil: string | null
          failureCount: number
          keyHash: string
          lastAttemptAt: string
          windowStartedAt: string
        }
        Insert: {
          blockedUntil?: string | null
          failureCount?: number
          keyHash: string
          lastAttemptAt?: string
          windowStartedAt?: string
        }
        Update: {
          blockedUntil?: string | null
          failureCount?: number
          keyHash?: string
          lastAttemptAt?: string
          windowStartedAt?: string
        }
        Relationships: []
      }
      AutomationRun: {
        Row: {
          errorMessage: string | null
          finishedAt: string | null
          id: string
          jobName: string
          notificationsCreated: number
          startedAt: string
          status: string
        }
        Insert: {
          errorMessage?: string | null
          finishedAt?: string | null
          id?: string
          jobName: string
          notificationsCreated?: number
          startedAt?: string
          status: string
        }
        Update: {
          errorMessage?: string | null
          finishedAt?: string | null
          id?: string
          jobName?: string
          notificationsCreated?: number
          startedAt?: string
          status?: string
        }
        Relationships: []
      }
      BillingLedgerEntry: {
        Row: {
          amount: number
          clientId: string
          clientSubscriptionId: string | null
          createdAt: string
          createdById: string | null
          currency: string
          description: string
          id: string
          occurredAt: string
          paymentId: string | null
          receiptNumber: string
          status: Database["public"]["Enums"]["LedgerEntryStatus"]
          type: Database["public"]["Enums"]["LedgerEntryType"]
        }
        Insert: {
          amount: number
          clientId: string
          clientSubscriptionId?: string | null
          createdAt?: string
          createdById?: string | null
          currency?: string
          description: string
          id?: string
          occurredAt?: string
          paymentId?: string | null
          receiptNumber: string
          status?: Database["public"]["Enums"]["LedgerEntryStatus"]
          type: Database["public"]["Enums"]["LedgerEntryType"]
        }
        Update: {
          amount?: number
          clientId?: string
          clientSubscriptionId?: string | null
          createdAt?: string
          createdById?: string | null
          currency?: string
          description?: string
          id?: string
          occurredAt?: string
          paymentId?: string | null
          receiptNumber?: string
          status?: Database["public"]["Enums"]["LedgerEntryStatus"]
          type?: Database["public"]["Enums"]["LedgerEntryType"]
        }
        Relationships: [
          {
            foreignKeyName: "BillingLedgerEntry_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BillingLedgerEntry_clientSubscriptionId_fkey"
            columns: ["clientSubscriptionId"]
            isOneToOne: false
            referencedRelation: "ClientSubscription"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BillingLedgerEntry_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BillingLedgerEntry_paymentId_fkey"
            columns: ["paymentId"]
            isOneToOne: true
            referencedRelation: "Payment"
            referencedColumns: ["id"]
          },
        ]
      }
      CategorySupervisor: {
        Row: {
          categoryId: string
          coachId: string
          createdAt: string
        }
        Insert: {
          categoryId: string
          coachId: string
          createdAt?: string
        }
        Update: {
          categoryId?: string
          coachId?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "CategorySupervisor_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "TrainingCategory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CategorySupervisor_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
        ]
      }
      Client: {
        Row: {
          categoryId: string | null
          createdAt: string
          dateOfBirth: string | null
          fullName: string
          groupId: string | null
          id: string
          injuryNotes: string | null
          injuryStatus: Database["public"]["Enums"]["InjuryStatus"]
          isPaid: boolean
          membershipType: string
          paymentStatus: Database["public"]["Enums"]["ClientPaymentStatus"]
          phone: string | null
          restrictions: string | null
          sessionsLeft: number
          sport: string | null
          status: Database["public"]["Enums"]["ClientLifecycleStatus"]
          trainingCategory: Database["public"]["Enums"]["LegacyTrainingCategory"]
          trialOutcome: Database["public"]["Enums"]["TrialOutcome"] | null
          updatedAt: string
          userId: string
        }
        Insert: {
          categoryId?: string | null
          createdAt?: string
          dateOfBirth?: string | null
          fullName: string
          groupId?: string | null
          id?: string
          injuryNotes?: string | null
          injuryStatus?: Database["public"]["Enums"]["InjuryStatus"]
          isPaid?: boolean
          membershipType?: string
          paymentStatus?: Database["public"]["Enums"]["ClientPaymentStatus"]
          phone?: string | null
          restrictions?: string | null
          sessionsLeft?: number
          sport?: string | null
          status?: Database["public"]["Enums"]["ClientLifecycleStatus"]
          trainingCategory?: Database["public"]["Enums"]["LegacyTrainingCategory"]
          trialOutcome?: Database["public"]["Enums"]["TrialOutcome"] | null
          updatedAt?: string
          userId: string
        }
        Update: {
          categoryId?: string | null
          createdAt?: string
          dateOfBirth?: string | null
          fullName?: string
          groupId?: string | null
          id?: string
          injuryNotes?: string | null
          injuryStatus?: Database["public"]["Enums"]["InjuryStatus"]
          isPaid?: boolean
          membershipType?: string
          paymentStatus?: Database["public"]["Enums"]["ClientPaymentStatus"]
          phone?: string | null
          restrictions?: string | null
          sessionsLeft?: number
          sport?: string | null
          status?: Database["public"]["Enums"]["ClientLifecycleStatus"]
          trainingCategory?: Database["public"]["Enums"]["LegacyTrainingCategory"]
          trialOutcome?: Database["public"]["Enums"]["TrialOutcome"] | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Client_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "TrainingCategory"
            referencedColumns: ["id"]
          },
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
      ClientCoachNote: {
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
            foreignKeyName: "ClientCoachNote_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ClientCoachNote_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
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
          cycleMonths: number
          endsAt: string | null
          id: string
          isAutoRenew: boolean
          nextSessionResetAt: string | null
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
          cycleMonths?: number
          endsAt?: string | null
          id?: string
          isAutoRenew?: boolean
          nextSessionResetAt?: string | null
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
          cycleMonths?: number
          endsAt?: string | null
          id?: string
          isAutoRenew?: boolean
          nextSessionResetAt?: string | null
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
      CoachTrainingCategory: {
        Row: {
          categoryId: string
          coachId: string
          createdAt: string
        }
        Insert: {
          categoryId: string
          coachId: string
          createdAt?: string
        }
        Update: {
          categoryId?: string
          coachId?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "CoachTrainingCategory_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "TrainingCategory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CoachTrainingCategory_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
        ]
      }
      Exercise: {
        Row: {
          category: string
          createdAt: string
          createdById: string | null
          defaultUnit: string | null
          id: string
          instructions: string | null
          isActive: boolean
          name: string
          updatedAt: string
        }
        Insert: {
          category: string
          createdAt?: string
          createdById?: string | null
          defaultUnit?: string | null
          id?: string
          instructions?: string | null
          isActive?: boolean
          name: string
          updatedAt?: string
        }
        Update: {
          category?: string
          createdAt?: string
          createdById?: string | null
          defaultUnit?: string | null
          id?: string
          instructions?: string | null
          isActive?: boolean
          name?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Exercise_createdById_fkey"
            columns: ["createdById"]
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
          deletedAt?: string | null
          downloadedAt?: string | null
          expiresAt?: string
          groupId?: string | null
          id?: string
          mimeType?: string | null
          name: string
          note?: string | null
          path: string
          size?: number
          updatedAt?: string
          uploadedById?: string | null
        }
        Update: {
          clientId?: string | null
          createdAt?: string
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
          categoryId: string
          coachId: string
          createdAt: string
          id: string
          isActive: boolean
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["GroupType"]
        }
        Insert: {
          categoryId: string
          coachId: string
          createdAt?: string
          id?: string
          isActive?: boolean
          name: string
          notes?: string | null
          type?: Database["public"]["Enums"]["GroupType"]
        }
        Update: {
          categoryId?: string
          coachId?: string
          createdAt?: string
          id?: string
          isActive?: boolean
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["GroupType"]
        }
        Relationships: [
          {
            foreignKeyName: "Group_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "TrainingCategory"
            referencedColumns: ["id"]
          },
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
          categoryId: string | null
          consentAccepted: boolean
          createdAt: string
          email: string | null
          fullName: string
          id: string
          interestedCategory:
            | Database["public"]["Enums"]["LegacyTrainingCategory"]
            | null
          lostReason: string | null
          message: string | null
          phone: string
          preferredAvailability: string | null
          source: string
          status: Database["public"]["Enums"]["LeadStatus"]
          trialGroupId: string | null
          updatedAt: string
        }
        Insert: {
          categoryId?: string | null
          consentAccepted?: boolean
          createdAt?: string
          email?: string | null
          fullName: string
          id?: string
          interestedCategory?:
            | Database["public"]["Enums"]["LegacyTrainingCategory"]
            | null
          lostReason?: string | null
          message?: string | null
          phone: string
          preferredAvailability?: string | null
          source?: string
          status?: Database["public"]["Enums"]["LeadStatus"]
          trialGroupId?: string | null
          updatedAt?: string
        }
        Update: {
          categoryId?: string | null
          consentAccepted?: boolean
          createdAt?: string
          email?: string | null
          fullName?: string
          id?: string
          interestedCategory?:
            | Database["public"]["Enums"]["LegacyTrainingCategory"]
            | null
          lostReason?: string | null
          message?: string | null
          phone?: string
          preferredAvailability?: string | null
          source?: string
          status?: Database["public"]["Enums"]["LeadStatus"]
          trialGroupId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Lead_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "TrainingCategory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Lead_trialGroupId_fkey"
            columns: ["trialGroupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          body: string
          createdAt: string
          dedupeKey: string
          href: string | null
          id: string
          kind: Database["public"]["Enums"]["NotificationKind"]
          metadata: Json
          readAt: string | null
          recipientId: string
          sentAt: string
          status: Database["public"]["Enums"]["NotificationStatus"]
          title: string
        }
        Insert: {
          body: string
          createdAt?: string
          dedupeKey: string
          href?: string | null
          id?: string
          kind: Database["public"]["Enums"]["NotificationKind"]
          metadata?: Json
          readAt?: string | null
          recipientId: string
          sentAt?: string
          status?: Database["public"]["Enums"]["NotificationStatus"]
          title: string
        }
        Update: {
          body?: string
          createdAt?: string
          dedupeKey?: string
          href?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["NotificationKind"]
          metadata?: Json
          readAt?: string | null
          recipientId?: string
          sentAt?: string
          status?: Database["public"]["Enums"]["NotificationStatus"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_recipientId_fkey"
            columns: ["recipientId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PasswordResetGrant: {
        Row: {
          createdAt: string
          createdById: string
          expiresAt: string
          id: string
          revokedAt: string | null
          tokenHash: string
          usedAt: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          createdById: string
          expiresAt: string
          id?: string
          revokedAt?: string | null
          tokenHash: string
          usedAt?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          createdById?: string
          expiresAt?: string
          id?: string
          revokedAt?: string | null
          tokenHash?: string
          usedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PasswordResetGrant_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PasswordResetGrant_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
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
          method: string | null
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
          method?: string | null
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
          method?: string | null
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
      RateLimitBucket: {
        Row: {
          blockedUntil: string | null
          keyHash: string
          lastRequestAt: string
          requestCount: number
          windowStartedAt: string
        }
        Insert: {
          blockedUntil?: string | null
          keyHash: string
          lastRequestAt?: string
          requestCount?: number
          windowStartedAt?: string
        }
        Update: {
          blockedUntil?: string | null
          keyHash?: string
          lastRequestAt?: string
          requestCount?: number
          windowStartedAt?: string
        }
        Relationships: []
      }
      Receipt: {
        Row: {
          billingLedgerEntryId: string | null
          clientId: string | null
          content: string
          createdAt: string
          id: string
          receiptNumber: string
          snapshot: Json | null
          updatedAt: string
        }
        Insert: {
          billingLedgerEntryId?: string | null
          clientId?: string | null
          content: string
          createdAt?: string
          id?: string
          receiptNumber: string
          snapshot?: Json | null
          updatedAt?: string
        }
        Update: {
          billingLedgerEntryId?: string | null
          clientId?: string | null
          content?: string
          createdAt?: string
          id?: string
          receiptNumber?: string
          snapshot?: Json | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Receipt_billingLedgerEntryId_fkey"
            columns: ["billingLedgerEntryId"]
            isOneToOne: true
            referencedRelation: "BillingLedgerEntry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Receipt_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
        ]
      }
      RecurringSessionSlot: {
        Row: {
          createdAt: string
          id: string
          localStartTime: string
          templateId: string
          updatedAt: string
          weekday: number
        }
        Insert: {
          createdAt?: string
          id?: string
          localStartTime: string
          templateId: string
          updatedAt?: string
          weekday: number
        }
        Update: {
          createdAt?: string
          id?: string
          localStartTime?: string
          templateId?: string
          updatedAt?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "RecurringSessionSlot_templateId_fkey"
            columns: ["templateId"]
            isOneToOne: false
            referencedRelation: "RecurringSessionTemplate"
            referencedColumns: ["id"]
          },
        ]
      }
      RecurringSessionTemplate: {
        Row: {
          active: boolean
          coachId: string
          createdAt: string
          createdById: string
          description: string | null
          durationMinutes: number
          endsOn: string | null
          groupId: string | null
          id: string
          lastGeneratedThrough: string | null
          startsOn: string
          status: Database["public"]["Enums"]["TrainingSessionStatus"]
          timezone: string
          title: string
          type: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt: string
        }
        Insert: {
          active?: boolean
          coachId: string
          createdAt?: string
          createdById: string
          description?: string | null
          durationMinutes: number
          endsOn?: string | null
          groupId?: string | null
          id?: string
          lastGeneratedThrough?: string | null
          startsOn: string
          status?: Database["public"]["Enums"]["TrainingSessionStatus"]
          timezone?: string
          title: string
          type: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt?: string
        }
        Update: {
          active?: boolean
          coachId?: string
          createdAt?: string
          createdById?: string
          description?: string | null
          durationMinutes?: number
          endsOn?: string | null
          groupId?: string | null
          id?: string
          lastGeneratedThrough?: string | null
          startsOn?: string
          status?: Database["public"]["Enums"]["TrainingSessionStatus"]
          timezone?: string
          title?: string
          type?: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "RecurringSessionTemplate_coachId_fkey"
            columns: ["coachId"]
            isOneToOne: false
            referencedRelation: "Coach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RecurringSessionTemplate_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RecurringSessionTemplate_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
        ]
      }
      ScheduleChangeLog: {
        Row: {
          changeType: string
          createdAt: string
          id: string
          newCoachId: string | null
          newEndsAt: string | null
          newStartsAt: string | null
          newStatus: Database["public"]["Enums"]["TrainingSessionStatus"] | null
          previousCoachId: string | null
          previousEndsAt: string | null
          previousStartsAt: string | null
          previousStatus:
            | Database["public"]["Enums"]["TrainingSessionStatus"]
            | null
          trainingSessionId: string
        }
        Insert: {
          changeType: string
          createdAt?: string
          id?: string
          newCoachId?: string | null
          newEndsAt?: string | null
          newStartsAt?: string | null
          newStatus?:
            | Database["public"]["Enums"]["TrainingSessionStatus"]
            | null
          previousCoachId?: string | null
          previousEndsAt?: string | null
          previousStartsAt?: string | null
          previousStatus?:
            | Database["public"]["Enums"]["TrainingSessionStatus"]
            | null
          trainingSessionId: string
        }
        Update: {
          changeType?: string
          createdAt?: string
          id?: string
          newCoachId?: string | null
          newEndsAt?: string | null
          newStartsAt?: string | null
          newStatus?:
            | Database["public"]["Enums"]["TrainingSessionStatus"]
            | null
          previousCoachId?: string | null
          previousEndsAt?: string | null
          previousStartsAt?: string | null
          previousStatus?:
            | Database["public"]["Enums"]["TrainingSessionStatus"]
            | null
          trainingSessionId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ScheduleChangeLog_trainingSessionId_fkey"
            columns: ["trainingSessionId"]
            isOneToOne: false
            referencedRelation: "TrainingSession"
            referencedColumns: ["id"]
          },
        ]
      }
      ScheduleChangeRequest: {
        Row: {
          clientId: string
          createdAt: string
          createdById: string
          decidedAt: string | null
          decidedById: string | null
          effectiveFrom: string | null
          fromWeekdays: number[] | null
          groupId: string | null
          id: string
          kind: string
          reason: string
          resultSummary: string | null
          sourceSessionId: string | null
          status: string
          targetSessionId: string | null
          toGroupId: string | null
          toWeekdays: number[] | null
        }
        Insert: {
          clientId: string
          createdAt?: string
          createdById: string
          decidedAt?: string | null
          decidedById?: string | null
          effectiveFrom?: string | null
          fromWeekdays?: number[] | null
          groupId?: string | null
          id?: string
          kind: string
          reason: string
          resultSummary?: string | null
          sourceSessionId?: string | null
          status?: string
          targetSessionId?: string | null
          toGroupId?: string | null
          toWeekdays?: number[] | null
        }
        Update: {
          clientId?: string
          createdAt?: string
          createdById?: string
          decidedAt?: string | null
          decidedById?: string | null
          effectiveFrom?: string | null
          fromWeekdays?: number[] | null
          groupId?: string | null
          id?: string
          kind?: string
          reason?: string
          resultSummary?: string | null
          sourceSessionId?: string | null
          status?: string
          targetSessionId?: string | null
          toGroupId?: string | null
          toWeekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ScheduleChangeRequest_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "Client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduleChangeRequest_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduleChangeRequest_decidedById_fkey"
            columns: ["decidedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduleChangeRequest_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduleChangeRequest_sourceSessionId_fkey"
            columns: ["sourceSessionId"]
            isOneToOne: false
            referencedRelation: "TrainingSession"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduleChangeRequest_targetSessionId_fkey"
            columns: ["targetSessionId"]
            isOneToOne: false
            referencedRelation: "TrainingSession"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ScheduleChangeRequest_toGroupId_fkey"
            columns: ["toGroupId"]
            isOneToOne: false
            referencedRelation: "Group"
            referencedColumns: ["id"]
          },
        ]
      }
      SecurityEvent: {
        Row: {
          authMethod: string | null
          createdAt: string
          eventType: string
          id: string
          identifierHash: string | null
          ipHash: string | null
          metadata: Json
          outcome: string
          userId: string | null
        }
        Insert: {
          authMethod?: string | null
          createdAt?: string
          eventType: string
          id?: string
          identifierHash?: string | null
          ipHash?: string | null
          metadata?: Json
          outcome: string
          userId?: string | null
        }
        Update: {
          authMethod?: string | null
          createdAt?: string
          eventType?: string
          id?: string
          identifierHash?: string | null
          ipHash?: string | null
          metadata?: Json
          outcome?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "SecurityEvent_userId_fkey"
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
      StudioExpense: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["StudioExpenseCategory"]
          createdAt: string
          createdById: string
          currency: string
          description: string
          expenseNumber: string
          id: string
          occurredAt: string
          paymentMethod: Database["public"]["Enums"]["StudioExpenseMethod"]
          reference: string | null
          status: Database["public"]["Enums"]["StudioExpenseStatus"]
          voidedAt: string | null
          voidedById: string | null
          voidReason: string | null
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["StudioExpenseCategory"]
          createdAt?: string
          createdById: string
          currency?: string
          description: string
          expenseNumber: string
          id?: string
          occurredAt: string
          paymentMethod: Database["public"]["Enums"]["StudioExpenseMethod"]
          reference?: string | null
          status?: Database["public"]["Enums"]["StudioExpenseStatus"]
          voidedAt?: string | null
          voidedById?: string | null
          voidReason?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["StudioExpenseCategory"]
          createdAt?: string
          createdById?: string
          currency?: string
          description?: string
          expenseNumber?: string
          id?: string
          occurredAt?: string
          paymentMethod?: Database["public"]["Enums"]["StudioExpenseMethod"]
          reference?: string | null
          status?: Database["public"]["Enums"]["StudioExpenseStatus"]
          voidedAt?: string | null
          voidedById?: string | null
          voidReason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "StudioExpense_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StudioExpense_voidedById_fkey"
            columns: ["voidedById"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      StudioIncome: {
        Row: {
          amount: number
          createdAt: string
          createdById: string
          currency: string
          id: string
          incomeNumber: string
          method: string
          note: string | null
          occurredAt: string
          sourceLabel: string
        }
        Insert: {
          amount: number
          createdAt?: string
          createdById: string
          currency?: string
          id?: string
          incomeNumber: string
          method: string
          note?: string | null
          occurredAt: string
          sourceLabel: string
        }
        Update: {
          amount?: number
          createdAt?: string
          createdById?: string
          currency?: string
          id?: string
          incomeNumber?: string
          method?: string
          note?: string | null
          occurredAt?: string
          sourceLabel?: string
        }
        Relationships: [
          {
            foreignKeyName: "StudioIncome_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "User"
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
      TrainingCategory: {
        Row: {
          createdAt: string
          id: string
          isActive: boolean
          legacyValue: string | null
          name: string
          slug: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: string
          isActive?: boolean
          legacyValue?: string | null
          name: string
          slug: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          isActive?: boolean
          legacyValue?: string | null
          name?: string
          slug?: string
          updatedAt?: string
        }
        Relationships: []
      }
      TrainingSession: {
        Row: {
          coachId: string
          createdAt: string
          createdById: string
          description: string | null
          endsAt: string
          groupId: string | null
          id: string
          isTemplateException: boolean
          location: string | null
          sourceSlotId: string | null
          sourceTemplateId: string | null
          startsAt: string
          status: Database["public"]["Enums"]["TrainingSessionStatus"]
          title: string
          type: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt: string
        }
        Insert: {
          coachId: string
          createdAt?: string
          createdById: string
          description?: string | null
          endsAt: string
          groupId?: string | null
          id?: string
          isTemplateException?: boolean
          location?: string | null
          sourceSlotId?: string | null
          sourceTemplateId?: string | null
          startsAt: string
          status?: Database["public"]["Enums"]["TrainingSessionStatus"]
          title: string
          type: Database["public"]["Enums"]["TrainingSessionType"]
          updatedAt?: string
        }
        Update: {
          coachId?: string
          createdAt?: string
          createdById?: string
          description?: string | null
          endsAt?: string
          groupId?: string | null
          id?: string
          isTemplateException?: boolean
          location?: string | null
          sourceSlotId?: string | null
          sourceTemplateId?: string | null
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
          {
            foreignKeyName: "TrainingSession_sourceSlotId_fkey"
            columns: ["sourceSlotId"]
            isOneToOne: false
            referencedRelation: "RecurringSessionSlot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TrainingSession_sourceTemplateId_fkey"
            columns: ["sourceTemplateId"]
            isOneToOne: false
            referencedRelation: "RecurringSessionTemplate"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string | null
          id: string
          lastLoginAt: string | null
          mustChangePassword: boolean
          name: string | null
          password: string | null
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email?: string | null
          id?: string
          lastLoginAt?: string | null
          mustChangePassword?: boolean
          name?: string | null
          password?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string | null
          id?: string
          lastLoginAt?: string | null
          mustChangePassword?: boolean
          name?: string | null
          password?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_client: {
        Args: { target_client_id: string }
        Returns: undefined
      }
      admin_mutate_subscription: {
        Args: {
          target_action: string
          target_amount?: number
          target_duration_months?: number
          target_id: string
          target_note?: string
          target_payment_method: string
          target_sessions_per_month?: number
        }
        Returns: Json
      }
      admin_save_client: { Args: { payload: Json }; Returns: string }
      admin_save_subscription: { Args: { payload: Json }; Returns: Json }
      book_client_into_session: {
        Args: { p_client_id: string; p_session_id: string }
        Returns: Json
      }
      build_receipt_snapshot: {
        Args: { p_ledger_entry_id: string }
        Returns: Json
      }
      bulk_update_session_attendance: {
        Args: {
          p_client_ids: string[]
          p_status: Database["public"]["Enums"]["BookingStatus"]
          p_training_session_id: string
        }
        Returns: number
      }
      bulk_update_training_sessions: {
        Args: { p_action: string; p_coach_id: string; p_session_ids: string[] }
        Returns: number
      }
      cancel_training_session: {
        Args: { p_session_id: string }
        Returns: {
          id: string
        }[]
      }
      check_auth_throttle: { Args: { p_key_hash: string }; Returns: Json }
      close_lead_as_lost: {
        Args: { target_lead_id: string; target_reason: string }
        Returns: undefined
      }
      consume_password_reset_grant: {
        Args: { p_password_hash: string; p_token_hash: string }
        Returns: boolean
      }
      consume_rate_limit: {
        Args: {
          p_block_seconds: number
          p_key_hash: string
          p_max_attempts: number
          p_window_seconds: number
        }
        Returns: Json
      }
      decide_schedule_change_request: {
        Args: {
          p_decided_by_id: string
          p_decision: string
          p_request_id: string
        }
        Returns: string
      }
      delete_coach: { Args: { p_coach_id: string }; Returns: undefined }
      delete_recurring_session_template: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      delete_training_session: {
        Args: { p_session_id: string }
        Returns: {
          id: string
        }[]
      }
      enqueue_studio_notifications: {
        Args: { p_now?: string }
        Returns: number
      }
      generate_recurring_sessions: {
        Args: { p_template_id: string; p_through_date: string }
        Returns: number
      }
      issue_password_reset_grant: {
        Args: {
          p_created_by_id: string
          p_expires_at: string
          p_token_hash: string
          p_user_id: string
        }
        Returns: string
      }
      log_schedule_change_request: {
        Args: {
          p_client_id: string
          p_created_by_id: string
          p_effective_from?: string
          p_from_weekdays?: number[]
          p_group_id?: string
          p_kind: string
          p_reason: string
          p_source_session_id?: string
          p_target_session_id?: string
          p_to_group_id?: string
          p_to_weekdays?: number[]
        }
        Returns: string
      }
      promote_lead_to_client: {
        Args: { target_lead_id: string }
        Returns: Json
      }
      reconcile_client_subscription_lifecycle: {
        Args: { target_client_id: string }
        Returns: undefined
      }
      reconcile_subscription_session_windows: {
        Args: never
        Returns: undefined
      }
      record_auth_attempt: {
        Args: {
          p_auth_method: string
          p_identifier_hash: string
          p_ip_hash: string
          p_key_hash: string
          p_success: boolean
          p_user_id?: string
        }
        Returns: Json
      }
      record_ledger_adjustment: {
        Args: {
          p_amount: number
          p_client_id: string
          p_created_by_id: string
          p_currency: string
          p_description: string
          p_subscription_id: string
          p_type: Database["public"]["Enums"]["LedgerEntryType"]
        }
        Returns: string
      }
      record_security_event: {
        Args: {
          p_auth_method?: string
          p_event_type: string
          p_identifier_hash?: string
          p_ip_hash?: string
          p_metadata?: Json
          p_outcome: string
          p_user_id?: string
        }
        Returns: string
      }
      record_studio_expense: {
        Args: {
          p_amount: number
          p_category: Database["public"]["Enums"]["StudioExpenseCategory"]
          p_created_by_id: string
          p_currency: string
          p_description: string
          p_occurred_at: string
          p_payment_method: Database["public"]["Enums"]["StudioExpenseMethod"]
          p_reference: string
        }
        Returns: string
      }
      record_studio_income: {
        Args: {
          p_amount: number
          p_created_by_id: string
          p_currency: string
          p_method: string
          p_note: string
          p_occurred_at: string
          p_source_label: string
        }
        Returns: string
      }
      register_client: {
        Args: {
          p_email: string
          p_full_name: string
          p_group_id: string
          p_phone: string
        }
        Returns: {
          userId: string
        }[]
      }
      run_studio_notification_automation: {
        Args: { p_now?: string }
        Returns: Json
      }
      save_admin_group: {
        Args: {
          p_category_id: string
          p_coach_id: string
          p_group_id: string
          p_is_active: boolean
          p_name: string
          p_notes: string
          p_type: Database["public"]["Enums"]["GroupType"]
        }
        Returns: string
      }
      save_client_settings: {
        Args: {
          p_email: string
          p_full_name: string
          p_goal_label: string
          p_phone: string
          p_preferred_session_time: string
          p_user_id: string
        }
        Returns: undefined
      }
      save_coach: {
        Args: {
          p_category_ids: string[]
          p_coach_id: string
          p_email: string
          p_full_name: string
          p_password_hash: string
          p_phone: string
          p_specialization: Database["public"]["Enums"]["CoachSpecialization"]
        }
        Returns: string
      }
      save_coach_settings: {
        Args: {
          p_email: string
          p_full_name: string
          p_phone: string
          p_specialization: Database["public"]["Enums"]["CoachSpecialization"]
          p_user_id: string
        }
        Returns: undefined
      }
      set_admin_group_membership: {
        Args: { p_action: string; p_client_id: string; p_group_id: string }
        Returns: undefined
      }
      set_category_supervisors: {
        Args: { p_category_id: string; p_coach_ids: string[] }
        Returns: undefined
      }
      set_client_payment_status: {
        Args: {
          p_amount: number
          p_client_id: string
          p_status: Database["public"]["Enums"]["ClientPaymentStatus"]
        }
        Returns: undefined
      }
      sync_group_memberships: {
        Args: { p_client_ids: string[]; p_group_id: string }
        Returns: undefined
      }
      sync_recurring_session_template: {
        Args: {
          p_coach_id: string
          p_created_by_id: string
          p_description: string
          p_duration_minutes: number
          p_ends_on: string
          p_group_id: string
          p_slots: Json
          p_starts_on: string
          p_template_id: string
          p_through_date?: string
          p_title: string
          p_type: Database["public"]["Enums"]["TrainingSessionType"]
        }
        Returns: string
      }
      update_session_attendance: {
        Args: {
          p_client_id: string
          p_status: Database["public"]["Enums"]["BookingStatus"]
          p_training_session_id: string
        }
        Returns: {
          id: string
        }[]
      }
      update_training_session: {
        Args: {
          p_coach_id: string
          p_description: string
          p_ends_at: string
          p_group_id: string
          p_location: string
          p_session_id: string
          p_starts_at: string
          p_status: Database["public"]["Enums"]["TrainingSessionStatus"]
          p_title: string
          p_type: Database["public"]["Enums"]["TrainingSessionType"]
        }
        Returns: {
          id: string
        }[]
      }
      void_studio_expense: {
        Args: { p_expense_id: string; p_reason: string; p_voided_by_id: string }
        Returns: undefined
      }
    }
    Enums: {
      AssessmentStatus: "DRAFT" | "COMPLETE"
      BillingCycle: "MONTHLY" | "WEEKLY" | "CUSTOM"
      BookingSource: "BLOCK" | "MANUAL"
      BookingStatus:
        | "BOOKED"
        | "ATTENDED"
        | "LATE"
        | "MISSED"
        | "EXCUSED"
        | "CANCELED"
        | "WAITLIST"
        | "NO_SHOW"
        | "RESCHEDULED"
      ClientLifecycleStatus:
        | "ACTIVE"
        | "PENDING"
        | "PAUSED"
        | "TRIAL"
        | "INACTIVE"
        | "DID_NOT_CONTINUE"
      ClientPaymentStatus: "PAID" | "UNPAID" | "DUE_SOON"
      CoachSpecialization:
        | "STRENGTH"
        | "CONDITIONING"
        | "MOBILITY"
        | "PRIVATE_COACHING"
        | "FOOTBALL"
        | "TENNIS"
        | "CALISTHENICS"
        | "REHAB"
        | "ATHLETIC_PERFORMANCE"
        | "GENERAL_FITNESS"
      GroupType: "GROUP" | "PRIVATE"
      InjuryStatus: "NONE" | "CURRENT" | "PREVIOUS" | "REHAB"
      LeadStatus: "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED" | "TRIAL_DONE"
      LedgerEntryStatus: "POSTED" | "VOID"
      LedgerEntryType: "PAYMENT" | "CHARGE" | "CREDIT" | "REFUND"
      LegacyTrainingCategory:
        | "FOOTBALL"
        | "TENNIS"
        | "OTHER_SPORT"
        | "FAT_LOSS"
        | "MUSCLE_GAIN"
        | "CALISTHENICS"
        | "REHAB"
        | "GENERAL_FITNESS"
      NotificationKind: "SESSION_REMINDER" | "RENEWAL_REMINDER" | "SYSTEM"
      NotificationStatus: "SENT" | "READ" | "FAILED"
      StudioExpenseCategory:
        | "SUPPLIES"
        | "MAINTENANCE"
        | "COACH_PAYMENT"
        | "RENT_UTILITIES"
        | "MARKETING"
        | "OTHER"
      StudioExpenseMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "INSTAPAY"
      StudioExpenseStatus: "POSTED" | "VOID"
      SubscriptionStatus:
        | "ACTIVE"
        | "TRIAL"
        | "PAUSED"
        | "EXPIRED"
        | "CANCELED"
        | "UPCOMING"
        | "QUEUED"
      TrainingSessionStatus: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED"
      TrainingSessionType: "GROUP" | "PRIVATE"
      TrialOutcome:
        | "SUBSCRIBED"
        | "FOLLOW_UP"
        | "DID_NOT_CONTINUE"
        | "NO_RESPONSE"
        | "NO_SHOW"
        | "NEEDS_DIFFERENT_OPTION"
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
      AssessmentStatus: ["DRAFT", "COMPLETE"],
      BillingCycle: ["MONTHLY", "WEEKLY", "CUSTOM"],
      BookingSource: ["BLOCK", "MANUAL"],
      BookingStatus: [
        "BOOKED",
        "ATTENDED",
        "LATE",
        "MISSED",
        "EXCUSED",
        "CANCELED",
        "WAITLIST",
        "NO_SHOW",
        "RESCHEDULED",
      ],
      ClientLifecycleStatus: [
        "ACTIVE",
        "PENDING",
        "PAUSED",
        "TRIAL",
        "INACTIVE",
        "DID_NOT_CONTINUE",
      ],
      ClientPaymentStatus: ["PAID", "UNPAID", "DUE_SOON"],
      CoachSpecialization: [
        "STRENGTH",
        "CONDITIONING",
        "MOBILITY",
        "PRIVATE_COACHING",
        "FOOTBALL",
        "TENNIS",
        "CALISTHENICS",
        "REHAB",
        "ATHLETIC_PERFORMANCE",
        "GENERAL_FITNESS",
      ],
      GroupType: ["GROUP", "PRIVATE"],
      InjuryStatus: ["NONE", "CURRENT", "PREVIOUS", "REHAB"],
      LeadStatus: ["NEW", "CONTACTED", "CONVERTED", "CLOSED", "TRIAL_DONE"],
      LedgerEntryStatus: ["POSTED", "VOID"],
      LedgerEntryType: ["PAYMENT", "CHARGE", "CREDIT", "REFUND"],
      LegacyTrainingCategory: [
        "FOOTBALL",
        "TENNIS",
        "OTHER_SPORT",
        "FAT_LOSS",
        "MUSCLE_GAIN",
        "CALISTHENICS",
        "REHAB",
        "GENERAL_FITNESS",
      ],
      NotificationKind: ["SESSION_REMINDER", "RENEWAL_REMINDER", "SYSTEM"],
      NotificationStatus: ["SENT", "READ", "FAILED"],
      StudioExpenseCategory: [
        "SUPPLIES",
        "MAINTENANCE",
        "COACH_PAYMENT",
        "RENT_UTILITIES",
        "MARKETING",
        "OTHER",
      ],
      StudioExpenseMethod: ["CASH", "CARD", "BANK_TRANSFER", "INSTAPAY"],
      StudioExpenseStatus: ["POSTED", "VOID"],
      SubscriptionStatus: [
        "ACTIVE",
        "TRIAL",
        "PAUSED",
        "EXPIRED",
        "CANCELED",
        "UPCOMING",
        "QUEUED",
      ],
      TrainingSessionStatus: ["DRAFT", "SCHEDULED", "COMPLETED", "CANCELED"],
      TrainingSessionType: ["GROUP", "PRIVATE"],
      TrialOutcome: [
        "SUBSCRIBED",
        "FOLLOW_UP",
        "DID_NOT_CONTINUE",
        "NO_RESPONSE",
        "NO_SHOW",
        "NEEDS_DIFFERENT_OPTION",
      ],
      UserRole: ["ADMIN", "COACH", "CLIENT"],
    },
  },
} as const
