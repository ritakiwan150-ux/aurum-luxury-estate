// Integration tests for the cookie-session gateway. Needs the app running (see run-integration.mjs).
import test from "node:test";
import assert from "node:assert/strict";

const APP = process.env.APP_URL || "http://127.0.0.1:3010";
const MOCK = process.env.MOCK_URL || "http://127.0.0.1:8010";
const SAME_SITE = { "X-Requested-With": "aurum", Origin: new URL(APP).origin };
const COOKIE_NAME = "__Host-aurum_session";

const post = (path, body, headers = {}) =>
  fetch(`${APP}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const setCookies = (res) => res.headers.getSetCookie();
const cookieValue = (res) => setCookies(res).find((c) => c.startsWith(`${COOKIE_NAME}=`))?.split(";")[0] ?? null;

test.beforeEach(() => fetch(`${MOCK}/api/__reset`));

test("wrong credentials: validation errors are relayed, no cookie, no internals", async () => {
  const res = await post("/api/auth/login", { email: "client@example.com", password: "nope" }, SAME_SITE);
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.ok(body.errors.email);
  assert.equal(JSON.stringify(body).includes("internal_trace"), false);
  assert.equal(setCookies(res).length, 0);
});

test("login: httpOnly cookie is set and the token is never in the response body", async () => {
  const res = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, { ...SAME_SITE, "X-Forwarded-For": "203.0.113.9" });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.equal(text.includes("tok_client_123"), false, "token leaked into the JSON body");
  assert.equal(JSON.parse(text).user.email, "client@example.com");
  const cookie = setCookies(res).find((c) => c.startsWith(`${COOKIE_NAME}=`)) ?? "";
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=lax/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /Path=\//);
  assert.equal(/Domain=/i.test(cookie), false, "__Host- cookies must not set Domain");
  const calls = await (await fetch(`${MOCK}/api/__calls`)).json();
  assert.equal(calls.find((c) => c.path === "/login")?.forwardedFor, "203.0.113.9", "visitor IP must reach Laravel for rate limiting");
});

test("login without the CSRF header or from another origin is blocked", async () => {
  const noHeader = await post("/api/auth/login", { email: "client@example.com", password: "password1" });
  assert.equal(noHeader.status, 403);
  const foreign = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, { "X-Requested-With": "aurum", Origin: "https://evil.example" });
  assert.equal(foreign.status, 403);
  const crossSite = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, { ...SAME_SITE, "Sec-Fetch-Site": "cross-site" });
  assert.equal(crossSite.status, 403);
});

test("session: signed-out visitors get user:null, cookie holders get their user", async () => {
  const anonymous = await (await fetch(`${APP}/api/auth/session`)).json();
  assert.equal(anonymous.user, null);
  const login = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, SAME_SITE);
  const me = await (await fetch(`${APP}/api/auth/session`, { headers: { Cookie: cookieValue(login) } })).json();
  assert.equal(me.user.email, "client@example.com");
});

test("gateway: attaches the Bearer token for cookie holders, 401 for anonymous", async () => {
  const login = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, SAME_SITE);
  const cookie = cookieValue(login);
  const ok = await fetch(`${APP}/api/backend/favorites`, { headers: { Cookie: cookie } });
  assert.equal(ok.status, 200);
  const calls = await (await fetch(`${MOCK}/api/__calls`)).json();
  assert.equal(calls.find((c) => c.path === "/favorites")?.authorization, "Bearer tok_client_123");
  const anonymous = await fetch(`${APP}/api/backend/favorites`);
  assert.equal(anonymous.status, 401);
});

test("gateway: state-changing requests need the same-site headers and forward the visitor IP", async () => {
  const login = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, SAME_SITE);
  const cookie = cookieValue(login);
  const blocked = await post("/api/backend/properties/1/inquiries", { name: "A", phone: "123", message: "hi" }, { Cookie: cookie });
  assert.equal(blocked.status, 403);
  const ok = await post("/api/backend/properties/1/inquiries", { name: "A", phone: "123", message: "hi" }, { ...SAME_SITE, Cookie: cookie, "X-Forwarded-For": "198.51.100.7" });
  assert.equal(ok.status, 201);
  const calls = await (await fetch(`${MOCK}/api/__calls`)).json();
  const hit = calls.find((c) => c.path === "/properties/1/inquiries");
  assert.equal(hit.authorization, "Bearer tok_client_123");
  assert.equal(hit.forwardedFor, "198.51.100.7");
});

test("gateway: session endpoints can never be reached through it (the token would leak)", async () => {
  for (const path of ["login", "register", "logout"]) {
    const res = await post(`/api/backend/${path}`, { email: "client@example.com", password: "password1" }, SAME_SITE);
    assert.equal(res.status, 404, `${path} must be blocked`);
  }
  const calls = await (await fetch(`${MOCK}/api/__calls`)).json();
  assert.equal(calls.length, 0, "blocked paths must not reach Laravel");
});

test("gateway: path traversal attempts are rejected", async () => {
  const res = await fetch(`${APP}/api/backend/..%2Flogin`);
  assert.ok([400, 404].includes(res.status), `unexpected status ${res.status}`);
});

test("gateway: streams multipart uploads (property images) through to Laravel", async () => {
  const login = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, SAME_SITE);
  const form = new FormData();
  const payload = new Uint8Array(300_000).fill(7);
  form.append("images[]", new Blob([payload], { type: "image/jpeg" }), "photo.jpg");
  const res = await fetch(`${APP}/api/backend/owner/properties/1/images`, { method: "POST", headers: { ...SAME_SITE, Cookie: cookieValue(login) }, body: form });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.received_bytes >= 300_000, `Laravel received only ${body.received_bytes} bytes`);
  assert.match(body.content_type, /^multipart\/form-data; boundary=/);
});

test("logout revokes the token and clears the cookie; a stale cookie is cleaned up", async () => {
  const login = await post("/api/auth/login", { email: "client@example.com", password: "password1" }, SAME_SITE);
  const cookie = cookieValue(login);
  const out = await post("/api/auth/logout", {}, { ...SAME_SITE, Cookie: cookie });
  assert.equal(out.status, 200);
  assert.match(setCookies(out).find((c) => c.startsWith(`${COOKIE_NAME}=`)) ?? "", /Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  const stale = await fetch(`${APP}/api/auth/session`, { headers: { Cookie: cookie } });
  assert.equal((await stale.json()).user, null);
  assert.match(setCookies(stale).join(";"), /Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  const proxied = await fetch(`${APP}/api/backend/favorites`, { headers: { Cookie: cookie } });
  assert.equal(proxied.status, 401);
  assert.match(setCookies(proxied).join(";"), /Max-Age=0|Expires=Thu, 01 Jan 1970/i, "expired sessions are cleared by the gateway");
});

test("security headers are present on pages and API responses", async () => {
  for (const path of ["/ar", "/en/properties", "/api/auth/session"]) {
    const res = await fetch(`${APP}${path}`, { redirect: "manual" });
    const h = res.headers;
    assert.match(h.get("content-security-policy") ?? "", /frame-ancestors 'none'/, path);
    assert.match(h.get("content-security-policy") ?? "", /object-src 'none'/, path);
    assert.equal(h.get("x-content-type-options"), "nosniff", path);
    assert.equal(h.get("x-frame-options"), "DENY", path);
    assert.ok(h.get("referrer-policy"), path);
    assert.ok(h.get("strict-transport-security"), path);
    assert.equal(h.get("x-powered-by"), null, path);
  }
});

test("server-rendered property pages read Laravel correctly (API_INTERNAL_URL has no /api suffix here)", async () => {
  const detail = await fetch(`${APP}/en/properties/palm-villa`);
  assert.equal(detail.status, 200, "an existing property must open");
  assert.match(await detail.text(), /<title>Villa 1 \| AURUM<\/title>/);

  // A real HTTP 404 (not a streamed "soft 404") so search engines drop dead links.
  const missing = await fetch(`${APP}/en/properties/does-not-exist`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Page not found/);

  const unknown = await fetch(`${APP}/ar/not-a-page`);
  assert.equal(unknown.status, 404);
});
