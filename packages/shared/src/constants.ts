export const APP_NAME = "Causal Trading";

export const CHAIN_ID = 43113; // Avalanche Fuji Testnet

export const FUJI_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ??
  process.env.RPC_URL ??
  "https://api.avax-test.network/ext/bc/C/rpc";

/**
 * Contract addresses on Avalanche Fuji Testnet.
 * Populated from env vars or updated manually after deployment.
 */
export const CONTRACTS = {
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`,
  mockTokenX: (process.env.NEXT_PUBLIC_MOCK_TOKEN_X_ADDRESS ?? "") as `0x${string}`,
  mockUsdc: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ?? "") as `0x${string}`,
  // Uniswap V3 (self-deployed to Fuji)
  uniswapV3Factory: (process.env.NEXT_PUBLIC_UNISWAP_V3_FACTORY ?? "") as `0x${string}`,
  positionManager: (process.env.NEXT_PUBLIC_POSITION_MANAGER ?? "") as `0x${string}`,
  swapRouter: (process.env.NEXT_PUBLIC_SWAP_ROUTER ?? "") as `0x${string}`,
  causalOrganizations: (process.env.NEXT_PUBLIC_CAUSAL_ORGANIZATIONS_ADDRESS ?? "") as `0x${string}`,
} as const;

/** Uniswap V3 fee tiers */
export const FEE_TIERS = {
  LOW: 500,
  MEDIUM: 3000,
  HIGH: 10000,
} as const;

/** Default TWAP window in seconds (now configurable per proposal, min 60) */
export const TWAP_WINDOW_SECONDS = 3600;

/** Minimum TWAP window enforced by the contract (seconds) */
export const MIN_TWAP_WINDOW_SECONDS = 60;

/** Outcome enum matching the Solidity contract */
export const OUTCOME = {
  Unresolved: 0,
  Yes: 1,
  No: 2,
} as const;
