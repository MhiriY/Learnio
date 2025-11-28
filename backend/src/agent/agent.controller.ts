import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AgentService } from './agent.service';
import { DocChatDto } from './dto/doc-chat.dto.js';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Req() req: any, @Body() dto: ChatDto) {
    return this.agentService.chat(
      req.user.id,
      dto.prompt,
      dto.conversationId,
      dto.documentId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('chat/stream')
  async chatStream(
    @Req() req: any,
    @Body() dto: ChatDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      await this.agentService.chatStream(
        req.user.id,
        dto.prompt,
        dto.conversationId,
        dto.documentId,
        res,
      );
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
