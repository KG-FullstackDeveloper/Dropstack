import { Hono } from "hono";
import { orders, products } from "../data/store";
import type { Order } from "../types/order";
import { calculateProfitability } from "../utils/profitability";

const businessHealthRoute = new Hono();

type HealthPoint = {
timestamp: string;
revenue: number;
cost: number;
profit: number;
loss: number;
margin: number;
orders: number;
units: number;
};

function isBusinessOrder(order: Order): boolean {
return [
"payment_confirmed",
"settlement_pending",
"ready_to_fulfill",
"supplier_ordered",
"shipped",
"delivered",
].includes(order.order_status);
}

function calculateOrderValues(order: Order) {
let revenue = 0;
let cost = 0;
let units = 0;

for (const item of order.items ?? []) {
const product = products.find(
(productItem) => productItem.id === item.product_id,
);

const sellingPrice =
  Number(item.selling_price) ||
  Number(product?.price) ||
  0;

const supplierCost =
  Number(item.supplier_cost) ||
  Number(product?.supplier_cost) ||
  0;

const shippingCost =
  Number(item.shipping_cost) ||
  Number(product?.shipping_cost) ||
  0;

const otherCost =
  Number(item.other_cost) ||
  Number(product?.other_cost) ||
  0;

const quantity = Math.max(0, Number(item.quantity) || 0);

revenue += sellingPrice * quantity;

cost +=
  (supplierCost + shippingCost + otherCost) *
  quantity;

units += quantity;

}

return {
revenue,
cost,
units,
};
}

function calculatePeriod(
periodOrders: Order[],
) {
let revenue = 0;
let cost = 0;
let ordersCount = 0;
let units = 0;

for (const order of periodOrders) {
const values = calculateOrderValues(order);

revenue += values.revenue;
cost += values.cost;
units += values.units;
ordersCount += 1;

}

const profit = revenue - cost;

const margin =
revenue > 0
? (profit / revenue) * 100
: 0;

return {
revenue,
cost,
profit,
margin,
orders: ordersCount,
units,
};
}

function getTrend(
current: number,
previous: number,
): "up" | "down" | "stable" {
if (previous === 0) {
if (current > 0) return "up";
if (current < 0) return "down";
return "stable";
}

const change =
((current - previous) / Math.abs(previous)) * 100;

if (change > 2) return "up";
if (change < -2) return "down";

return "stable";
}

function getChangePercent(
current: number,
previous: number,
): number {
if (previous === 0) {
return current === 0 ? 0 : 100;
}

return (
((current - previous) / Math.abs(previous)) *
100
);
}

businessHealthRoute.get("/", (c) => {
const now = Date.now();

const currentStart =
now - 30 * 24 * 60 * 60 * 1000;

const previousStart =
currentStart - 30 * 24 * 60 * 60 * 1000;

const currentOrders = orders.filter((order) => {
const createdAt =
new Date(order.created_at).getTime();

return (
  isBusinessOrder(order) &&
  createdAt >= currentStart &&
  createdAt <= now
);

});

const previousOrders = orders.filter((order) => {
const createdAt =
new Date(order.created_at).getTime();

return (
  isBusinessOrder(order) &&
  createdAt >= previousStart &&
  createdAt < currentStart
);

});

const currentPeriod =
calculatePeriod(currentOrders);

const previousPeriod =
calculatePeriod(previousOrders);

const productCounts = {
healthy: 0,
acceptable: 0,
lowMargin: 0,
loss: 0,
};

for (const product of products) {
const result = calculateProfitability(
Number(product.price) || 0,
Number(product.supplier_cost) || 0,
Number(product.shipping_cost) || 0,
Number(product.other_cost) || 0,
);

switch (result.status) {
  case "healthy":
    productCounts.healthy += 1;
    break;

  case "acceptable":
    productCounts.acceptable += 1;
    break;

  case "very_low_margin":
    productCounts.lowMargin += 1;
    break;

  case "loss":
    productCounts.loss += 1;
    break;
}

}

const businessStatus =
currentPeriod.profit > 0
? "profitable"
: currentPeriod.profit < 0
? "loss"
: "break_even";

const response = {
currentPeriod,
previousPeriod,

revenueTrend: getTrend(
  currentPeriod.revenue,
  previousPeriod.revenue,
),

profitTrend: getTrend(
  currentPeriod.profit,
  previousPeriod.profit,
),

businessStatus,

revenueChangePercent: getChangePercent(
  currentPeriod.revenue,
  previousPeriod.revenue,
),

profitChangePercent: getChangePercent(
  currentPeriod.profit,
  previousPeriod.profit,
),

healthyProducts: productCounts.healthy,
acceptableProducts: productCounts.acceptable,
lowMarginProducts: productCounts.lowMargin,
lossProducts: productCounts.loss,

chart: buildHealthSeries(),

};

return c.json({
success: true,
data: response,
});
});

function buildHealthSeries(): HealthPoint[] {
const now = Date.now();

const start =
now - 30 * 24 * 60 * 60 * 1000;

const points: HealthPoint[] = [];

for (let index = 0; index < 30; index += 1) {
const dayStart =
start +
index * 24 * 60 * 60 * 1000;

const dayEnd =
  dayStart +
  24 * 60 * 60 * 1000;

const dayOrders = orders.filter((order) => {
  const createdAt =
    new Date(order.created_at).getTime();

  return (
    isBusinessOrder(order) &&
    createdAt >= dayStart &&
    createdAt < dayEnd
  );
});

const period = calculatePeriod(dayOrders);

const profitability =
  calculateProfitability(
    period.revenue,
    period.cost,
    0,
    0,
  );

points.push({
  timestamp: new Date(dayStart).toISOString(),
  revenue: period.revenue,
  cost: period.cost,
  profit:
    profitability.profit > 0
      ? profitability.profit
      : 0,
  loss:
    profitability.profit < 0
      ? Math.abs(profitability.profit)
      : 0,
  margin: period.margin,
  orders: period.orders,
  units: period.units,
});

}

return points;
}

export default businessHealthRoute;
