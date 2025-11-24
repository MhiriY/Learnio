import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at runtime in Docker
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Create a PostgreSQL connection pool
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    // Initialize PrismaClient with the adapter
    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit() {
    // Optional: Test the connection
    await (this as any).$connect();
  }

  async onModuleDestroy() {
    // Clean up the connection pool
    await (this as any).$disconnect();
    await this.pool.end();
  }
}
