const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const checkoutPlans = {
  Trial: {
    unitAmount: 2500,
    period: "/ 1 day",
  },
  "Non-IT": {
    unitAmount: 20000,
    period: "/ week",
  },
  IT: {
    unitAmount: 25000,
    period: "/ week",
  },
  "Resume Makeover": {
    unitAmount: 4900,
    period: "one-time",
  },
  "Resume + LinkedIn Optimisation": {
    unitAmount: 8900,
    period: "one-time",
  },
  "Resume + LinkedIn + Seek Optimization": {
    unitAmount: 8900,
    period: "one-time",
  },
  "Resume + LinkedIn + SEEK Optimisation": {
    unitAmount: 8900,
    period: "one-time",
  },
  "Resume, LinkedIn & SEEK Optimisation": {
    unitAmount: 8900,
    period: "one-time",
  },
  "Job Search Essentials": {
    unitAmount: 12900,
    period: "one-time",
  },
  "Career Branding Bundle": {
    unitAmount: 14900,
    period: "one-time",
  },
};

router.post("/api/create-checkout-session", async (req, res) => {
  const planName = typeof req.body.planName === "string" ? req.body.planName.trim() : "";
  const plan = checkoutPlans[planName];

  if (!plan) {
    return res.status(400).json({ error: "Unsupported checkout plan." });
  }

  try {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers.host || "localhost:3000";
    const baseUrl = process.env.APP_BASE_URL || `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `9Jobs ${planName} Plan`,
              description: `${planName} plan - ${plan.period}`,
            },
            unit_amount: plan.unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe checkout URL was not created." });
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
