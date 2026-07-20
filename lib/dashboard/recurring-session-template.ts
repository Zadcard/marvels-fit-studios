export type RecurringSessionTemplateSlot = {
  weekday: number;
  localStartTime: string;
};

export type RecurringSessionTemplateRecord = {
  id: string;
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  coachId: string;
  coachName: string;
  groupId: string | null;
  groupName: string;
  slots: RecurringSessionTemplateSlot[];
  durationMinutes: number;
  startsOn: string;
  endsOn: string;
  active: boolean;
  lastGeneratedThrough: string | null;
};
