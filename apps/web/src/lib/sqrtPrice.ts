/**
 * Uniswap V3 sqrtPriceX96 conversion utilities.
 *
 * sqrtPriceX96 = sqrt(price) * 2^96
 * where price = token1 / token0 (in terms of the smallest units)
 */

const Q96 = 2n ** 96n;
const PRECISION = 10n ** 18n;

/**
 * Convert a human-readable price to sqrtPriceX96.
 *
 * In Uniswap V3, price = token1_smallest / token0_smallest.
 * If "1 token0 = humanPrice token1" in human terms, then:
 *   price_smallest = humanPrice * 10^(decimalsToken1 - decimalsToken0)
 *
 * @param humanPrice - Human-readable price: 1 token0 = humanPrice token1
 * @param decimalsToken0 - Decimals of token0 (the lower-address token)
 * @param decimalsToken1 - Decimals of token1 (the higher-address token)
 * @returns sqrtPriceX96 as bigint
 */
export function priceToSqrtPriceX96(
  humanPrice: number,
  decimalsToken0: number,
  decimalsToken1: number,
): bigint {
  // Convert human price to smallest-unit price:
  // price_smallest = humanPrice * 10^(decimalsToken1 - decimalsToken0)
  const decimalAdjustment = 10 ** (decimalsToken1 - decimalsToken0);
  const adjustedPrice = humanPrice * decimalAdjustment;

  // sqrtPriceX96 = sqrt(adjustedPrice) * 2^96
  const sqrtPrice = Math.sqrt(adjustedPrice);

  // Scale by 2^96 — use PRECISION intermediary for better accuracy
  const scaledSqrt = BigInt(Math.round(sqrtPrice * Number(PRECISION)));
  return (scaledSqrt * Q96) / PRECISION;
}

/**
 * Compute sqrtPriceX96 for a token pair, automatically handling token0/token1 ordering.
 *
 * @param tokenA - Address of the first token (e.g. yesX conditional token)
 * @param decimalsA - Decimals of tokenA
 * @param tokenB - Address of the second token (e.g. USDC)
 * @param decimalsB - Decimals of tokenB
 * @param priceAPerB - How many tokenA per 1 tokenB (e.g. 1.0 = 1:1)
 * @returns sqrtPriceX96 as bigint
 */
export function computeSqrtPriceX96ForPair(
  tokenA: `0x${string}`,
  decimalsA: number,
  tokenB: `0x${string}`,
  decimalsB: number,
  priceAPerB: number,
): bigint {
  const aIsToken0 = tokenA.toLowerCase() < tokenB.toLowerCase();

  if (aIsToken0) {
    // token0 = A, token1 = B
    // Uniswap price = token1/token0 = B/A
    // "priceAPerB" means 1 B costs priceAPerB A, so B/A = 1/priceAPerB
    const price = 1 / priceAPerB;
    return priceToSqrtPriceX96(price, decimalsA, decimalsB);
  }

  // token0 = B, token1 = A
  // Uniswap price = token1/token0 = A/B = priceAPerB
  return priceToSqrtPriceX96(priceAPerB, decimalsB, decimalsA);
}
