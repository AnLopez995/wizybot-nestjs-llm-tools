import { Product } from '../interfaces/product.interface';
import { normalize, searchProducts, tokenizeQuery } from './product-search.util';

function makeProduct(partial: Partial<Product>): Product {
  return {
    displayTitle: '',
    embeddingText: '',
    url: '',
    imageUrl: '',
    productType: '',
    discount: false,
    rawPrice: '',
    price: 0,
    currency: 'USD',
    variants: '',
    createDate: '',
    ...partial,
  };
}

const catalog: Product[] = [
  makeProduct({
    displayTitle: 'iPhone 12',
    embeddingText: 'iPhone 12 Technology technology celulares',
    productType: 'Technology',
    price: 900,
  }),
  makeProduct({
    displayTitle: 'Apple Watch Series 8 GPS',
    embeddingText: 'Apple Watch Series 8 GPS Technology smartwatch',
    productType: 'Technology',
    price: 350,
  }),
  makeProduct({
    displayTitle: "Men's Comfy Memory Foam Slide Slippers",
    embeddingText: "Men's Comfy Memory Foam Slide Slippers Clothing men",
    productType: 'Clothing',
    price: 23,
  }),
  makeProduct({
    displayTitle: 'Racerback Tank Tops for women',
    embeddingText: 'Racerback Tank Tops for women Clothing',
    productType: 'Clothing',
    price: 5,
  }),
];

describe('normalize', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalize('George Men’s Piqué Polo!')).toBe('george men s pique polo');
  });
});

describe('tokenizeQuery', () => {
  it('removes stopwords', () => {
    expect(tokenizeQuery('How much does a watch costs?')).toEqual(['watch']);
  });
});

describe('searchProducts', () => {
  it('finds phones for a phone query', () => {
    const results = searchProducts('I am looking for a phone', catalog);
    expect(results[0].product.displayTitle).toBe('iPhone 12');
  });

  it('finds the watch for a watch query', () => {
    const results = searchProducts('How much does a watch costs?', catalog);
    expect(results[0].product.displayTitle).toBe('Apple Watch Series 8 GPS');
  });

  it('does not match women products for a dad query (no "men" inside "women")', () => {
    const results = searchProducts('present for my dad', catalog);
    const titles = results.map((r) => r.product.displayTitle);
    expect(titles).toContain("Men's Comfy Memory Foam Slide Slippers");
    expect(titles).not.toContain('Racerback Tank Tops for women');
  });

  it('returns at most 2 products', () => {
    const results = searchProducts('technology', catalog);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchProducts('xyzzy', catalog)).toEqual([]);
  });
});
