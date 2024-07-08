/*
  Warnings:

  - You are about to drop the column `ownerId` on the `books` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "books" DROP CONSTRAINT "books_ownerId_fkey";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "ownerId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "token" TEXT;
