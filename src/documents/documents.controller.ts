import {
  Controller,
  Post,
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
}
