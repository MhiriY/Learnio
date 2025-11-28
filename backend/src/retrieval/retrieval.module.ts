import { Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [PrismaModule, EmbeddingsModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}

