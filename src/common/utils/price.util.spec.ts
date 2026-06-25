import { parsePrice } from './price.util';

describe('parsePrice', () => {
  it('parses a simple price with currency', () => {
    expect(parsePrice('17.0 USD')).toEqual({ amount: 17, currency: 'USD' });
  });

  it('takes the lower bound of a price range', () => {
    expect(parsePrice('13.0 - 15.0 USD')).toEqual({ amount: 13, currency: 'USD' });
  });

  it('uppercases the currency code', () => {
    expect(parsePrice('900.0 eur')).toEqual({ amount: 900, currency: 'EUR' });
  });

  it('defaults to amount 0 / USD for empty or null input', () => {
    expect(parsePrice('')).toEqual({ amount: 0, currency: 'USD' });
    expect(parsePrice(undefined)).toEqual({ amount: 0, currency: 'USD' });
    expect(parsePrice(null)).toEqual({ amount: 0, currency: 'USD' });
  });

  it('defaults currency to USD when none is present', () => {
    expect(parsePrice('42.5')).toEqual({ amount: 42.5, currency: 'USD' });
  });
});
