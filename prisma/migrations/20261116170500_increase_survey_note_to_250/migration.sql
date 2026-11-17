-- Increase survey_suggestions.note length from 140 to 250 characters
ALTER TABLE "survey_suggestions"
ALTER COLUMN "note" TYPE VARCHAR(250);
