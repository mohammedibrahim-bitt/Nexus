import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_research_runs" ADD COLUMN "triggered_by_rule_id" integer;
  ALTER TABLE "seo_research_runs" ADD CONSTRAINT "seo_research_runs_triggered_by_rule_id_seo_research_rules_id_fk" FOREIGN KEY ("triggered_by_rule_id") REFERENCES "public"."seo_research_rules"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "seo_research_runs_triggered_by_rule_idx" ON "seo_research_runs" USING btree ("triggered_by_rule_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_research_runs" DROP CONSTRAINT "seo_research_runs_triggered_by_rule_id_seo_research_rules_id_fk";
  
  DROP INDEX "seo_research_runs_triggered_by_rule_idx";
  ALTER TABLE "seo_research_runs" DROP COLUMN "triggered_by_rule_id";`)
}
