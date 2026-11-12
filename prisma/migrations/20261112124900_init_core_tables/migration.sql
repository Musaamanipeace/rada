-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('user', 'reviewer', 'admin');

-- CreateEnum
CREATE TYPE "item_cost" AS ENUM ('free', 'paid', 'unknown');

-- CreateEnum
CREATE TYPE "item_status" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'duplicate');

-- CreateEnum
CREATE TYPE "item_origin" AS ENUM ('seed', 'survey', 'import');

-- CreateEnum
CREATE TYPE "interaction_type" AS ENUM ('open', 'save', 'unsave', 'calendar_add', 'dismiss');

-- CreateEnum
CREATE TYPE "survey_pick_type" AS ENUM ('useful', 'impactful', 'favorite');

-- CreateEnum
CREATE TYPE "survey_suggestion_status" AS ENUM ('pending', 'approved', 'rejected', 'duplicate');

-- CreateEnum
CREATE TYPE "portfolio_visibility" AS ENUM ('draft', 'public', 'unlisted');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "display_name" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'user',
    "region" TEXT,
    "thumbnails_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "anon_sessions" (
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anon_sessions_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "description" VARCHAR(280),
    "thumbnail_url" TEXT,
    "category_id" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "cost" "item_cost" NOT NULL DEFAULT 'unknown',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "timezone" TEXT,
    "region" TEXT,
    "status" "item_status" NOT NULL DEFAULT 'pending',
    "origin" "item_origin" NOT NULL,
    "popularity_count" INTEGER NOT NULL DEFAULT 1,
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interests" (
    "owner" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "user_interests_pkey" PRIMARY KEY ("owner","subcategory_id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "type" "interaction_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_items" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL,
    "notes" TEXT,
    "source_item_id" TEXT,
    "reminder_minutes" INTEGER,
    "done_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_sessions" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "consent_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "claimed_user_id" TEXT,

    CONSTRAINT "survey_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_suggestions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "topic_id" TEXT,
    "title_or_url" TEXT NOT NULL,
    "pick_type" "survey_pick_type" NOT NULL,
    "note" VARCHAR(140),
    "status" "survey_suggestion_status" NOT NULL DEFAULT 'pending',
    "item_id" TEXT,

    CONSTRAINT "survey_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "intro" TEXT,
    "avatar" TEXT,
    "template" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "visibility" "portfolio_visibility" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_sections" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "portfolio_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_projects" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_links" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "portfolio_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_slug_key" ON "subcategories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_id_parent_id_key" ON "subcategories"("id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "topics_id_parent_id_key" ON "topics"("id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_url_key" ON "items"("url");

-- CreateIndex
CREATE INDEX "interactions_owner_created_at_idx" ON "interactions"("owner", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_items_owner_item_id_key" ON "saved_items"("owner", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_user_id_key" ON "portfolios"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_username_key" ON "portfolios"("username");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_subcategory_id_category_id_fkey" FOREIGN KEY ("subcategory_id", "category_id") REFERENCES "subcategories"("id", "parent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_topic_id_subcategory_id_fkey" FOREIGN KEY ("topic_id", "subcategory_id") REFERENCES "topics"("id", "parent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_source_item_id_fkey" FOREIGN KEY ("source_item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_sessions" ADD CONSTRAINT "survey_sessions_claimed_user_id_fkey" FOREIGN KEY ("claimed_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_suggestions" ADD CONSTRAINT "survey_suggestions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "survey_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_suggestions" ADD CONSTRAINT "survey_suggestions_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_suggestions" ADD CONSTRAINT "survey_suggestions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_suggestions" ADD CONSTRAINT "survey_suggestions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_sections" ADD CONSTRAINT "portfolio_sections_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_links" ADD CONSTRAINT "portfolio_links_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
