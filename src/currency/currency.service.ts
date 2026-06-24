import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CurrencyConversionResult,
  OpenExchangeRatesLatestResponse,
} from './interfaces/currency-conversion.interface';
import { computeConversion } from './utils/currency-conversion.util';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly appId: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.getOrThrow<string>('OPEN_EXCHANGE_RATES_APP_ID');
    this.baseUrl = this.configService.getOrThrow<string>('OPEN_EXCHANGE_RATES_BASE_URL');
  }

  /**
   * Convert `amount` from `fromCurrency` to `toCurrency` using the latest
   * USD-based rates. Throws BadRequestException for unsupported currencies and
   * BadGatewayException when the external API fails.
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<CurrencyConversionResult> {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    const { rates, timestamp } = await this.fetchLatestRates();

    if (rates[from] === undefined) {
      throw new BadRequestException(`Unsupported source currency: ${from}`);
    }
    if (rates[to] === undefined) {
      throw new BadRequestException(`Unsupported target currency: ${to}`);
    }

    // Rates are USD-based; convert via the USD cross-rate.
    const { convertedAmount, exchangeRate } = computeConversion(amount, rates[from], rates[to]);

    return {
      originalAmount: amount,
      fromCurrency: from,
      toCurrency: to,
      convertedAmount,
      exchangeRate,
      timestamp,
    };
  }

  private async fetchLatestRates(): Promise<OpenExchangeRatesLatestResponse> {
    const url = `${this.baseUrl}/latest.json?app_id=${this.appId}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      this.logger.error(`Failed to reach Open Exchange Rates: ${(error as Error).message}`);
      throw new BadGatewayException('Currency provider is unreachable');
    }

    if (!response.ok) {
      this.logger.error(`Open Exchange Rates returned status ${response.status}`);
      throw new BadGatewayException('Currency provider returned an error');
    }

    return (await response.json()) as OpenExchangeRatesLatestResponse;
  }
}
