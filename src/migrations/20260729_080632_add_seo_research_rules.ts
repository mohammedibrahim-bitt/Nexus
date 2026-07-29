import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "seo_research_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"run_as_user_id" integer NOT NULL,
  	"interval_days" numeric DEFAULT 7 NOT NULL,
  	"last_run_id" integer,
  	"last_run_at" timestamp(3) with time zone,
  	"last_run_status" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "seo_research_rules_id" integer;
  ALTER TABLE "seo_research_rules" ADD CONSTRAINT "seo_research_rules_run_as_user_id_users_id_fk" FOREIGN KEY ("run_as_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_research_rules" ADD CONSTRAINT "seo_research_rules_last_run_id_seo_research_runs_id_fk" FOREIGN KEY ("last_run_id") REFERENCES "public"."seo_research_runs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "seo_research_rules_run_as_user_idx" ON "seo_research_rules" USING btree ("run_as_user_id");
  CREATE INDEX "seo_research_rules_last_run_idx" ON "seo_research_rules" USING btree ("last_run_id");
  CREATE INDEX "seo_research_rules_updated_at_idx" ON "seo_research_rules" USING btree ("updated_at");
  CREATE INDEX "seo_research_rules_created_at_idx" ON "seo_research_rules" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_seo_research_rules_fk" FOREIGN KEY ("seo_research_rules_id") REFERENCES "public"."seo_research_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_seo_research_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("seo_research_rules_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_research_rules" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "seo_research_rules" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_seo_research_rules_fk";
  
  DROP INDEX "payload_locked_documents_rels_seo_research_rules_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "seo_research_rules_id";`)
}
