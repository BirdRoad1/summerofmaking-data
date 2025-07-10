-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "readme_link" TEXT,
    "demo_link" TEXT,
    "repo_link" TEXT,
    "project_created_at" TIMESTAMP(3),
    "project_updated_at" TIMESTAMP(3),
    "minutes_spent" INTEGER NOT NULL,
    "devlogs_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "slack_id" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraped_page" (
    "id" SERIAL NOT NULL,
    "page_number" INTEGER NOT NULL,
    "last_scraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "scraped_page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_project_id_key" ON "project"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_slack_id_key" ON "user"("slack_id");

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
