import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { DocumentsController } from './documents.controller.js';
import { DocumentProcessingService } from './document-processing.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ChunkingModule } from '../chunking/chunking.module.js';
import { EmbeddingsModule } from '../embeddings/embeddings.module.js';

@Module({
  imports: [PrismaModule, ChunkingModule, EmbeddingsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentProcessingService],
  exports: [DocumentsService, DocumentProcessingService],
})
export class DocumentsModule {}
