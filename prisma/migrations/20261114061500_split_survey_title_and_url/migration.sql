-- AlterTable
ALTER TABLE "survey_suggestions" ADD COLUMN "title" TEXT;
ALTER TABLE "survey_suggestions" ADD COLUMN "url" TEXT;

-- Backfill existing rows from title_or_url
UPDATE "survey_suggestions"
SET "title" = "title_or_url",
    "url" = CASE
      WHEN "title_or_url" ~* '^https?://' THEN "title_or_url"
      ELSE 'https://' || "title_or_url"
    END;

-- Make title and url NOT NULL
ALTER TABLE "survey_suggestions" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "survey_suggestions" ALTER COLUMN "url" SET NOT NULL;

-- Drop obsolete title_or_url column
ALTER TABLE "survey_suggestions" DROP COLUMN "title_or_url";
