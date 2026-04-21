type JoinNowFieldName = "name" | "fullName" | "phone" | "email";

export type GeneratedClientCredentials = {
  clientId: string;
  password: string;
  fullName: string;
  phone: string;
};

export type JoinNowActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<JoinNowFieldName, string[]>>;
  credentials?: GeneratedClientCredentials;
};

export const initialJoinNowState: JoinNowActionState = {
  status: "idle",
  message: "",
};
