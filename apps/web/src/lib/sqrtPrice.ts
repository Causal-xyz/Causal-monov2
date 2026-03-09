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
 * @param price - Human-readable price of token0 in terms of token1 (e.g. 1.0 means 1 token0 = 1 token1)
 * @param decimalsToken0 - Decimals of token0
 * @param decimalsToken1 - Decimals of token1
 * @returns sqrtPriceX96 as bigint
 */
export function priceToSqrtPriceX96(
  price: number,
  decimalsToken0: number,
  decimalsToken1: number,
): bigint {
  // price in smallest units: price * 10^(decimalsToken0) / 10^(decimalsToken1)
  // sqrtPriceX96 = sqrt(adjustedPrice) * 2^96
  const decimalAdjustment = 10 ** (decimalsToken0 - decimalsToken1);
  const adjustedPrice = price * decimalAdjustment;

  // Use floating-point sqrt then convert to bigint with Q96
  const sqrtPrice = Math.sqrt(adjustedPrice);

  // Scale by 2^96 — use PRECISION intermediary for better accuracy
  const scaledSqrt = BigInt(Math.round(sqrtPrice * Number(PRECISION)));
  return (scaledSqrt * Q96) / PRECISION;
}

/**
 * Compute sqrtPriceX96 for a token pair, automatically handling token0/token1 ordering.
 *
 * @param tokenA - Address of the first token
 * @param decimalsA - Decimals of tokenA
 * @param tokenB - Address of the second token
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
    // sqrtPriceX96 represents price = token1/token0 = B/A = 1/priceAPerB
    const price = 1 / priceAPerB;
    return priceToSqrtPriceX96(price, decimalsA, decimalsB);
  }

  // token0 = B, token1 = A
  // sqrtPriceX96 represents price = token1/token0 = A/B = priceAPerB
  return priceToSqrtPriceX96(priceAPerB, decimalsB, decimalsA);
}
