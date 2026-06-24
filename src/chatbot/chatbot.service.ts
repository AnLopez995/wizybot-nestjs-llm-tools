import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import type OpenAI from 'openai';
import { CurrencyService } from '../currency/currency.service';
import { OpenAiService } from '../openai/openai.service';
import { TOOL_NAMES } from '../openai/tools/openai-tools.definition';
import { ProductsService } from '../products/products.service';
import { SYSTEM_PROMPT } from './prompts/system.prompt';

/** Upper bound on tool-calling rounds to support multi-step flows safely. */
const MAX_TOOL_ITERATIONS = 3;

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly productsService: ProductsService,
    private readonly currencyService: CurrencyService,
  ) {}

  /**
   * Drive a Chat Completions conversation with function calling until the model
   * returns a final text answer or the iteration cap is reached.
   */
  async handleMessage(message: string): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ];

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const assistantMessage = await this.openAiService.createChatCompletion(messages);
      messages.push(assistantMessage);

      const toolCalls = assistantMessage.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        return assistantMessage.content ?? '';
      }

      for (const toolCall of toolCalls) {
        const result = await this.executeToolCall(toolCall);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Reached the iteration cap: ask once more for a final answer without tools forcing.
    const finalMessage = await this.openAiService.createChatCompletion(messages);
    if (finalMessage.content) {
      return finalMessage.content;
    }

    this.logger.error('Max tool iterations exceeded without a final answer');
    throw new InternalServerErrorException('Unable to produce a response, please try again.');
  }

  /**
   * Validate and execute a single tool call locally. Errors are returned as
   * structured data so the model can recover instead of aborting the request.
   */
  private async executeToolCall(
    toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
  ): Promise<unknown> {
    // The model may emit custom tool calls; we only support function tools.
    if (toolCall.type !== 'function') {
      return { error: `Unsupported tool call type: ${toolCall.type}` };
    }

    const { name, arguments: rawArgs } = toolCall.function;

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(rawArgs || '{}') as Record<string, unknown>;
    } catch {
      return { error: 'Invalid tool arguments: not valid JSON' };
    }

    try {
      switch (name) {
        case TOOL_NAMES.searchProducts:
          return this.handleSearchProducts(args);
        case TOOL_NAMES.convertCurrencies:
          return await this.handleConvertCurrencies(args);
        default:
          this.logger.warn(`Unknown tool requested: ${name}`);
          return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Tool "${name}" failed: ${(error as Error).message}`);
      return { error: (error as Error).message };
    }
  }

  private handleSearchProducts(args: Record<string, unknown>): unknown {
    const query = args.query;
    if (typeof query !== 'string' || query.trim().length === 0) {
      return { error: 'searchProducts requires a non-empty "query" string' };
    }

    const results = this.productsService.search(query);
    if (results.length === 0) {
      return { products: [], message: 'No related products were found.' };
    }

    return {
      products: results.map(({ product }) => ({
        title: product.displayTitle,
        price: product.price,
        currency: product.currency,
        productType: product.productType,
        url: product.url,
        onSale: product.discount,
      })),
    };
  }

  private async handleConvertCurrencies(args: Record<string, unknown>): Promise<unknown> {
    const { amount, fromCurrency, toCurrency } = args;

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return { error: 'convertCurrencies requires a numeric "amount"' };
    }
    if (typeof fromCurrency !== 'string' || fromCurrency.trim().length === 0) {
      return { error: 'convertCurrencies requires a "fromCurrency" string' };
    }
    if (typeof toCurrency !== 'string' || toCurrency.trim().length === 0) {
      return { error: 'convertCurrencies requires a "toCurrency" string' };
    }

    return this.currencyService.convert(amount, fromCurrency, toCurrency);
  }
}
