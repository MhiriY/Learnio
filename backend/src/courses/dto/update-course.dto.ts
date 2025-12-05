import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({
    description: 'Course title',
    example: 'Advanced Machine Learning',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Course description',
    example: 'An advanced course covering deep learning and neural networks',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
