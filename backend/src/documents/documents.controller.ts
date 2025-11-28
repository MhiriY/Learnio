import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import { DocumentProcessingService } from './document-processing.service.js';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { DocumentResponseDto } from './dto/document-response.dto.js';
import { ExtractTextResponseDto } from './dto/extract-text-response.dto.js';
import { fileFilter } from './utils/file-filter.util.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentProcessingService: DocumentProcessingService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: fileFilter,
    }),
  )
  @ApiOperation({ summary: 'Upload a PDF or PPTX document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF or PPTX file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document successfully uploaded',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or missing file',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async upload(
    @UploadedFile() file: any,
    @Request() req: any,
  ): Promise<DocumentResponseDto> {
    // Get user ID from JWT token (set by JwtStrategy)
    const userId = req.user.id;
    return this.documentsService.uploadFile(file, userId);
  }

  @Post(':id/extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract text from a PDF document' })
  @ApiResponse({
    status: 200,
    description: 'Text successfully extracted from PDF',
    type: ExtractTextResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Document is not a PDF file',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to extract text from PDF',
  })
  async extract(@Param('id') id: string): Promise<ExtractTextResponseDto> {
    return this.documentsService.extractTextFromPDF(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({
    status: 201,
    description: 'Document successfully created',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  @ApiResponse({
    status: 200,
    description: 'List of all documents',
    type: [DocumentResponseDto],
  })
  async findAll(): Promise<DocumentResponseDto[]> {
    return this.documentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document found',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async findOne(@Param('id') id: string): Promise<DocumentResponseDto> {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document' })
  @ApiResponse({
    status: 200,
    description: 'Document successfully updated',
    type: DocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Get(':id/chunks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all chunks for a document' })
  @ApiResponse({
    status: 200,
    description: 'List of document chunks',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async getChunks(@Param('id') id: string, @Request() req: any) {
    // Verify document ownership
    const document = await this.documentsService.findOne(id);
    if (document.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // Access Prisma through DocumentsService's prisma property
    const prisma = (this.documentsService as any).prisma;
    const chunks = await prisma.documentChunk.findMany({
      where: { documentId: id },
      orderBy: { index: 'asc' },
      select: {
        id: true,
        index: true,
        content: true,
        createdAt: true,
        // Don't return embedding (too large)
      },
    });

    return chunks;
  }

  @Post(':id/rebuild')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rebuild chunks and embeddings for a document' })
  @ApiResponse({
    status: 200,
    description: 'Chunks and embeddings successfully rebuilt',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async rebuild(@Param('id') id: string, @Request() req: any) {
    // Verify document ownership
    const document = await this.documentsService.findOne(id);
    if (document.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this document');
    }

    await this.documentProcessingService.processDocument(id);
    return { message: 'Chunks and embeddings rebuilt successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({
    status: 204,
    description: 'Document successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.documentsService.remove(id);
  }
}
