/*
  Warnings:

  - You are about to drop the column `user_id` on the `project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slack_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slack_id` to the `project` table without a default value. This is not possible if the table is not empty.
  - Made the column `slack_id` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "project" DROP CONSTRAINT "project_user_id_fkey";

-- AlterTable
ALTER TABLE "project" DROP COLUMN "user_id",
ADD COLUMN     "slack_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "slack_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_slack_id_key" ON "user"("slack_id");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_slack_id_fkey" FOREIGN KEY ("slack_id") REFERENCES "user"("slack_id") ON DELETE RESTRICT ON UPDATE CASCADE;
