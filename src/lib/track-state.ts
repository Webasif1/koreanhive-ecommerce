import type { TrackedOrder } from "@/server/queries/order";

export type TrackState = {
  error: string | null;
  order: TrackedOrder | null;
};

/** Kept out of the "use server" module — those may only export functions. */
export const emptyTrackState: TrackState = {
  error: null,
  order: null,
};
