import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, ConversationsModule, MessagesModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
