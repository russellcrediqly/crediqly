'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserSubscription } from '@/lib/supabase/subscriptionService';
import { Subscription, hasActiveProSubscription, hasPremiumAdvisory } from '@/types/subscription';

interface SubscriptionContextType {
  subscription: Subscription | null;
  isPro: boolean;
  isAdvisory: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  verifyCheckoutSession: (sessionId: string) => Promise<void>;
  upgradeToPro: () => Promise<void>;
  upgradeToAdvisory: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const sub = await getUserSubscription(user.id);
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const verifyCheckoutSession = useCallback(async (sessionId: string) => {
    if (!user?.id || !sessionId) return;
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: user.id }),
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      } else {
        await fetchSubscription();
      }
    } catch (err) {
      console.warn('Checkout session verification error:', err);
      await fetchSubscription();
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchSubscription]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      if (sessionId && user?.id) {
        verifyCheckoutSession(sessionId);
      } else {
        fetchSubscription();
      }
    } else {
      fetchSubscription();
    }

    // Listen for live subscription updates
    const handleSubUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Subscription>;
      if (customEvent.detail && customEvent.detail.userId === user?.id) {
        setSubscription(customEvent.detail);
      } else {
        fetchSubscription();
      }
    };

    window.addEventListener('crediqly_subscription_updated', handleSubUpdated);
    return () => {
      window.removeEventListener('crediqly_subscription_updated', handleSubUpdated);
    };
  }, [fetchSubscription, verifyCheckoutSession, user?.id]);

  const isPro = hasActiveProSubscription(subscription);
  const isAdvisory = hasPremiumAdvisory(subscription);

  // Trigger Pro subscription checkout
  const upgradeToPro = async () => {
    if (!user?.id) {
      window.location.href = '/signup';
      return;
    }

    try {
      const res = await fetch('/api/stripe/checkout-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          customerEmail: user.email,
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.notConfigured) {
        alert('Stripe payments are currently in setup mode on this server. Please contact support.');
      } else {
        throw new Error(data.error || 'Failed to start checkout session.');
      }
    } catch (err: any) {
      console.error('Upgrade to Pro error:', err);
      alert(err.message || 'Unable to proceed to checkout. Please try again.');
    }
  };

  // Trigger Done-For-You Premium Advisory checkout ($499 setup + $149/mo)
  const upgradeToAdvisory = async () => {
    if (!user?.id) {
      window.location.href = '/signup';
      return;
    }

    try {
      const res = await fetch('/api/stripe/checkout-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          customerEmail: user.email,
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.notConfigured) {
        alert('Stripe payments are currently in setup mode on this server. Please contact support.');
      } else {
        throw new Error(data.error || 'Failed to start Premium Advisory checkout session.');
      }
    } catch (err: any) {
      console.error('Upgrade to Premium Advisory error:', err);
      alert(err.message || 'Unable to proceed to checkout. Please try again.');
    }
  };

  // Open Stripe Customer Portal
  const openCustomerPortal = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        throw new Error(data.error || 'Failed to open billing portal.');
      }
    } catch (err: any) {
      console.error('Customer portal error:', err);
      alert(err.message || 'Unable to open billing portal.');
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isPro,
        isAdvisory,
        loading,
        refreshSubscription: fetchSubscription,
        verifyCheckoutSession,
        upgradeToPro,
        upgradeToAdvisory,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
