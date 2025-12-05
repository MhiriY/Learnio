import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from '../messages/messages.service';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  create(
    @Req() req: any,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.create(
      req.user.id,
      createConversationDto.documentId,
      createConversationDto.title,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.conversationsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.findOne(id, req.user.id);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string, @Req() req: any) {
    return this.messagesService.findAll(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(
      id,
      req.user.id,
      updateConversationDto.title,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.remove(id, req.user.id);
  }
}
