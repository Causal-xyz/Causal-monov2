export const APP_NAME = "Causal Trading";

export type Outcome = "Unresolved" | "Yes" | "No";

export interface Proposal {
  readonly id: string;
  readonly title: string;
  readonly outcome: Outcome;
  readonly resolutionTimestamp: number;
}
