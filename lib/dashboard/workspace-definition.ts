export type WorkspaceFilterDefinition<
  TFilters extends Record<string, string>
> = {
  key: Extract<keyof TFilters, string>;
  label: string;
  options: ReadonlyArray<TFilters[Extract<keyof TFilters, string>]>;
};

type WorkspaceTextField<TForm extends Record<string, string>> = {
  key: Extract<keyof TForm, string>;
  label: string;
  kind: "text" | "email" | "tel";
};

type WorkspaceSelectField<TForm extends Record<string, string>> = {
  key: Extract<keyof TForm, string>;
  label: string;
  kind: "select";
  options: ReadonlyArray<TForm[Extract<keyof TForm, string>]>;
};

export type WorkspaceFormFieldDefinition<
  TForm extends Record<string, string>
> = WorkspaceTextField<TForm> | WorkspaceSelectField<TForm>;

export type WorkspaceRowAction<TRecord> = {
  label: string;
  onClick: (record: TRecord) => void;
};

export type WorkspaceDefinition<
  TRecord extends { id: string },
  TFilters extends Record<string, string>,
  TForm extends Record<string, string>
> = {
  searchPlaceholder: string;
  filters: ReadonlyArray<WorkspaceFilterDefinition<TFilters>>;
  formFields: ReadonlyArray<WorkspaceFormFieldDefinition<TForm>>;
  getSearchValue: (record: TRecord) => string;
  matchesFilters: (record: TRecord, filters: TFilters) => boolean;
  createEmptyForm: () => TForm;
  toFormState: (record: TRecord) => TForm;
};
