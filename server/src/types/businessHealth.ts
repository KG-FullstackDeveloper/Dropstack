export type BusinessTrend =
| "up"
| "down"
| "stable";

export type BusinessProfitStatus =
| "profitable"
| "loss"
| "break_even";

export interface BusinessPeriod {
revenue: number;
cost: number;
profit: number;
margin: number;
orders: number;
units: number;
}

export interface BusinessHealthPoint {
timestamp: string;
revenue: number;
cost: number;
profit: number;
loss: number;
margin: number;
orders: number;
units: number;
}

export interface BusinessHealth {
currentPeriod: BusinessPeriod;
previousPeriod: BusinessPeriod;

revenueTrend: BusinessTrend;
profitTrend: BusinessTrend;

businessStatus: BusinessProfitStatus;

revenueChangePercent: number;
profitChangePercent: number;

healthyProducts: number;
acceptableProducts: number;
lowMarginProducts: number;
lossProducts: number;

chart: BusinessHealthPoint[];
}
