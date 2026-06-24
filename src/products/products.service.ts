import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from 'csv-parse/sync';
import { parsePrice } from '../common/utils/price.util';
import { Product, ScoredProduct } from './interfaces/product.interface';
import { searchProducts as runSearch } from './utils/product-search.util';

interface RawCsvRow {
  displayTitle?: string;
  embeddingText?: string;
  url?: string;
  imageUrl?: string;
  productType?: string;
  discount?: string;
  price?: string;
  variants?: string;
  createDate?: string;
}

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);
  private products: Product[] = [];

  constructor(private readonly configService: ConfigService) {}

  /** Load and parse the CSV once at startup, keeping products in memory. */
  onModuleInit(): void {
    const configuredPath = this.configService.get<string>('PRODUCTS_CSV_PATH', 'data/products_list.csv');
    const csvPath = isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath);

    if (!existsSync(csvPath)) {
      throw new Error(`Products CSV file not found at: ${csvPath}`);
    }

    const fileContent = readFileSync(csvPath, 'utf-8');
    // NOTE: `trim` is intentionally OFF. Combined with the unescaped quotes in
    // this catalog (e.g. a 8" knife title) it triggers CSV_NON_TRIMABLE_CHAR
    // errors; we trim per-field in mapRow instead.
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true, // tolerate rows with wrong field count
      relax_quotes: true, // tolerate unescaped quotes (e.g. 8" in a title)
      skip_records_with_error: true, // skip malformed rows instead of crashing
    }) as RawCsvRow[];

    this.products = rows
      .map((row) => this.mapRow(row))
      .filter((product): product is Product => product !== null);

    this.logger.log(`Loaded ${this.products.length} products from ${csvPath}`);
  }

  /** Convert a raw CSV row into a Product, returning null for invalid rows. */
  private mapRow(row: RawCsvRow): Product | null {
    const clean = (value: string | undefined): string => (value ?? '').trim();

    const displayTitle = clean(row.displayTitle);
    const embeddingText = clean(row.embeddingText);
    if (!displayTitle && !embeddingText) {
      return null; // not enough information to be useful
    }

    const rawPrice = clean(row.price);
    const { amount, currency } = parsePrice(rawPrice);

    return {
      displayTitle,
      embeddingText,
      url: clean(row.url),
      imageUrl: clean(row.imageUrl),
      productType: clean(row.productType),
      discount: clean(row.discount) === '1',
      rawPrice,
      price: amount,
      currency,
      variants: clean(row.variants),
      createDate: clean(row.createDate),
    };
  }

  /** Return the top 2 products related to the query. */
  search(query: string): ScoredProduct[] {
    return runSearch(query, this.products, 2);
  }

  /** Total number of products currently loaded (useful for diagnostics/tests). */
  get count(): number {
    return this.products.length;
  }
}
