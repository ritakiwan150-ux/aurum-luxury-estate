// A tiny stand-in for the Laravel API, used by the integration and end-to-end tests.
// Run directly:  node tests/mock-api.mjs [port]
import http from "node:http";

const port = Number(process.argv[2] || process.env.MOCK_API_PORT || 8010);

const USERS = {
  "client@example.com": { password: "password1", token: "tok_client_123", user: { id: 1, name: "Test Client", email: "client@example.com", is_active: true, roles: [{ id: 1, name: "client" }] } },
};
const revoked = new Set();
const calls = [];

const property = (id, slug, extra = {}) => ({
  id, slug, title_en: `Villa ${id}`, title_ar: `فيلا ${id}`, description_en: "A fine home.", description_ar: "منزل رائع.",
  original_language: "en", operation: "sale", price: "12500000.00", area: "5400.00", bedrooms: 5, bathrooms: 6, district: "Palm Jumeirah",
  latitude: "25.1124000", longitude: "55.1390000", status: "published", is_featured: id === 1, type_id: 1, city_id: 1,
  type: { id: 1, name_en: "Villa", name_ar: "فيلا", icon: "house" }, city: { id: 1, name_en: "Dubai", name_ar: "دبي" },
  images: [], amenities: [{ id: 1, name_en: "Pool", name_ar: "مسبح", icon: "waves" }], ...extra,
});
const list = [property(1, "palm-villa"), property(2, "marina-villa")];

const json = (res, status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((resolve) => { const chunks = []; req.on("data", (c) => chunks.push(c)); req.on("end", () => resolve(Buffer.concat(chunks))); });
const bearer = (req) => (req.headers.authorization || "").replace(/^Bearer /, "");
const userFor = (req) => { const token = bearer(req); if (revoked.has(token)) return null; return Object.values(USERS).find((u) => u.token === token)?.user ?? null; };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  // Like the real Laravel app, only /api/... exists. A request without the prefix is a bug in the caller.
  if (!url.pathname.startsWith("/api/")) return json(res, 404, { message: "The route could not be found." });
  const p = url.pathname.slice("/api".length);
  const record = { method: req.method, path: p, authorization: req.headers.authorization ?? null, forwardedFor: req.headers["x-forwarded-for"] ?? null, contentType: req.headers["content-type"] ?? null };
  if (p.startsWith("/__")) {
    if (p === "/__calls") return json(res, 200, calls);
    if (p === "/__reset") { calls.length = 0; revoked.clear(); return json(res, 200, { ok: true }); }
  }
  calls.push(record);

  if (p === "/login" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)).toString() || "{}");
    const entry = USERS[body.email];
    if (!entry || entry.password !== body.password) return json(res, 422, { message: "The provided credentials are incorrect.", errors: { email: ["The provided credentials are incorrect."] }, internal_trace: "should never reach the browser" });
    return json(res, 200, { user: entry.user, token: entry.token });
  }
  if (p === "/me") { const user = userFor(req); return user ? json(res, 200, { user }) : json(res, 401, { message: "Unauthenticated." }); }
  if (p === "/logout" && req.method === "POST") { revoked.add(bearer(req)); return json(res, 200, { message: "Logged out successfully." }); }
  if (p === "/favorites") { return userFor(req) ? json(res, 200, { favorites: [{ property: list[0] }] }) : json(res, 401, { message: "Unauthenticated." }); }
  if (/^\/properties\/\d+\/inquiries$/.test(p) && req.method === "POST") { await readBody(req); return json(res, 201, { inquiry: { id: 1 } }); }
  if (/^\/owner\/properties\/\d+\/images$/.test(p) && req.method === "POST") {
    const body = await readBody(req);
    record.bodyBytes = body.length;
    return userFor(req) ? json(res, 201, { images: [], received_bytes: body.length, content_type: req.headers["content-type"] }) : json(res, 401, { message: "Unauthenticated." });
  }
  if (p === "/properties") return json(res, 200, { data: list, current_page: 1, last_page: 1, total: 2 });
  if (p.startsWith("/properties/")) { const hit = list.find((x) => x.slug === decodeURIComponent(p.split("/")[2])); return hit ? json(res, 200, { property: hit }) : json(res, 404, { message: "Not found" }); }
  if (p === "/cities") return json(res, 200, { cities: [{ id: 1, name_en: "Dubai", name_ar: "دبي" }] });
  if (p === "/property-types") return json(res, 200, { property_types: [{ id: 1, name_en: "Villa", name_ar: "فيلا", icon: "house" }] });
  if (p === "/amenities") return json(res, 200, { amenities: [{ id: 1, name_en: "Pool", name_ar: "مسبح", icon: "waves" }] });
  if (p === "/settings/public") return json(res, 200, { settings: { contact_phone: "+971 4 123 4567", contact_email: "hello@aurum.test" } });
  json(res, 404, { message: "Not found" });
}).listen(port, "127.0.0.1", () => console.log(`mock api on ${port}`));
