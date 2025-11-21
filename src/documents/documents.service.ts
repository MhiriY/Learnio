import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocumentResponseDto } from './dto/document-response.dto.js';
import { ExtractTextResponseDto } from './dto/extract-text-response.dto.js';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse-fixed';

@Injectable()
export class DocumentsService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(file: any, userId: string): Promise<DocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // File type validation is handled by multer fileFilter

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
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        filePath: filePath,
      },
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

      // Save extracted text into document.content and set status to READY
      const updatedDocument = await (this.prisma as any).document.update({
        where: { id: documentId },
        data: {
          content: extractedText,
          status: 'READY',
        },
      });

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
}
