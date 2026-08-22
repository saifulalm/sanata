-- ============================================================
-- SANATA GROUP Content Update - Deployment Script
-- Run this AFTER: git pull
-- ============================================================

-- Step 1: Check for duplicate titles in same collection (would block migration)
-- If this returns rows, investigate and fix duplicates before proceeding
-- SELECT "collection", "title", COUNT(*) as cnt
-- FROM "SiteCollectionItem"
-- GROUP BY "collection", "title"
-- HAVING COUNT(*) > 1;

-- Step 2: Clean duplicate titles if any exist (keeps first, deletes rest)
-- Run only if Step 1 returned rows
-- WITH dups AS (
--   SELECT id, "collection", "title",
--          ROW_NUMBER() OVER (PARTITION BY "collection", "title" ORDER BY "createdAt") as rn
--   FROM "SiteCollectionItem"
-- )
-- DELETE FROM "SiteCollectionItem" WHERE id IN (
--   SELECT id FROM dups WHERE rn > 1
-- );

-- Step 3: Apply schema migration (adds unique constraint on collection+title)
-- npx prisma migrate dev --name add_collection_title_unique

-- Step 4: Regenerate Prisma client types
-- npx prisma generate

-- Step 5: Run seed to update content (creates new items + updates existing)
-- npm run prisma:seed

-- Expected output:
-- Seeded X site content items (N updated) and 80 settings.
-- (Numbers may vary depending on what's changed since last seed)
