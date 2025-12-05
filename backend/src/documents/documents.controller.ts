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
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import { DocumentProcessingService } from './document-processing.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { DocumentResponseDto } from './dto/document-response.dto.js';
import { ExtractTextResponseDto } from './dto/extract-text-response.dto.js';
import { fileFilter } from './utils/file-filter.util.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

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
  @ApiOperation({
    summary: 'Upload a PDF or PPTX document',
    description:
      'Upload a document. Optionally specify courseId as a query parameter to assign the document to a course.',
  })
  @ApiQuery({
    name: 'courseId',
    required: false,
    type: String,
    description: 'Optional course ID to assign the document to. Must belong to the authenticated user.',
  })
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
    status: 403,
    description: 'Forbidden - Course does not belong to user',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
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
    @Query('courseId') courseId?: string,
  ): Promise<DocumentResponseDto> {
    // Get user ID from JWT token (set by JwtStrategy)
    const userId = req.user.id;
    return this.documentsService.uploadFile(file, userId, courseId);
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

  @Get(':id/file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document file' })
  @ApiResponse({
    status: 200,
    description: 'Document file',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Document does not belong to user',
  })
  async getFile(@Param('id') id: string, @Request() req: any, @Res() res: any) {
    try {
      // Verify document ownership
      const document = await this.documentsService.findOne(id);

      if (!document) {
        this.logger.warn(`Document ${id} not found`);
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      this.logger.log(
        `Found document ${id}, userId: ${document.userId}, requesting userId: ${req.user.id}`,
      );

      if (document.userId !== req.user.id) {
        this.logger.warn(
          `User ${req.user.id} attempted to access document ${id} owned by ${document.userId}`,
        );
        throw new ForbiddenException('You do not have access to this document');
      }

      // Determine file path - handle both absolute and relative paths
      let filePath: string;
      if (path.isAbsolute(document.filePath)) {
        // If filePath is already absolute, use it directly
        filePath = document.filePath;
      } else {
        // If filePath is relative, join with process.cwd()
        filePath = path.join(process.cwd(), document.filePath);
      }

      this.logger.log(`Attempting to serve file from path: ${filePath}`);
      this.logger.log(`Document filePath in DB: ${document.filePath}`);
      this.logger.log(`process.cwd(): ${process.cwd()}`);

      if (!fs.existsSync(filePath)) {
        this.logger.error(`File not found at path: ${filePath}`);
        this.logger.error(`Document filePath in DB: ${document.filePath}`);
        this.logger.error(`process.cwd(): ${process.cwd()}`);
        throw new NotFoundException(`File not found at path: ${filePath}`);
      }

      this.logger.log(`Successfully serving file: ${filePath}`);
      res.setHeader('Content-Type', 'application/pdf');
      res.sendFile(filePath);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Error serving file for document ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
