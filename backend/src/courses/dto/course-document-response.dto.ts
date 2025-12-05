import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseDocumentResponseDto {
  @ApiProperty({
    description: 'Document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'lecture-notes.pdf',
  })
  originalFilename: string | null;

  @ApiProperty({
    description: 'Document creation timestamp',
    example: '2025-12-05T11:40:41.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Document processing status',
    enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'],
    example: 'READY',
  })
  status: string;
}

