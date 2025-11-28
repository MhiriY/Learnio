import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    conversationId: string,
    userId: string,
    role: 'USER' | 'ASSISTANT' | 'SYSTEM',
    content: string,
  ) {
    // Verify conversation ownership
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });

    // Update conversation's updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async findAll(conversationId: string, userId: string) {
    // Verify conversation ownership
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.conversation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return message;
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    await this.findOne(id, userId);

    return this.prisma.message.delete({
      where: { id },
    });
  }
}
