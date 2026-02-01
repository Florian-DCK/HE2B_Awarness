/*
  Warnings:

  - Added the required column `email` to the `Scoreboard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scoreboard" ADD COLUMN     "email" TEXT NOT NULL;
