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
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products').then(setProducts).catch(console.error),
      api.get('/content').then(setContent).catch(() => {}),
    ]).finally(() => {
      setHeroLoaded(true);
      // fade-out then unmount
      setTimeout(() => setShowLoader(false), 480);
    });
  }, []);

  return (
    <>
      {showLoader && (
        <div className={`app-loading ${heroLoaded ? 'fade-out' : ''}`}>
          <img src="/images/logo.png" alt="Crunz" className="app-loading-logo" />
          <div className="app-loading-bar"><div className="app-loading-fill" /></div>
        </div>
      )}
      <Navbar content={content} />
      <Hero content={content} products={products} loaded={heroLoaded} />
      <MarqueeBar />
      <Products products={products} onOpenModal={setSelectedProduct} />
      <Features />
      <Reviews />
      <Contact products={products} content={content} onOpenModal={setSelectedProduct} />
      <Footer content={content} />
      <WaFloat wa={content.whatsapp} />
      <Cart content={content} />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CheckoutModal content={content} />
    </>
  );
}
