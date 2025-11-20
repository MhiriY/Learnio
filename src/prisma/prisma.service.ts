import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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
    await this.$connect();
  }

  async onModuleDestroy() {
    // Clean up the connection pool
    await this.$disconnect();
    await this.pool.end();
  }
}

