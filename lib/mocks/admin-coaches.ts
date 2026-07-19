export type AdminCoachSpecialization =
  | "Strength"
  | "Conditioning"
  | "Mobility"
  | "Private Coaching"
  | "Football"
  | "Tennis"
  | "Calisthenics"
  | "Rehab"
  | "Athletic Performance"
  | "General Fitness";

/**
 * Today-at-a-glance view for a coach, derived from real session times.
 * `slots` holds the session count for seven two-hour buckets from 7a to 7p.
 */
export type CoachTodayView = {
  slots: number[];
  freeHours: number;
  isOff: boolean;
  context: string;
};

export type AdminCoachRecord = {
  id: string;
  fullName: string;
  specialization: AdminCoachSpecialization;
  activeClients: number;
  sessionsThisWeek: number;
  conflicts: number;
  openSlots: number;
  weeklyLoad: Array<{
    day: string;
    sessions: number;
  }>;
  today: CoachTodayView;
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
    today: { slots: [0, 0, 0, 0, 0, 1, 0], freeHours: 12, isOff: false, context: "Free until 5:00 PM" },
    email: "ahmed.waheed@example.com",
    phone: "+20 101 222 1100",
    summary: "Leads strength training and anchors prime evening sessions.",
  },
  {
    id: "coach-hisham-mostafa",
    fullName: "Hisham Mostafa",
    specialization: "Private Coaching",
    activeClients: 18,
    sessionsThisWeek: 13,
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
    today: { slots: [1, 0, 1, 0, 1, 0, 1], freeHours: 6, isOff: false, context: "Done at 7:00 PM" },
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
    today: { slots: [0, 1, 0, 1, 0, 0, 0], freeHours: 10, isOff: false, context: "Free until 9:00 AM" },
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
    today: { slots: [0, 0, 0, 0, 1, 0, 0], freeHours: 12, isOff: false, context: "Free until 3:00 PM" },
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
    today: { slots: [0, 0, 0, 0, 0, 0, 0], freeHours: 14, isOff: true, context: "Off today" },
    email: "abdullah.zaki@example.com",
    phone: "+20 115 210 8811",
    summary: "Out this week, sessions temporarily covered by the main team.",
  },
];
