export type ClientSettingsRecord = {
  fullName: string;
  email: string;
  phone: string;
  goalLabel: string;
  preferredSessionTime: string;
  notificationEmail: boolean;
  scheduleReminders: boolean;
  coachUpdates: boolean;
};

export const clientSettingsOptions = {
  preferredSessionTimes: ["Evenings", "Mornings", "Flexible"],
};

export const clientSettingsRecord: ClientSettingsRecord = {
  fullName: "Nour Hassan",
  email: "nour.hassan@example.com",
  phone: "+20 109 441 2288",
  goalLabel: "Build steady strength and improve movement confidence.",
  preferredSessionTime: "Evenings",
  notificationEmail: true,
  scheduleReminders: true,
  coachUpdates: true,
};
