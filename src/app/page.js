'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MarqueeBar from '@/components/MarqueeBar';
import Products from '@/components/Products';
import Features from '@/components/Features';
import Reviews from '@/components/Reviews';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import WaFloat from '@/components/WaFloat';
import Cart from '@/components/Cart';
import ProductModal from '@/components/ProductModal';
import CheckoutModal from '@/components/CheckoutModal';
import { api } from '@/lib/api';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    api.get('/products').then(setProducts).catch(console.error);
    api.get('/content').then(setContent).catch(() => {});
  }, []);

  return (
    <>
      <Navbar content={content} />
      <Hero content={content} products={products} />
      <MarqueeBar />
      <Products products={products} onOpenModal={setSelectedProduct} />
      <Features />
      <Reviews />
      <Contact products={products} content={content} onOpenModal={setSelectedProduct} />
      <Footer content={content} />
      <WaFloat wa={content.whatsapp} />
      <Cart />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CheckoutModal content={content} />
    </>
  );
}
