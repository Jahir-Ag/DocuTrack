/*
  Warnings:

  - A unique constraint covering the columns `[requestId]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "documents_requestId_key" ON "documents"("requestId");
