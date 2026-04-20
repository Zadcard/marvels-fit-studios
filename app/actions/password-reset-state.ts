export type PasswordResetActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialPasswordResetState: PasswordResetActionState = {
  status: "idle",
  message: "",
};
