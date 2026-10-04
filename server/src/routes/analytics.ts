import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

import { getAllOrders, getProductById } from "../data/store";
import type {
  AnalyticsInterval,
  AnalyticsPoint,
  VisitorLocation,
} from "../types/analytics";

const analytics = new Hono();
analytics.use("*", authMiddleware);

function getProductCost(productId: string) {
  const product = getProductById(productId);

  if (!product) {
    return {
      supplierCost: 0,
      shippingCost: 0,
      otherCost: 0,
    };
  }

  return {
    supplierCost: Number(product.supplier_cost) || 0,
    shippingCost: Number(product.shipping_cost) || 0,
    otherCost: Number(product.other_cost) || 0,
  };
}

function isCompletedOrder(status: string) {
  return [
    "payment_confirmed",
    "settlement_pending",
    "ready_to_fulfill",
    "supplier_ordered",
    "shipped",
    "delivered",
  ].includes(status);
}

function getInterval(from: number, to: number): AnalyticsInterval {
  const difference = to - from;
  const oneDay = 24 * 60 * 60 * 1000;
  const days = difference / oneDay;

  if (days <= 2) return "hour";
  if (days <= 90) return "day";
  if (days <= 730) return "month";
  return "year";
}

function getBucket(date: Date, interval: AnalyticsInterval) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hour = date.getUTCHours();

  if (interval === "hour") {
    return new Date(Date.UTC(year, month, day, hour)).toISOString();
  }

  if (interval === "day") {
    return new Date(Date.UTC(year, month, day)).toISOString();
  }

  if (interval === "month") {
    return new Date(Date.UTC(year, month, 1)).toISOString();
  }

  return new Date(Date.UTC(year, 0, 1)).toISOString();
}

analytics.get("/", (c) => {
  const now = Date.now();
  const defaultFrom = now - 30 * 24 * 60 * 60 * 1000;

  const fromParam = c.req.query("from");
  const toParam = c.req.query("to");
  const intervalParam = c.req.query("interval");

  const from = fromParam ? new Date(fromParam).getTime() : defaultFrom;
  const to = toParam ? new Date(toParam).getTime() : now;

  const interval =
    intervalParam === "hour" ||
    intervalParam === "day" ||
    intervalParam === "month" ||
    intervalParam === "year"
      ? intervalParam
      : getInterval(from, to);

  const buckets = new Map<string, AnalyticsPoint>();

  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let totalOrders = 0;
  let totalUnits = 0;

  const allOrders = getAllOrders();

  const filteredOrders = allOrders.filter((order) => {
    const createdAt = new Date(order.created_at).getTime();

    return (
      Number.isFinite(createdAt) &&
      createdAt >= from &&
      createdAt <= to &&
      isCompletedOrder(order.order_status)
    );
  });

  for (const order of filteredOrders) {
    const orderItems = order.items ?? [];

    let orderRevenue = 0;
    let orderCost = 0;
    let orderUnits = 0;

    for (const item of orderItems) {
      const quantity = Number(item.quantity) || 0;
      const sellingPrice = Number(item.selling_price) || 0;
      const fallback = getProductCost(item.product_id);

      const supplierCost =
        Number(item.supplier_cost) || fallback.supplierCost;
      const shippingCost =
        Number(item.shipping_cost) || fallback.shippingCost;
      const otherCost =
        Number(item.other_cost) || fallback.otherCost;

      const revenue = sellingPrice * quantity;
      const cost = (supplierCost + shippingCost + otherCost) * quantity;

      orderRevenue += revenue;
      orderCost += cost;
      orderUnits += quantity;
    }

    if (orderItems.length === 0) {
      orderRevenue = Number(order.subtotal) || 0;
      orderCost = 0;
      orderUnits = 0;
    }

    const orderProfit = orderRevenue - orderCost;

    totalRevenue += orderRevenue;
    totalCost += orderCost;
    totalProfit += Math.max(orderProfit, 0);
    totalLoss += Math.abs(Math.min(orderProfit, 0));
    totalOrders += 1;
    totalUnits += orderUnits;

    const timestamp = getBucket(new Date(order.created_at), interval);
    const existing = buckets.get(timestamp);

    if (existing) {
      existing.revenue += orderRevenue;
      existing.cost += orderCost;
      existing.profit += Math.max(orderProfit, 0);
      existing.loss += Math.abs(Math.min(orderProfit, 0));
      existing.orders += 1;
      existing.units += orderUnits;
    } else {
      buckets.set(timestamp, {
        timestamp,
        revenue: orderRevenue,
        cost: orderCost,
        profit: Math.max(orderProfit, 0),
        loss: Math.abs(Math.min(orderProfit, 0)),
        orders: 1,
        units: orderUnits,
      });
    }
  }

  const series = Array.from(buckets.values()).sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const visitorLocations: VisitorLocation[] = [];

  return c.json({
    success: true,
    data: {
      summary: {
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        loss: totalLoss,
        orders: totalOrders,
        units: totalUnits,
        visitors: visitorLocations.reduce(
          (total, location) => total + location.visitors,
          0
        ),
      },
      series,
      visitorLocations,
    },
  });
});

export default analytics;
