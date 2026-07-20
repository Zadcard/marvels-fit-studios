export type RecurringSessionTemplateRecord = {
  id: string;
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  coachId: string;
  coachName: string;
  groupId: string | null;
  groupName: string;
  weekday: number;
  localStartTime: string;
  durationMinutes: number;
  startsOn: string;
  endsOn: string;
  active: boolean;
  lastGeneratedThrough: string | null;
};
