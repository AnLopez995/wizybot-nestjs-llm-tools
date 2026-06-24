import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'The final natural-language answer produced by the chatbot.',
    example: 'I found two great phone options for you: ...',
  })
  response!: string;
}
