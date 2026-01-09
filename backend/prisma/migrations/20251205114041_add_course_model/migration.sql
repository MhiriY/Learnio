-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add optional courseId to Document
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
ALTER TABLE "Document" ADD CONSTRAINT "Document_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add optional courseId to Conversation
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;


