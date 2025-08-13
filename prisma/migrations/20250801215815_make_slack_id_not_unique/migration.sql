/*
  Warnings:

  - You are about to drop the column `userId` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "user_slack_id_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_user_id_key" ON "user"("user_id");
