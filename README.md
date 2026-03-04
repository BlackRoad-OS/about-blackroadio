# about-blackroadio

Part of the [BlackRoad OS](https://blackroad.io) ecosystem.

## Overview

Cloudflare Worker that serves the **about.blackroad.io** subdomain — an informational page for the BlackRoad OS platform.

## What's Working (verified 2026-03-04, 25/25 tests passing)

| Feature | Status | Details |
|---|---|---|
| **GET /** | Working | Returns branded HTML about page with gradient logo, tagline, and link to blackroad.ai |
| **GET /health** | Working | Returns JSON `{ status, worker, region, timestamp }` with CORS headers |
| **GET /robots.txt** | Working | Returns `User-agent: * / Disallow: /api/` |
| **OPTIONS (CORS preflight)** | Working | Returns `Access-Control-Allow-Origin: *` with allowed methods and headers |
| **404 handling** | Working | Any unknown path returns JSON `{ error: "not_found", path }` with status 404 |
| **Security headers** | Working | X-Frame-Options DENY, CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy |
| **Brand compliance** | Working | Worker HTML and static index.html both use approved palette only |

## Running Tests

```sh
npm install
npm test
```

Output:

```
 ✓ src/index.test.js  (25 tests) 16ms
   ✓ OPTIONS preflight — returns 200 with CORS headers
   ✓ GET /health — returns 200, JSON, status ok, worker name, ISO timestamp, CORS, security headers
   ✓ GET /health (no env) — falls back to default worker name
   ✓ GET /robots.txt — returns 200, text/plain, disallows /api/
   ✓ GET / — returns 200, HTML, title, tagline, approved colors, security headers, link
   ✓ GET /nonexistent — returns 404, JSON error, CORS, security headers
   ✓ Brand compliance — index.html contains no forbidden colors
```

## Architecture

```
src/index.js      Cloudflare Worker (edge function, zero dependencies)
index.html        Static fallback page (Cloudflare Pages)
```

The worker uses only the Cloudflare Workers runtime — no npm dependencies at runtime.

## Brand Palette (enforced)

| Color | Hex | Usage |
|---|---|---|
| Hot Pink | #FF1D6C | Primary accent, links |
| Amber | #F5A623 | Gradient start |
| Electric Blue | #2979FF | Gradient end |
| Violet | #9C27B0 | Gradient middle |
| Black | #000000 | Background |
| White | #FFFFFF | Text |

## License

Copyright 2025 BlackRoad OS, Inc.

## Links

- [BlackRoad OS](https://blackroad.io)
- [Documentation](https://docs.blackroad.io)
- [GitHub](https://github.com/BlackRoad-OS)

---

Generated with [Claude Code](https://claude.com/claude-code)
