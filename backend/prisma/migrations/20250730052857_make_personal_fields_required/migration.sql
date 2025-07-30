/*
  Warnings:

  - Made the column `address` on table `requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birthDate` on table `requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cedula` on table `requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `firstName` on table `requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lastName` on table `requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "requests" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "birthDate" SET NOT NULL,
ALTER COLUMN "cedula" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;
