'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar({ content = {} }) {
  const [mmOpen, setMmOpen] = useState(false);
  const { itemCount, setCartOpen } = useCart();
  const { user } = useAuth();

  const announce = content.announce || 'Free delivery on orders over £25 · 100% Natural · Zero Preservatives';

  return (
    <>
      <div className="announce">
        {announce.split('·').map((part, i, arr) => (
          <span key={i}>{part.trim()}{i < arr.length - 1 && <span> · </span>}</span>
        ))}
      </div>

      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo">
            <Image src="/images/logo.png" alt="CRUNZ" width={160} height={40} priority />
          </Link>
          <ul className="navlinks">
            <li><a href="#products">Shop</a></li>
            <li><a href="#spotlight">Flavours</a></li>
            <li><a href="#features">Why Us</a></li>
            <li><a href="#reviews">Reviews</a></li>
            <li><a href="#contact">Contact</a></li>
            {user?.isAdmin && <li><Link href="/admin" style={{ opacity: 1, color: '#16a34a', fontWeight: 700 }}>Admin</Link></li>}
          </ul>
          <div className="nav-right">
            <button className="cart-btn" onClick={() => setCartOpen(true)}>
              Cart <span className="cc">{itemCount}</span>
            </button>
            <button className="hbg" onClick={() => setMmOpen(true)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mm ${mmOpen ? 'open' : ''}`}>
        <button className="mm-x" onClick={() => setMmOpen(false)}>✕</button>
        <a href="#products" onClick={() => setMmOpen(false)}>Shop</a>
        <a href="#spotlight" onClick={() => setMmOpen(false)}>Flavours</a>
        <a href="#features" onClick={() => setMmOpen(false)}>Why Us</a>
        <a href="#reviews" onClick={() => setMmOpen(false)}>Reviews</a>
        <a href="#contact" onClick={() => setMmOpen(false)}>Contact</a>
        {user?.isAdmin && <Link href="/admin" onClick={() => setMmOpen(false)}>Admin Panel</Link>}
      </div>
    </>
  );
}
