import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { db } from "../database/db";

const contact = new Hono();

// Lightweight per-process abuse guard for the public contact form.
// Production deployments should also enforce rate limits at the hosting edge.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

contact.post("/", async (c) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);

  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return c.json({ success: false, error: "Too many messages. Please try again later." }, 429);
  }

  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    current.count += 1;
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Please submit a valid message." }, 400);
  }

  if (!body || typeof body !== "object") {
    return c.json({ success: false, error: "Please submit a valid message." }, 400);
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!name || !email || !subject || !message) {
    return c.json({ success: false, error: "Please complete every field." }, 400);
  }
  if (name.length > 100 || subject.length > 160 || message.length > 5000) {
    return c.json({ success: false, error: "One or more fields are too long." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return c.json({ success: false, error: "Enter a valid email address." }, 400);
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO support_messages (id, name, email, subject, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'new', ?)
  `).run(id, name, email, subject, message, createdAt);

  return c.json({
    success: true,
    data: { id, message: "Your message has been received. Our team will review it." },
  }, 201);
});

export default contact;
