import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { QuestionResponseDto } from './dto/question-response.dto.js';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<QuestionResponseDto> {
    const question = await (this.prisma as any).question.create({
      data: createQuestionDto,
    });

    return {
      id: question.id,
      question: question.question,
      answer: question.answer,
      createdAt: question.createdAt,
      userId: question.userId,
      documentId: question.documentId,
    };
  }

  async findAll(): Promise<QuestionResponseDto[]> {
    const questions = await (this.prisma as any).question.findMany();
    return questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      createdAt: q.createdAt,
      userId: q.userId,
      documentId: q.documentId,
    }));
  }

  async findOne(id: string): Promise<QuestionResponseDto> {
    const question = await (this.prisma as any).question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    return {
      id: question.id,
      question: question.question,
      answer: question.answer,
      createdAt: question.createdAt,
      userId: question.userId,
      documentId: question.documentId,
    };
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    const question = await (this.prisma as any).question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    const updated = await (this.prisma as any).question.update({
      where: { id },
      data: updateQuestionDto,
    });

    return {
      id: updated.id,
      question: updated.question,
      answer: updated.answer,
      createdAt: updated.createdAt,
      userId: updated.userId,
      documentId: updated.documentId,
    };
  }

  async remove(id: string): Promise<void> {
    const question = await (this.prisma as any).question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    await (this.prisma as any).question.delete({
      where: { id },
    });
  }
}

