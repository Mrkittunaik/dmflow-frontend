// ===== DMFlow API Helper — Full Stack =====
// All backend calls go through here.

const API = (() => {
  const BASE_URL = 'http://localhost:4000'; // ← change to your deployed backend URL

  function getToken()  { return localStorage.getItem('dmflow_token'); }
  function setToken(t) { localStorage.setItem('dmflow_token', t); }
  function clearToken(){ localStorage.removeItem('dmflow_token'); }

  async function req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res  = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  return {
    getToken, setToken, clearToken,
    get:    (path)       => req('GET',    path),
    post:   (path, body) => req('POST',   path, body),
    patch:  (path, body) => req('PATCH',  path, body),
    delete: (path)       => req('DELETE', path),

    // Auth shortcuts
    register: (name, email, password) => req('POST', '/auth/register', { name, email, password }),
    login:    (email, password)        => req('POST', '/auth/login',    { email, password }),

    // Google login — redirect browser to backend
    googleLoginUrl: () => BASE_URL + '/auth/google',

    // Instagram
    instagramConnectUrl: async () => {
      const token = getToken();
      const res   = await fetch(BASE_URL + '/auth/instagram/url', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      return (await res.json()).url;
    },
    saveInstagram: (data) => req('PATCH', '/api/user/instagram', data),
    disconnectInstagram: () => req('DELETE', '/api/user/instagram'),

    // User
    getMe: () => req('GET', '/api/user/me'),

    // Automations
    getAutomations:   ()      => req('GET',    '/api/automations'),
    createAutomation: (data)  => req('POST',   '/api/automations', data),
    updateAutomation: (id, d) => req('PATCH',  '/api/automations/' + id, d),
    toggleAutomation: (id)    => req('PATCH',  '/api/automations/' + id + '/toggle'),
    deleteAutomation: (id)    => req('DELETE', '/api/automations/' + id),

    // Templates
    getTemplates: () => req('GET', '/api/templates'),

    BASE_URL,
  };
})();
