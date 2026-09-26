export type ProfitabilityStatus =
| "loss"
| "very_low_margin"
| "acceptable"
| "healthy";

export interface ProfitabilityResult {
sellingPrice: number;
totalCost: number;
profit: number;
margin: number;
status: ProfitabilityStatus;
label: string;
warning: string | null;
isProfitable: boolean;
}

export function calculateProfitability(
sellingPrice: number,
supplierCost: number,
shippingCost: number,
otherCost: number,
): ProfitabilityResult {
const safeSellingPrice = Number.isFinite(sellingPrice)
? sellingPrice
: 0;

const safeSupplierCost = Number.isFinite(supplierCost)
? supplierCost
: 0;

const safeShippingCost = Number.isFinite(shippingCost)
? shippingCost
: 0;

const safeOtherCost = Number.isFinite(otherCost)
? otherCost
: 0;

const totalCost =
safeSupplierCost +
safeShippingCost +
safeOtherCost;

const profit = safeSellingPrice - totalCost;

const margin =
safeSellingPrice > 0
? (profit / safeSellingPrice) * 100
: profit < 0
? -100
: 0;

let status: ProfitabilityStatus;
let label: string;
let warning: string | null = null;

if (margin < 0) {
status = "loss";
label = "Loss";
warning = "This selling price is below your total product cost.";
} else if (margin < 15) {
status = "very_low_margin";
label = "Very Low Margin";
warning =
"This product is profitable, but the margin is below 15%. Consider increasing the selling price.";
} else if (margin < 25) {
status = "acceptable";
label = "Acceptable";
} else {
status = "healthy";
label = "Healthy";
}

return {
sellingPrice: safeSellingPrice,
totalCost,
profit,
margin,
status,
label,
warning,
isProfitable: profit >= 0,
};
}

export function formatProfitMargin(margin: number): string {
return `${margin.toFixed(2)}%`;
}

export function getProfitabilityStatusMessage(
result: ProfitabilityResult,
): string {
switch (result.status) {
case "loss":
return "Loss: selling price is below total cost.";
case "very_low_margin":
  return "Very low margin: profit is below the 15% target.";

case "acceptable":
  return "Acceptable margin.";

case "healthy":
  return "Healthy margin.";

default:
  return "";

}
}
