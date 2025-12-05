import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, documentId?: string, title?: string) {
    return this.prisma.conversation.create({
      data: {
        userId,
        documentId: documentId || null,
        title: title || null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        document: {
          select: {
            id: true,
            originalFilename: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            originalFilename: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return conversation;
  }

  async update(id: string, userId: string, title?: string) {
    // Verify ownership
    await this.findOne(id, userId);

    return this.prisma.conversation.update({
      where: { id },
      data: {
        title,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    await this.findOne(id, userId);

    return this.prisma.conversation.delete({
      where: { id },
    });
  }

  async updateTitle(id: string, title: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        title,
        updatedAt: new Date(),
      },
    });
  }
}
