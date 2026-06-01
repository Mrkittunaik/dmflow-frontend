// ===== DMFlow API Helper — Production Ready =====
// Set DMFLOW_API_URL in your environment or update BASE_URL below.
// For local dev: http://localhost:4000
// For production: https://api.yourdomain.com

const API = (() => {
  // ── Config: reads from meta tag or falls back to env constant ──
  const metaUrl = document.querySelector('meta[name="dmflow-api"]')?.content;
  const BASE_URL = metaUrl || window.DMFLOW_API_URL || 'https://dmflow-backend-u9h8.onrender.com';

  // ── Token helpers ──────────────────────────────────────────────
  function getToken()  { return localStorage.getItem('dmflow_token'); }
  function setToken(t) { localStorage.setItem('dmflow_token', t); }
  function clearToken(){ localStorage.removeItem('dmflow_token'); }

  // ── Core request ───────────────────────────────────────────────
  async function req(method, path, body, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeout || 15000);

    try {
      const res  = await fetch(BASE_URL + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));

      // Token expired — clear and redirect to login
      if (res.status === 401) {
        clearToken();
        if (!opts.silent) {
          // Works whether served from root or a subdirectory
          const depth = (window.location.pathname.match(/\//g) || []).length - 1;
          const back  = depth > 1 ? '../'.repeat(depth - 1) : '';
          window.location.href = back + 'pages/auth/login.html';
        }
        throw new Error('Session expired. Please log in again.');
      }

      if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
      return data;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('Request timed out. Check your connection.');
      throw err;
    }
  }

  // ── Retry helper (for flaky connections) ──────────────────────
  async function reqWithRetry(method, path, body, retries = 1) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await req(method, path, body);
      } catch (err) {
        if (i === retries) throw err;
        await new Promise(r => setTimeout(r, 800 * (i + 1))); // backoff
      }
    }
  }

  return {
    BASE_URL,
    getToken, setToken, clearToken,

    // ── Raw methods ─────────────────────────────────────────────
    get:    (path, opts)       => req('GET',    path, null, opts),
    post:   (path, body, opts) => req('POST',   path, body, opts),
    patch:  (path, body, opts) => req('PATCH',  path, body, opts),
    delete: (path, opts)       => req('DELETE', path, null, opts),

    // ── Auth ────────────────────────────────────────────────────
    register:       (name, email, password) => req('POST', '/auth/register', { name, email, password }),
    login:          (email, password)       => req('POST', '/auth/login',    { email, password }),
    forgotPassword: (email)                 => req('POST', '/auth/forgot-password', { email }),
    resetPassword:  (token, password)       => req('POST', '/auth/reset-password', { token, password }),

    // Google OAuth — backend redirect
    googleLoginUrl: () => BASE_URL + '/auth/google',

    // Instagram OAuth — backend provides URL
    instagramConnectUrl: async () => {
      const token = getToken();
      const res   = await fetch(BASE_URL + '/auth/instagram/url', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      if (!res.ok) throw new Error('Could not fetch Instagram OAuth URL.');
      return (await res.json()).url;
    },
    saveInstagram:       (data) => req('PATCH',  '/api/user/instagram', data),
    disconnectInstagram: ()     => req('DELETE', '/api/user/instagram'),

    // ── User ────────────────────────────────────────────────────
    getMe:        ()     => req('GET',   '/api/user/me'),
    updateProfile:(data) => req('PATCH', '/api/user/profile', data),

    // ── Automations ─────────────────────────────────────────────
    getAutomations:   ()       => req('GET',    '/api/automations'),
    createAutomation: (data)   => req('POST',   '/api/automations', data),
    updateAutomation: (id, d)  => req('PATCH',  '/api/automations/' + id, d),
    toggleAutomation: (id)     => req('PATCH',  '/api/automations/' + id + '/toggle'),
    deleteAutomation: (id)     => req('DELETE', '/api/automations/' + id),

    // ── Templates ───────────────────────────────────────────────
    getTemplates: () => req('GET', '/api/templates'),

    // ── Analytics ───────────────────────────────────────────────
    getAnalytics:  (range)    => req('GET', '/api/analytics?range=' + (range || '7d')),

    // ── Inbox ────────────────────────────────────────────────────
    getInbox:      (page, search) => req('GET', '/api/inbox?page=' + (page || 1) + (search ? '&search=' + encodeURIComponent(search) : '')),
    getThread:     (threadId)     => req('GET', '/api/inbox/' + threadId),
    sendReply:     (threadId, text) => req('POST', '/api/inbox/' + threadId + '/reply', { text }),
    markRead:      (threadId)     => req('PATCH', '/api/inbox/' + threadId + '/read'),

    // ── Contacts ─────────────────────────────────────────────────
    getContacts:   (page, search) => req('GET', '/api/contacts?page=' + (page || 1) + (search ? '&search=' + encodeURIComponent(search) : '')),
    getContact:    (id)           => req('GET', '/api/contacts/' + id),
    updateContact: (id, data)     => req('PATCH', '/api/contacts/' + id, data),
    deleteContact: (id)           => req('DELETE', '/api/contacts/' + id),
    exportContacts: ()            => req('GET', '/api/contacts/export'),

    // ── Keywords ─────────────────────────────────────────────────
    getKeywords:   ()             => req('GET',    '/api/keywords'),
    createKeyword: (data)         => req('POST',   '/api/keywords', data),
    updateKeyword: (id, data)     => req('PATCH',  '/api/keywords/' + id, data),
    deleteKeyword: (id)           => req('DELETE', '/api/keywords/' + id),

    // ── Instagram Media (real posts/reels for post picker) ───────
    getIgMedia:    (tab)          => req('GET', '/api/ig/media?type=' + (tab || 'all')),

    // ── Billing / Plans ─────────────────────────────────────────
    getPlans:      ()         => req('GET',  '/api/billing/plans'),
    createOrder:   (planId)   => req('POST', '/api/billing/order', { planId }),
    verifyPayment: (data)     => req('POST', '/api/billing/verify', data),

    // ── Health check ────────────────────────────────────────────
    ping: () => req('GET', '/health', null, { silent: true, timeout: 5000 }),
  };
})();
