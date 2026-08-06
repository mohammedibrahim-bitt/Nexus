import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { Client } from 'pg'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Renames the existing 'admin' enum value to 'super_admin' — on a FRESH
  // database, every row currently `role = 'admin'` transparently becomes
  // `role = 'super_admin'` via this rename alone, with no manual UPDATE
  // needed. Then adds a *fresh* 'admin' value for the new tenant-scoped
  // role (no collision: the old value no longer exists under that name by
  // the time this runs).
  //
  // Postgres does not allow a newly added enum value to be used within the
  // same transaction that adds it. Payload wraps each migration's `up` in a
  // single transaction, so both ALTER TYPE statements run on a separate,
  // autocommitting connection first (each commits immediately, independent
  // of the migration's transaction) — same pattern as
  // 20260728_190303_add_reader_role.ts.
  //
  // On a database where dev-mode schema auto-push already ran ahead of this
  // migration (push adds enum labels straight from the Users collection's
  // `role.options` config, independent of migration files — this happened
  // here while iterating), 'super_admin' can already exist as a *separate*
  // label with the row data untouched, which would make RENAME VALUE fail
  // with "enum label already exists." Detected below and skipped in that
  // case; the UPDATE after this block is what actually migrates the data
  // for that scenario instead.
  const directClient = new Client({ connectionString: process.env.DATABASE_URL })
  await directClient.connect()
  try {
    const { rows } = await directClient.query(
      `SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'public.enum_users_role'::regtype`,
    )
    if (rows.length === 0) {
      await directClient.query(`ALTER TYPE "public"."enum_users_role" RENAME VALUE 'admin' TO 'super_admin';`)
    }
    await directClient.query(`ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'admin';`)
  } finally {
    await directClient.end()
  }

  // No-op on a fresh database (the rename above already moved every row, so
  // nothing still reads 'admin' at this point). On a database where the
  // rename was skipped, this is the actual data migration: every row still
  // literally 'admin' was created under the old, unrestricted meaning
  // (nothing could have used the new tenant-scoped 'admin' role before this
  // migration existed), so it's unambiguous to move all of them to
  // 'super_admin' here.
  await db.execute(sql`UPDATE "users" SET "role" = 'super_admin' WHERE "role" = 'admin';`)

  // Unrelated drift picked up by the same diff: the design-token re-skin
  // (font default outfit->newsreader swap, accent/radius defaults) was
  // applied via dev-mode auto-push earlier and never captured in a
  // migration until now — bundled here rather than a separate no-op-looking
  // migration, matching this project's existing precedent (see
  // 20260804_080143_add_forms_tenant_scope.ts, which bundled similar
  // previously-unpushed drift).
  await db.execute(sql`
   ALTER TABLE "settings" ALTER COLUMN "font_family" SET DATA TYPE text;
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DEFAULT 'outfit'::text;
  DROP TYPE "public"."enum_settings_font_family";
  CREATE TYPE "public"."enum_settings_font_family" AS ENUM('outfit', 'space-grotesk', 'poppins', 'sora', 'inter', 'newsreader', 'playfair-display');
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DEFAULT 'outfit'::"public"."enum_settings_font_family";
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DATA TYPE "public"."enum_settings_font_family" USING "font_family"::"public"."enum_settings_font_family";
  ALTER TABLE "settings" ALTER COLUMN "primary_color" SET DEFAULT '#6366f1';
  ALTER TABLE "settings" ALTER COLUMN "corner_radius" SET DEFAULT 16;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Postgres can't drop a single enum value without recreating the whole
  // type — same constraint 20260728_190303_add_reader_role.ts's down()
  // already works around. Order matters here: the old 4-value schema has no
  // "tenant admin" concept, so rows on the *new* tenant-scoped 'admin' are
  // downgraded to 'author' (safer than silently inheriting the old,
  // unrestricted meaning of 'admin') FIRST, while 'admin' can still only
  // mean that — only afterward is the rename reversed, once no row is left
  // that would be ambiguous between the two meanings.
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reader'::text;
  UPDATE "users" SET "role" = 'author' WHERE "role" = 'admin';
  UPDATE "users" SET "role" = 'admin' WHERE "role" = 'super_admin';
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'author', 'reviewer', 'reader');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reader'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DATA TYPE text;
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DEFAULT 'newsreader'::text;
  DROP TYPE "public"."enum_settings_font_family";
  CREATE TYPE "public"."enum_settings_font_family" AS ENUM('newsreader', 'space-grotesk', 'poppins', 'sora', 'outfit', 'playfair-display', 'inter');
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DEFAULT 'newsreader'::"public"."enum_settings_font_family";
  ALTER TABLE "settings" ALTER COLUMN "font_family" SET DATA TYPE "public"."enum_settings_font_family" USING "font_family"::"public"."enum_settings_font_family";
  ALTER TABLE "settings" ALTER COLUMN "primary_color" SET DEFAULT '#dc2626';
  ALTER TABLE "settings" ALTER COLUMN "corner_radius" SET DEFAULT 12;`)
}
