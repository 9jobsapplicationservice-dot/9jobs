"use client";

import { CreditCard } from "lucide-react";

export function resolveCheckoutApiBase({ hostname, configuredApiUrl }) {
  const normalizedApiUrl = (configuredApiUrl || "").replace(/\/$/, "");
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (!isLocal) {
    return "";
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedApiUrl)) {
    return normalizedApiUrl;
  }

  return "http://localhost:5000";
}

export default function PricingCheckoutButton({ plan, className }) {
  const handleCheckout = async () => {
    try {
      const apiBase = resolveCheckoutApiBase({
        hostname: typeof window !== "undefined" ? window.location.hostname : "",
        configuredApiUrl: process.env.NEXT_PUBLIC_API_URL,
      });

      const response = await fetch(`${apiBase}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planName: plan.name,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Network response was not ok");
      }

      const session = await response.json();

      if (!session.url) {
        throw new Error("Stripe checkout URL was not returned");
      }

      window.location.href = session.url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to initiate checkout. Please try again.");
    }
  };

  return (
    <button onClick={handleCheckout} className={className}>
      Pay Now <CreditCard size={17} style={{ marginLeft: '8px' }} />
    </button>
  );
}
