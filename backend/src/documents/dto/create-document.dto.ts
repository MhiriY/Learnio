import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  originalFilename?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}

