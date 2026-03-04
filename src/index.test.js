import { describe, it, expect, beforeAll } from "vitest";
import worker from "./index.js";

// Helper to create a Request for the worker
function makeRequest(path, method = "GET") {
  return new Request(`https://about.blackroad.io${path}`, {
    method,
    cf: { colo: "DFW" },
  });
}

const env = { WORKER_NAME: "about-blackroadio" };

describe("Cloudflare Worker — about.blackroad.io", () => {
  // ─── CORS Preflight ───────────────────────────────────────────────
  describe("OPTIONS preflight", () => {
    it("returns 200 with CORS headers", async () => {
      const res = await worker.fetch(makeRequest("/", "OPTIONS"), env);
      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      expect(res.headers.get("Access-Control-Allow-Headers")).toContain(
        "Content-Type",
      );
    });
  });

  // ─── Health Check ─────────────────────────────────────────────────
  describe("GET /health", () => {
    let res;
    let body;

    beforeAll(async () => {
      res = await worker.fetch(makeRequest("/health"), env);
      body = await res.json();
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });

    it("returns JSON content-type", () => {
      expect(res.headers.get("Content-Type")).toBe("application/json");
    });

    it('has status "ok"', () => {
      expect(body.status).toBe("ok");
    });

    it("includes worker name from env", () => {
      expect(body.worker).toBe("about-blackroadio");
    });

    it("includes a valid ISO timestamp", () => {
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });

    it("includes CORS headers", () => {
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("includes security headers", () => {
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Strict-Transport-Security")).toContain(
        "max-age=",
      );
    });
  });

  // ─── Health Check — fallback worker name ──────────────────────────
  describe("GET /health (no WORKER_NAME env)", () => {
    it("falls back to default worker name", async () => {
      const res = await worker.fetch(makeRequest("/health"), {});
      const body = await res.json();
      expect(body.worker).toBe("blackroad-worker");
    });
  });

  // ─── Robots.txt ───────────────────────────────────────────────────
  describe("GET /robots.txt", () => {
    let res;
    let text;

    beforeAll(async () => {
      res = await worker.fetch(makeRequest("/robots.txt"), env);
      text = await res.text();
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });

    it("returns text/plain", () => {
      expect(res.headers.get("Content-Type")).toBe("text/plain");
    });

    it("disallows /api/", () => {
      expect(text).toContain("Disallow: /api/");
    });

    it("specifies User-agent: *", () => {
      expect(text).toContain("User-agent: *");
    });
  });

  // ─── Main Route (/) ───────────────────────────────────────────────
  describe("GET /", () => {
    let res;
    let body;

    beforeAll(async () => {
      res = await worker.fetch(makeRequest("/"), env);
      body = await res.text();
    });

    it("returns 200", () => {
      expect(res.status).toBe(200);
    });

    it("returns HTML content-type", () => {
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });

    it("contains BlackRoad OS title", () => {
      expect(body).toContain("<title>BlackRoad OS</title>");
    });

    it("contains brand tagline", () => {
      expect(body).toContain("Your AI. Your Hardware. Your Rules.");
    });

    it("uses approved brand colors only", () => {
      const APPROVED = ["#FF1D6C", "#F5A623", "#2979FF", "#9C27B0", "#000", "#fff", "#64748b"];
      const FORBIDDEN = ["#FF9D00", "#FF6B00", "#FF0066", "#FF006B", "#D600AA", "#7700FF", "#0066FF"];
      for (const color of FORBIDDEN) {
        expect(body.toUpperCase()).not.toContain(color.toUpperCase());
      }
    });

    it("includes security headers", () => {
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("Content-Security-Policy")).toContain(
        "default-src 'self'",
      );
      expect(res.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
    });

    it("links to blackroad.ai", () => {
      expect(body).toContain('href="https://blackroad.ai"');
    });
  });

  // ─── 404 Not Found ────────────────────────────────────────────────
  describe("GET /nonexistent", () => {
    let res;
    let body;

    beforeAll(async () => {
      res = await worker.fetch(makeRequest("/nonexistent"), env);
      body = await res.json();
    });

    it("returns 404", () => {
      expect(res.status).toBe(404);
    });

    it("returns JSON error body", () => {
      expect(body.error).toBe("not_found");
      expect(body.path).toBe("/nonexistent");
    });

    it("includes CORS headers on 404", () => {
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("includes security headers on 404", () => {
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    });
  });

  // ─── Static index.html Brand Compliance ───────────────────────────
  describe("Brand compliance — index.html", () => {
    let html;

    beforeAll(async () => {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      html = await fs.readFile(
        path.resolve(import.meta.dirname, "../index.html"),
        "utf-8",
      );
    });

    it("does not contain forbidden colors", () => {
      const FORBIDDEN = ["#FF9D00", "#FF6B00", "#FF0066", "#FF006B", "#D600AA", "#7700FF", "#0066FF"];
      for (const color of FORBIDDEN) {
        expect(html.toUpperCase()).not.toContain(color.toUpperCase());
      }
    });
  });
});
