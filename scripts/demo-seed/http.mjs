/**
 * Tiny HTTP client for the demo seed — scripts/demo-seed/seed-demo.mjs helper.
 *
 * Everything in the seed talks to the services the same way a browser would:
 * JSON over HTTP against the public/admin REST APIs, Bearer JWT for writes.
 * No DB drivers, no raw SQL on purpose (plan §10.9): validation, outbox rows,
 * Kafka events and storefront revalidation all fire exactly as they do for a
 * human admin, so seeded state equals admin-edited state.
 */

export class ApiError extends Error {
  constructor(method, url, status, bodyText) {
    super(`${method} ${url} -> ${status}`);
    this.method = method;
    this.url = url;
    this.status = status;
    this.bodyText = bodyText;
  }
}

/**
 * Fetch + JSON. Throws ApiError with the response body attached for a readable
 * failure line. `expectJson: false` tolerates 204/empty bodies.
 */
export async function req(method, url, { token, body, expectJson = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new ApiError(method, url, res.status, text);
  }
  if (!expectJson || text === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(method, url, res.status, `<unparseable: ${text.slice(0, 120)}>`);
  }
}

/** True when the call failed with exactly this status (404-as-probe pattern). */
export async function orNull(promise) {
  return await promise.catch((err) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
