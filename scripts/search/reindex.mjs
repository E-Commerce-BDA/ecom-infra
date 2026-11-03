#!/usr/bin/env node
/**
 * Full snapshot reindexer for search-svc.
 *
 * Reads the products and categories catalog-svc exposes and the blogs cms-svc
 * publishes, builds SearchDocument payloads, and posts them to search-svc at
 * /api/v1/search/internal/reindex.
 *
 * `reindex` is a *replacing* operation: inside one transaction it upserts every
 * document in the payload and then prunes, per document type present in the
 * payload, every stored row the payload did not name. So the payload must be
 * complete for its types, and a half-read type is worse than an absent one.
 * That single fact drives every choice below.
 *
 * What `srch-004` found while rebuilding the dev index:
 *
 * - `?limit=250` was a hard HTTP 400 (`ProductQueryDto.limit` is `@Max(100)`).
 *   The old code caught it, printed a warning and carried on, so the run
 *   "succeeded" with categories and blogs only and never reconciled products at
 *   all — the orphan product docs survived exactly the bug this script exists to
 *   clear. Any source read that cannot be completed now fails its type loudly.
 * - Categories come back as `isActive`, not `status: 'active'`. Reading the
 *   wrong field mapped every live category to `inactive`, which kept the row in
 *   the index but hid it from every query.
 * - catalog-svc's products cursor does not walk: the default order is
 *   `p.created_at DESC, p.id DESC` while the continuation predicate is
 *   `p.id > cursor`. Measured live on 267 non-deleted products with `limit=100`,
 *   page 2 repeated 78 of page 1's 100 rows. A paginated snapshot built on it
 *   would be both incomplete and silently wrong, and an incomplete product
 *   payload prunes live rows. So this script takes one page per type, sized
 *   above the whole dev catalog, and refuses to reconcile a type that does not
 *   fit on it. Fixing the cursor is a catalog-svc change outside `srch-004`.
 */

import { fileURLToPath } from "node:url";

const ENV = {
  searchUrl: process.env.SEARCH_SVC_URL ?? "http://localhost:4090",
  catalogUrl: process.env.CATALOG_SVC_URL ?? "http://localhost:4020",
  cmsUrl: process.env.CMS_SVC_URL ?? "http://localhost:4050",
  serviceKey:
    process.env.INTERNAL_SERVICE_KEY ??
    process.env.SERVICE_KEY ??
    "dev-internal-service-key-change-in-prod",
};

/** The largest page the sources accept: catalog validates `limit` with `@Max(100)`. */
const PAGE_SIZE = 100;

const log = (msg) => console.log(`[search:reindex] ${msg}`);

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Reads one page and insists that it was the whole list.
 *
 * `nextCursor` is treated as "there is more, and I cannot safely reach it", not
 * as an invitation to page: see the header. Returning early here keeps the
 * caller's `catch` from pruning a type against a truncated snapshot.
 */
async function collectCompleteList(url, params = {}) {
  const query = new URLSearchParams(params);
  const body = await fetchJson(`${url}?${query.toString()}`);
  const rows = Array.isArray(body) ? body : (body?.data ?? []);
  if (!Array.isArray(body) && body?.nextCursor) {
    throw new Error(
      `${url} returned ${rows.length} rows plus a nextCursor: the list does not fit one page of ${PAGE_SIZE}, ` +
        `and its cursor walk is not exhaustive. Refusing to reconcile this type.`,
    );
  }
  return rows;
}

function toProductDocument(p) {
  const content = [p.name, p.shortDescription, p.categorySlug, p.brandName, ...(p.tags || [])]
    .filter(Boolean)
    .join(" ");

  return {
    id: p.id,
    documentType: "product",
    title: p.name,
    slug: p.slug,
    content: content || p.name,
    imageUrl: p.primaryImageUrl || (p.images && p.images[0]?.url) || null,
    price: p.price ?? 0,
    effectivePrice: p.effectivePrice ?? p.price ?? null,
    categoryId: p.categoryId || null,
    // Same rule as `search-svc/src/indexer/event-mapper.ts`: visibility follows
    // the catalog status, and an out-of-stock product stays searchable.
    status: p.status === "active" ? "active" : "inactive",
    sourceUpdatedAt: p.updatedAt || p.createdAt || new Date().toISOString(),
  };
}

function toCategoryDocument(c) {
  return {
    id: c.id,
    documentType: "category",
    title: c.name,
    slug: c.slug,
    content: [c.name, c.description].filter(Boolean).join(" ") || c.name,
    imageUrl: c.imageUrl || null,
    price: null,
    effectivePrice: null,
    categoryId: null,
    // catalog-svc exposes the flag as `isActive`; there is no `status` string.
    status: c.isActive === true || c.status === "active" ? "active" : "inactive",
    sourceUpdatedAt: c.updatedAt || new Date().toISOString(),
  };
}

function toBlogDocument(b) {
  const title = b.title || b.slug;
  return {
    id: b.id,
    documentType: "blog",
    title,
    slug: b.slug,
    content: [title, b.excerpt].filter(Boolean).join(" ") || b.slug,
    imageUrl: b.coverUrl || null,
    price: null,
    effectivePrice: null,
    categoryId: null,
    status: b.status === "published" ? "active" : "inactive",
    sourceUpdatedAt: b.updatedAt || b.publishedAt || new Date().toISOString(),
  };
}

/**
 * Maps a source list to documents and reports the rows the mapping rule
 * refused, so a source shape change is visible in the log instead of showing up
 * as unexplained pruning.
 */
function mapType(print, label, rows, isIndexable, toDocument) {
  const mapped = rows.filter(isIndexable).map(toDocument);
  const byId = new Map();
  for (const doc of mapped) byId.set(doc.id, doc);
  const unique = [...byId.values()];
  const dropped = rows.length - mapped.length;
  const collapsed = mapped.length - unique.length;
  const notes = [
    dropped > 0 ? `${dropped} skipped (missing id/slug/name)` : null,
    collapsed > 0 ? `${collapsed} duplicate ids` : null,
  ].filter(Boolean);
  print(`Found ${rows.length} ${label} (${unique.length} mapped)${notes.length ? `: ${notes.join(", ")}` : ""}`);
  return unique;
}

export async function reindexCatalogAndContent({ silent = false } = {}) {
  const print = silent ? () => {} : log;
  print("Starting search snapshot reindex...");

  const documents = [];
  const unreconciled = [];

  /**
   * A type reaches the payload only if the whole list was read. On any failure
   * the type's documents are dropped — not just the prune step — because the
   * endpoint prunes by type presence, and naming half a type would delete the
   * other half.
   */
  const reconcile = async (label, load) => {
    try {
      documents.push(...(await load()));
    } catch (err) {
      print(`Warning: ${label} not reconciled: ${err.message}`);
      unreconciled.push(label);
    }
  };

  // 1. Products — the active listing. Archived rows stay out of the snapshot
  //    because enumerating them needs the cursor this script will not trust.
  await reconcile("product", async () => {
    const rows = await collectCompleteList(`${ENV.catalogUrl}/api/v1/products`, {
      limit: String(PAGE_SIZE),
    });
    return mapType(print, "products", rows, (p) => p?.id && p?.slug && p?.name, toProductDocument);
  });

  // 2. Categories — the flat list including inactive ones, so a deactivated
  //    category keeps its row as `inactive` instead of being pruned.
  await reconcile("category", async () => {
    const rows = await collectCompleteList(`${ENV.catalogUrl}/api/v1/categories`, {
      includeInactive: "true",
    });
    return mapType(print, "categories", rows, (c) => c?.id && c?.slug && c?.name, toCategoryDocument);
  });

  // 3. Blogs — the public list is the published set; cms-svc only exposes
  //    drafts behind admin auth, which a script call cannot carry.
  await reconcile("blog", async () => {
    const rows = await collectCompleteList(`${ENV.cmsUrl}/api/v1/cms/blogs`, {
      limit: String(PAGE_SIZE),
    });
    return mapType(print, "blogs", rows, (b) => b?.id && b?.slug, toBlogDocument);
  });

  if (documents.length === 0) {
    print("No documents collected to index. Skipping reindex POST.");
    return { indexed: 0, removed: 0, unreconciled };
  }

  // 4. POST to search-svc reindex endpoint
  print(
    `Sending ${documents.length} documents to ${ENV.searchUrl}/api/v1/search/internal/reindex` +
      (unreconciled.length ? `; types left as-is: ${unreconciled.join(", ")}` : "") +
      "...",
  );
  const result = await fetchJson(`${ENV.searchUrl}/api/v1/search/internal/reindex`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-service-key": ENV.serviceKey,
    },
    body: JSON.stringify({ documents }),
  });

  print(`Success: ${result.indexed} indexed, ${result.removed} pruned.`);
  return { indexed: result.indexed, removed: result.removed, unreconciled };
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, "/") === process.argv[1].replace(/\\/g, "/");

if (isMain) {
  reindexCatalogAndContent()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[search:reindex] FATAL: ${err.message}`);
      process.exit(1);
    });
}
