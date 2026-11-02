import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import routes from "../src/worker/routes";

test("worker exposes /api/ai and requires auth instead of returning 404", async () => {
  const app = new Hono();
  app.route("/api", routes);

  const response = await app.request("http://example.com/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "hello" }],
    }),
  });

  assert.notEqual(response.status, 404, "AI route should be registered");
  assert.equal(
    response.status,
    401,
    "Unauthenticated requests should be rejected with 401",
  );
});
