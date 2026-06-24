/**
 * Normalized product loaded from products_list.csv.
 * Raw CSV columns: displayTitle, embeddingText, url, imageUrl, productType,
 * discount, price, variants, createDate.
 */
export interface Product {
  displayTitle: string;
  embeddingText: string;
  url: string;
  imageUrl: string;
  productType: string;
  discount: boolean;
  /** Raw price text as stored in the CSV, e.g. "17.0 USD" or "13.0 - 15.0 USD". */
  rawPrice: string;
  /** Numeric price parsed from rawPrice (lower bound for ranges). */
  price: number;
  /** Currency code parsed from rawPrice, defaults to "USD". */
  currency: string;
  variants: string;
  createDate: string;
}

/** A product paired with the relevance score produced by the search algorithm. */
export interface ScoredProduct {
  product: Product;
  score: number;
}
