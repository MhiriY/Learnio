import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { DocumentsController } from './documents.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
