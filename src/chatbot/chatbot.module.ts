import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { OpenAiModule } from '../openai/openai.module';
import { ProductsModule } from '../products/products.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [OpenAiModule, ProductsModule, CurrencyModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
