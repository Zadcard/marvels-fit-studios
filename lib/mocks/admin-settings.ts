export type AdminStudioSettingSection =
  | "Identity"
  | "Operations"
  | "Booking";

export type AdminStudioSettings = {
  studioName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  defaultSessionLength: string;
  intakeLeadTime: string;
  overbookWaitlist: boolean;
  cancellationWindow: string;
  privateSessionBuffer: string;
  scheduleStartDay: string;
};

export const adminSettingsSections: Array<{
  id: AdminStudioSettingSection;
  title: string;
  description: string;
}> = [
  {
    id: "Identity",
    title: "Studio identity",
    description: "Control the core studio details that appear across the admin workspace.",
  },
  {
    id: "Operations",
    title: "Operations rhythm",
    description: "Shape the default pacing for classes, private sessions, and intake handling.",
  },
  {
    id: "Booking",
    title: "Booking controls",
    description: "Keep the scheduling rules organized so future calendar integrations have a clean home.",
  },
];

export const adminStudioSettings: AdminStudioSettings = {
  studioName: "Marvel Fitness Studio",
  supportEmail: "hello@marvelfitness.studio",
  supportPhone: "+20 10 5555 9084",
  timezone: "Africa/Cairo",
  defaultSessionLength: "60 minutes",
  intakeLeadTime: "24 hours",
  overbookWaitlist: true,
  cancellationWindow: "6 hours",
  privateSessionBuffer: "15 minutes",
  scheduleStartDay: "Monday",
};

export const adminStudioSettingOptions = {
  sessionLengths: ["45 minutes", "60 minutes", "75 minutes"],
  intakeLeadTimes: ["6 hours", "12 hours", "24 hours", "48 hours"],
  cancellationWindows: ["2 hours", "4 hours", "6 hours", "12 hours"],
  privateSessionBuffers: ["0 minutes", "10 minutes", "15 minutes", "20 minutes"],
  scheduleStartDays: ["Monday", "Saturday", "Sunday"],
};
