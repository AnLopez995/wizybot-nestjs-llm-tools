/** Result of the pure conversion computation. */
export interface ComputedConversion {
  convertedAmount: number;
  exchangeRate: number;
}

/**
 * Convert `amount` between two currencies given their USD-based rates.
 *
 * Open Exchange Rates returns rates relative to USD, so the cross-rate is
 * `rateTo / rateFrom`. The converted amount is rounded to 2 decimals.
 *
 * Pure and side-effect free so it can be unit tested without network access.
 */
export function computeConversion(
  amount: number,
  rateFrom: number,
  rateTo: number,
): ComputedConversion {
  const exchangeRate = rateTo / rateFrom;
  const convertedAmount = Math.round(amount * exchangeRate * 100) / 100;
  return { convertedAmount, exchangeRate };
}
