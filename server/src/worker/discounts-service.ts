import { Hono } from "hono";
import type { WorkerEnvironment } from "./types";
import { workerAuthMiddleware } from "./auth";

const discountsService = new Hono<WorkerEnvironment>();

discountsService.get("/", workerAuthMiddleware, async (c) => {
  return c.json(
    {
      success: false,
      error:
        "Discount management remains on the original Node backend until the D1 schema is ready.",
      route: "/api/discounts",
      status: "deferred",
    },
    501,
  );
});

export default discountsService;
