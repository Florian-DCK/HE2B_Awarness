/*
  Warnings:

  - Added the required column `pseudo` to the `PlayerRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlayerRegistration" ADD COLUMN     "pseudo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Scoreboard" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "pseudo" TEXT;
