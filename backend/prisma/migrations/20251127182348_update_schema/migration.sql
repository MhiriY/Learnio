-- AlterTable: Add updatedAt to Document (with default for existing rows)
ALTER TABLE "Document" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to use createdAt as initial updatedAt value (more accurate than CURRENT_TIMESTAMP)
UPDATE "Document" SET "updatedAt" = "createdAt";

-- AlterTable: Remove subscriptionTier from User
ALTER TABLE "User" DROP COLUMN "subscriptionTier";

-- AlterTable: Add name to User
ALTER TABLE "User" ADD COLUMN "name" TEXT;

-- AlterTable: Remove title from Document (if it exists)
ALTER TABLE "Document" DROP COLUMN IF EXISTS "title";

-- AlterTable: Rename text to content in DocumentChunk
ALTER TABLE "DocumentChunk" RENAME COLUMN "text" TO "content";

-- AlterTable: Remove embedding from DocumentChunk
ALTER TABLE "DocumentChunk" DROP COLUMN IF EXISTS "embedding";

-- AlterTable: Add createdAt to DocumentChunk
ALTER TABLE "DocumentChunk" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateEnum: MessageRole (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Conversation
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Message
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: Conversation.userId -> User.id
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Conversation.documentId -> Document.id
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Message.conversationId -> Conversation.id
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update foreign key constraints to match schema (CASCADE for Document.userId)
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_fkey";
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update foreign key constraints to match schema (CASCADE for DocumentChunk.documentId)
ALTER TABLE "DocumentChunk" DROP CONSTRAINT IF EXISTS "DocumentChunk_documentId_fkey";
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update foreign key constraints to match schema (CASCADE for Question.userId)
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_userId_fkey";
ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

