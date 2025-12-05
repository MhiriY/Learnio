import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { DocumentResponseDto } from './dto/document-response.dto.js';
import { ExtractTextResponseDto } from './dto/extract-text-response.dto.js';
import { DocumentProcessingService } from './document-processing.service.js';
import { CoursesService } from '../courses/courses.service.js';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse-fixed';

@Injectable()
export class DocumentsService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private documentProcessingService: DocumentProcessingService,
    private coursesService: CoursesService,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(
    file: any,
    userId: string,
    courseId?: string,
  ): Promise<DocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // File type validation is handled by multer fileFilter

    // Ensure user exists (user should be authenticated via JWT, but verify anyway)
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    // Validate course ownership if courseId is provided
    if (courseId) {
      try {
        await this.coursesService.findOne(courseId, userId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException(`Course with ID ${courseId} not found`);
        }
        if (error instanceof ForbiddenException) {
          throw new ForbiddenException('You do not have access to this course');
        }
        throw error;
      }
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, uniqueFilename);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Save document metadata to database
    const document = await (this.prisma as any).document.create({
      data: {
        userId,
        courseId: courseId || null,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        filePath: filePath,
      },
    });

    // Automatically extract text for PDFs so doc chat works immediately.
    if (document.mimeType === 'application/pdf') {
      try {
        await this.extractTextFromPDF(document.id);
      } catch (error) {
        this.logger.error(
          `Failed to extract text for document ${document.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        throw error;
      }
    }

    return {
      id: document.id,
      userId: document.userId,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      filePath: document.filePath,
      createdAt: document.createdAt,
    } as DocumentResponseDto;
  }

  async extractTextFromPDF(
    documentId: string,
  ): Promise<ExtractTextResponseDto> {
    // Load the document record from Prisma
    const document = await (this.prisma as any).document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Check if file is a PDF
    if (document.mimeType !== 'application/pdf') {
      throw new BadRequestException(
        'Text extraction is only supported for PDF files',
      );
    }

    // Check if file exists on disk
    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException(
        `File not found at path: ${document.filePath}`,
      );
    }

    try {
      // Update status to PROCESSING
      await (this.prisma as any).document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING' },
      });

      // Read the file from disk
      const fileBuffer = fs.readFileSync(document.filePath);

      // Parse the PDF text using pdf-parse-fixed
      const parsed = await pdf(fileBuffer);
      const extractedText = parsed.text;

      // Note: fileBuffer and parsed will be garbage collected after this scope

      // Save extracted text into document.content and set status to READY
      const updatedDocument = await (this.prisma as any).document.update({
        where: { id: documentId },
        data: {
          content: extractedText,
          status: 'READY',
        },
      });

      // Automatically chunk and generate embeddings asynchronously (don't block response)
      if (this.documentProcessingService) {
        // Process in background without awaiting - use void to explicitly mark as fire-and-forget
        void this.documentProcessingService
          .processDocument(documentId)
          .then(() => {
            this.logger.log(
              `Successfully processed chunks and embeddings for document ${documentId}`,
            );
          })
          .catch((error) => {
            this.logger.error(
              `Failed to process document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            // Update status to indicate processing failed but extraction succeeded
            void this.prisma.document.update({
              where: { id: documentId },
              data: { status: 'READY' }, // Keep as READY since extraction worked
            });
          });
      }

      // Return response (extractedText will be garbage collected after return)
      return {
        documentId: updatedDocument.id,
        content: extractedText,
        status: updatedDocument.status,
      };
    } catch (error) {
      // Update status to FAILED if extraction fails
      await (this.prisma as any).document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });

      throw new InternalServerErrorException(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async create(
    createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const document = await (this.prisma as any).document.create({
      data: createDocumentDto,
    });

    return {
      id: document.id,
      userId: document.userId,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      filePath: document.filePath,
      createdAt: document.createdAt,
    } as DocumentResponseDto;
  }

  async findAll(): Promise<DocumentResponseDto[]> {
    const documents = await (this.prisma as any).document.findMany();
    return documents.map((doc: any) => ({
      id: doc.id,
      userId: doc.userId,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      filePath: doc.filePath,
      createdAt: doc.createdAt,
    })) as DocumentResponseDto[];
  }

  async findOne(id: string): Promise<DocumentResponseDto> {
    const document = await (this.prisma as any).document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return {
      id: document.id,
      userId: document.userId,
      originalFilename: document.originalFilename,
      mimeType: document.mimeType,
      filePath: document.filePath,
      createdAt: document.createdAt,
    } as DocumentResponseDto;
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const document = await (this.prisma as any).document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const updated = await (this.prisma as any).document.update({
      where: { id },
      data: updateDocumentDto,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      originalFilename: updated.originalFilename,
      mimeType: updated.mimeType,
      filePath: updated.filePath,
      createdAt: updated.createdAt,
    } as DocumentResponseDto;
  }

  async remove(id: string): Promise<void> {
    const document = await (this.prisma as any).document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    await (this.prisma as any).document.delete({
      where: { id },
    });
  }
}
