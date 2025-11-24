import { IsString, IsOptional } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}

