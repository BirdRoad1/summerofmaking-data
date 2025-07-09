-- CreateTable
CREATE TABLE "ScrapedPage" (
    "id" SERIAL NOT NULL,
    "page_number" INTEGER NOT NULL,
    "last_scraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapedPage_pkey" PRIMARY KEY ("id")
);
