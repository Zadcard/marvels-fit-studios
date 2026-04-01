export type CoachSettingsRecord = {
  fullName: string;
  roleLabel: string;
  email: string;
  phone: string;
  bio: string;
  specialization: string;
  preferredView: string;
  reminderLeadTime: string;
  availabilityNote: string;
  mobileAlerts: boolean;
  clientCheckIns: boolean;
  waitlistFlags: boolean;
};

export const coachSettingsOptions = {
  preferredViews: ["Today first", "Week board", "Sessions list"],
  reminderLeadTimes: ["15 minutes", "30 minutes", "60 minutes"],
};

export const coachSettingsRecord: CoachSettingsRecord = {
  fullName: "Ahmed Waheed",
  roleLabel: "Strength Coach",
  email: "ahmed.waheed@marvelfitness.studio",
  phone: "+20 101 222 1100",
  bio: "Leads strength-focused group sessions and guides private members through confident progression.",
  specialization: "Strength and group performance",
  preferredView: "Today first",
  reminderLeadTime: "30 minutes",
  availabilityNote: "Available Monday to Thursday evenings, plus Saturday morning blocks.",
  mobileAlerts: true,
  clientCheckIns: true,
  waitlistFlags: false,
};
