import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  /*
   * Adding an enum value inside a transaction is allowed on PG12+; *using* it
   * in that same transaction is not ("unsafe use of new value"). The generator
   * emitted both — the ADD VALUE below plus an
   * `ALTER COLUMN "font_family" SET DEFAULT 'newsreader'`, which would fail.
   *
   * The SET DEFAULT is dropped rather than worked around: it only affects rows
   * inserted outside Payload, and the application already defaults this via
   * DEFAULT_DISPLAY_FONT in src/utilities/displayFonts.ts. Doing it this way
   * keeps the whole migration on one connection, inside one transaction.
   */
  await db.execute(sql`
  ALTER TYPE "public"."enum_settings_font_family" ADD VALUE IF NOT EXISTS 'newsreader' BEFORE 'space-grotesk';
  CREATE TABLE "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"domain" varchar,
  	"source_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_tenants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL
  );
  
  ALTER TABLE "reviews" ALTER COLUMN "approved" SET DEFAULT true;
  ALTER TABLE "header" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "header" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "header" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "header" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "footer" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "footer" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "footer" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "footer" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "primary_color" SET DEFAULT '#dc2626';
  ALTER TABLE "settings" ALTER COLUMN "corner_radius" SET DEFAULT 12;
  ALTER TABLE "settings" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "settings" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "settings" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_tenant_id" integer;
  ALTER TABLE "posts" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_tenant_id" integer;
  ALTER TABLE "media" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "categories" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "tags" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "reviews" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "content_sources" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "seo_research_runs" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "seo_research_rules" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "search" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenants_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "settings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "header_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "footer_id" integer;
  ALTER TABLE "header" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "footer" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "settings" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");
  CREATE UNIQUE INDEX "tenants_domain_idx" ON "tenants" USING btree ("domain");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
  CREATE INDEX "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
  CREATE INDEX "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_research_runs" ADD CONSTRAINT "seo_research_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_research_rules" ADD CONSTRAINT "seo_research_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search" ADD CONSTRAINT "search_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_settings_fk" FOREIGN KEY ("settings_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_header_fk" FOREIGN KEY ("header_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_footer_fk" FOREIGN KEY ("footer_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header" ADD CONSTRAINT "header_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "footer" ADD CONSTRAINT "footer_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_tenant_idx" ON "pages" USING btree ("tenant_id");
  CREATE INDEX "_pages_v_version_version_tenant_idx" ON "_pages_v" USING btree ("version_tenant_id");
  CREATE INDEX "posts_tenant_idx" ON "posts" USING btree ("tenant_id");
  CREATE INDEX "_posts_v_version_version_tenant_idx" ON "_posts_v" USING btree ("version_tenant_id");
  CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX "categories_tenant_idx" ON "categories" USING btree ("tenant_id");
  CREATE INDEX "tags_tenant_idx" ON "tags" USING btree ("tenant_id");
  CREATE INDEX "reviews_tenant_idx" ON "reviews" USING btree ("tenant_id");
  CREATE INDEX "content_sources_tenant_idx" ON "content_sources" USING btree ("tenant_id");
  CREATE INDEX "seo_research_runs_tenant_idx" ON "seo_research_runs" USING btree ("tenant_id");
  CREATE INDEX "seo_research_rules_tenant_idx" ON "seo_research_rules" USING btree ("tenant_id");
  CREATE INDEX "search_tenant_idx" ON "search" USING btree ("tenant_id");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("settings_id");
  CREATE INDEX "payload_locked_documents_rels_header_id_idx" ON "payload_locked_documents_rels" USING btree ("header_id");
  CREATE INDEX "payload_locked_documents_rels_footer_id_idx" ON "payload_locked_documents_rels" USING btree ("footer_id");
  CREATE UNIQUE INDEX "header_tenant_idx" ON "header" USING btree ("tenant_id");
  CREATE INDEX "header_updated_at_idx" ON "header" USING btree ("updated_at");
  CREATE INDEX "header_created_at_idx" ON "header" USING btree ("created_at");
  CREATE UNIQUE INDEX "footer_tenant_idx" ON "footer" USING btree ("tenant_id");
  CREATE INDEX "footer_updated_at_idx" ON "footer" USING btree ("updated_at");
  CREATE INDEX "footer_created_at_idx" ON "footer" USING btree ("created_at");
  CREATE UNIQUE INDEX "settings_tenant_idx" ON "settings" USING btree ("tenant_id");
  CREATE INDEX "settings_updated_at_idx" ON "settings" USING btree ("updated_at");
  CREATE INDEX "settings_created_at_idx" ON "settings" USING btree ("created_at");`)

  /*
   * ── Data backfill ────────────────────────────────────────────────────────
   * Everything above is additive: `tenant_id` columns land nullable, and the
   * unique tenant indexes on settings/header/footer tolerate that because
   * Postgres allows repeated NULLs in a UNIQUE index. This step attaches all
   * pre-existing content to a single "default" tenant representing the site as
   * it was before multi-tenancy.
   *
   * Note settings/header/footer are NOT recreated — Payload names Global and
   * Collection tables identically, so the Global->Collection conversion kept
   * those rows and their data in place; they just gain a tenant.
   */
  await db.execute(sql`
  -- The default tenant inherits the existing site's name and brand source.
  INSERT INTO "tenants" ("name", "slug", "source_url")
  SELECT COALESCE(NULLIF(s."site_name", ''), 'Nexus'), 'default', s."brand_sync_url"
  FROM (SELECT "site_name", "brand_sync_url" FROM "settings" ORDER BY "id" LIMIT 1) s
  WHERE NOT EXISTS (SELECT 1 FROM "tenants" WHERE "slug" = 'default');

  -- Fallback for a database that somehow has no settings row yet.
  INSERT INTO "tenants" ("name", "slug")
  SELECT 'Nexus', 'default'
  WHERE NOT EXISTS (SELECT 1 FROM "tenants" WHERE "slug" = 'default');

  -- Tenant-scoped content collections.
  UPDATE "pages"              SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "posts"              SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "media"              SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "categories"         SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "tags"               SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "reviews"            SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "content_sources"    SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "seo_research_runs"  SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "seo_research_rules" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "search"             SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;

  -- Draft/published version tables, so version history stays with its tenant.
  UPDATE "_pages_v" SET "version_tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "version_tenant_id" IS NULL;
  UPDATE "_posts_v" SET "version_tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "version_tenant_id" IS NULL;

  -- Per-tenant "globals": adopt the existing row, or create one if absent.
  UPDATE "settings" SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "header"   SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;
  UPDATE "footer"   SET "tenant_id" = (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE "tenant_id" IS NULL;

  INSERT INTO "settings" ("tenant_id") SELECT (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE NOT EXISTS (SELECT 1 FROM "settings");
  INSERT INTO "header"   ("tenant_id") SELECT (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE NOT EXISTS (SELECT 1 FROM "header");
  INSERT INTO "footer"   ("tenant_id") SELECT (SELECT "id" FROM "tenants" WHERE "slug" = 'default') WHERE NOT EXISTS (SELECT 1 FROM "footer");

  -- Assign every existing user to the default tenant. Admins reach all tenants
  -- via userHasAccessToAllTenants, but authors/reviewers are gated on this
  -- array — without it, existing staff would lose access to their own content.
  INSERT INTO "users_tenants" ("_order", "_parent_id", "id", "tenant_id")
  SELECT 1, u."id", gen_random_uuid()::text, (SELECT "id" FROM "tenants" WHERE "slug" = 'default')
  FROM "users" u
  WHERE NOT EXISTS (SELECT 1 FROM "users_tenants" ut WHERE ut."_parent_id" = u."id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_tenants" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants" CASCADE;
  DROP TABLE "users_tenants" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_tenant_id_tenants_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_tenant_id_tenants_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_tenant_id_tenants_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_tenant_id_tenants_id_fk";
  
  ALTER TABLE "media" DROP CONSTRAINT "media_tenant_id_tenants_id_fk";
  
  ALTER TABLE "categories" DROP CONSTRAINT "categories_tenant_id_tenants_id_fk";
  
  ALTER TABLE "tags" DROP CONSTRAINT "tags_tenant_id_tenants_id_fk";
  
  ALTER TABLE "reviews" DROP CONSTRAINT "reviews_tenant_id_tenants_id_fk";
  
  ALTER TABLE "content_sources" DROP CONSTRAINT "content_sources_tenant_id_tenants_id_fk";
  
  ALTER TABLE "seo_research_runs" DROP CONSTRAINT "seo_research_runs_tenant_id_tenants_id_fk";
  
  ALTER TABLE "seo_research_rules" DROP CONSTRAINT "seo_research_rules_tenant_id_tenants_id_fk";
  
  ALTER TABLE "settings" DROP CONSTRAINT "settings_tenant_id_tenants_id_fk";
  
  ALTER TABLE "header" DROP CONSTRAINT "header_tenant_id_tenants_id_fk";
  
  ALTER TABLE "footer" DROP CONSTRAINT "footer_tenant_id_tenants_id_fk";
  
  ALTER TABLE "search" DROP CONSTRAINT "search_tenant_id_tenants_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tenants_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_settings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_header_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_footer_fk";
  
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DATA TYPE text;
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DEFAULT 'space-grotesk'::text;
  DROP TYPE "public"."enum_settings_font_family";
  CREATE TYPE "public"."enum_settings_font_family" AS ENUM('space-grotesk', 'poppins', 'sora', 'outfit', 'playfair-display', 'inter');
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DEFAULT 'space-grotesk'::"public"."enum_settings_font_family";
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DATA TYPE "public"."enum_settings_font_family" USING "font_family"::"public"."enum_settings_font_family";
  DROP INDEX "pages_tenant_idx";
  DROP INDEX "_pages_v_version_version_tenant_idx";
  DROP INDEX "posts_tenant_idx";
  DROP INDEX "_posts_v_version_version_tenant_idx";
  DROP INDEX "media_tenant_idx";
  DROP INDEX "categories_tenant_idx";
  DROP INDEX "tags_tenant_idx";
  DROP INDEX "reviews_tenant_idx";
  DROP INDEX "content_sources_tenant_idx";
  DROP INDEX "seo_research_runs_tenant_idx";
  DROP INDEX "seo_research_rules_tenant_idx";
  DROP INDEX "settings_tenant_idx";
  DROP INDEX "settings_updated_at_idx";
  DROP INDEX "settings_created_at_idx";
  DROP INDEX "header_tenant_idx";
  DROP INDEX "header_updated_at_idx";
  DROP INDEX "header_created_at_idx";
  DROP INDEX "footer_tenant_idx";
  DROP INDEX "footer_updated_at_idx";
  DROP INDEX "footer_created_at_idx";
  DROP INDEX "search_tenant_idx";
  DROP INDEX "payload_locked_documents_rels_tenants_id_idx";
  DROP INDEX "payload_locked_documents_rels_settings_id_idx";
  DROP INDEX "payload_locked_documents_rels_header_id_idx";
  DROP INDEX "payload_locked_documents_rels_footer_id_idx";
  ALTER TABLE "reviews" ALTER COLUMN "approved" SET DEFAULT false;
  ALTER TABLE "settings" ALTER COLUMN "primary_color" SET DEFAULT '#171717';
  ALTER TABLE "settings" ALTER COLUMN "corner_radius" SET DEFAULT 16;
  ALTER TABLE "settings" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "settings" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "settings" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "settings" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "header" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "header" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "header" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "header" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "footer" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "footer" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "footer" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "footer" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "tenant_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_tenant_id";
  ALTER TABLE "posts" DROP COLUMN "tenant_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_tenant_id";
  ALTER TABLE "media" DROP COLUMN "tenant_id";
  ALTER TABLE "categories" DROP COLUMN "tenant_id";
  ALTER TABLE "tags" DROP COLUMN "tenant_id";
  ALTER TABLE "reviews" DROP COLUMN "tenant_id";
  ALTER TABLE "content_sources" DROP COLUMN "tenant_id";
  ALTER TABLE "seo_research_runs" DROP COLUMN "tenant_id";
  ALTER TABLE "seo_research_rules" DROP COLUMN "tenant_id";
  ALTER TABLE "settings" DROP COLUMN "tenant_id";
  ALTER TABLE "header" DROP COLUMN "tenant_id";
  ALTER TABLE "footer" DROP COLUMN "tenant_id";
  ALTER TABLE "search" DROP COLUMN "tenant_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tenants_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "settings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "header_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "footer_id";`)
}
