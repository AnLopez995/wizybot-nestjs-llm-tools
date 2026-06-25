import { computeConversion } from './currency-conversion.util';

describe('computeConversion', () => {
  // Example USD-based rates (as returned by Open Exchange Rates).
  const rates = { USD: 1, EUR: 0.92, CAD: 1.36 };

  it('converts USD to EUR using the cross-rate', () => {
    const { convertedAmount, exchangeRate } = computeConversion(900, rates.USD, rates.EUR);
    expect(exchangeRate).toBeCloseTo(0.92, 5);
    expect(convertedAmount).toBe(828); // 900 * 0.92
  });

  it('converts between two non-USD currencies (EUR -> CAD)', () => {
    const { convertedAmount } = computeConversion(350, rates.EUR, rates.CAD);
    // 350 / 0.92 * 1.36 = 517.39 (rounded to 2 decimals)
    expect(convertedAmount).toBeCloseTo(517.39, 2);
  });

  it('rounds the converted amount to 2 decimals', () => {
    const { convertedAmount } = computeConversion(10, 0.92, 1.36);
    expect(Number.isInteger(convertedAmount * 100)).toBe(true);
  });

  it('returns the same amount when converting a currency to itself', () => {
    const { convertedAmount, exchangeRate } = computeConversion(123.45, 0.92, 0.92);
    expect(exchangeRate).toBe(1);
    expect(convertedAmount).toBe(123.45);
  });
});
