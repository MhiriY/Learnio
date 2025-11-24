import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DocumentChunksService } from './document-chunks.service.js';
import { CreateDocumentChunkDto } from './dto/create-document-chunk.dto.js';
import { UpdateDocumentChunkDto } from './dto/update-document-chunk.dto.js';
import { DocumentChunkResponseDto } from './dto/document-chunk-response.dto.js';

@ApiTags('document-chunks')
@Controller('document-chunks')
export class DocumentChunksController {
  constructor(
    private readonly documentChunksService: DocumentChunksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new document chunk' })
  @ApiResponse({
    status: 201,
    description: 'Document chunk successfully created',
    type: DocumentChunkResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async create(
    @Body() createDocumentChunkDto: CreateDocumentChunkDto,
  ): Promise<DocumentChunkResponseDto> {
    return this.documentChunksService.create(createDocumentChunkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all document chunks' })
  @ApiResponse({
    status: 200,
    description: 'List of all document chunks',
    type: [DocumentChunkResponseDto],
  })
  async findAll(): Promise<DocumentChunkResponseDto[]> {
    return this.documentChunksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document chunk by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document chunk found',
    type: DocumentChunkResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document chunk not found',
  })
  async findOne(@Param('id') id: string): Promise<DocumentChunkResponseDto> {
    return this.documentChunksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document chunk' })
  @ApiResponse({
    status: 200,
    description: 'Document chunk successfully updated',
    type: DocumentChunkResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document chunk not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDocumentChunkDto: UpdateDocumentChunkDto,
  ): Promise<DocumentChunkResponseDto> {
    return this.documentChunksService.update(id, updateDocumentChunkDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document chunk' })
  @ApiResponse({
    status: 204,
    description: 'Document chunk successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Document chunk not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.documentChunksService.remove(id);
  }
}

