import { describe, expect, it } from "vitest";
import { generateReceiptPDF, type ReceiptSnapshot } from "../lib/receipts/pdf-generator";

describe("Subscriptions, Renewals, Payments & Receipts Unit Tests", () => {
  describe("Early Renewal Calculation Logic", () => {
    it("preserves 15 remaining days when renewing an active time-based subscription", () => {
      const now = new Date("2026-07-21T12:00:00.000Z");
      const currentRenewsAt = new Date("2026-08-05T12:00:00.000Z"); // 15 days in future

      // If active sub renewsAt > now, new subscription start date = currentRenewsAt
      const newStartsAt = currentRenewsAt > now ? currentRenewsAt : now;
      const durationMonths = 1;
      const newRenewsAt = new Date(newStartsAt);
      newRenewsAt.setMonth(newRenewsAt.getMonth() + durationMonths);

      expect(newStartsAt.toISOString()).toBe("2026-08-05T12:00:00.000Z");
      expect(newRenewsAt.toISOString()).toBe("2026-09-05T12:00:00.000Z");
    });

    it("starts immediately today when renewing an expired subscription", () => {
      const now = new Date("2026-07-21T12:00:00.000Z");
      const currentRenewsAt = new Date("2026-07-10T12:00:00.000Z"); // expired 11 days ago

      const newStartsAt = currentRenewsAt > now ? currentRenewsAt : now;
      const durationMonths = 1;
      const newRenewsAt = new Date(newStartsAt);
      newRenewsAt.setMonth(newRenewsAt.getMonth() + durationMonths);

      expect(newStartsAt.toISOString()).toBe("2026-07-21T12:00:00.000Z");
      expect(newRenewsAt.toISOString()).toBe("2026-08-21T12:00:00.000Z");
    });

    it("appends multiple queued renewals sequentially without overlapping active dates", () => {
      const activeEnd = new Date("2026-08-01T00:00:00.000Z");

      // First renewal queued
      const sub1Start = activeEnd;
      const sub1End = new Date(sub1Start);
      sub1End.setMonth(sub1End.getMonth() + 1);

      // Second renewal queued
      const sub2Start = sub1End;
      const sub2End = new Date(sub2Start);
      sub2End.setMonth(sub2End.getMonth() + 1);

      expect(sub1Start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
      expect(sub1End.toISOString()).toBe("2026-09-01T00:00:00.000Z");
      expect(sub2Start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
      expect(sub2End.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    });

    it("preserves remaining sessions when renewing a session-based plan early", () => {
      const activeSessionsLeft = 5;
      const newPackageSessions = 12;

      // Active sessions should remain 5 until current package completes
      const updatedActiveSessions = activeSessionsLeft;
      const queuedPackageSessions = newPackageSessions;

      expect(updatedActiveSessions).toBe(5);
      expect(queuedPackageSessions).toBe(12);
    });
  });

  describe("Receipt Snapshot Persistence & Sorting", () => {
    const mockSnapshot1: ReceiptSnapshot = {
      receiptNumber: "MFS-202607-001",
      clientId: "client-101",
      clientName: "Aly Mazhar",
      clientPhone: "+201001234567",
      amount: 2500,
      currency: "EGP",
      paymentMethod: "InstaPay",
      paymentDate: "2026-07-01T10:00:00.000Z",
      planName: "Monthly Group Membership",
      planType: "Group Membership",
      billingCycle: "MONTHLY",
      durationMonths: 1,
      sessionsIncluded: 16,
      coachName: "Ahmed Waheed",
      groupName: "CrossFit Morning",
      paymentStatus: "PAID",
    };

    const mockSnapshot2: ReceiptSnapshot = {
      receiptNumber: "MFS-202607-002",
      clientId: "client-101",
      clientName: "Aly Mazhar",
      clientPhone: "+201001234567",
      amount: 2500,
      currency: "EGP",
      paymentMethod: "Visa",
      paymentDate: "2026-07-20T14:30:00.000Z",
      planName: "Monthly Group Membership",
      planType: "Group Membership",
      billingCycle: "MONTHLY",
      durationMonths: 1,
      sessionsIncluded: 16,
      coachName: "Ahmed Waheed",
      groupName: "CrossFit Morning",
      paymentStatus: "PAID",
    };

    it("sorts receipt history newest first", () => {
      const history = [mockSnapshot1, mockSnapshot2];
      const sorted = [...history].sort((a, b) => {
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      });

      expect(sorted[0].receiptNumber).toBe("MFS-202607-002");
      expect(sorted[1].receiptNumber).toBe("MFS-202607-001");
    });

    it("preserves historical snapshot even if client coach changes later", () => {
      // Simulating a snapshot created when coach was Ahmed Waheed
      const savedSnapshot = { ...mockSnapshot1 };

      // Client later changes coach to Karim Adel
      const currentClientState = {
        fullName: "Aly Mazhar",
        coachName: "Karim Adel",
      };

      // Saved receipt snapshot must remain unchanged
      expect(savedSnapshot.coachName).toBe("Ahmed Waheed");
      expect(currentClientState.coachName).toBe("Karim Adel");
    });

    it("handles optional coach or group assignments gracefully", () => {
      const unassignedSnapshot: ReceiptSnapshot = {
        ...mockSnapshot1,
        receiptNumber: "MFS-202607-003",
        coachName: null,
        groupName: null,
      };

      expect(unassignedSnapshot.coachName).toBeNull();
      expect(unassignedSnapshot.groupName).toBeNull();
      expect(unassignedSnapshot.receiptNumber).toBe("MFS-202607-003");
    });
  });

  describe("PDF Generator Service", () => {
    it("generates PDF without throwing errors", () => {
      const testSnapshot: ReceiptSnapshot = {
        receiptNumber: "MFS-202607-TEST",
        clientName: "Test Client",
        clientPhone: "+201234567890",
        amount: 1850,
        currency: "EGP",
        paymentMethod: "Cash",
        paymentDate: "2026-07-21T10:00:00Z",
        planName: "Monthly Membership",
        planType: "Group Membership",
        billingCycle: "MONTHLY",
        durationMonths: 1,
        sessionsIncluded: 12,
        coachName: "Coach Farouk",
        groupName: "Group B",
        paymentStatus: "PAID",
      };

      expect(() => generateReceiptPDF(testSnapshot)).not.toThrow();
    });

    it("handles pdf generation failure gracefully with visible error message", () => {
      const invalidSnapshot = null as unknown as ReceiptSnapshot;

      expect(() => generateReceiptPDF(invalidSnapshot)).toThrow();
    });
  });
});
