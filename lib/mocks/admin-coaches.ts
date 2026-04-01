export type AdminCoachStatus = "Active" | "Limited" | "Away";
export type AdminCoachSpecialization =
  | "Strength"
  | "Conditioning"
  | "Mobility"
  | "Private Coaching";

export type AdminCoachRecord = {
  id: string;
  fullName: string;
  specialization: AdminCoachSpecialization;
  status: AdminCoachStatus;
  activeClients: number;
  sessionsThisWeek: number;
  email: string;
  phone: string;
  summary: string;
};

export const adminCoachStatusFilters: Array<"All" | AdminCoachStatus> = [
  "All",
  "Active",
  "Limited",
  "Away",
];

export const adminCoachRecords: AdminCoachRecord[] = [
  {
    id: "coach-ahmed-waheed",
    fullName: "Ahmed Waheed",
    specialization: "Strength",
    status: "Active",
    activeClients: 42,
    sessionsThisWeek: 11,
    email: "ahmed.waheed@example.com",
    phone: "+20 101 222 1100",
    summary: "Leads the strength block and anchors prime evening sessions.",
  },
  {
    id: "coach-hisham-mostafa",
    fullName: "Hisham Mostafa",
    specialization: "Private Coaching",
    status: "Active",
    activeClients: 18,
    sessionsThisWeek: 13,
    email: "hisham.mostafa@example.com",
    phone: "+20 112 342 5510",
    summary: "Private-coaching heavy schedule with strong retention.",
  },
  {
    id: "coach-ahmed-farouk",
    fullName: "Ahmed Farouk",
    specialization: "Conditioning",
    status: "Active",
    activeClients: 26,
    sessionsThisWeek: 9,
    email: "ahmed.farouk@example.com",
    phone: "+20 127 990 8712",
    summary: "Owns the Conditioning Lab and high-capacity group classes.",
  },
  {
    id: "coach-youssef-abdelatif",
    fullName: "Youssef Abdelatif",
    specialization: "Mobility",
    status: "Limited",
    activeClients: 14,
    sessionsThisWeek: 6,
    email: "youssef.abdelatif@example.com",
    phone: "+20 109 650 4478",
    summary: "Reduced week due to external workshop commitment.",
  },
  {
    id: "coach-abdullah-zaki",
    fullName: "Abdullah Zaki",
    specialization: "Conditioning",
    status: "Away",
    activeClients: 12,
    sessionsThisWeek: 0,
    email: "abdullah.zaki@example.com",
    phone: "+20 115 210 8811",
    summary: "Out this week, sessions temporarily covered by the main team.",
  },
];
