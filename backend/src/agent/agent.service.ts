import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly model = 'gpt-5-nano';
  private client: OpenAI;
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured');
      throw new Error(
        'OPENAI_API_KEY is required but not found in environment variables',
      );
    }
    this.client = new OpenAI({ apiKey });
    this.logger.log(`AgentService initialized with model: ${this.model}`);
  }

  async ask(prompt: string) {
    this.logger.log(`Making request with model: ${this.model}`);
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });
    this.logger.log(`Response received from model: ${res.model}`);
    return res.choices[0].message.content;
  }

  async docChat(documentId: string, userPrompt: string) {
    // 1. Fetch the document from the database
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    if (!doc.content) {
      throw new Error(
        'Document has no extracted text. Extract it before chatting.',
      );
    }

    // 2. Build the context-aware prompt
    const systemPrompt = `
You are an academic assistant. 
You must strictly use the following document content to answer user questions.
If something is not in the document, say "The information is not available in the provided document."

Document Content:
${doc.content}
  `;

    // 3. Call the OpenAI agent
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const answer = completion.choices[0].message.content;

    return {
      documentId,
      answer,
    };
  }

  async chat(
    userId: string,
    prompt: string,
    conversationId?: string,
    documentId?: string,
  ) {
    let conversation;
    let messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [];

    // Build system prompt
    let systemPrompt = 'You are a helpful AI assistant.';

    if (documentId) {
      const doc = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!doc) {
        throw new NotFoundException('Document not found');
      }

      // Verify document ownership
      if (doc.userId !== userId) {
        throw new ForbiddenException('You do not have access to this document');
      }

      if (doc.content) {
        systemPrompt = `
You are an academic assistant. 
You must strictly use the following document content to answer user questions.
If something is not in the document, say "The information is not available in the provided document."

Document Content:
${doc.content}
        `;
      }
    }

    // Handle conversation
    if (conversationId) {
      // Load existing conversation and verify ownership
      conversation = await this.conversationsService.findOne(
        conversationId,
        userId,
      );

      // Load message history
      const messageHistory = await this.messagesService.findAll(
        conversationId,
        userId,
      );

      // Convert to OpenAI format
      messages = messageHistory.map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));
    } else {
      // Create new conversation
      const title =
        prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      conversation = await this.conversationsService.create(
        userId,
        documentId,
        title,
      );
    }

    // Add system prompt at the beginning
    messages.unshift({ role: 'system', content: systemPrompt });

    // Add current user message
    messages.push({ role: 'user', content: prompt });

    // Store user message
    await this.messagesService.create(conversation.id, userId, 'USER', prompt);

    // Call OpenAI
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
    });

    const assistantResponse = completion.choices[0].message.content;

    if (!assistantResponse) {
      throw new Error('No response from AI model');
    }

    // Store assistant message
    await this.messagesService.create(
      conversation.id,
      userId,
      'ASSISTANT',
      assistantResponse,
    );

    return {
      conversationId: conversation.id,
      answer: assistantResponse,
    };
  }

  async chatStream(
    userId: string,
    prompt: string,
    conversationId: string | undefined,
    documentId: string | undefined,
    res: Response,
  ) {
    let conversation;
    let messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [];

    // Build system prompt
    let systemPrompt = 'You are a helpful AI assistant.';

    if (documentId) {
      const doc = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!doc) {
        throw new NotFoundException('Document not found');
      }

      if (doc.userId !== userId) {
        throw new ForbiddenException('You do not have access to this document');
      }

      if (doc.content) {
        systemPrompt = `
You are an academic assistant. 
You must strictly use the following document content to answer user questions.
If something is not in the document, say "The information is not available in the provided document."

Document Content:
${doc.content}
        `;
      }
    }

    // Handle conversation
    if (conversationId) {
      conversation = await this.conversationsService.findOne(
        conversationId,
        userId,
      );

      const messageHistory = await this.messagesService.findAll(
        conversationId,
        userId,
      );

      messages = messageHistory.map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));
    } else {
      const title =
        prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      conversation = await this.conversationsService.create(
        userId,
        documentId,
        title,
      );
    }

    // Add system prompt at the beginning
    messages.unshift({ role: 'system', content: systemPrompt });

    // Add current user message
    messages.push({ role: 'user', content: prompt });

    // Store user message
    await this.messagesService.create(conversation.id, userId, 'USER', prompt);

    // Send conversation ID first
    res.write(
      `data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`,
    );

    // Call OpenAI with streaming
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Store assistant message
    if (fullResponse) {
      await this.messagesService.create(
        conversation.id,
        userId,
        'ASSISTANT',
        fullResponse,
      );
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
}
