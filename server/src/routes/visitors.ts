import { Hono } from "hono";

import { visitorLocations } from "../data/visitors";

import type {
VisitorLocation,
} from "../types/analytics";

const visitorsRoute = new Hono();

interface IpLocationResponse {
city?: string;
region?: string;
country_code?: string;
country_name?: string;
latitude?: number;
longitude?: number;
error?: boolean;
}

function getClientIp(
request: Request,
): string | null {
const forwarded =
request.headers.get(
"x-forwarded-for",
);

if (forwarded) {
return forwarded
.split(",")[0]
.trim();
}

const realIp =
request.headers.get(
"x-real-ip",
);

if (realIp) {
return realIp.trim();
}

return null;
}

function isPrivateIp(
ip: string,
): boolean {
return (
ip === "127.0.0.1" ||
ip === "::1" ||
ip.startsWith("10.") ||
ip.startsWith("192.168.") ||
ip.startsWith("172.16.") ||
ip.startsWith("172.17.") ||
ip.startsWith("172.18.") ||
ip.startsWith("172.19.") ||
ip.startsWith("172.20.") ||
ip.startsWith("172.21.") ||
ip.startsWith("172.22.") ||
ip.startsWith("172.23.") ||
ip.startsWith("172.24.") ||
ip.startsWith("172.25.") ||
ip.startsWith("172.26.") ||
ip.startsWith("172.27.") ||
ip.startsWith("172.28.") ||
ip.startsWith("172.29.") ||
ip.startsWith("172.30.") ||
ip.startsWith("172.31.")
);
}

visitorsRoute.get(
"/",
(c) => {
return c.json({
success: true,
data: [...visitorLocations],
});
},
);

visitorsRoute.post(
"/track",
async (c) => {
try {
const ip =
getClientIp(c.req.raw);

  if (
    !ip ||
    isPrivateIp(ip)
  ) {
    return c.json({
      success: true,
      data: null,
      message:
        "Visitor IP is unavailable in local development.",
    });
  }

  const response =
    await fetch(
      `https://ipapi.co/${encodeURIComponent(
        ip,
      )}/json/`,
      {
        headers: {
          Accept:
            "application/json",
          "User-Agent":
            "Custom-Ecommerce-Analytics/1.0",
        },
      },
    );

  if (!response.ok) {
    return c.json(
      {
        success: false,
        error:
          "Visitor location lookup failed.",
      },
      502,
    );
  }

  const location =
    (await response.json()) as IpLocationResponse;

  if (
    location.error ||
    typeof location.latitude !==
      "number" ||
    typeof location.longitude !==
      "number"
  ) {
    return c.json({
      success: true,
      data: null,
      message:
        "Visitor location could not be determined.",
    });
  }

  const country =
    location.country_code ||
    "Unknown";

  const city =
    location.city ||
    "Unknown";

  const region =
    location.region ||
    "Unknown";

  const existing =
    visitorLocations.find(
      (item) =>
        item.country ===
          country &&
        item.city === city &&
        item.region ===
          region,
    );

  const now =
    new Date().toISOString();

  if (existing) {
    existing.visitors += 1;
    existing.lastSeenAt =
      now;

    return c.json({
      success: true,
      data: existing,
    });
  }

  const visitor: VisitorLocation =
    {
      id: crypto.randomUUID(),
      country,
      city,
      region,
      latitude:
        location.latitude,
      longitude:
        location.longitude,
      visitors: 1,
      lastSeenAt: now,
    };

  visitorLocations.push(
    visitor,
  );

  return c.json({
    success: true,
    data: visitor,
  });
} catch (error) {
  console.error(
    "VISITOR TRACKING ERROR:",
    error,
  );

  return c.json(
    {
      success: false,
      error:
        "Unable to track visitor location.",
    },
    500,
  );
}

},
);

export default visitorsRoute;
