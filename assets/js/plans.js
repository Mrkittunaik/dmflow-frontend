// ===== DMFlow Plans — Single Source of Truth =====
// index.html, app.html, and pages/billing/checkout.html all read prices/features from here.
// Change a price ONCE here and it updates everywhere.
// TODO: once /api/billing/plans is live on the backend, swap PLANS for a live fetch
// (see loadPlans() below — it already tries the API first and falls back to this).

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'mo',
    tagline: 'Perfect to test the waters',
    dms: '500 DMs / month',
    features: [
      { text: '500 DMs / month', included: true },
      { text: '1 Instagram account', included: true },
      { text: 'All basic templates', included: true },
      { text: 'Comment triggers', included: true },
      { text: 'Email collection', included: false },
      { text: 'Advanced analytics', included: false },
    ],
    cta: 'Get started free',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 199,
    period: 'mo',
    badge: 'Most popular',
    tagline: 'For serious creators',
    dms: 'Unlimited DMs',
    features: [
      { text: 'Unlimited DMs', included: true },
      { text: '3 Instagram accounts', included: true },
      { text: 'All templates', included: true },
      { text: 'Email collection', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Start 14-day free trial',
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 299,
    period: 'mo',
    tagline: 'For teams & agencies',
    dms: 'Unlimited DMs',
    features: [
      { text: 'Unlimited DMs', included: true },
      { text: '10 Instagram accounts', included: true },
      { text: 'White-label options', included: true },
      { text: 'Team management', included: true },
      { text: 'API access', included: true },
      { text: 'Dedicated support', included: true },
    ],
    cta: 'Contact sales',
  },
};

// Try live backend plans first (admin-editable), fall back to the hardcoded PLANS above.
// Merges by id so partial backend responses don't break the UI.
async function loadPlans() {
  try {
    if (window.API && typeof API.getPlans === 'function') {
      const live = await API.getPlans();
      if (live && typeof live === 'object') {
        const merged = { ...PLANS };
        for (const key of Object.keys(live)) {
          merged[key] = { ...(merged[key] || {}), ...live[key] };
        }
        return merged;
      }
    }
  } catch (e) { /* backend not ready — silently use local config */ }
  return PLANS;
}

window.PLANS = PLANS;
window.loadPlans = loadPlans;
