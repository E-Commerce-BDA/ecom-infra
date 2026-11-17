#!/usr/bin/env node
/**
 * Backfill per-product PDP sections from the `pdp-default` blueprint.
 *
 * HTTP-only through the admin APIs — no database access. For every active
 * product with no `pdp-<id>` sections, this clones the blueprint. Products
 * that already have sections are left untouched unless `--replace` is passed.
 *
 * Usage:
 *   node scripts/backfill-pdp-sections.mjs            (dry run)
 *   node scripts/backfill-pdp-sections.mjs --apply    (clone missing pages)
 *   node scripts/backfill-pdp-sections.mjs --apply --replace
 *
 * Env overrides:
 *   AUTH_SVC_URL (4010)  CATALOG_SVC_URL (4020)  CMS_SVC_URL (4050)
 *   SEED_EMAIL (seed-admin@foreafcbeta.test)  SEED_PASSWORD (SeedAdmin2026!)
 */

import { ApiError, req } from "./demo-seed/http.mjs";

const ENV = {
  auth: process.env.AUTH_SVC_URL ?? "http://localhost:4010",
  catalog: process.env.CATALOG_SVC_URL ?? "http://localhost:4020",
  cms: process.env.CMS_SVC_URL ?? "http://localhost:4050",
  email: process.env.SEED_EMAIL ?? "seed-admin@foreafcbeta.test",
  password: process.env.SEED_PASSWORD ?? "SeedAdmin2026!",
};

const apply = process.argv.includes("--apply");
const replace = process.argv.includes("--replace");

let token = "";

async function api(method, base, path, { body, expectJson = true } = {}) {
  return req(method, `${base}${path}`, { token, body, expectJson });
}

async function login() {
  const session = await api("POST", ENV.auth, "/api/v1/auth/login", {
    body: { email: ENV.email, password: ENV.password },
  });
  token = session.accessToken;
}

async function main() {
  await login();
  const list = await api("GET", ENV.catalog, "/api/v1/catalog/products?limit=200&status=active");
  const products = (list.data ?? []).filter((p) => p.status === "active" || p.status === undefined);

  let cloned = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of products) {
    const pageKey = `pdp-${String(product.id).toLowerCase()}`;
    const { sections } = await api("GET", ENV.cms, `/api/v1/cms/admin/sections?pageKey=${pageKey}`);
    if ((sections ?? []).length > 0 && !replace) {
      skipped += 1;
      console.log(`${pageKey}: skipped (already materialized)`);
      continue;
    }
    if (!apply) {
      console.log(`${pageKey}: would clone pdp-default${replace ? " (replace)" : ""}`);
      continue;
    }
    try {
      const res = await api("POST", ENV.cms, "/api/v1/cms/admin/sections/clone", {
        body: { fromPageKey: "pdp-default", toPageKey: pageKey, ...(replace ? { replace: true } : {}) },
      });
      cloned += 1;
      console.log(`${pageKey}: cloned ${(res.sections ?? []).length} sections`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && !replace) {
        skipped += 1;
        console.log(`${pageKey}: skipped (already materialized)`);
      } else {
        failed += 1;
        console.error(`${pageKey}: FAILED — ${error?.message ?? String(error)}`);
      }
    }
  }

  console.log(`\ndone: ${cloned} cloned, ${skipped} skipped, ${failed} failed${apply ? "" : " (dry run — pass --apply)"}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(`\nBACKFILL FAILED: ${err.message}`);
  if (err instanceof ApiError) console.error(`  ${err.method} ${err.url}\n  ${err.bodyText}`);
  process.exit(1);
});
