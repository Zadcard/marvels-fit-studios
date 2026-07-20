type JoinNowFieldName = "name" | "fullName" | "phone" | "email";

export type JoinNowActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<JoinNowFieldName, string[]>>;
};

export const initialJoinNowState: JoinNowActionState = {
  status: "idle",
  message: "",
};
