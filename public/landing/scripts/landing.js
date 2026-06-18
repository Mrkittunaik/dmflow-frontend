// ===== DMFlow Landing Page (index.html) — section-specific scripts =====
// Note: toggleFaq() lives in main.js (it was previously duplicated here,
// which silently overrode the main.js version since this loaded last — removed).

// ── Contact form submit handler ────────────────────────────────
function handleContactForm(e) {
  e.preventDefault();
  const btn = document.getElementById('contactSubmitBtn');
  const form = e.target;
  const success = document.getElementById('contactSuccess');
  btn.disabled = true;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Sending...';
  setTimeout(() => {
    form.style.display = 'none';
    success.style.display = 'flex';
  }, 900);
}

// ── Auth-aware nav: show profile + "Open App" if user is already logged in ──
(function() {
  try {
    const user = JSON.parse(localStorage.getItem('dmflow_user') || 'null');
    const token = localStorage.getItem('dmflow_token');
    if (!user || !token) return;

    const loginBtn    = document.getElementById('navLoginBtn');
    const registerBtn = document.getElementById('navRegisterBtn');
    const appBtn      = document.getElementById('navAppBtn');
    const avatar      = document.getElementById('navUserAvatar');
    const mobLogin    = document.getElementById('mobLoginLink');
    const mobRegister = document.getElementById('mobRegisterLink');
    const mobApp      = document.getElementById('mobAppLink');

    if (loginBtn)    loginBtn.style.display    = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (appBtn)      { appBtn.style.display = 'inline-flex'; }
    if (mobLogin)    mobLogin.style.display    = 'none';
    if (mobRegister) mobRegister.style.display = 'none';
    if (mobApp)      mobApp.style.display      = 'block';

    if (avatar) {
      const name = user.name || user.displayName || '';
      const initial = name.charAt(0).toUpperCase() || '?';
      if (user.profilePic || user.picture) {
        avatar.innerHTML = '<img src="' + (user.profilePic || user.picture) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.parentElement.textContent=\'' + initial + '\'">';
      } else {
        avatar.textContent = initial;
      }
      avatar.style.display = 'flex';
    }
  } catch (e) {}
})();
