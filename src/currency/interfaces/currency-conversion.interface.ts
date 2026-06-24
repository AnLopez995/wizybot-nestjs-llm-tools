/** Result of a currency conversion, returned to the LLM as a tool result. */
export interface CurrencyConversionResult {
  originalAmount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  /** Effective rate applied: rates[to] / rates[from]. */
  exchangeRate: number;
  /** Unix timestamp of the rates, when provided by the API. */
  timestamp?: number;
}

/** Shape of the Open Exchange Rates `latest.json` response. */
export interface OpenExchangeRatesLatestResponse {
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}
