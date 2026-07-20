export type AdminTodaySession = {
  id: string;
  title: string;
  timeLabel: string;
  durationLabel: string;
  sessionType: "Group" | "Private";
  coachName: string;
  coachInitials: string;
  bookedCount: number;
  isLive: boolean;
};

export type AdminTodayCoach = {
  id: string;
  fullName: string;
  initials: string;
  specialization: string;
  status: "On floor" | "Later" | "Done";
  detail: string;
};

export type AdminTodayTrial = {
  id: string;
  fullName: string;
  initials: string;
  groupName: string;
  phone: string;
};

export type AdminTodayRenewal = {
  id: string;
  fullName: string;
  initials: string;
  planName: string;
  amountLabel: string;
  dueLabel: string;
  methodLabel?: string;
};

export type AdminTodayPayment = {
  id: string;
  description: string;
  amountLabel: string;
  timeLabel: string;
};

export type AdminTodayOperations = {
  sessions: AdminTodaySession[];
  coaches: AdminTodayCoach[];
  trials: AdminTodayTrial[];
  renewals: AdminTodayRenewal[];
  recentPayments: AdminTodayPayment[];
  liveCount: number;
  expectedClients: number;
  cashTodayLabel: string;
  cashTodayCount: number;
};
