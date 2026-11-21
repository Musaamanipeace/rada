-- Add Sports topic to News and articles subcategory
INSERT INTO "topics" ("id", "parent_id", "slug", "name", "sort")
VALUES ('top-news-articles-sports', 'sub-news-articles', 'news-articles-sports', 'Sports', 7)
ON CONFLICT ("id") DO NOTHING;

-- Update General / All topics sort to 8
UPDATE "topics"
SET "sort" = 8
WHERE "id" = 'top-news-articles-general';
