export interface ParsedPrice {
  amount: number;
  currency: string;
}

/**
 * Parse a raw CSV price string into a numeric amount and currency code.
 *
 * Handles single values ("17.0 USD") and ranges ("13.0 - 15.0 USD"),
 * taking the lower bound for ranges. Falls back to amount 0 / USD when the
 * string is missing or malformed, so a bad row never crashes the catalog.
 */
export function parsePrice(rawPrice: string | undefined | null): ParsedPrice {
  const fallback: ParsedPrice = { amount: 0, currency: 'USD' };
  if (!rawPrice) {
    return fallback;
  }

  const numbers = rawPrice.match(/\d+(\.\d+)?/g);
  const currencyMatch = rawPrice.match(/[A-Za-z]{3}/);

  const amount = numbers && numbers.length > 0 ? Number(numbers[0]) : 0;
  const currency = currencyMatch ? currencyMatch[0].toUpperCase() : 'USD';

  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency,
  };
}
