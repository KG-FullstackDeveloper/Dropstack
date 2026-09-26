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
warning = "Selling price is below total product cost.";
} else if (margin < 15) {
status = "very_low_margin";
label = "Very Low Margin";
warning =
"Product is profitable but has a margin below 15%.";
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
