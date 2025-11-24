import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly model = 'gpt-5-nano';
  private client: OpenAI;

  constructor(private configService: ConfigService) {
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
}
