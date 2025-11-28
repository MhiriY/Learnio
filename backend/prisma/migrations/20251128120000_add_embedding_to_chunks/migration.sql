-- AlterTable: Add embedding field to DocumentChunk
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS "embedding" JSONB;

