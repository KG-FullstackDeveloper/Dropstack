import { BrowserRouter, Route, Routes } from "react-router-dom";

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

export default function App() {
  return (
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

        {/* Global Ecommerce workspace */}
        <Route path="/admin" element={<AdminWorkspace />} />

        {/* Global MEO AI */}
        <Route path="/admin/ai" element={<MEOAI />} />

        {/* Global storefront */}
        <Route path="/store/*" element={<Store />} />

        {/* Nigeria Ecommerce workspace */}
        <Route
          path="/nigeria-admin"
          element={<NigeriaAdmin />}
        />

        {/* Nigeria storefront */}
        <Route
          path="/nigeria-store"
          element={<NigeriaStore />}
        />

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}