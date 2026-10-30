import { db } from "../database/db";
import { runShippingMigration } from "../database/shippingMigration";
import { convertCurrencyAmount } from "./exchangeRates";

// Ensure the order columns exist before checkout uses this service.
runShippingMigration();

export type Workspace = "global" | "nigeria";

export interface ShippingOption {
  id: string;
  name: string;
  code: string;
  active: boolean;
  price: number;
  minDays: number;
  maxDays: number;
}

export interface ShippingSettings {
  policyText: string;
  options: ShippingOption[];
}

export interface ShippingInfo {
  country: string;
  deliveryTime: string;
  fee: number;
}

export interface SelectedShippingOption {
  id: string;
  name: string;
  code: string;
  price: number;
  minDays: number;
  maxDays: number;
  deliveryEstimate: string;
}

const AFRICA = ["NG", "GH", "ZA"];
const DOMESTIC = ["US", "GB", "AU"];

export function getShippingInfo(country: string): ShippingInfo {
  const code = country.trim().toUpperCase();

  if (AFRICA.includes(code)) {
    return { country: code, deliveryTime: "6–10 days", fee: 15 };
  }

  if (DOMESTIC.includes(code)) {
    return { country: code, deliveryTime: "10–14 days", fee: 10 };
  }

  return {
    country: code,
    deliveryTime: "Shipping time confirmed at checkout",
    fee: 20,
  };
}

export function getDefaultShippingSettings(country: string): ShippingSettings {
  const legacy = getShippingInfo(country);

  return {
    policyText:
      "Please review your selected shipping method and estimated delivery window before continuing. Delivery estimates are not guaranteed and may be affected by customs, carriers, or circumstances outside the store's control.",
    options: [
      {
        id: "standard",
        name: "Standard Shipping",
        code: "STD",
        active: true,
        price: legacy.fee,
        minDays: 8,
        maxDays: 15,
      },
      {
        id: "express",
        name: "Express Shipping",
        code: "EXP",
        active: true,
        price: legacy.fee + 10,
        minDays: 5,
        maxDays: 8,
      },
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateShippingSettings(
  value: unknown,
): ShippingSettings | null {
  if (!isRecord(value)) return null;

  if (typeof value.policyText !== "string") return null;
  if (value.policyText.trim().length < 10) return null;
  if (value.policyText.length > 5000) return null;

  if (!Array.isArray(value.options)) return null;
  if (value.options.length < 1 || value.options.length > 10) return null;

  const ids = new Set<string>();
  const codes = new Set<string>();
  const options: ShippingOption[] = [];

  for (const item of value.options) {
    if (!isRecord(item)) return null;

    const { id, name, code, active, price, minDays, maxDays } = item;

    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(id)) {
      return null;
    }

    if (
      typeof name !== "string" ||
      name.trim().length < 1 ||
      name.length > 80
    ) {
      return null;
    }

    if (typeof code !== "string" || !/^[A-Z]{3,5}$/.test(code)) {
      return null;
    }

    if (typeof active !== "boolean") return null;
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return null;
    }

    if (
      typeof minDays !== "number" ||
      !Number.isInteger(minDays) ||
      minDays < 0 ||
      minDays > 365
    ) {
      return null;
    }

    if (
      typeof maxDays !== "number" ||
      !Number.isInteger(maxDays) ||
      maxDays < minDays ||
      maxDays > 365
    ) {
      return null;
    }

    if (ids.has(id) || codes.has(code)) return null;

    ids.add(id);
    codes.add(code);

    options.push({
      id,
      name: name.trim(),
      code,
      active,
      price: Math.round(price * 100) / 100,
      minDays,
      maxDays,
    });
  }

  return {
    policyText: value.policyText.trim(),
    options,
  };
}

export function getShippingSettings(
  workspace: Workspace,
  country: string,
): ShippingSettings {
  const row = db
    .prepare(
      "SELECT settings FROM admin_workspace_settings WHERE workspace = ?",
    )
    .get(workspace) as { settings: string } | undefined;

  const defaults = getDefaultShippingSettings(country);

  if (!row?.settings) return defaults;

  let parsed: unknown;

  try {
    parsed = JSON.parse(row.settings);
  } catch {
    return defaults;
  }

  if (!isRecord(parsed) || !("shipping" in parsed)) {
    return defaults;
  }

  const validated = validateShippingSettings(parsed.shipping);

  // Don't silently use invalid saved configuration.
  if (!validated) {
    throw new Error(`Invalid shipping settings for workspace "${workspace}".`);
  }

  return validated;
}

export function getAvailableShippingOptions(
  workspace: Workspace,
  country: string,
): ShippingOption[] {
  return getShippingSettings(workspace, country).options.filter(
    (option) => option.active,
  );
}

export async function resolveShippingOption(
  workspace: Workspace,
  country: string,
  methodId: string,
  currency = "USD",
): Promise<SelectedShippingOption> {
  const options = getAvailableShippingOptions(workspace, country);
  const selected = options.find((option) => option.id === methodId);

  if (!selected) {
    throw new Error("The selected shipping method is unavailable.");
  }

  const deliveryEstimate =
    selected.minDays === selected.maxDays
      ? `${selected.minDays} business days`
      : `${selected.minDays}–${selected.maxDays} business days`;

  return {
    id: selected.id,
    name: selected.name,
    code: selected.code,
    price: await convertCurrencyAmount(selected.price, "USD", currency),
    minDays: selected.minDays,
    maxDays: selected.maxDays,
    deliveryEstimate,
  };
}
