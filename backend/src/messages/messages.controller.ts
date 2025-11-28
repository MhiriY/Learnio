import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversation/:conversationId')
  findAllByConversation(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.messagesService.findAll(conversationId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.messagesService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.messagesService.remove(id, req.user.id);
  }
}

