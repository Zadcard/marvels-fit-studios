import type { ComponentProps } from "react";

import type { WorkspaceDefinition } from "@/lib/dashboard/workspace-definition";
import {
  adminClientMembershipFilters,
  adminPaymentStatusFilters,
  adminClientStatusFilters,
  type AdminClientMembership,
  type AdminClientRecord,
  type AdminPaymentStatus,
  type AdminClientStatus,
} from "@/lib/dashboard/admin-dashboard-data";

export type ClientFormState = {
  fullName: string;
  email: string;
  phone: string;
  membership: AdminClientMembership;
  status: AdminClientStatus;
  paymentStatus: AdminPaymentStatus;
  paymentAmount: string;
  assignedCoach: string;
};

export type AdminClientWorkspaceFilters = {
  status: "All" | AdminClientStatus;
  membership: "All" | AdminClientMembership;
  paymentStatus: "All" | AdminPaymentStatus;
};

type DashboardTone = ComponentProps<
  typeof import("@/components/dashboard/dashboard-status-badge").DashboardStatusBadge
>["tone"];

export const adminClientToneByStatus: Record<AdminClientStatus, DashboardTone> = {
  Active: "success",
  Pending: "warning",
  Paused: "neutral",
};

export const adminClientWorkspaceDefinition: WorkspaceDefinition<
  AdminClientRecord,
  AdminClientWorkspaceFilters,
  ClientFormState
> = {
  searchPlaceholder: "Search by client, coach, or membership",
  filters: [
    {
      key: "status",
      label: "Status",
      options: adminClientStatusFilters,
    },
    {
      key: "membership",
      label: "Membership",
      options: adminClientMembershipFilters,
    },
    {
      key: "paymentStatus",
      label: "Payment",
      options: adminPaymentStatusFilters,
    },
  ],
  formFields: [
    {
      key: "fullName",
      label: "Full name",
      kind: "text",
    },
    {
      key: "email",
      label: "Email",
      kind: "email",
    },
    {
      key: "phone",
      label: "Phone",
      kind: "tel",
    },
    {
      key: "assignedCoach",
      label: "Assigned coach",
      kind: "text",
    },
    {
      key: "membership",
      label: "Membership",
      kind: "select",
      options: adminClientMembershipFilters.filter(
        (membership) => membership !== "All"
      ),
    },
    {
      key: "status",
      label: "Status",
      kind: "select",
      options: adminClientStatusFilters.filter((status) => status !== "All"),
    },
    {
      key: "paymentStatus",
      label: "Payment status",
      kind: "select",
      options: ["Paid", "Unpaid", "Due soon"],
    },
    {
      key: "paymentAmount",
      label: "Payment amount",
      kind: "text",
    },
  ],
  getSearchValue: (record) =>
    [
      record.fullName,
      record.email,
      record.assignedCoach,
      record.membership,
    ].join(" "),
  matchesFilters: (record, filters) => {
    const matchesStatus =
      filters.status === "All" || record.status === filters.status;
    const matchesMembership =
      filters.membership === "All" || record.membership === filters.membership;
    const matchesPaymentStatus =
      filters.paymentStatus === "All" ||
      record.paymentStatus === filters.paymentStatus;

    return matchesStatus && matchesMembership && matchesPaymentStatus;
  },
  createEmptyForm: () => ({
    fullName: "",
    email: "",
    phone: "",
    membership: "Group Membership",
    status: "Pending",
    paymentStatus: "Unpaid",
    paymentAmount: "",
    assignedCoach: "Unassigned",
  }),
  toFormState: (record) => ({
    fullName: record.fullName,
    email: record.email,
    phone: record.phone,
    membership: record.membership,
    status: record.status,
    paymentStatus: record.paymentStatus,
    paymentAmount:
      record.paymentAmountLabel === "No payment yet"
        ? ""
        : record.paymentAmountLabel.replace(/^EGP\s*/, ""),
    assignedCoach: record.assignedCoach,
  }),
};
