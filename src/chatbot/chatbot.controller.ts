import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('chatbot')
@Controller('chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @ApiOperation({
    summary: 'Send a message to the chatbot and receive the final answer.',
  })
  async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    const response = await this.chatbotService.handleMessage(body.message);
    return { response };
  }
}
