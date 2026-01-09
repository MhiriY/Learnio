-- AlterTable: Only alter if table exists (for migration order compatibility)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Conversation') THEN
        ALTER TABLE "Conversation" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable: Only alter if column exists (migration order compatibility)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Document' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Document" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable: Only alter if column exists (migration order compatibility)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;
