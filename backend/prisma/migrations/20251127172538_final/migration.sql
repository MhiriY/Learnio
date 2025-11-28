-- AlterTable: Only alter if table exists (for migration order compatibility)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Conversation') THEN
        ALTER TABLE "Conversation" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
