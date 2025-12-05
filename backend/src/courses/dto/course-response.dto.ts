import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseResponseDto {
  @ApiProperty({
    description: 'Course ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns the course',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Course title',
    example: 'Introduction to Machine Learning',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Course description',
    example:
      'A comprehensive course covering the fundamentals of machine learning',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Course creation timestamp',
    example: '2025-12-05T11:40:41.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Course last update timestamp',
    example: '2025-12-05T11:40:41.000Z',
  })
  updatedAt: Date;
}
