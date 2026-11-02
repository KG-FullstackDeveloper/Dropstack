import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { verifyWorkerToken } from "../src/worker/auth";

test("Worker auth accepts Node-issued JWTs with id/sub claim compatibility", async () => {
  const secret = "1234567890abcdefghijklmnopqrstuvwxyz";
  const token = jwt.sign(
    {
      id: "admin_123",
      sub: "admin_123",
      email: "owner@example.com",
      name: "Owner",
      role: "platform_owner",
    },
    secret,
    { expiresIn: "1h" },
  );

  const payload = await verifyWorkerToken(token, secret);

  assert.ok(payload, "JWT should verify successfully");
  assert.equal(payload?.sub, "admin_123");
  assert.equal(payload?.id, "admin_123");
  assert.equal(payload?.role, "platform_owner");
});
