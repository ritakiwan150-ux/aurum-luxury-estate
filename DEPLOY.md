# AURUM — launch checklist

Work through this top to bottom. Anything marked **(stop)** must be done before real visitors arrive.

## 1. Secrets — do these first
- [ ] **(stop) Rotate every secret that was ever pasted into chat or a screenshot:** the Aiven database password, the Cloudinary API secret, and the Laravel `APP_KEY` if it was shared. Update them only in the hosting platform's environment settings.
- [ ] `.env`, `.env.local` and `.env.production` are in `.gitignore` and were never committed (`git log --all -- .env` should print nothing).
- [ ] **(stop) Do not run `TestUsersSeeder` in production** (it creates `admin@example.com` / `password`). Create the real admin by hand with a strong password:
  ```bash
  php artisan tinker
  >>> $u = App\Models\User::create(['name'=>'Your name','email'=>'you@company.com','password'=>'<long random password>']);
  >>> $u->assignRole('admin');
  ```
- [ ] `PropertySeeder` is demo data. Skip it in production, or run it once and then replace the listings.

## 2. Laravel API
- [ ] Copy `backend/.env.production.example` into the server environment and fill every value.
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, HTTPS only.
- [ ] `TRUSTED_PROXIES` lists the address(es) your Next.js server calls from. Check: two different visitors must not share one rate-limit bucket.
- [ ] Database is in the same region as the API (see "13 seconds to log in").
- [ ] Deploy commands:
  ```bash
  composer install --no-dev --optimize-autoloader
  php artisan migrate --force
  php artisan config:cache && php artisan route:cache && php artisan event:cache
  ```
- [ ] Back up the database daily and test a restore once.
- [ ] `GET https://api.your-domain.com/up` returns 200 (add it to an uptime monitor).

## 3. Website (Next.js)
- [ ] Environment: `NEXT_PUBLIC_SITE_URL` (the real https address) and `API_INTERNAL_URL` (the Laravel address). `NEXT_PUBLIC_API_BASE_URL` is no longer needed in the browser.
- [ ] `npm run check` passes (type-check, lint, unit tests) and `npm run build` succeeds.
- [ ] `npm run build && npm run test:integration` passes (cookie session, CSRF, headers, uploads).
- [ ] Optional but recommended: `npx playwright install chromium && npm run test:e2e`.
- [ ] Serve over HTTPS. The session cookie is `__Host-aurum_session` + `Secure` in production, so it will not work on plain http (Safari also rejects it on http://localhost in production mode — use `npm run dev` locally).
- [ ] Upload the scroll animation as WebP (`node scripts/optimize-frames.mjs`, then `NEXT_PUBLIC_SCROLL_FRAME_EXT=webp`).
- [ ] Move the three "Anatomy of Perfection" images from Google's servers to Cloudinary and update `ExplodedView.tsx` (the CSP currently whitelists `lh3.googleusercontent.com` only for them).
- [ ] Replace placeholder content: footer address, DLD licence number, phone/e-mail (Admin → Settings), upload real photos for every listing.
- [ ] Submit `https://your-domain.com/sitemap.xml` to Google Search Console.

## 4. After deploying — smoke test (5 minutes, on a phone and a desktop)
1. `/` redirects to `/ar` (Arabic browser) or `/en`; the language switch keeps the page.
2. Browse → filter → open a property → send an inquiry → it appears in the owner's and admin's lists.
3. Register a client → sign in → save a favorite → sign out → the favorite page asks you to sign in.
4. Register an owner with a licence → admin verifies it → owner publishes a listing with photos → admin approves → it shows on the site.
5. Admin overview shows the numbers and charts.
6. In DevTools → Application → Cookies: `__Host-aurum_session` is **HttpOnly** and **Secure**; Local Storage contains no token.
7. In DevTools → Network: no request goes to the Laravel address (everything is `/api/backend/...`).
8. `curl -I https://your-domain.com/en` shows `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`.

## 5. Known limits (know them, don't be surprised by them)
- The Content-Security-Policy allows inline scripts (`'unsafe-inline'`) because Next.js emits inline hydration data. The login token is not readable by scripts, which limits the damage of an XSS bug, but moving to a nonce-based policy is the next hardening step.
- A property page's view counter increases at most once a minute per page (server-side caching).
- Login attempts are limited to 6 per minute per e-mail+IP, inquiries to 5 per minute per IP.
- Playwright tests were written but need `npx playwright install` and a local run to be trusted; the integration and unit tests are the ones verified in CI-style runs.
