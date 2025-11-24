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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service.js';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { DocumentResponseDto } from './dto/document-response.dto.js';
import { ExtractTextResponseDto } from './dto/extract-text-response.dto.js';
import { fileFilter } from './utils/file-filter.util.js';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
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
        userId: {
          type: 'string',
          description: 'ID of the user uploading the document',
        },
      },
      required: ['file', 'userId'],
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
  async upload(
    @UploadedFile() file: any,
    @Body() uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadFile(file, uploadDto.userId);
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
  async extract(
    @Param('id') id: string,
  ): Promise<ExtractTextResponseDto> {
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
