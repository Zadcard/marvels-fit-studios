export type AdminCoachSpecialization =
  | "Strength"
  | "Conditioning"
  | "Mobility"
  | "Private Coaching";

export type AdminCoachRecord = {
  id: string;
  fullName: string;
  specialization: AdminCoachSpecialization;
  activeClients: number;
  sessionsThisWeek: number;
  recurringBlocks: number;
  conflicts: number;
  openSlots: number;
  weeklyLoad: Array<{
    day: string;
    sessions: number;
  }>;
  blockAssignments: Array<{
    id: string;
    title: string;
    recurrenceSummary: string;
    rosterCount: number;
  }>;
  email: string;
  phone: string;
  summary: string;
};

export const adminCoachRecords: AdminCoachRecord[] = [
  {
    id: "coach-ahmed-waheed",
    fullName: "Ahmed Waheed",
    specialization: "Strength",
    activeClients: 42,
    sessionsThisWeek: 11,
    recurringBlocks: 4,
    conflicts: 1,
    openSlots: 1,
    weeklyLoad: [
      { day: "Sun", sessions: 2 },
      { day: "Mon", sessions: 1 },
      { day: "Tue", sessions: 2 },
      { day: "Wed", sessions: 2 },
      { day: "Thu", sessions: 2 },
      { day: "Fri", sessions: 1 },
      { day: "Sat", sessions: 1 },
    ],
    blockAssignments: [
      {
        id: "block-strength-foundations",
        title: "Strength Foundations",
        recurrenceSummary: "Sunday, Tuesday, Thursday",
        rosterCount: 14,
      },
    ],
    email: "ahmed.waheed@example.com",
    phone: "+20 101 222 1100",
    summary: "Leads the strength block and anchors prime evening sessions.",
  },
  {
    id: "coach-hisham-mostafa",
    fullName: "Hisham Mostafa",
    specialization: "Private Coaching",
    activeClients: 18,
    sessionsThisWeek: 13,
    recurringBlocks: 5,
    conflicts: 0,
    openSlots: 0,
    weeklyLoad: [
      { day: "Sun", sessions: 2 },
      { day: "Mon", sessions: 2 },
      { day: "Tue", sessions: 2 },
      { day: "Wed", sessions: 2 },
      { day: "Thu", sessions: 2 },
      { day: "Fri", sessions: 2 },
      { day: "Sat", sessions: 1 },
    ],
    blockAssignments: [
      {
        id: "block-private-peak",
        title: "Private Peak",
        recurrenceSummary: "Sunday, Monday, Wednesday",
        rosterCount: 1,
      },
    ],
    email: "hisham.mostafa@example.com",
    phone: "+20 112 342 5510",
    summary: "Private-coaching heavy schedule with strong retention.",
  },
  {
    id: "coach-ahmed-farouk",
    fullName: "Ahmed Farouk",
    specialization: "Conditioning",
    activeClients: 26,
    sessionsThisWeek: 9,
    recurringBlocks: 3,
    conflicts: 0,
    openSlots: 3,
    weeklyLoad: [
      { day: "Sun", sessions: 1 },
      { day: "Mon", sessions: 2 },
      { day: "Tue", sessions: 1 },
      { day: "Wed", sessions: 1 },
      { day: "Thu", sessions: 2 },
      { day: "Fri", sessions: 1 },
      { day: "Sat", sessions: 1 },
    ],
    blockAssignments: [
      {
        id: "block-conditioning-lab",
        title: "Conditioning Lab",
        recurrenceSummary: "Monday, Thursday",
        rosterCount: 18,
      },
    ],
    email: "ahmed.farouk@example.com",
    phone: "+20 127 990 8712",
    summary: "Owns the Conditioning Lab and high-capacity group classes.",
  },
  {
    id: "coach-youssef-abdelatif",
    fullName: "Youssef Abdelatif",
    specialization: "Mobility",
    activeClients: 14,
    sessionsThisWeek: 6,
    recurringBlocks: 2,
    conflicts: 0,
    openSlots: 6,
    weeklyLoad: [
      { day: "Sun", sessions: 1 },
      { day: "Mon", sessions: 0 },
      { day: "Tue", sessions: 1 },
      { day: "Wed", sessions: 1 },
      { day: "Thu", sessions: 1 },
      { day: "Fri", sessions: 1 },
      { day: "Sat", sessions: 1 },
    ],
    blockAssignments: [
      {
        id: "block-mobility-reset",
        title: "Mobility Reset",
        recurrenceSummary: "Tuesday, Friday",
        rosterCount: 10,
      },
    ],
    email: "youssef.abdelatif@example.com",
    phone: "+20 109 650 4478",
    summary: "Reduced week due to external workshop commitment.",
  },
  {
    id: "coach-abdullah-zaki",
    fullName: "Abdullah Zaki",
    specialization: "Conditioning",
    activeClients: 12,
    sessionsThisWeek: 0,
    recurringBlocks: 0,
    conflicts: 0,
    openSlots: 12,
    weeklyLoad: [
      { day: "Sun", sessions: 0 },
      { day: "Mon", sessions: 0 },
      { day: "Tue", sessions: 0 },
      { day: "Wed", sessions: 0 },
      { day: "Thu", sessions: 0 },
      { day: "Fri", sessions: 0 },
      { day: "Sat", sessions: 0 },
    ],
    blockAssignments: [],
    email: "abdullah.zaki@example.com",
    phone: "+20 115 210 8811",
    summary: "Out this week, sessions temporarily covered by the main team.",
  },
];
