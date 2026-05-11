'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function PaymentResult() {
  const searchParams  = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    const clientSecret    = searchParams.get('payment_intent_client_secret');
    const orderId         = searchParams.get('orderId');

    if (!paymentIntentId || !clientSecret) {
      setStatus('failed');
      setMessage('Invalid payment session. Please contact support.');
      return;
    }

    async function verify() {
      try {
        const stripe = await stripePromise;
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        if (paymentIntent.status === 'succeeded') {
          await api.post('/payment/confirm-order', { paymentIntentId, orderId });
          clearCart();
          setStatus('success');
        } else if (paymentIntent.status === 'processing') {
          await api.post('/payment/confirm-order', { paymentIntentId, orderId }).catch(() => {});
          setStatus('processing');
          setMessage('Your UPI payment is being processed by your bank. You will receive a confirmation email once it clears (usually within a few minutes).');
        } else if (paymentIntent.status === 'requires_payment_method') {
          setStatus('failed');
          setMessage('Payment was declined or cancelled. Please go back and try again.');
        } else {
          setStatus('failed');
          setMessage(`Payment status: ${paymentIntent.status}. Please contact support if you were charged.`);
        }
      } catch (e) {
        setStatus('failed');
        setMessage(e.message || 'Something went wrong. Please contact support.');
      }
    }

    verify();
  }, [searchParams, clearCart]);

  const STATUS = {
    loading: {
      ico: '⏳',
      title: 'Verifying Payment…',
      sub: 'Please wait while we confirm your payment.',
      btn: null,
    },
    success: {
      ico: '🎉',
      title: 'Order Confirmed!',
      sub: 'Payment successful. Check your email for your order details.',
      btn: { label: 'Continue Shopping', href: '/' },
    },
    processing: {
      ico: '🕐',
      title: 'Payment Processing',
      sub: message,
      btn: { label: 'Back to Home', href: '/' },
    },
    failed: {
      ico: '✕',
      title: 'Payment Failed',
      sub: message,
      btn: { label: 'Try Again', href: '/' },
    },
  };

  const s = STATUS[status];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#fafafa',
      fontFamily: 'Inter, system-ui, sans-serif', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '56px 40px',
        textAlign: 'center', maxWidth: 460, width: '100%',
        boxShadow: '0 4px 32px rgba(0,0,0,.08)',
      }}>
        {/* Logo */}
        <img src="/images/logo.png" alt="Crunz" style={{ height: 36, marginBottom: 32, opacity: .85 }} />

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: status === 'success' ? '#dcfce7' : status === 'failed' ? '#fee2e2' : status === 'processing' ? '#fef3c7' : '#f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
        }}>
          {status === 'loading'
            ? <div style={{ width: 28, height: 28, border: '3px solid #e0e0e0', borderTopColor: '#0a0a0a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : s.ico}
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-.5px', margin: '0 0 10px' }}>
          {s.title}
        </h1>
        <p style={{ color: '#666', fontSize: '.9rem', lineHeight: 1.6, margin: '0 0 28px' }}>
          {s.sub}
        </p>

        {s.btn && (
          <a href={s.btn.href} style={{
            display: 'inline-block', background: '#0a0a0a', color: '#fff',
            padding: '14px 36px', borderRadius: 12, fontWeight: 700,
            fontSize: '.9rem', textDecoration: 'none',
            transition: 'opacity .15s',
          }}>
            {s.btn.label}
          </a>
        )}

        {status === 'processing' && (
          <p style={{ marginTop: 16, fontSize: '.75rem', color: '#aaa' }}>
            Order ID saved — no need to repay.
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div>Verifying…</div>
      </div>
    }>
      <PaymentResult />
    </Suspense>
  );
}
