import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { DocChatDto } from './dto/doc-chat.dto.js';
@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) { }
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', example: 'Explain overfitting simply.' },
      },
    },
  })
  @Post('ask')
  async askAgent(@Body('prompt') prompt: string) {
    const result = await this.agentService.ask(prompt);
    return { response: result };
  }
  @Post('doc-chat')
  async docChat(@Body() dto: DocChatDto) {
    return this.agentService.docChat(dto.documentId, dto.prompt);
  }
}
