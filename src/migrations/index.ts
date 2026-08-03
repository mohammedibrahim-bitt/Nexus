import * as migration_20260728_074942_init from './20260728_074942_init';
import * as migration_20260728_110701_unify_auth from './20260728_110701_unify_auth';
import * as migration_20260728_190303_add_reader_role from './20260728_190303_add_reader_role';
import * as migration_20260729_080632_add_seo_research_rules from './20260729_080632_add_seo_research_rules';
import * as migration_20260729_092635_add_header_nav_staff_only from './20260729_092635_add_header_nav_staff_only';
import * as migration_20260729_112722_add_run_rule_link from './20260729_112722_add_run_rule_link';
import * as migration_20260731_080955_add_multi_tenant from './20260731_080955_add_multi_tenant';

export const migrations = [
  {
    up: migration_20260728_074942_init.up,
    down: migration_20260728_074942_init.down,
    name: '20260728_074942_init',
  },
  {
    up: migration_20260728_110701_unify_auth.up,
    down: migration_20260728_110701_unify_auth.down,
    name: '20260728_110701_unify_auth',
  },
  {
    up: migration_20260728_190303_add_reader_role.up,
    down: migration_20260728_190303_add_reader_role.down,
    name: '20260728_190303_add_reader_role',
  },
  {
    up: migration_20260729_080632_add_seo_research_rules.up,
    down: migration_20260729_080632_add_seo_research_rules.down,
    name: '20260729_080632_add_seo_research_rules',
  },
  {
    up: migration_20260729_092635_add_header_nav_staff_only.up,
    down: migration_20260729_092635_add_header_nav_staff_only.down,
    name: '20260729_092635_add_header_nav_staff_only',
  },
  {
    up: migration_20260729_112722_add_run_rule_link.up,
    down: migration_20260729_112722_add_run_rule_link.down,
    name: '20260729_112722_add_run_rule_link',
  },
  {
    up: migration_20260731_080955_add_multi_tenant.up,
    down: migration_20260731_080955_add_multi_tenant.down,
    name: '20260731_080955_add_multi_tenant',
  },
];
