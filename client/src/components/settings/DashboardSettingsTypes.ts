export type SettingsSection =
  | "General"
  | "Account"
  | "Security"
  | "Users"
  | "Payments"
  | "Checkout"
  | "Shipping"
  | "Taxes"
  | "Notifications"
  | "Domains"
  | "Storefront"
  | "Policies"
  | "Privacy"
  | "Data"
  | "Integrations"
  | "Advanced";

export interface DashboardSettingsData {
  storeName: string;
  storeDescription: string;
  storeEmail: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  language: string;
  currency: string;

  ownerName: string;
  ownerEmail: string;

  paymentMethod: "Flutterwave" | "Manual" | "Cash on delivery";
  flutterwavePublicKey: string;
  paymentTestMode: boolean;

  checkoutRequireEmail: boolean;
  checkoutRequirePhone: boolean;
  checkoutRequireAddress: boolean;
  checkoutAllowNotes: boolean;
  checkoutRequireTerms: boolean;

  shippingFee: number;
  freeShippingMinimum: number;
  deliveryEstimate: string;

  notificationsNewOrder: boolean;
  notificationsPayment: boolean;
  notificationsFulfillment: boolean;
  notificationsCustomer: boolean;

  storeOnline: boolean;
  passwordProtectedStore: boolean;

  domain: string;

  refundWindowDays: number;
  returnPolicy: string;
  privacyPolicy: string;
  termsPolicy: string;
  shippingPolicy: string;

  analyticsEnabled: boolean;
  trackingEnabled: boolean;

  apiAccessEnabled: boolean;
  webhooksEnabled: boolean;
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettingsData = {
  storeName: "Nigeria Ecommerce",
  storeDescription: "",
  storeEmail: "",
  supportEmail: "",
  supportPhone: "",
  timezone: "Africa/Lagos",
  language: "English",
  currency: "NGN",

  ownerName: "Store Owner",
  ownerEmail: "",

  paymentMethod: "Flutterwave",
  flutterwavePublicKey: "",
  paymentTestMode: true,

  checkoutRequireEmail: true,
  checkoutRequirePhone: true,
  checkoutRequireAddress: true,
  checkoutAllowNotes: true,
  checkoutRequireTerms: false,

  shippingFee: 0,
  freeShippingMinimum: 0,
  deliveryEstimate: "3–7 business days",

  notificationsNewOrder: true,
  notificationsPayment: true,
  notificationsFulfillment: true,
  notificationsCustomer: true,

  storeOnline: true,
  passwordProtectedStore: false,

  domain: "",

  refundWindowDays: 3,
  returnPolicy: "",
  privacyPolicy: "",
  termsPolicy: "",
  shippingPolicy: "",

  analyticsEnabled: true,
  trackingEnabled: false,

  apiAccessEnabled: false,
  webhooksEnabled: false,
};