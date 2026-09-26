import type {
AnalyticsPoint,
VisitorLocation,
} from "../types/analytics";

/*

* Analytics data source.
*
* Real sales analytics are calculated from orders and
* products in server/src/routes/analytics.ts.
*
* This file now only keeps visitor-location data.
*
* Visitor tracking will later be connected to real
* storefront sessions/IP geolocation.
  */

export const analyticsSeries: AnalyticsPoint[] =
[];

export const visitorLocations: VisitorLocation[] =
[];
