import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent/agent.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentChunksModule } from './document-chunks/document-chunks.module';
import { QuestionsModule } from './questions/questions.module';
import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env', // Load .env from root directory
    }),
    PrismaModule,
    AgentModule,
    UsersModule,
    AuthModule,
    DocumentsModule,
    DocumentChunksModule,
    QuestionsModule,
    ConversationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
