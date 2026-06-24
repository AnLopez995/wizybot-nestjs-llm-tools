import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OPENAI_TOOLS } from './tools/openai-tools.definition';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.model = this.configService.getOrThrow<string>('OPENAI_MODEL');
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Thin wrapper around Chat Completions. Always offers the function-calling
   * tools with tool_choice "auto" so the model decides when to use them.
   */
  async createChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessage> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: OPENAI_TOOLS,
        tool_choice: 'auto',
      });
      return completion.choices[0].message;
    } catch (error) {
      this.logger.error(`OpenAI request failed: ${(error as Error).message}`);
      throw new BadGatewayException('Language model provider returned an error');
    }
  }
}
