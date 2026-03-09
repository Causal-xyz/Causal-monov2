// Re-export shared contracts and ABIs for use in the web app
export { CONTRACTS, causalOrganizationsAbi as CAUSAL_ORGANIZATIONS_ABI } from "@causal/shared";

export const CAUSAL_ORGANIZATIONS_ADDRESS =
  (process.env.NEXT_PUBLIC_CAUSAL_ORGANIZATIONS_ADDRESS ?? "") as `0x${string}`;
