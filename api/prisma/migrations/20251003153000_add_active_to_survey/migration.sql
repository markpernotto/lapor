-- Add active boolean to Survey
ALTER TABLE "Survey" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
