import { plainToInstance, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

/**
 * Schema for the environment variables required by the application.
 * Validated once at startup so the app fails fast on misconfiguration.
 */
export class EnvironmentVariables {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  OPENAI_API_KEY!: string;

  @IsString()
  @IsNotEmpty()
  OPENAI_MODEL!: string;

  @IsString()
  @IsNotEmpty()
  OPEN_EXCHANGE_RATES_APP_ID!: string;

  @IsUrl({ require_tld: false })
  OPEN_EXCHANGE_RATES_BASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  PRODUCTS_CSV_PATH!: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validated;
}
