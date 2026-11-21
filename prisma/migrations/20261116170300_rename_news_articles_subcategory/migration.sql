-- Update subcategory display name from 'News articles' to 'News and articles' (slug 'news-articles' unchanged)
UPDATE "subcategories"
SET "name" = 'News and articles'
WHERE "id" = 'sub-news-articles';
