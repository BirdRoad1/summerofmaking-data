/*
  Warnings:

  - You are about to drop the column `minutes_spent` on the `project` table. All the data in the column will be lost.
  - Added the required column `seconds_spent` to the `project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "project" DROP COLUMN "minutes_spent",
ADD COLUMN     "seconds_spent" INTEGER NOT NULL;
