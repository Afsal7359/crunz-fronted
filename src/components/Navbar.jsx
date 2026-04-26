'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar({ content = {}, onOpenAuth, onOpenProfile }) {
  const [mmOpen, setMmOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const { itemCount, setCartOpen } = useCart();
  const { user, logout } = useAuth();

  const announce = content.announce || 'Free delivery on orders over £25 · ';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
            <li><a href="#videos">Videos</a></li>
            <li><a href="#reviews">Reviews</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="nav-right">
            {/* Profile / Auth dropdown */}
            <div className="nav-profile-wrap" ref={dropRef}>
              <button className="nav-icon-btn" onClick={() => setDropOpen(d => !d)} aria-label="Account">
                {/* Person icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                {user && <span className="nav-icon-dot" />}
              </button>

              {dropOpen && (
                <div className="nav-drop">
                  {user ? (
                    <>
                      <div className="nav-drop-user">
                        <div className="nav-drop-avatar">
                          {user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="nav-drop-name">{user.name}</div>
                          <div className="nav-drop-email">{user.email}</div>
                        </div>
                      </div>
                      <div className="nav-drop-divider" />
                      <button className="nav-drop-item" onClick={() => { setDropOpen(false); onOpenProfile?.(); }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                        My Orders
                      </button>
                      {user.isAdmin && (
                        <Link href="/admin" className="nav-drop-item" onClick={() => setDropOpen(false)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                          Admin Panel
                        </Link>
                      )}
                      <div className="nav-drop-divider" />
                      <button className="nav-drop-item nav-drop-logout" onClick={() => { logout(); setDropOpen(false); }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="nav-drop-guest">Sign in for order tracking &amp; faster checkout</div>
                      <button className="nav-drop-signin" onClick={() => { setDropOpen(false); onOpenAuth?.(); }}>Sign In</button>
                      <button className="nav-drop-register" onClick={() => { setDropOpen(false); onOpenAuth?.(); }}>Create Account</button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart button — icon only on mobile */}
            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Cart">
              <span className="cart-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {itemCount > 0 && <span className="cc">{itemCount > 9 ? '9+' : itemCount}</span>}
              </span>
              <span className="cart-label">Cart</span>
            </button>

            {/* Hamburger */}
            <button className="hbg" onClick={() => setMmOpen(true)} aria-label="Menu">
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
        <a href="#videos" onClick={() => setMmOpen(false)}>Videos</a>
        <a href="#reviews" onClick={() => setMmOpen(false)}>Reviews</a>
        <a href="#contact" onClick={() => setMmOpen(false)}>Contact</a>
        {user ? (
          <>
            <button className="mm-profile-btn" onClick={() => { setMmOpen(false); onOpenProfile?.(); }}>
              My Orders &amp; Profile
            </button>
            {user.isAdmin && <Link href="/admin" onClick={() => setMmOpen(false)}>Admin Panel</Link>}
            <button className="mm-logout-btn" onClick={() => { logout(); setMmOpen(false); }}>Sign Out</button>
          </>
        ) : (
          <button className="mm-signin-btn" onClick={() => { setMmOpen(false); onOpenAuth?.(); }}>Sign In / Register</button>
        )}
      </div>
    </>
  );
}
