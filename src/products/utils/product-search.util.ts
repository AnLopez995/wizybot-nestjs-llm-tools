import { Product, ScoredProduct } from '../interfaces/product.interface';

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/** Common English words that carry no search signal and would inflate scores. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'of', 'to', 'in', 'on', 'with', 'my',
  'me', 'is', 'are', 'am', 'be', 'do', 'does', 'how', 'what', 'much', 'cost',
  'costs', 'price', 'looking', 'want', 'need', 'find', 'this', 'that', 'you',
  'your', 'please', 'some', 'any',
]);

/** Tokenize normalized text into meaningful words (drop very short tokens). */
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((token) => token.length > 1);
}

/** Tokenize and drop stopwords — used for the user query side of the search. */
export function tokenizeQuery(text: string): string[] {
  return tokenize(text).filter((token) => !STOPWORDS.has(token));
}

/**
 * Lightweight synonym map to bridge common customer phrasing to catalog terms.
 * Kept intentionally small; embeddings are out of scope for this assessment.
 */
const SYNONYMS: Record<string, string[]> = {
  phone: ['smartphone', 'mobile', 'cellphone', 'iphone', 'android'],
  watch: ['smartwatch', 'wristwatch', 'clock'],
  dad: ['father', 'men', 'mens', 'man'],
  present: ['gift'],
  gift: ['present'],
};

/** Expand query tokens with their configured synonyms (deduplicated). */
export function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    for (const synonym of SYNONYMS[token] ?? []) {
      expanded.add(synonym);
    }
  }
  return Array.from(expanded);
}

const WEIGHT_TITLE = 3;
const WEIGHT_TYPE = 2;
const WEIGHT_EMBEDDING = 1;

/**
 * Score a single product against the (synonym-expanded) query tokens.
 * displayTitle matches weigh most, then productType, then embeddingText.
 *
 * Matching is whole-word (token equality), not substring, to avoid false
 * positives such as "men" matching inside "women".
 */
function scoreProduct(product: Product, queryTokens: string[]): number {
  const titleTokens = new Set(tokenize(product.displayTitle));
  const typeTokens = new Set(tokenize(product.productType));
  const embeddingTokens = new Set(tokenize(product.embeddingText));

  let score = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += WEIGHT_TITLE;
    if (typeTokens.has(token)) score += WEIGHT_TYPE;
    if (embeddingTokens.has(token)) score += WEIGHT_EMBEDDING;
  }
  return score;
}

/**
 * Return the top `limit` products related to `query`, ranked by keyword score.
 * Products with a zero score are excluded.
 */
export function searchProducts(query: string, products: Product[], limit = 2): ScoredProduct[] {
  const queryTokens = expandWithSynonyms(tokenizeQuery(query));
  if (queryTokens.length === 0) {
    return [];
  }

  return products
    .map((product) => ({ product, score: scoreProduct(product, queryTokens) }))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
