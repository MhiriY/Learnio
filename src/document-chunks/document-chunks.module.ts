import { Module } from '@nestjs/common';
import { DocumentChunksService } from './document-chunks.service.js';
import { DocumentChunksController } from './document-chunks.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentChunksController],
  providers: [DocumentChunksService],
  exports: [DocumentChunksService],
})
export class DocumentChunksModule {}

