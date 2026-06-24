import type OpenAI from 'openai';

/** Centralized names so service code and schemas never drift apart. */
export const TOOL_NAMES = {
  searchProducts: 'searchProducts',
  convertCurrencies: 'convertCurrencies',
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

/**
 * OpenAI function-calling tool schemas exposed to the model.
 * The model decides when to call these (tool_choice: "auto").
 */
export const OPENAI_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: TOOL_NAMES.searchProducts,
      description:
        'Search the store product catalog and return up to 2 products related to the customer enquiry. ' +
        'Use this whenever the customer asks about products, gifts, prices or availability.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Keywords describing what the customer is looking for, e.g. "phone", "watch", "gift for dad".',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: TOOL_NAMES.convertCurrencies,
      description:
        'Convert a monetary amount from one currency to another using the latest exchange rates. ' +
        'Use this when the customer asks for a price in a different currency or to convert between currencies.',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'The numeric amount to convert.',
          },
          fromCurrency: {
            type: 'string',
            description: 'ISO 4217 source currency code, e.g. "USD".',
          },
          toCurrency: {
            type: 'string',
            description: 'ISO 4217 target currency code, e.g. "EUR".',
          },
        },
        required: ['amount', 'fromCurrency', 'toCurrency'],
        additionalProperties: false,
      },
    },
  },
];
