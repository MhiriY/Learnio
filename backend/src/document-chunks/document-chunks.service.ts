import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDocumentChunkDto } from './dto/create-document-chunk.dto.js';
import { UpdateDocumentChunkDto } from './dto/update-document-chunk.dto.js';
import { DocumentChunkResponseDto } from './dto/document-chunk-response.dto.js';

@Injectable()
export class DocumentChunksService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDocumentChunkDto: CreateDocumentChunkDto,
  ): Promise<DocumentChunkResponseDto> {
    const chunk = await (this.prisma as any).documentChunk.create({
      data: createDocumentChunkDto,
    });

    return {
      id: chunk.id,
      index: chunk.index,
      text: chunk.text,
      embedding: chunk.embedding,
      documentId: chunk.documentId,
    };
  }

  async findAll(): Promise<DocumentChunkResponseDto[]> {
    const chunks = await (this.prisma as any).documentChunk.findMany();
    return chunks.map((chunk: any) => ({
      id: chunk.id,
      index: chunk.index,
      text: chunk.text,
      embedding: chunk.embedding,
      documentId: chunk.documentId,
    }));
  }

  async findOne(id: string): Promise<DocumentChunkResponseDto> {
    const chunk = await (this.prisma as any).documentChunk.findUnique({
      where: { id },
    });

    if (!chunk) {
      throw new NotFoundException(`DocumentChunk with ID ${id} not found`);
    }

    return {
      id: chunk.id,
      index: chunk.index,
      text: chunk.text,
      embedding: chunk.embedding,
      documentId: chunk.documentId,
    };
  }

  async update(
    id: string,
    updateDocumentChunkDto: UpdateDocumentChunkDto,
  ): Promise<DocumentChunkResponseDto> {
    const chunk = await (this.prisma as any).documentChunk.findUnique({
      where: { id },
    });

    if (!chunk) {
      throw new NotFoundException(`DocumentChunk with ID ${id} not found`);
    }

    const updated = await (this.prisma as any).documentChunk.update({
      where: { id },
      data: updateDocumentChunkDto,
    });

    return {
      id: updated.id,
      index: updated.index,
      text: updated.text,
      embedding: updated.embedding,
      documentId: updated.documentId,
    };
  }

  async remove(id: string): Promise<void> {
    const chunk = await (this.prisma as any).documentChunk.findUnique({
      where: { id },
    });

    if (!chunk) {
      throw new NotFoundException(`DocumentChunk with ID ${id} not found`);
    }

    await (this.prisma as any).documentChunk.delete({
      where: { id },
    });
  }
}

