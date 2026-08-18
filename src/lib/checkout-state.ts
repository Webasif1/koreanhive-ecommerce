export type CheckoutState = {
  ok: boolean;
  message: string | null;
  errors: Record<string, string>;
};

/** Lives outside the "use server" module: those files may only export async
 *  functions, so a plain object constant cannot sit next to the action. */
export const emptyCheckoutState: CheckoutState = {
  ok: false,
  message: null,
  errors: {},
};
