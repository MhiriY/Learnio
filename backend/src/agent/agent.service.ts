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
import { RetrievalService } from '../retrieval/retrieval.service';
import { CoursesService } from '../courses/courses.service';

interface DocumentContext {
  context: string;
  source: 'rag' | 'full' | 'course-rag';
  metadata?: Array<{
    documentId?: string;
    documentFilename?: string;
  }>;
  chunks?: Array<{
    documentId: string;
    documentName: string;
    chunkIndex: number;
    content: string;
  }>;
}

interface ConversationData {
  conversation: any;
  history: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

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
    private readonly retrievalService?: RetrievalService,
    private readonly coursesService?: CoursesService,
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
    // Get document context (without userId check for docChat - legacy behavior)
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

    // Use full content for docChat (legacy behavior)
    const context: DocumentContext = {
      context: doc.content,
      source: 'full',
    };

    const systemPrompt = this.generateSystemPrompt(
      context.context,
      context.source,
    );

    const answer = await this.sendOpenAICompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return {
      documentId,
      answer,
    };
  }

  async chat(
    userId: string,
    prompt: string,
    conversationId?: string,
    courseId?: string,
    documentId?: string,
  ) {
    // 1. Validate course and document ownership
    await this.validateCourseAndDocument(userId, courseId, documentId);

    // 2. Get document/course context
    const documentContext = documentId
      ? await this.getDocumentContext(documentId, userId, prompt)
      : courseId
        ? await this.getCourseContext(courseId, userId, prompt)
        : null;

    // 3. Build system prompt
    const systemPrompt = documentContext
      ? this.generateSystemPrompt(
          documentContext.context,
          documentContext.source,
        )
      : 'You are a helpful AI assistant.';

    // 4. Load or create conversation and get message history
    const { conversation, history } = await this.loadConversationOrCreateNew(
      userId,
      prompt,
      conversationId,
      courseId,
      documentId,
    );

    // 4. Build OpenAI messages
    const messages = this.buildOpenAIMessages(systemPrompt, history, prompt);

    // 5. Store user message
    await this.messagesService.create(
      conversation.id as string,
      userId,
      'USER',
      prompt,
    );

    // 6. Call OpenAI
    const assistantResponse = await this.sendOpenAICompletion(messages);

    if (!assistantResponse) {
      throw new Error('No response from AI model');
    }

    // 7. Store assistant message
    await this.messagesService.create(
      conversation.id as string,
      userId,
      'ASSISTANT',
      assistantResponse,
    );

    // 8. Extract sources from document context
    const sources = documentContext?.chunks || [];

    // 9. Return response
    return {
      conversationId: conversation.id,
      answer: assistantResponse,
      sources,
    };
  }

  async chatStream(
    userId: string,
    prompt: string,
    conversationId: string | undefined,
    courseId: string | undefined,
    documentId: string | undefined,
    res: Response,
  ) {
    // 1. Validate course and document ownership
    await this.validateCourseAndDocument(userId, courseId, documentId);

    // 2. Get document/course context
    const documentContext = documentId
      ? await this.getDocumentContext(documentId, userId, prompt)
      : courseId
        ? await this.getCourseContext(courseId, userId, prompt)
        : null;

    // 3. Build system prompt
    const systemPrompt = documentContext
      ? this.generateSystemPrompt(
          documentContext.context,
          documentContext.source,
        )
      : 'You are a helpful AI assistant.';

    // 4. Load or create conversation and get message history
    const { conversation, history } = await this.loadConversationOrCreateNew(
      userId,
      prompt,
      conversationId,
      courseId,
      documentId,
    );

    // 4. Build OpenAI messages
    const messages = this.buildOpenAIMessages(systemPrompt, history, prompt);

    // 5. Store user message
    await this.messagesService.create(
      conversation.id as string,
      userId,
      'USER',
      prompt,
    );

    // 6. Extract sources from document context
    const sources = documentContext?.chunks || [];

    // 7. Send conversation ID first
    res.write(
      `data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`,
    );

    // 8. Call OpenAI with streaming
    const fullResponse = await this.sendOpenAIStreaming(messages, res);

    // 9. Store assistant message
    if (fullResponse) {
      await this.messagesService.create(
        conversation.id as string,
        userId,
        'ASSISTANT',
        fullResponse,
      );
    }

    // 10. Send sources
    res.write(`data: ${JSON.stringify({ sources })}\n\n`);

    // 11. Send done signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }

  /**
   * Get document context with RAG retrieval or fallback to full content
   * Handles document loading, ownership validation, and context retrieval
   */
  private async getDocumentContext(
    documentId: string,
    userId: string,
    userPrompt: string,
  ): Promise<DocumentContext | null> {
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

    // Use RAG retrieval if available, otherwise fall back to full content
    if (this.retrievalService) {
      try {
        const relevantChunks =
          await this.retrievalService.retrieveRelevantChunks(
            documentId,
            userPrompt,
            5, // top-K
          );

        if (relevantChunks.length > 0) {
          const contextChunks = relevantChunks.map(
            (chunk) => `[Chunk ${chunk.index}]: ${chunk.content}`,
          );
          return {
            context: contextChunks.join('\n\n---\n\n'),
            source: 'rag',
            chunks: relevantChunks.map((chunk) => ({
              documentId: documentId,
              documentName: doc.originalFilename || 'Untitled',
              chunkIndex: chunk.index,
              content: chunk.content,
            })),
          };
        } else if (doc.content) {
          // Fallback to full content if no chunks found
          return {
            context: doc.content,
            source: 'full',
          };
        }
      } catch (error) {
        this.logger.warn(
          `RAG retrieval failed, falling back to full content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        // Fallback to full content on error
        if (doc.content) {
          return {
            context: doc.content,
            source: 'full',
          };
        }
      }
    } else if (doc.content) {
      // Fallback if retrieval service not available
      return {
        context: doc.content,
        source: 'full',
      };
    }

    return null;
  }

  /**
   * Validate course and document ownership and relationship
   */
  private async validateCourseAndDocument(
    userId: string,
    courseId?: string,
    documentId?: string,
  ): Promise<void> {
    // If courseId is provided, validate ownership
    if (courseId && this.coursesService) {
      await this.coursesService.findOne(courseId, userId);
    }

    // If both courseId and documentId are provided, verify document belongs to course
    if (courseId && documentId) {
      const doc = await this.prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true, userId: true, courseId: true as any },
      });

      if (!doc) {
        throw new NotFoundException('Document not found');
      }

      if (doc.userId !== userId) {
        throw new ForbiddenException('You do not have access to this document');
      }

      if ((doc as any).courseId !== courseId) {
        throw new ForbiddenException(
          'Document does not belong to the specified course',
        );
      }
    }
  }

  /**
   * Get course context with RAG retrieval across all documents in the course
   */
  private async getCourseContext(
    courseId: string,
    userId: string,
    userPrompt: string,
  ): Promise<DocumentContext | null> {
    // Verify course ownership
    if (this.coursesService) {
      await this.coursesService.findOne(courseId, userId);
    }

    // Use RAG retrieval if available
    if (this.retrievalService) {
      try {
        const relevantChunks =
          await this.retrievalService.retrieveRelevantChunksForCourse(
            courseId,
            userPrompt,
            10, // top-K for course (more chunks since multiple documents)
          );

        if (relevantChunks.length > 0) {
          // Format chunks with document identifiers
          const contextChunks = relevantChunks.map(
            (chunk) =>
              `[Doc: ${chunk.documentFilename || 'Untitled'} | Chunk ${chunk.index}]: ${chunk.content}`,
          );

          return {
            context: contextChunks.join('\n\n---\n\n'),
            source: 'course-rag',
            metadata: relevantChunks.map((chunk) => ({
              documentId: chunk.documentId,
              documentFilename: chunk.documentFilename,
            })),
            chunks: relevantChunks.map((chunk) => ({
              documentId: chunk.documentId || '',
              documentName: chunk.documentFilename || 'Untitled',
              chunkIndex: chunk.index,
              content: chunk.content,
            })),
          };
        }
      } catch (error) {
        this.logger.warn(
          `Course RAG retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Fallback: get all documents in course and use their content
    const documents = await this.prisma.document.findMany({
      where: {
        courseId: courseId as any,
        userId, // Ensure documents belong to user
      },
      select: {
        id: true,
        originalFilename: true,
        content: true,
      },
    });

    if (documents.length === 0) {
      return null;
    }

    // Concatenate document contents (limit to avoid token overflow)
    const maxContentLength = 10000; // Approximate limit
    let totalContent = '';
    const usedDocuments: Array<{ documentId?: string; documentFilename?: string }> = [];

    for (const doc of documents) {
      if (doc.content && totalContent.length < maxContentLength) {
        const remaining = maxContentLength - totalContent.length;
        const contentToAdd = doc.content.substring(0, remaining);
        totalContent += `[Document: ${doc.originalFilename || 'Untitled'}]\n${contentToAdd}\n\n`;
        usedDocuments.push({
          documentId: doc.id,
          documentFilename: doc.originalFilename || undefined,
        });
      }
    }

    if (totalContent) {
      return {
        context: totalContent,
        source: 'full',
        metadata: usedDocuments,
      };
    }

    return null;
  }

  /**
   * Generate system prompt based on context and source type
   */
  private generateSystemPrompt(
    context: string,
    source: 'rag' | 'full' | 'course-rag',
  ): string {
    if (source === 'course-rag') {
      return `
You are an academic assistant. 
You must strictly use the following retrieved context from the course documents to answer user questions.
If something is not in the provided context, say "The information is not available in the provided course materials."

Retrieved Context from Course:
${context}
      `;
    } else if (source === 'rag') {
      return `
You are an academic assistant. 
You must strictly use the following retrieved context from the document to answer user questions.
If something is not in the provided context, say "The information is not available in the provided document."

Retrieved Context:
${context}
      `;
    } else {
      return `
You are an academic assistant. 
You must strictly use the following document content to answer user questions.
If something is not in the document, say "The information is not available in the provided document."

Document Content:
${context}
      `;
    }
  }

  /**
   * Load existing conversation or create a new one
   * Returns conversation and message history
   */
  private async loadConversationOrCreateNew(
    userId: string,
    prompt: string,
    conversationId?: string,
    courseId?: string,
    documentId?: string,
  ): Promise<ConversationData> {
    let conversation;
    let history: OpenAIMessage[] = [];

    if (conversationId) {
      // Load existing conversation and verify ownership
      conversation = await this.conversationsService.findOne(
        conversationId,
        userId,
      );

      // Verify conversation belongs to the correct course if courseId is provided
      if (courseId && conversation.courseId !== courseId) {
        throw new ForbiddenException(
          'Conversation does not belong to the specified course',
        );
      }

      // Verify conversation belongs to the correct document if documentId is provided
      if (documentId && conversation.documentId !== documentId) {
        throw new ForbiddenException(
          'Conversation does not belong to the specified document',
        );
      }

      // Load message history
      history = await this.buildMessageHistory(conversationId, userId);
    } else {
      // Create new conversation
      const title =
        prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      conversation = await this.conversationsService.create(
        userId,
        courseId,
        documentId,
        title,
      );
    }

    return { conversation, history };
  }

  /**
   * Load and format message history for OpenAI
   */
  private async buildMessageHistory(
    conversationId: string,
    userId: string,
  ): Promise<OpenAIMessage[]> {
    const messageHistory = await this.messagesService.findAll(
      conversationId,
      userId,
    );

    return messageHistory.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  /**
   * Build OpenAI messages array with system prompt, history, and current user input
   */
  private buildOpenAIMessages(
    systemPrompt: string,
    history: OpenAIMessage[],
    userInput: string,
  ): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [];

    // Add system prompt at the beginning
    messages.push({ role: 'system', content: systemPrompt });

    // Add message history (excluding any existing system messages)
    messages.push(...history.filter((msg) => msg.role !== 'system'));

    // Add current user message
    messages.push({ role: 'user', content: userInput });

    return messages;
  }

  /**
   * Send OpenAI completion request (non-streaming)
   */
  private async sendOpenAICompletion(
    messages: OpenAIMessage[],
  ): Promise<string | null> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
    });

    return completion.choices[0].message.content;
  }

  /**
   * Send OpenAI streaming request
   * Returns the full accumulated response
   */
  private async sendOpenAIStreaming(
    messages: OpenAIMessage[],
    res: Response,
  ): Promise<string> {
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

    return fullResponse;
  }
}
