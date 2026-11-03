import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundReturns from "./pages/RefundReturns";
import ProtectedRoute from "./components/admin/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Shipping = lazy(() => import("./pages/Shipping"));
const FAQ = lazy(() => import("./pages/FAQ"));

const OrderTracking = lazy(() =>
  import("./pages/TrustPages").then((module) => ({
    default: module.OrderTracking,
  })),
);

const Product = lazy(() => import("./pages/Product"));
const AdminWorkspace = lazy(() => import("./pages/AdminWorkspace"));
const Store = lazy(() => import("./pages/Store"));
const Shop = lazy(() => import("./pages/Shop"));
const NigeriaStore = lazy(() => import("./pages/NigeriaStore"));
const NigeriaAdmin = lazy(() => import("./pages/NigeriaAdmin"));
const MEOAI = lazy(() => import("./pages/MEOAI"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerRegister = lazy(() => import("./pages/CustomerRegister"));
const Profile = lazy(() => import("./pages/Profile"));
const PlatformOwnerPortal = lazy(
  () => import("./pages/PlatformOwnerPortal"),
);
const MEOAssistant = lazy(() => import("./components/MEOAssistant"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LuxuryStorefront = lazy(
  () => import("./pages/LuxuryStorefront"),
);

function SEOManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.toLowerCase();

    const isAdminPage =
      path === "/admin" ||
      path.startsWith("/admin/") ||
      path === "/platform-owner" ||
      path.startsWith("/platform-owner/") ||
      path === "/nigeria-admin" ||
      path.startsWith("/nigeria-admin/") ||
      path.startsWith("/customer/");

    const knownExactPaths = new Set([
      "/",
      "/admin/login",
      "/admin",
      "/admin/ai",
      "/admin/profile",
      "/platform-owner",
      "/nigeria-admin",
      "/nigeria-admin/profile",
      "/customer/login",
      "/customer/register",
      "/customer/dashboard",
      "/store",
      "/shop",
      "/about",
      "/contact",
      "/shipping",
      "/faq",
      "/privacy",
      "/terms",
      "/refund-returns",
      "/order-tracking",
    ]);

    const isKnownRoute =
      knownExactPaths.has(path) ||
      /^\/store\/[^/]+(?:\/.*)?$/.test(path) ||
      path.startsWith("/nigeria-store/") ||
      path === "/nigeria-store" ||
      path.startsWith("/luxury-store/") ||
      path === "/luxury-store" ||
      /^\/product\/[^/]+$/.test(path);

    let title = "MEO Store | Shop Quality Products";
    let description =
      "Discover quality products and shop online with MEO Store.";

    if (path === "/") {
      title = "MEO Store | Online Shopping";
      description =
        "Explore MEO Store and discover products selected for your everyday needs.";
    } else if (path === "/shop") {
      title = "Shop Products | MEO Store";
      description =
        "Browse products available in the MEO Store online catalogue.";
    } else if (path === "/about") {
      title = "About Us | MEO Store";
      description =
        "Learn more about MEO Store and our online shopping platform.";
    } else if (path === "/contact") {
      title = "Contact Us | MEO Store";
      description =
        "Contact the MEO Store team for help and enquiries.";
    } else if (path === "/shipping") {
      title = "Shipping Information | MEO Store";
      description =
        "Read MEO Store's shipping information and delivery details.";
    } else if (path === "/faq") {
      title = "Frequently Asked Questions | MEO Store";
      description =
        "Find answers to common questions about shopping with MEO Store.";
    } else if (path === "/privacy") {
      title = "Privacy Policy | MEO Store";
      description = "Read the MEO Store privacy policy.";
    } else if (path === "/terms") {
      title = "Terms and Conditions | MEO Store";
      description = "Read the terms and conditions for using MEO Store.";
    } else if (path === "/refund-returns") {
      title = "Returns Policy | MEO Store";
      description = "Read the MEO Store returns and refund policy.";
    } else if (path === "/order-tracking") {
      title = "Order Tracking | MEO Store";
      description =
        "Find information about tracking your MEO Store order.";
    } else if (path.startsWith("/store/")) {
      title = "Online Store | MEO Store";
      description = "Explore products in this online store.";
    } else if (path.startsWith("/nigeria-store")) {
      title = "Nigeria Store | MEO Store";
      description =
        "Browse products in the MEO Store Nigeria shopping experience.";
    } else if (path.startsWith("/luxury-store")) {
      title = "Luxury Collection | MEO Store";
      description =
        "Explore the collection available in this online store.";
    } else if (path.startsWith("/product/")) {
      title = "Product Details | MEO Store";
      description =
        "View product details and shopping information.";
    } else if (path.startsWith("/customer/")) {
      title = "Customer Account | MEO Commerce";
      description =
        "Manage your MEO Commerce customer account.";
    } else if (isAdminPage) {
      title = "Dashboard | MEO Commerce";
      description = "MEO Commerce account dashboard.";
    }

    if (!isKnownRoute) {
      title = "Page Not Found | MEO Store";
      description = "The requested page could not be found.";
    }

    document.title = title;

    const setMeta = (
      name: string,
      content: string,
      property = false,
    ) => {
      const attribute = property ? "property" : "name";

      let tag = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      );

      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }

      tag.content = content;
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta(
      "robots",
      isAdminPage ? "noindex, nofollow" : "index, follow",
    );
  }, [pathname]);

  return null;
}

function PlatformAssistant() {
  const { pathname } = useLocation();
  const path = pathname.toLowerCase();

  if (
    path === "/" ||
    path === "/admin/login" ||
    path.startsWith("/customer/")
  ) {
    return null;
  }

  const isAdmin =
    path.startsWith("/admin") ||
    path.startsWith("/nigeria-admin");

  if (!isAdmin) return null;

  const workspace = path.startsWith("/nigeria-admin")
    ? "nigeria"
    : "global";

  const currentPage = path.startsWith("/nigeria-admin")
    ? path.includes("/profile")
      ? "Profile"
      : "Nigeria Ecommerce"
    : path.includes("/profile")
      ? "Profile"
      : path.includes("/ai")
        ? "AI Assistant"
        : "Global Ecommerce";

  return (
    <MEOAssistant
      key={workspace}
      workspace={workspace}
      currentPage={currentPage}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SEOManager />

      <Suspense
        fallback={
          <div
            className="grid min-h-screen place-items-center text-sm text-slate-500"
            role="status"
          >
            Loading page...
          </div>
        }
      >
        <Routes>
          {/* Public homepage */}
          <Route path="/" element={<Home />} />

          {/* Admin authentication */}
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* Customer authentication */}
          <Route
            path="/customer/login"
            element={<CustomerLogin />}
          />

          <Route
            path="/customer/register"
            element={<CustomerRegister />}
          />

          {/* Backward compatibility: use the shared dashboard */}
          <Route
            path="/customer/dashboard"
            element={<Navigate to="/admin" replace />}
          />

          {/* Shared admin/customer dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowCustomer>
                <AdminWorkspace />
              </ProtectedRoute>
            }
          />

          {/* Admin-only AI page */}
          <Route
            path="/admin/ai"
            element={
              <ProtectedRoute>
                <MEOAI />
              </ProtectedRoute>
            }
          />

          {/* Admin-only profile */}
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Platform owner only */}
          <Route
            path="/platform-owner"
            element={
              <ProtectedRoute requiredRole="platform_owner">
                <PlatformOwnerPortal />
              </ProtectedRoute>
            }
          />

          {/* Nigeria workspace remains separate */}
          <Route
            path="/nigeria-admin"
            element={
              <ProtectedRoute>
                <NigeriaAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nigeria-admin/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Public storefronts */}
          <Route
            path="/store"
            element={<Navigate to="/store/meo-store" replace />}
          />

          <Route
            path="/store/:slug/*"
            element={<Store />}
          />

          <Route
            path="/nigeria-store/*"
            element={<NigeriaStore />}
          />

          <Route
            path="/luxury-store/*"
            element={<LuxuryStorefront />}
          />

          {/* Public content */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/faq" element={<FAQ />} />

          {/* Policies */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/refund-returns"
            element={<RefundReturns />}
          />

          <Route
            path="/order-tracking"
            element={<OrderTracking />}
          />

          {/* Product pages */}
          <Route
            path="/product/:id"
            element={<Product />}
          />

          {/* Not found */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <PlatformAssistant />
      </Suspense>
    </BrowserRouter>
  );
}