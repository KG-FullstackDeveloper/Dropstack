import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Admin from "./pages/Admin";
import Store from "./pages/Store";
import StorePerformance from "./pages/StorePerformance";
import Stores from "./pages/Stores";


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

        {/* Web app */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/store/*" element={<Store />} />
        <Route path="store-performance" element={<StorePerformance />} />
        <Route path="/stores" element={<Stores />} />

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}