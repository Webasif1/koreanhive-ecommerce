export type AdminFormState = {
  ok: boolean;
  message: string | null;
  errors: Record<string, string>;
};

/** Outside the "use server" modules — those may only export functions. */
export const emptyAdminFormState: AdminFormState = {
  ok: false,
  message: null,
  errors: {},
};
