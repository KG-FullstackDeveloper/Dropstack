import { Hono } from "hono";

const market = new Hono();

function getClientIp(
request: Request
): string | null {
const forwarded =
request.headers.get(
"x-forwarded-for"
);

if (forwarded) {
return (
forwarded
.split(",")[0]
?.trim() || null
);
}

return (
request.headers.get(
"x-real-ip"
) || null
);
}

function isPrivateIp(
ip: string | null
): boolean {
if (!ip) {
return true;
}

const value = ip.trim();

if (
value === "127.0.0.1" ||
value === "::1" ||
value === "localhost"
) {
return true;
}

if (
value.startsWith("10.") ||
value.startsWith("192.168.") ||
value.startsWith("172.16.") ||
value.startsWith("172.17.") ||
value.startsWith("172.18.") ||
value.startsWith("172.19.") ||
value.startsWith("172.20.") ||
value.startsWith("172.21.") ||
value.startsWith("172.22.") ||
value.startsWith("172.23.") ||
value.startsWith("172.24.") ||
value.startsWith("172.25.") ||
value.startsWith("172.26.") ||
value.startsWith("172.27.") ||
value.startsWith("172.28.") ||
value.startsWith("172.29.") ||
value.startsWith("172.30.") ||
value.startsWith("172.31.")
) {
return true;
}

return false;
}

market.get("/", async (c) => {
const ip = getClientIp(
c.req.raw
);

if (isPrivateIp(ip)) {
return c.json({
success: true,
data: {
countryCode: "NG",
countryName: "Nigeria",
},
});
}

try {
const response = await fetch(
`https://ipapi.co/${encodeURIComponent(ip as string)}/json/`,
{
headers: {
Accept: "application/json",
"User-Agent":
"custom-ecommerce-market-detection",
},
}
);

if (!response.ok) {
  throw new Error(
    "IP location provider failed."
  );
}

const data = (await response.json()) as {
  country_code?: string;
  country_name?: string;
};

const countryCode =
  data.country_code
    ?.trim()
    .toUpperCase();

if (!countryCode) {
  throw new Error(
    "Country could not be detected."
  );
}

return c.json({
  success: true,
  data: {
    countryCode,
    countryName:
      data.country_name ||
      countryCode,
  },
});

} catch {
return c.json({
success: true,
data: {
countryCode: "NG",
countryName: "Nigeria",
},
});
}
});

export default market;