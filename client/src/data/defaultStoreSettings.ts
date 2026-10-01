import type { StoreSettings } from "../types/storeSettings";

export function createDefaultStoreSettings(storeName = ""): StoreSettings {
  return {
    general: {
      storeName,
      contactEmail: "",
      contactPhone: "",
      address: "",
      timezone: "Africa/Lagos",
      currency: "USD",
      weightUnit: "kg",
    },

    checkout: {
      guestCheckout: true,
      accountsOptional: true,
      requiredEmail: true,
      requiredPhone: true,
      requiredAddress: true,
      allowOrderNotes: true,
      processingMode: "manual",
    },

    discounts: {
      allowCombination: false,
      rules: [],
    },

    markets: {
      defaultMarketId: "default-market",
      autoDetectCountry: true,
      markets: [
        {
          id: "default-market",
          name: "Default market",
          countries: [],
          currency: "USD",
          priceAdjustmentPercent: 0,
          shippingMarkup: 0,
          enabled: true,
        },
      ],
    },

    shipping: {
      supplierDefaultCost: 0,
      zones: [],
    },

    taxesAndDuties: {
      enabled: false,
      displayPricesWithTax: false,
      collectImportDuties: false,
      customerDutyMessage: "",
    },

    notifications: {
      orderConfirmationEnabled: true,
      shippingUpdateEnabled: true,
      refundEnabled: true,
      abandonedCartEnabled: false,
      abandonedCartDelayHours: 4,
      templates: {
        orderConfirmation: "",
        shippingUpdate: "",
        refund: "",
        abandonedCart: "",
      },
    },

    customerAccounts: {
      enabled: true,
      optional: true,
      allowWishlist: true,
      allowRecentlyViewed: true,
      loyaltyEnabled: false,
    },

    marketing: {
      newsletterEnabled: true,
      firstOrderDiscountPercent: 10,
      exitIntentEnabled: false,
      metaPixelId: "",
      tikTokPixelId: "",
      googleAnalyticsId: "",
    },

    seo: {
      title: "",
      description: "",
      socialImageUrl: "",
      allowIndexing: true,
    },

    policies: {
      refund: "",
      privacy: "",
      terms: "",
      shipping: "",
    },

    payments: {
      provider: "flutterwave",
      enabled: true,
    },
  };
}
