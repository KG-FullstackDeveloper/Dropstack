import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Store from "./pages/store/Store";

import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/admin/Toast";
import ProtectedRoute from "./components/admin/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public website */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Admin auth */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Web app */}
            <Route path="/store/*" element={<Store />} />

            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
