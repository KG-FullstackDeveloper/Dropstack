
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Product from "./pages/Product";
import AdminWorkspace from "./pages/AdminWorkspace";
import Store from "./pages/Store";
import NigeriaStore from "./pages/NigeriaStore";
import NigeriaAdmin from "./pages/NigeriaAdmin";
import MEOAI from "./pages/MEOAI";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import Profile from "./pages/Profile";
import MEOAssistant from "./components/MEOAssistant";
import NotFound from "./pages/NotFound";

function PlatformAssistant() {
  const location = useLocation();
  const path = location.pathname;

  // Keep the assistant away from the landing page and login screen.
  if (path === "/" || path === "/admin/login") {
    return null;
  }

  // Only show the assistant inside authenticated admin areas.
  const isAdmin =
    path.startsWith("/admin") || path.startsWith("/nigeria-admin");

  if (!isAdmin) {
    return null;
  }

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
      <Routes>
        {/* Private platform landing page */}
        <Route path="/" element={<Home />} />

        {/* Admin authentication */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected global admin workspace */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminWorkspace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/ai"
          element={
            <ProtectedRoute>
              <MEOAI />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Protected Nigeria admin workspace */}
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

        {/* Public customer storefronts */}
        <Route path="/store/*" element={<Store />} />
        <Route path="/nigeria-store/*" element={<NigeriaStore />} />

        {/* Legacy platform-level shopping URLs */}
        <Route path="/shop" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/contact" element={<Navigate to="/" replace />} />
        <Route path="/shipping" element={<Navigate to="/" replace />} />
        <Route path="/faq" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<Navigate to="/" replace />} />
        <Route path="/terms" element={<Navigate to="/" replace />} />
        <Route path="/refund-returns" element={<Navigate to="/" replace />} />
        <Route path="/order-tracking" element={<Navigate to="/" replace />} />

        {/* Keep legacy product links from becoming broken */}
        <Route path="/product/:id" element={<Product />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <PlatformAssistant />
    </BrowserRouter>
  );
}
