export class DocumentResponseDto {
  id: string;
  userId: string;
  originalFilename: string | null;
  mimeType: string | null;
  filePath: string;
  createdAt: Date;
}
