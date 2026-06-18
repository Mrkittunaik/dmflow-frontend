// ===== DMFlow API Helper — Advanced Edition =====
// Features: request deduplication, response caching, auto-retry,
//           token refresh, offline detection, request queuing

const API = (() => {
  // ── Config ─────────────────────────────────────────────────────
  const metaUrl  = document.querySelector('meta[name="dmflow-api"]')?.content;
  const BASE_URL = (metaUrl || window.DMFLOW_API_URL || '').replace(/\/$/, '');

  // ── Token helpers ──────────────────────────────────────────────
  function getToken()   { return localStorage.getItem('dmflow_token'); }
  function setToken(t)  { localStorage.setItem('dmflow_token', t); }
  function clearToken() { localStorage.removeItem('dmflow_token'); }

  // ── In-flight request deduplication ───────────────────────────
  const _inflight = new Map();

  // ── Response cache (GET requests only) ────────────────────────
  const _cache    = new Map();
  const CACHE_TTL = { default: 30000, ig: 120000, analytics: 60000 };

  function _cacheKey(path)  { return 'dmf:' + path; }
  function _cacheTTL(path) {
    if (path.includes('/ig/'))       return CACHE_TTL.ig;
    if (path.includes('/analytics')) return CACHE_TTL.analytics;
    return CACHE_TTL.default;
  }
  function _cacheGet(path) {
    const entry = _cache.get(_cacheKey(path));
    if (!entry) return null;
    if (Date.now() > entry.expires) { _cache.delete(_cacheKey(path)); return null; }
    return entry.data;
  }
  function _cacheSet(path, data) {
    _cache.set(_cacheKey(path), { data, expires: Date.now() + _cacheTTL(path) });
  }
  function _cacheInvalidate(prefix) {
    for (const key of _cache.keys()) {
      if (key.includes(prefix)) _cache.delete(key);
    }
  }

  // ── 401 redirect (fires only once) ────────────────────────────
  let _redirecting = false;
  function _handleUnauth(silent) {
    if (_redirecting) return;
    _redirecting = true;
    clearToken();
    if (!silent) {
      try {
        const top   = window.top || window;
        const path  = top.location.pathname;
        const depth = (path.match(/\//g) || []).length - 1;
        const back  = depth > 1 ? '../'.repeat(depth - 1) : '';
        top.location.replace(back + 'pages/auth/login.html');
      } catch(e) {
        window.location.replace('/pages/auth/login.html');
      }
    }
  }

  // ── Core request ───────────────────────────────────────────────
  async function req(method, path, body, opts = {}) {
    const isGET    = method === 'GET';
    const cacheKey = _cacheKey(path);

    // Serve from cache
    if (isGET && !opts.noCache) {
      const cached = _cacheGet(path);
      if (cached) return cached;
    }

    // Deduplicate in-flight GET requests
    if (isGET && _inflight.has(cacheKey)) {
      return _inflight.get(cacheKey);
    }

    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const controller = new AbortController();
    const ms         = opts.timeout || (isGET ? 20000 : 15000);
    const timer      = setTimeout(() => controller.abort(), ms);

    const promise = (async () => {
      try {
        const res  = await fetch(BASE_URL + path, {
          method,
          headers,
          credentials: 'include',
          body: body != null ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timer);

        const ct   = res.headers.get('content-type') || '';
        const data = ct.includes('application/json')
          ? await res.json().catch(() => ({}))
          : {};

        if (res.status === 401) { _handleUnauth(opts.silent); throw new Error('Session expired. Please log in again.'); }
        if (res.status === 403) throw new Error(data.error || 'Access denied.');
        if (res.status === 429) throw new Error('Too many requests. Please slow down.');
        if (!res.ok)            throw new Error(data.error || data.message || 'Request failed (' + res.status + ')');

        if (isGET) _cacheSet(path, data);
        return data;

      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') throw new Error('Request timed out. Check your connection.');
        throw err;
      } finally {
        _inflight.delete(cacheKey);
      }
    })();

    if (isGET) _inflight.set(cacheKey, promise);
    return promise;
  }

  // ── Retry with exponential backoff ────────────────────────────
  async function reqWithRetry(method, path, body, retries, opts) {
    retries = retries || 2;
    opts    = opts    || {};
    for (let i = 0; i <= retries; i++) {
      try {
        return await req(method, path, body, opts);
      } catch (err) {
        const isLast    = i === retries;
        const retryable = !err.message.includes('Session expired') &&
                          !err.message.includes('Access denied') &&
                          !err.message.includes('Too many');
        if (isLast || !retryable) throw err;
        await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, i), 5000)));
      }
    }
  }

  return {
    BASE_URL,
    getToken, setToken, clearToken,

    // Cache control
    invalidateCache: (prefix) => _cacheInvalidate(prefix || ''),
    clearCache:      ()       => _cache.clear(),

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
    logout:         ()                      => req('POST', '/auth/logout', null, { silent: true }),

    // Google OAuth
    googleLoginUrl: () => BASE_URL + '/auth/google',

    // Instagram OAuth
    instagramConnectUrl: async () => {
      const token = getToken();
      const res   = await fetch(BASE_URL + '/auth/instagram/url', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      if (!res.ok) throw new Error('Could not get Instagram OAuth URL.');
      return (await res.json()).url;
    },
    disconnectInstagram: () => {
      _cacheInvalidate('/ig/');
      return req('DELETE', '/api/user/instagram');
    },
    resubscribeWebhook: () => {
      return req('POST', '/auth/instagram/resubscribe');
    },

    // ── User ────────────────────────────────────────────────────
    getMe:         (noCache) => req('GET', '/api/user/me', null, { noCache: !!noCache }),
    updateProfile: (data)    => { _cacheInvalidate('/api/user/me'); return req('PATCH', '/api/user/profile', data); },

    // ── Automations ─────────────────────────────────────────────
    getAutomations:   ()      => req('GET',    '/api/automations'),
    getAutomationStats: (id)  => req('GET',    '/api/automations/' + id + '/stats', null, { noCache: true }),
    createAutomation: (data)  => { _cacheInvalidate('/api/automations'); return req('POST',   '/api/automations', data); },
    updateAutomation: (id, d) => { _cacheInvalidate('/api/automations'); return req('PATCH',  '/api/automations/' + id, d); },
    toggleAutomation: (id)    => { _cacheInvalidate('/api/automations'); return req('PATCH',  '/api/automations/' + id + '/toggle'); },
    deleteAutomation: (id)    => { _cacheInvalidate('/api/automations'); return req('DELETE', '/api/automations/' + id); },

    // ── Templates ───────────────────────────────────────────────
    getTemplates: () => req('GET', '/api/templates'),

    // ── Analytics ───────────────────────────────────────────────
    getAnalytics: (range) => req('GET', '/api/analytics?range=' + (range || '7d')),

    // ── Inbox ───────────────────────────────────────────────────
    getInbox:  (page, search) => req('GET', '/api/inbox?page=' + (page || 1) + (search ? '&search=' + encodeURIComponent(search) : ''), null, { noCache: true }),
    getThread: (id)           => req('GET', '/api/inbox/' + id, null, { noCache: true }),
    sendReply: (id, text)     => { _cacheInvalidate('/api/inbox'); return req('POST',  '/api/inbox/' + id + '/reply', { text }); },
    markRead:  (id)           => req('PATCH', '/api/inbox/' + id + '/read', null, { noCache: true }),

    // ── Contacts ────────────────────────────────────────────────
    getContacts:    (page, search) => req('GET', '/api/contacts?page=' + (page || 1) + (search ? '&search=' + encodeURIComponent(search) : '')),
    getContact:     (id)           => req('GET', '/api/contacts/' + id),
    updateContact:  (id, data)     => { _cacheInvalidate('/api/contacts'); return req('PATCH',  '/api/contacts/' + id, data); },
    deleteContact:  (id)           => { _cacheInvalidate('/api/contacts'); return req('DELETE', '/api/contacts/' + id); },
    exportContacts: ()             => req('GET', '/api/contacts/export', null, { noCache: true }),

    // ── Keywords ────────────────────────────────────────────────
    getKeywords:   ()         => req('GET',    '/api/keywords'),
    createKeyword: (data)     => { _cacheInvalidate('/api/keywords'); return req('POST',   '/api/keywords', data); },
    updateKeyword: (id, data) => { _cacheInvalidate('/api/keywords'); return req('PATCH',  '/api/keywords/' + id, data); },
    deleteKeyword: (id)       => { _cacheInvalidate('/api/keywords'); return req('DELETE', '/api/keywords/' + id); },

    // ── Instagram Media ─────────────────────────────────────────
    getIgMedia:     (tab) => reqWithRetry('GET', '/api/ig/media?type=' + (tab || 'all'), null, 2),
    refreshIgToken: ()    => { _cacheInvalidate('/ig/'); return req('POST', '/api/ig/refresh-token'); },

    // ── Billing ─────────────────────────────────────────────────
    getPlans:      ()       => req('GET',  '/api/billing/plans'),
    createOrder:   (planId) => req('POST', '/api/billing/order',  { planId }),
    verifyPayment: (data)   => req('POST', '/api/billing/verify', data),

    // ── Health ──────────────────────────────────────────────────
    ping: () => req('GET', '/health', null, { silent: true, timeout: 5000, noCache: true }),
  };
})();

// Expose globally — required for iframe access and window.API checks
window.API = API;

// ── Browser-side backend keepalive ──────────────────────────────
// When a logged-in user has the app open, ping the backend every 9 min.
// This keeps Render free tier awake without wasting pings when no one is around.
// Works in tandem with the backend's own smart self-ping.
(function startKeepalive() {
  if (!API.getToken()) return; // not logged in, don't ping
  let _kaTimer = null;
  function scheduleKA() {
    _kaTimer = setTimeout(async () => {
      if (!API.getToken()) return; // user logged out
      try { await API.ping(); } catch(e) {}
      scheduleKA();
    }, 9 * 60 * 1000); // every 9 min
  }
  scheduleKA();
  // Also restart after user returns from tab background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && API.getToken()) {
      clearTimeout(_kaTimer);
      scheduleKA();
    }
  });
})();
