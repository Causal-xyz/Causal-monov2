export type Outcome = "Unresolved" | "Yes" | "No";

export type ProposalStatus =
  | "pending-amm"
  | "trading"
  | "awaiting-resolution"
  | "resolved-yes"
  | "resolved-no";

export interface Proposal {
  readonly id: number;
  readonly address: `0x${string}`;
  readonly title: string;
  readonly outcome: Outcome;
  readonly resolutionTimestamp: number;
  readonly tokenX: `0x${string}`;
  readonly usdc: `0x${string}`;
  readonly transferToken: `0x${string}`;
  readonly recipient: `0x${string}`;
  readonly transferAmount: bigint;
}

export interface ConditionalTokenSet {
  readonly yesX: `0x${string}`;
  readonly noX: `0x${string}`;
  readonly yesUsdc: `0x${string}`;
  readonly noUsdc: `0x${string}`;
}

export interface ConditionalBalances {
  readonly yesX: bigint;
  readonly noX: bigint;
  readonly yesUsdc: bigint;
  readonly noUsdc: bigint;
}

export interface PoolPrices {
  readonly yesTwap: bigint;
  readonly noTwap: bigint;
}

export interface ProposalView {
  readonly proposal: Proposal;
  readonly tokens: ConditionalTokenSet;
  readonly status: ProposalStatus;
}
