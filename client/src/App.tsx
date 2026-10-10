import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import AdminWorkspace from "./pages/AdminWorkspace";
import Store from "./pages/Store";
import NigeriaStore from "./pages/NigeriaStore";
import NigeriaAdmin from "./pages/NigeriaAdmin";
import MEOAI from "./pages/MEOAI";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import Profile from "./pages/Profile";
import MEOAssistant from "./components/MEOAssistant";

function PlatformAssistant() {
  const location = useLocation();
  const path = location.pathname;
  const workspace = path.startsWith("/nigeria-admin") || path.startsWith("/nigeria-store") ? "nigeria" : "global";

  const currentPage = path.startsWith("/nigeria-admin")
    ? path.includes("/profile") ? "Profile" : "Nigeria Ecommerce"
    : path.startsWith("/admin")
      ? path.includes("/profile") ? "Profile" : path.includes("/ai") ? "AI Assistant" : "Global Ecommerce"
      : path.startsWith("/nigeria-store") ? "Nigeria Storefront"
      : path.startsWith("/store") ? "Global Storefront"
      : path === "/shop" ? "Shop"
      : path === "/about" ? "About"
      : path === "/contact" ? "Contact"
      : path === "/shipping" ? "Shipping"
      : path === "/faq" ? "FAQ"
      : path.startsWith("/product/") ? "Product"
      : "Home";

  return <MEOAssistant key={workspace} workspace={workspace} currentPage={currentPage} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/faq" element={<FAQ />} />

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<ProtectedRoute><AdminWorkspace /></ProtectedRoute>} />
        <Route path="/admin/ai" element={<ProtectedRoute><MEOAI /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/nigeria-admin/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/store/*" element={<Store />} />
        <Route path="/nigeria-admin" element={<ProtectedRoute><NigeriaAdmin /></ProtectedRoute>} />
        <Route path="/nigeria-store" element={<NigeriaStore />} />

        <Route path="*" element={<Home />} />
      </Routes>
      <PlatformAssistant />
    </BrowserRouter>
  );
}
