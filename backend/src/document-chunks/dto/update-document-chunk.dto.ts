import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateDocumentChunkDto {
  @IsOptional()
  @IsInt()
  index?: number;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  embedding?: any;
}
