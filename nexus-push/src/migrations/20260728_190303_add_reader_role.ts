import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { Client } from 'pg'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Postgres does not allow a newly added enum value to be used within the
  // same transaction that adds it. Payload wraps each migration's `up` in a
  // single transaction, so we add the enum value on a separate, autocommitting
  // connection first (it commits immediately, independent of the migration's
  // transaction), and only then reference it from the transactional `db`.
  const directClient = new Client({ connectionString: process.env.DATABASE_URL })
  await directClient.connect()
  try {
    await directClient.query(`ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'reader';`)
  } finally {
    await directClient.end()
  }

  await db.execute(sql`
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reader';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'author', 'reviewer');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'author'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";`)
}
