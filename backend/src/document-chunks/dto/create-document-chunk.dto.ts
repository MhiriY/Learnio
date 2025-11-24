import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateDocumentChunkDto {
  @IsNotEmpty()
  @IsInt()
  index: number;

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsOptional()
  embedding?: any;

  @IsNotEmpty()
  @IsString()
  documentId: string;
}

