export type DiscountType =
  | "percentage"
  | "fixed"
  | "free_shipping"
  | "buy_x_get_y";

export type DiscountTarget = "order" | "products" | "collections";

export type ShippingRateType = "flat" | "price_based" | "weight_based" | "free";

export type StoreMarket = {
  id: string;
  name: string;
  countries: string[];
  currency: string;
  priceAdjustmentPercent: number;
  shippingMarkup: number;
  enabled: boolean;
};

export type DiscountRule = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  type: DiscountType;
  value: number;
  target: DiscountTarget;
  productIds: string[];
  collectionIds: string[];
  minimumOrderAmount?: number;
  minimumQuantity?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  startAt?: string;
  endAt?: string;
  buyQuantity?: number;
  getQuantity?: number;
  getProductIds?: string[];
  getDiscountPercent?: number;
  combinesWithDiscounts: boolean;
};

export type ShippingRate = {
  id: string;
  name: string;
  type: ShippingRateType;
  amount: number;
  threshold?: number;
  minWeight?: number;
  maxWeight?: number;
  estimatedDelivery: string;
  active: boolean;
};

export type StoreSettings = {
  general: {
    storeName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    timezone: string;
    currency: string;
    weightUnit: "kg" | "g" | "lb" | "oz";
  };

  checkout: {
    guestCheckout: boolean;
    accountsOptional: boolean;
    requiredEmail: boolean;
    requiredPhone: boolean;
    requiredAddress: boolean;
    allowOrderNotes: boolean;
    processingMode: "manual" | "automatic";
  };

  discounts: {
    allowCombination: boolean;
    rules: DiscountRule[];
  };

  markets: {
    defaultMarketId: string;
    autoDetectCountry: boolean;
    markets: StoreMarket[];
  };

  shipping: {
    supplierDefaultCost: number;
    zones: Array<{
      id: string;
      name: string;
      countries: string[];
      rates: ShippingRate[];
    }>;
  };

  taxesAndDuties: {
    enabled: boolean;
    displayPricesWithTax: boolean;
    collectImportDuties: boolean;
    customerDutyMessage: string;
  };

  notifications: {
    orderConfirmationEnabled: boolean;
    shippingUpdateEnabled: boolean;
    refundEnabled: boolean;
    abandonedCartEnabled: boolean;
    abandonedCartDelayHours: number;
    templates: {
      orderConfirmation: string;
      shippingUpdate: string;
      refund: string;
      abandonedCart: string;
    };
  };

  customerAccounts: {
    enabled: boolean;
    optional: boolean;
    allowWishlist: boolean;
    allowRecentlyViewed: boolean;
    loyaltyEnabled: boolean;
  };

  marketing: {
    newsletterEnabled: boolean;
    firstOrderDiscountPercent: number;
    exitIntentEnabled: boolean;
    metaPixelId: string;
    tikTokPixelId: string;
    googleAnalyticsId: string;
  };

  seo: {
    title: string;
    description: string;
    socialImageUrl: string;
    allowIndexing: boolean;
  };

  policies: {
    refund: string;
    privacy: string;
    terms: string;
    shipping: string;
  };

  payments: {
    provider: "flutterwave" | "manual" | "other";
    enabled: boolean;
  };
};

export type StoreSettingsMap = Record<string, StoreSettings>;
