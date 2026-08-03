import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_header_nav_items_icon" ADD VALUE 'file-plus' BEFORE 'mail';
  ALTER TYPE "public"."enum_footer_nav_items_icon" ADD VALUE 'file-plus' BEFORE 'mail';
  ALTER TABLE "header_nav_items" ADD COLUMN "staff_only" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "header_nav_items" ALTER COLUMN "icon" SET DATA TYPE text;
  ALTER TABLE "header_nav_items" ALTER COLUMN "icon" SET DEFAULT ''::text;
  DROP TYPE "public"."enum_header_nav_items_icon";
  CREATE TYPE "public"."enum_header_nav_items_icon" AS ENUM('', 'home', 'file-text', 'mail', 'phone', 'info', 'search', 'star', 'shield-check', 'globe', 'message-square-text');
  ALTER TABLE "header_nav_items" ALTER COLUMN "icon" SET DEFAULT ''::"public"."enum_header_nav_items_icon";
  ALTER TABLE "header_nav_items" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_header_nav_items_icon" USING "icon"::"public"."enum_header_nav_items_icon";
  ALTER TABLE "footer_nav_items" ALTER COLUMN "icon" SET DATA TYPE text;
  ALTER TABLE "footer_nav_items" ALTER COLUMN "icon" SET DEFAULT ''::text;
  DROP TYPE "public"."enum_footer_nav_items_icon";
  CREATE TYPE "public"."enum_footer_nav_items_icon" AS ENUM('', 'home', 'file-text', 'mail', 'phone', 'info', 'search', 'star', 'shield-check', 'globe', 'message-square-text');
  ALTER TABLE "footer_nav_items" ALTER COLUMN "icon" SET DEFAULT ''::"public"."enum_footer_nav_items_icon";
  ALTER TABLE "footer_nav_items" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_footer_nav_items_icon" USING "icon"::"public"."enum_footer_nav_items_icon";
  ALTER TABLE "header_nav_items" DROP COLUMN "staff_only";`)
}
