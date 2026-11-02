#!/usr/bin/env node
/**
 * Demo seed — scripts/demo-seed/seed-demo.mjs (plan §8, task sf-064)
 *
 * HTTP-only against the local admin APIs. Nothing here touches a database
 * driver: every write goes through the same validation, outbox, Kafka and
 * revalidation path an admin edit takes, so seeded state IS admin-edited
 * state (plan §10.9). Re-running is safe — every row is found-by-slug/key
 * first, then created or patched.
 *
 * Usage (all defaults match the services' .env files; run from ecom-infra,
 * the cross-service operational repo — `ecom-infra` already owns verify/
 * topics:* and this seed is the same class of local-stack tool):
 *   pnpm --dir ecom-infra seed:demo
 *   # or: node ecom-infra/scripts/demo-seed/seed-demo.mjs
 *
 * Env overrides:
 *   AUTH_SVC_URL (4010)  CATALOG_SVC_URL (4020)  CMS_SVC_URL (4050)
 *   STOREFRONT_URL (3000)  REVALIDATE_SECRET (optional, POST /api/revalidate)
 *   SEED_EMAIL (seed-admin@foreafcbeta.test)  SEED_PASSWORD (SeedAdmin2026!)
 *
 * First run needs the admin grant once (auth-svc seeds roles, never users):
 *   docker exec -it ecom-pg psql -U ecom -d ecom -c "INSERT INTO auth.user_roles (user_id, role_id) SELECT u.id, r.id FROM auth.users u, auth.roles r WHERE u.email = 'seed-admin@foreafcbeta.test' AND r.slug = 'admin' ON CONFLICT DO NOTHING;"
 * The script prints this line and stops if the account is not admin yet.
 */

import { req, orNull, ApiError } from "./http.mjs";
import { CATEGORIES, BRANDS, PRODUCTS, NAV, FOOTER, SITE } from "./manifest.mjs";
import { BLOG_CATEGORY, BLOGS, PAGES, buildSections } from "./content.mjs";

const ENV = {
  auth: process.env.AUTH_SVC_URL ?? "http://localhost:4010",
  catalog: process.env.CATALOG_SVC_URL ?? "http://localhost:4020",
  cms: process.env.CMS_SVC_URL ?? "http://localhost:4050",
  storefront: process.env.STOREFRONT_URL ?? "http://localhost:3000",
  revalidateSecret: process.env.REVALIDATE_SECRET ?? "",
  email: process.env.SEED_EMAIL ?? "seed-admin@foreafcbeta.test",
  password: process.env.SEED_PASSWORD ?? "SeedAdmin2026!",
};

const ADMIN_GRANT_SQL =
  `INSERT INTO auth.user_roles (user_id, role_id) ` +
  `SELECT u.id, r.id FROM auth.users u, auth.roles r ` +
  `WHERE u.email = '${ENV.email}' AND r.slug = 'admin' ON CONFLICT DO NOTHING;`;

let token = "";
const counters = { created: 0, patched: 0, skipped: 0 };

const log = (msg) => console.log(msg);
const step = (msg) => console.log(`\n=== ${msg} ===`);

async function api(method, base, path, { body, expectJson = true } = {}) {
  return req(method, `${base}${path}`, { token, body, expectJson });
}

// ---------------------------------------------------------------------------
// 1. Admin session — register once, login always, refuse to proceed sans role
// ---------------------------------------------------------------------------

async function login() {
  return api("POST", ENV.auth, "/api/v1/auth/login", {
    body: { email: ENV.email, password: ENV.password },
  });
}

async function ensureAdmin() {
  step("auth: seed admin session");
  let session = null;
  try {
    session = await login();
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    log("no session yet — registering the seed admin");
    await api("POST", ENV.auth, "/api/v1/auth/register", {
      body: {
        email: ENV.email,
        password: ENV.password,
        firstName: "Seed",
        lastName: "Admin",
      },
    });
    session = await login();
  }
  token = session.accessToken;
  if (!session.user?.roles?.includes("admin")) {
    log(
      "\nThe seed account exists but has no admin role yet (auth-svc seeds\n" +
        "roles, never users — chicken-and-egg on the first HTTP grant).\n" +
        "Run this once against the dev Postgres, then re-run the seed:\n\n" +
        `  docker exec -it ecom-pg psql -U ecom -d ecom -c "${ADMIN_GRANT_SQL}"\n`,
    );
    process.exit(2);
  }
  log(`signed in as ${session.user.email} [${session.user.roles.join(", ")}]`);
}

// ---------------------------------------------------------------------------
// 2. Catalog — archive fixtures, then categories / brands / products
// ---------------------------------------------------------------------------

// Products owned by the catalog-svc e2e suite, which runs against this same dev
// database (`products.e2e-spec.ts` asserts fixture-tee/fixture-mug are active and
// discontinued-lamp is not). Archiving them turns that suite red, so the seed
// must never touch these two rows.
const E2E_OWNED_SKUS = new Set(["TEE-MAIN", "MUG-001"]);

async function archiveFixtures() {
  step("catalog: archive pre-seed fixture products");
  const seedSkus = new Set(PRODUCTS.map((p) => p.sku));
  const list = await api("GET", ENV.catalog, "/api/v1/catalog/products?limit=100");
  for (const p of list.data ?? []) {
    if (p.status === "archived" || seedSkus.has(p.sku) || E2E_OWNED_SKUS.has(p.sku)) continue;
    await api("PATCH", ENV.catalog, `/api/v1/catalog/products/${p.id}`, {
      body: { status: "archived" },
    });
    counters.patched += 1;
    log(`archived fixture ${p.sku} — ${p.name}`);
  }
}

async function upsertCategories() {
  const ids = {};
  for (const c of CATEGORIES) {
    const existing = await orNull(
      api("GET", ENV.catalog, `/api/v1/catalog/categories/${c.slug}`),
    );
    if (existing?.category) {
      await api("PATCH", ENV.catalog, `/api/v1/catalog/categories/${existing.category.id}`, {
        body: {
          name: c.name,
          description: c.description,
          imageUrl: c.imageUrl,
          isActive: true,
          showInNavbar: c.showInNavbar,
          sortOrder: c.sortOrder,
        },
      });
      ids[c.key] = existing.category.id;
      counters.patched += 1;
      log(`category ${c.slug}: patched`);
    } else {
      const res = await api("POST", ENV.catalog, "/api/v1/catalog/categories", {
        body: {
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
          isActive: true,
          showInNavbar: c.showInNavbar,
          sortOrder: c.sortOrder,
        },
      });
      ids[c.key] = res.category.id;
      counters.created += 1;
      log(`category ${c.slug}: created`);
    }
  }
  return ids;
}

async function upsertBrands() {
  const ids = {};
  for (const b of BRANDS) {
    const existing = await orNull(
      api("GET", ENV.catalog, `/api/v1/catalog/brands/${b.slug}`),
    );
    if (existing?.brand) {
      await api("PATCH", ENV.catalog, `/api/v1/catalog/brands/${existing.brand.id}`, {
        body: { name: b.name, description: b.description, isActive: true, sortOrder: b.sortOrder },
      });
      ids[b.key] = existing.brand.id;
      counters.patched += 1;
      log(`brand ${b.slug}: patched`);
    } else {
      const res = await api("POST", ENV.catalog, "/api/v1/catalog/brands", {
        body: { name: b.name, slug: b.slug, description: b.description, isActive: true, sortOrder: b.sortOrder },
      });
      ids[b.key] = res.brand.id;
      counters.created += 1;
      log(`brand ${b.slug}: created`);
    }
  }
  return ids;
}

async function upsertProducts(categoryIds, brandIds) {
  const productIds = {};
  for (const p of PRODUCTS) {
    const body = {
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      description: p.description,
      categoryId: categoryIds[p.category],
      brandId: brandIds[p.brand],
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stock: p.stock,
      status: "active",
      tags: p.tags,
    };
    const existing = await orNull(
      api("GET", ENV.catalog, `/api/v1/catalog/products/${p.slug}`),
    );
    let id;
    let needMedia = true;
    if (existing?.product) {
      id = existing.product.id;
      await api("PATCH", ENV.catalog, `/api/v1/catalog/products/${id}`, { body });
      needMedia =
        (existing.product.images?.length ?? 0) === 0 &&
        (existing.product.variants?.length ?? 0) === 0;
      counters.patched += 1;
      log(`product ${p.slug}: patched`);
    } else {
      const res = await api("POST", ENV.catalog, "/api/v1/catalog/products", { body });
      id = res.product.id;
      counters.created += 1;
      log(`product ${p.slug}: created`);
    }
    productIds[p.key] = id;
    // Options
    const optionMap = {};
    if (p.options && p.options.length > 0) {
      for (const opt of p.options) {
        try {
          const res = await api("POST", ENV.catalog, `/api/v1/catalog/products/${id}/options`, {
            body: {
              name: opt.name,
              displayType: opt.displayType,
              showOnCard: opt.showOnCard,
              cardPlacement: opt.cardPlacement,
              values: opt.values,
            },
          });
          const createdOpt = res.option;
          const valMap = {};
          for (const v of createdOpt.values) {
            valMap[v.value] = v.id;
          }
          optionMap[opt.name] = { id: createdOpt.id, values: valMap };
        } catch {
          try {
            const cur = await api("GET", ENV.catalog, `/api/v1/catalog/products/${id}`);
            for (const existingOpt of cur.product.options ?? []) {
              const valMap = {};
              for (const v of existingOpt.values ?? []) {
                valMap[v.value] = v.id;
              }
              optionMap[existingOpt.name] = { id: existingOpt.id, values: valMap };
            }
          } catch {}
        }
      }
    }

    // Gallery images
    if (p.gallery && p.gallery.length > 0) {
      for (const [idx, img] of p.gallery.entries()) {
        await api("POST", ENV.catalog, `/api/v1/catalog/products/${id}/images`, {
          body: { url: img.url, alt: img.alt, isPrimary: idx === 0, sortOrder: idx },
        }).catch(() => {});
      }
    } else if (needMedia) {
      await api("POST", ENV.catalog, `/api/v1/catalog/products/${id}/images`, {
        body: { url: p.image, alt: p.name, isPrimary: true, sortOrder: 0 },
      }).catch(() => {});
    }

    // Variants
    for (const [i, v] of (p.variants ?? []).entries()) {
      const variantOptions = [];
      if (v.optionValues) {
        for (const [optName, valName] of Object.entries(v.optionValues)) {
          if (optionMap[optName] && optionMap[optName].values[valName]) {
            variantOptions.push({
              optionId: optionMap[optName].id,
              optionValueId: optionMap[optName].values[valName],
            });
          }
        }
      }
      try {
        const varRes = await api("POST", ENV.catalog, `/api/v1/catalog/products/${id}/variants`, {
          body: {
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            imageUrl: v.imageUrl || p.image,
            options: variantOptions.length > 0 ? variantOptions : undefined,
          },
        });
        if (variantOptions.length > 0 && varRes?.variant?.id) {
          await api("PATCH", ENV.catalog, `/api/v1/catalog/variants/${varRes.variant.id}/options`, {
            body: { options: variantOptions },
          }).catch(() => {});
        }
      } catch (err) {
        log(`  variant ${v.sku}: ${err.message}`);
      }
      void i;
    }
  }
  return productIds;
}

// ---------------------------------------------------------------------------
// 3. CMS — navigation, theme, footer, sections, blogs, pages
// ---------------------------------------------------------------------------

async function putNavigation() {
  step("cms: navigation + theme + footer");
  await api("PUT", ENV.cms, "/api/v1/cms/admin/navigation", { body: NAV });
  log("navigation: written (replace-semantics PUT)");
  await api("PUT", ENV.cms, "/api/v1/cms/admin/settings/global", { body: {} });
  log("theme: baseline version written — storefront token defaults stay in charge");
  await api("PUT", ENV.cms, "/api/v1/cms/admin/footer", { body: FOOTER });
  log("footer: written");
}

async function upsertSections(ctx) {
  step("cms: homepage sections (7, in shipped order)");
  const wanted = buildSections(ctx);
  const { sections } = await api(
    "GET",
    ENV.cms,
    "/api/v1/cms/admin/sections",
  );
  const byKey = new Map((sections ?? []).map((s) => [s.key, s]));
  for (const s of wanted) {
    if (byKey.has(s.key)) {
      // key is the route param; pageKey/type/optional fields all re-validated
      // server-side against the same sectionSchema the create used.
      const { key, ...patch } = s;
      void key;
      await api("PATCH", ENV.cms, `/api/v1/cms/admin/sections/${s.key}`, { body: patch });
      counters.patched += 1;
      log(`section ${s.key}: patched`);
    } else {
      await api("POST", ENV.cms, "/api/v1/cms/admin/sections", { body: s });
      counters.created += 1;
      log(`section ${s.key}: created`);
    }
  }
  await api("PATCH", ENV.cms, "/api/v1/cms/admin/sections/reorder", {
    body: { pageKey: "homepage", orderedKeys: wanted.filter((s) => s.pageKey === "homepage").map((s) => s.key) },
    expectJson: false,
  });
  log(`order pinned: ${wanted.map((s) => s.key).join(" → ")}`);
}

async function upsertBlogs() {
  step("cms: blog category + 3 published posts");
  const cats = await api("GET", ENV.cms, "/api/v1/cms/blog-categories");
  let categoryId = (cats ?? []).find((c) => c.slug === BLOG_CATEGORY.slug)?.id;
  if (!categoryId) {
    const res = await api("POST", ENV.cms, "/api/v1/cms/admin/blog-categories", {
      body: BLOG_CATEGORY,
    });
    categoryId = res.category.id;
    counters.created += 1;
    log(`blog category ${BLOG_CATEGORY.slug}: created`);
  } else {
    log(`blog category ${BLOG_CATEGORY.slug}: exists`);
    counters.skipped += 1;
  }

  const postIds = [];
  for (const b of BLOGS) {
    const body = {
      slug: b.slug,
      title: b.title,
      coverUrl: b.coverUrl,
      excerpt: b.excerpt,
      author: b.author,
      status: b.status,
      publishedAt: b.publishedAt,
      seo: b.seo,
      categoryId,
      content: b.content,
    };
    const existing = await orNull(api("GET", ENV.cms, `/api/v1/cms/blogs/${b.slug}`));
    if (existing?.blog?.id) {
      const { slug, categoryId: _c, ...patch } = body;
      void slug;
      void _c;
      await api("PATCH", ENV.cms, `/api/v1/cms/admin/blogs/${existing.blog.id}`, { body: patch });
      postIds.push(existing.blog.id);
      counters.patched += 1;
      log(`post ${b.slug}: patched`);
    } else {
      const res = await api("POST", ENV.cms, "/api/v1/cms/admin/blogs", { body });
      postIds.push(res.blog.id);
      counters.created += 1;
      log(`post ${b.slug}: created`);
    }
  }
  return postIds;
}

async function upsertPages() {
  step("cms: about / privacy / terms pages");
  for (const p of PAGES) {
    const existing = await orNull(api("GET", ENV.cms, `/api/v1/cms/pages/${p.slug}`));
    if (existing?.page?.id) {
      const { slug, ...patch } = p;
      void slug;
      await api("PATCH", ENV.cms, `/api/v1/cms/admin/pages/${p.slug}`, { body: patch });
      counters.patched += 1;
      log(`page ${p.slug}: patched`);
    } else {
      await api("POST", ENV.cms, "/api/v1/cms/admin/pages", { body: p });
      counters.created += 1;
      log(`page ${p.slug}: created`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Belt-and-braces revalidation (cms-svc fires its own best-effort calls;
//    this proves the seam even when the outbox worker is behind)
// ---------------------------------------------------------------------------

async function revalidateStorefront() {
  step("storefront: POST /api/revalidate");
  if (!ENV.revalidateSecret) {
    log("REVALIDATE_SECRET not set — skipping (cms-svc's own revalidation still fires)");
    return;
  }
  const tags = [
    "cms:sections:homepage",
    "cms:footer",
    "cms:navigation",
    "cms:global-settings",
    "cms:blogs",
    "cms:pages:about",
    "cms:pages:privacy",
    "cms:pages:terms",
  ];
  try {
    const res = await fetch(`${ENV.storefront}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": ENV.revalidateSecret,
      },
      body: JSON.stringify({ tags }),
    });
    log(`revalidate -> ${res.status} ${JSON.stringify(await res.json())}`);
  } catch (err) {
    log(
      `revalidate failed (${err.message}) — the storefront should be running\n` +
        "before the seed (plan §12); otherwise ISR picks the content up within 300s.",
    );
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const started = Date.now();
  await ensureAdmin();
  await archiveFixtures();

  step("catalog: categories + brands + 14 products");
  const categoryIds = await upsertCategories();
  const brandIds = await upsertBrands();
  const productIds = await upsertProducts(categoryIds, brandIds);

  const ctx = {
    categoryIds: CATEGORIES.map((c) => categoryIds[c.key]).filter(Boolean),
    brandItems: BRANDS.map((b) => ({
      brandId: brandIds[b.key],
      label: b.name,
    })).filter((i) => i.brandId),
    productIds,
  };

  await putNavigation();
  const postIds = await upsertBlogs();
  ctx.postIds = postIds;
  await upsertSections(ctx);
  await upsertPages();
  await revalidateStorefront();

  log(
    `\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
      `${counters.created} created, ${counters.patched} patched, ${counters.skipped} skipped.\n` +
      `Store: ${SITE.name} · ${CATEGORIES.length} categories · ${BRANDS.length} brands · ` +
      `${PRODUCTS.length} products · 7 sections · ${BLOGS.length} posts · ${PAGES.length} pages.`,
  );
}

main().catch((err) => {
  console.error(`\nSEED FAILED: ${err.message}`);
  if (err instanceof ApiError) console.error(`  ${err.method} ${err.url}\n  ${err.bodyText}`);
  process.exit(1);
});
