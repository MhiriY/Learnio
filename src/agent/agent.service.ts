import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly model = 'gpt-5-nano';
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor() {
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
