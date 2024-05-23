/*
  Warnings:

  - You are about to drop the column `createdAt` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `penalties` table. All the data in the column will be lost.
  - You are about to drop the `borrowed_books` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `books` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `penalties` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "borrowed_books" DROP CONSTRAINT "borrowed_books_bookId_fkey";

-- DropForeignKey
ALTER TABLE "borrowed_books" DROP CONSTRAINT "borrowed_books_userId_fkey";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "borrowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "borrowerId" INTEGER,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "penalties" DROP COLUMN "expiresAt",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "borrowed_books";

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
