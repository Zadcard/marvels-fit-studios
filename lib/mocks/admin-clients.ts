export type AdminClientStatus = "Active" | "Pending" | "Paused";
export type AdminClientMembership =
  | "Group Membership"
  | "Private Coaching"
  | "Hybrid";

export type AdminClientRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  membership: AdminClientMembership;
  status: AdminClientStatus;
  joinedDate: string;
  assignedCoach: string;
  nextSession: string;
  progressNote: string;
};

export const adminClientStatusFilters: Array<"All" | AdminClientStatus> = [
  "All",
  "Active",
  "Pending",
  "Paused",
];

export const adminClientMembershipFilters: Array<
  "All" | AdminClientMembership
> = ["All", "Group Membership", "Private Coaching", "Hybrid"];

export const adminClientRecords: AdminClientRecord[] = [
  {
    id: "client-ahmed-k",
    fullName: "Ahmed Kamal",
    email: "ahmed.kamal@example.com",
    phone: "+20 100 221 3411",
    membership: "Group Membership",
    status: "Active",
    joinedDate: "Mar 05, 2026",
    assignedCoach: "Ahmed Waheed",
    nextSession: "Today, 6:30 PM",
    progressNote: "Strong attendance across the last three weeks.",
  },
  {
    id: "client-sara-n",
    fullName: "Sara Nabil",
    email: "sara.nabil@example.com",
    phone: "+20 109 882 1145",
    membership: "Private Coaching",
    status: "Active",
    joinedDate: "Feb 16, 2026",
    assignedCoach: "Youssef Abdelatif",
    nextSession: "Tomorrow, 8:00 PM",
    progressNote: "Private program moving into phase-two strength work.",
  },
  {
    id: "client-youssef-h",
    fullName: "Youssef Hany",
    email: "youssef.hany@example.com",
    phone: "+20 122 734 2210",
    membership: "Hybrid",
    status: "Pending",
    joinedDate: "Mar 28, 2026",
    assignedCoach: "Ahmed Farouk",
    nextSession: "Awaiting first session",
    progressNote: "Intake complete, placement call still pending.",
  },
  {
    id: "client-reham-b",
    fullName: "Reham Badawy",
    email: "reham.badawy@example.com",
    phone: "+20 114 522 9087",
    membership: "Group Membership",
    status: "Paused",
    joinedDate: "Jan 12, 2026",
    assignedCoach: "Abdullah Zaki",
    nextSession: "On hold",
    progressNote: "Paused due to travel, reactivation expected mid-April.",
  },
  {
    id: "client-mona-a",
    fullName: "Mona Adel",
    email: "mona.adel@example.com",
    phone: "+20 111 409 3388",
    membership: "Private Coaching",
    status: "Active",
    joinedDate: "Mar 02, 2026",
    assignedCoach: "Hisham Mostafa",
    nextSession: "Thu, 5:30 PM",
    progressNote: "Tracking well, no missed sessions this cycle.",
  },
  {
    id: "client-karim-s",
    fullName: "Karim Samir",
    email: "karim.samir@example.com",
    phone: "+20 120 500 1192",
    membership: "Group Membership",
    status: "Pending",
    joinedDate: "Mar 30, 2026",
    assignedCoach: "Ahmed Waheed",
    nextSession: "Placement review tomorrow",
    progressNote: "Needs final group assignment after onboarding.",
  },
  {
    id: "client-dina-r",
    fullName: "Dina Ragab",
    email: "dina.ragab@example.com",
    phone: "+20 103 847 6690",
    membership: "Hybrid",
    status: "Active",
    joinedDate: "Feb 08, 2026",
    assignedCoach: "Reham Badawy",
    nextSession: "Fri, 7:00 PM",
    progressNote: "Hybrid plan upgraded after strong February retention.",
  },
];
