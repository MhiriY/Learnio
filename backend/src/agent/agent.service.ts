import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly model = 'gpt-5-nano';
  private client: OpenAI;
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
}
