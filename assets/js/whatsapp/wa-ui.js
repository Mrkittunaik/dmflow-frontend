// ===== DMFlow WhatsApp Module — Shared UI helpers =====
// Toast, theme toggle, tiny mock-data store. UI-only (no backend calls yet).

(function () {

  // ---- Theme ----
  function initTheme() {
    const saved = localStorage.getItem('wa_theme') || 'light';
    document.documentElement.setAttribute('data-wa-theme', saved);
    updateThemeIcon(saved);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-wa-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-wa-theme', cur);
    localStorage.setItem('wa_theme', cur);
    updateThemeIcon(cur);
  }
  function updateThemeIcon(mode) {
    const btn = document.getElementById('waThemeBtn');
    if (!btn) return;
    btn.innerHTML = mode === 'dark'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8.5 8.5 0 1110 3.3a7 7 0 0010 11.2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }

  // ---- Toast ----
  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'wa-toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  // ---- Mock data store (localStorage-backed, UI demo only) ----
  const KEY = 'wa_mock_store_v1';
  function seedIfEmpty() {
    if (localStorage.getItem(KEY)) return;
    const seed = {
      business: { name: 'Aarav Fashion Co.', phone: '+91 98765 43210', status: 'connected', apiStatus: 'healthy' },
      stats: {
        contacts: 4820, conversations: 1264, sent: 18420, received: 15230,
        automationRuns: 6210, leads: 842, orders: 316, revenue: 482300
      },
      automations: [
        { id: 'a1', name: 'Welcome New Customer', trigger: 'New message', status: 'active', runs: 3204, success: 96 },
        { id: 'a2', name: 'Abandoned Cart Recovery', trigger: 'Cart abandoned', status: 'active', runs: 1120, success: 88 },
        { id: 'a3', name: 'Order Shipped Update', trigger: 'Order shipped', status: 'active', runs: 940, success: 99 },
        { id: 'a4', name: 'Price Enquiry Bot', trigger: 'Keyword: price', status: 'paused', runs: 612, success: 91 },
        { id: 'a5', name: 'Feedback Request', trigger: 'Order delivered', status: 'draft', runs: 0, success: 0 }
      ],
      templates: [
        { id: 't1', name: 'order_confirmation', category: 'Utility', lang: 'English', status: 'approved' },
        { id: 't2', name: 'flash_sale_promo', category: 'Marketing', lang: 'English', status: 'approved' },
        { id: 't3', name: 'otp_login', category: 'Authentication', lang: 'English', status: 'approved' },
        { id: 't4', name: 'delivery_reminder', category: 'Utility', lang: 'Hindi', status: 'pending' },
        { id: 't5', name: 'festival_greeting', category: 'Marketing', lang: 'English', status: 'rejected' }
      ]
    };
    localStorage.setItem(KEY, JSON.stringify(seed));
  }
  function store() {
    seedIfEmpty();
    return JSON.parse(localStorage.getItem(KEY));
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  window.WA_UI = { initTheme, toggleTheme, toast, store, save };
})();
