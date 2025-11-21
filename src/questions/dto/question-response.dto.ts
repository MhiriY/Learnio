export class QuestionResponseDto {
  id: string;
  question: string;
  answer?: string;
  createdAt: Date;
  userId: string;
  documentId?: string;
}

