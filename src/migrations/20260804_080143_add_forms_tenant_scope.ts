import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_clone_status" AS ENUM('none', 'scraping', 'pending_review', 'published', 'brand_only', 'failed');
  CREATE TYPE "public"."enum_tenants_clone_mode" AS ENUM('full_clone', 'brand_only');
  DROP INDEX "pages_slug_idx";
  DROP INDEX "posts_slug_idx";
  DROP INDEX "categories_slug_idx";
  DROP INDEX "tags_slug_idx";
  ALTER TABLE "tenants" ADD COLUMN "source_domain" varchar;
  ALTER TABLE "tenants" ADD COLUMN "dns_verification_token" varchar;
  ALTER TABLE "tenants" ADD COLUMN "dns_verified" boolean DEFAULT false;
  ALTER TABLE "tenants" ADD COLUMN "dns_verified_at" timestamp(3) with time zone;
  ALTER TABLE "tenants" ADD COLUMN "clone_status" "enum_tenants_clone_status" DEFAULT 'none';
  ALTER TABLE "tenants" ADD COLUMN "clone_mode" "enum_tenants_clone_mode" DEFAULT 'brand_only';
  ALTER TABLE "tenants" ADD COLUMN "qa_score" numeric;
  ALTER TABLE "tenants" ADD COLUMN "qa_threshold" numeric DEFAULT 85;
  ALTER TABLE "tenants" ADD COLUMN "shell_html_path" varchar;
  ALTER TABLE "tenants" ADD COLUMN "source_screenshot_path" varchar;
  ALTER TABLE "tenants" ADD COLUMN "shell_screenshot_path" varchar;
  ALTER TABLE "tenants" ADD COLUMN "diff_screenshot_path" varchar;
  ALTER TABLE "tenants" ADD COLUMN "last_cloned_at" timestamp(3) with time zone;
  ALTER TABLE "tenants" ADD COLUMN "clone_log" varchar;
  ALTER TABLE "tenants" ADD COLUMN "flagged_scripts" jsonb;
  ALTER TABLE "forms" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "form_submissions" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "forms" ADD CONSTRAINT "forms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tenants_source_domain_idx" ON "tenants" USING btree ("source_domain");
  CREATE INDEX "forms_tenant_idx" ON "forms" USING btree ("tenant_id");
  CREATE INDEX "form_submissions_tenant_idx" ON "form_submissions" USING btree ("tenant_id");
  CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP CONSTRAINT "forms_tenant_id_tenants_id_fk";
  
  ALTER TABLE "form_submissions" DROP CONSTRAINT "form_submissions_tenant_id_tenants_id_fk";
  
  DROP INDEX "tenants_source_domain_idx";
  DROP INDEX "forms_tenant_idx";
  DROP INDEX "form_submissions_tenant_idx";
  DROP INDEX "pages_slug_idx";
  DROP INDEX "posts_slug_idx";
  DROP INDEX "categories_slug_idx";
  DROP INDEX "tags_slug_idx";
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  ALTER TABLE "tenants" DROP COLUMN "source_domain";
  ALTER TABLE "tenants" DROP COLUMN "dns_verification_token";
  ALTER TABLE "tenants" DROP COLUMN "dns_verified";
  ALTER TABLE "tenants" DROP COLUMN "dns_verified_at";
  ALTER TABLE "tenants" DROP COLUMN "clone_status";
  ALTER TABLE "tenants" DROP COLUMN "clone_mode";
  ALTER TABLE "tenants" DROP COLUMN "qa_score";
  ALTER TABLE "tenants" DROP COLUMN "qa_threshold";
  ALTER TABLE "tenants" DROP COLUMN "shell_html_path";
  ALTER TABLE "tenants" DROP COLUMN "source_screenshot_path";
  ALTER TABLE "tenants" DROP COLUMN "shell_screenshot_path";
  ALTER TABLE "tenants" DROP COLUMN "diff_screenshot_path";
  ALTER TABLE "tenants" DROP COLUMN "last_cloned_at";
  ALTER TABLE "tenants" DROP COLUMN "clone_log";
  ALTER TABLE "tenants" DROP COLUMN "flagged_scripts";
  ALTER TABLE "forms" DROP COLUMN "tenant_id";
  ALTER TABLE "form_submissions" DROP COLUMN "tenant_id";
  DROP TYPE "public"."enum_tenants_clone_status";
  DROP TYPE "public"."enum_tenants_clone_mode";`)
}
