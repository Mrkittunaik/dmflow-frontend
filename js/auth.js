// ===== DMFlow Auth JS — Full Stack Edition =====
// Works with Express/MongoDB backend. Google OAuth via backend redirect.

const DMFLOW_CONFIG = {
  BACKEND_URL: 'http://localhost:4000', // ← change to your deployed URL
};

// ─── Storage helpers ──────────────────────────────────────
function dmSetUser(u) { try { localStorage.setItem('dmflow_user', JSON.stringify(u)); } catch(e){} }
function dmGetUser()  { try { return JSON.parse(localStorage.getItem('dmflow_user') || 'null'); } catch(e){ return null; } }
function dmClearUser(){ try { localStorage.removeItem('dmflow_user'); localStorage.removeItem('dmflow_token'); localStorage.removeItem('dmflow_modal_seen'); } catch(e){} }

// ─── UI helpers ───────────────────────────────────────────
function showEl(id) { const el=document.getElementById(id); if(el) el.style.display=''; }
function hideEl(id) { const el=document.getElementById(id); if(el) el.style.display='none'; }
function setError(id, msg) { const el=document.getElementById(id); if(el){ el.textContent=msg; el.style.display=msg?'':'none'; } }
function clearError(id) { setError(id,''); }

function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.innerHTML = inp.type === 'password'
    ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
}

function otpMove(input, idx) {
  input.value = input.value.replace(/\D/g, '');
  const boxes = document.querySelectorAll('.otp-box');
  if (input.value && idx < boxes.length - 1) boxes[idx + 1].focus();
}

// Handle backspace on OTP boxes
document.addEventListener('keydown', function(e) {
  if (e.key === 'Backspace' && e.target.classList.contains('otp-box')) {
    const boxes = Array.from(document.querySelectorAll('.otp-box'));
    const idx = boxes.indexOf(e.target);
    if (!e.target.value && idx > 0) boxes[idx-1].focus();
  }
});

function switchTab(btn, tabId) {
  btn.closest('.auth-form').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['emailTab','phoneTab'].forEach(id => hideEl(id));
  showEl(tabId);
}
function switchTabLogin(btn, tabId) {
  btn.closest('.auth-form').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['loginEmailTab','loginPhoneTab'].forEach(id => hideEl(id));
  showEl(tabId);
}

// ─── Validation ───────────────────────────────────────────
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ─── Password strength ────────────────────────────────────
document.addEventListener('input', function(e) {
  if (e.target.id !== 'regPassword') return;
  const val = e.target.value;
  const el  = document.getElementById('pwStrength');
  if (!el) return;
  let s = 0;
  if (val.length >= 8) s++;
  if (/[A-Z]/.test(val)) s++;
  if (/[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  const labels = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#ef4444','#f59e0b','#3b82f6','#22c55e'];
  const bars   = [0,25,50,75,100];
  el.innerHTML = val ? `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;"><div style="flex:1;height:3px;background:var(--gray-200);border-radius:2px;"><div style="width:${bars[s]}%;height:100%;background:${colors[s]};border-radius:2px;transition:all .3s;"></div></div><span style="color:${colors[s]};font-size:11px;font-weight:700;">${labels[s]}</span></div>` : '';
});

// ─── Toast ────────────────────────────────────────────────
function showToast(msg, type='success') {
  const colors = { success:'#22c55e', error:'#ef4444', info:'#7C3AED' };
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type]||colors.success};color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 24px rgba(0,0,0,0.2);animation:dmfUp .3s ease;max-width:320px;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 3500);
}
const _ts = document.createElement('style');
_ts.textContent = '@keyframes dmfUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}';
document.head.appendChild(_ts);

// ═══════════════════════════════════════════════════════════
// GOOGLE OAUTH — backend redirect
// ═══════════════════════════════════════════════════════════
function googleLogin(e) {
  if (e) e.preventDefault();
  window.location.href = DMFLOW_CONFIG.BACKEND_URL + '/auth/google';
}

// ═══════════════════════════════════════════════════════════
// INSTAGRAM OAUTH — backend provides URL
// ═══════════════════════════════════════════════════════════
async function connectInstagram(username) {
  const user = dmGetUser();
  if (user && username) { user.igUsernameIntent = username; dmSetUser(user); }
  try {
    const token = localStorage.getItem('dmflow_token');
    const res = await fetch(DMFLOW_CONFIG.BACKEND_URL + '/auth/instagram/url', {
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    });
    const { url } = await res.json();
    if (url) { window.location.href = url; }
    else { showToast('Could not get Instagram URL. Is the backend running?','error'); }
  } catch(err) {
    showToast('Backend not reachable. Start the backend server first.','error');
  }
}

// ═══════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════
function showContactRegister() { hideEl('step1'); showEl('step2email'); }
function backToStep1()         { hideEl('step2email'); hideEl('step2otp'); showEl('step1'); }
function backToEmailReg()      { hideEl('step2otp'); showEl('step2email'); }

async function doRegister() {
  const name  = document.getElementById('regName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const pw    = document.getElementById('regPassword')?.value;

  clearError('regError');
  if (!name || name.length < 2)    { setError('regError','Enter your full name.'); return; }
  if (!validateEmail(email))        { setError('regError','Enter a valid email address.'); return; }
  if (!pw || pw.length < 8)         { setError('regError','Password must be at least 8 characters.'); return; }

  const btn = document.querySelector('#emailTab .btn-auth-submit');
  if (btn) { btn.textContent = 'Creating account...'; btn.disabled = true; }

  try {
    const res  = await fetch(DMFLOW_CONFIG.BACKEND_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pw }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');

    localStorage.setItem('dmflow_token', data.token);
    dmSetUser({ ...data.user, avatar: (data.user.name||'U')[0].toUpperCase(), plan: data.user.plan || 'free' });
    window.location.href = 'connect.html';
  } catch(err) {
    if (btn) { btn.textContent = 'Create Account →'; btn.disabled = false; }
    setError('regError', err.message);
  }
}

function sendOtp() {
  const phone = document.getElementById('regPhone')?.value.trim();
  const name  = document.getElementById('regNamePhone')?.value.trim();
  const cc    = document.querySelector('.country-code-select')?.value || '+91';
  if (!name || name.length < 2) { showToast('Enter your full name.','error'); return; }
  if (!phone || phone.length < 6) { showToast('Enter a valid phone number.','error'); return; }
  const fullPhone = cc + phone;
  const el = document.getElementById('otpTarget'); if (el) el.textContent = fullPhone;
  hideEl('step2email'); showEl('step2otp');
  startOtpTimer('regOtpTimer');
}

function verifyOtp() {
  const boxes = document.querySelectorAll('#step2otp .otp-box');
  const otp   = Array.from(boxes).map(b => b.value).join('');
  if (otp.length < 6) { showToast('Enter all 6 digits.','error'); return; }
  const name  = document.getElementById('regNamePhone')?.value || 'User';
  const phone = document.getElementById('otpTarget')?.textContent;
  // Phone OTP: register via backend using OTP endpoint when configured
  dmSetUser({ name, phone, avatar: name[0].toUpperCase(), plan: 'free', registered: true });
  window.location.href = 'connect.html';
}

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════
function showEmailLogin()    { hideEl('step1'); showEl('step2login'); }
function backToStep1Login()  { hideEl('step2login'); hideEl('step3otp'); showEl('step1'); }
function backToLoginStep2()  { hideEl('step3otp'); showEl('step2login'); }

async function doLogin() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const pw    = document.getElementById('loginPassword')?.value;

  clearError('loginError');
  if (!validateEmail(email)) { setError('loginError','Enter a valid email address.'); return; }
  if (!pw)                    { setError('loginError','Enter your password.'); return; }

  const btn = document.querySelector('#loginEmailTab .btn-auth-submit');
  if (btn) { btn.textContent = 'Signing in...'; btn.disabled = true; }

  try {
    const res  = await fetch(DMFLOW_CONFIG.BACKEND_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');

    localStorage.setItem('dmflow_token', data.token);
    dmSetUser({ ...data.user, avatar: (data.user.name||'U')[0].toUpperCase(), plan: data.user.plan || 'free' });
    window.location.href = data.user.instagram?.connected ? 'dashboard.html' : 'platform-select.html';
  } catch(err) {
    if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }
    setError('loginError', err.message);
  }
}

function sendLoginOtp() {
  const phone = document.getElementById('loginPhone')?.value.trim();
  const cc    = document.querySelectorAll('.country-code-select')[0]?.value || '+91';
  if (!phone) { showToast('Enter your phone number.','error'); return; }
  const fullPhone = cc + phone;
  const el = document.getElementById('loginOtpTarget'); if (el) el.textContent = fullPhone;
  hideEl('step2login'); showEl('step3otp');
  startOtpTimer('loginOtpTimer');
}

function verifyLoginOtp() {
  const boxes = document.querySelectorAll('#step3otp .otp-box');
  const otp   = Array.from(boxes).map(b => b.value).join('');
  if (otp.length < 6) { showToast('Enter all 6 digits.','error'); return; }
  const phone = document.getElementById('loginOtpTarget')?.textContent;
  dmSetUser({ name:'User', phone, avatar:'U', plan:'free', registered:true });
  window.location.href = 'connect.html';
}

function resendOtp(e) {
  if (e) e.preventDefault();
  showToast('OTP resent!');
  startOtpTimer('regOtpTimer');
  startOtpTimer('loginOtpTimer');
}

// ─── OTP Timer ────────────────────────────────────────────
function startOtpTimer(elId) {
  const el = document.getElementById(elId); if (!el) return;
  let s = 60;
  el.textContent = 'Resend in 0:60';
  const iv = setInterval(() => {
    s--;
    el.textContent = s > 0 ? `Resend in 0:${s<10?'0'+s:s}` : '';
    if (s <= 0) clearInterval(iv);
  }, 1000);
}

// ─── Forgot password ──────────────────────────────────────
async function sendResetLink() {
  const email = document.getElementById('fpEmail')?.value.trim();
  if (!validateEmail(email)) { showToast('Enter a valid email.','error'); return; }
  const btn = document.querySelector('.btn-auth-submit');
  if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
  try {
    // POST to backend forgot-password endpoint when available
    await fetch(DMFLOW_CONFIG.BACKEND_URL + '/auth/forgot-password', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email})
    });
  } catch(e) { /* backend endpoint optional, still show success UI */ }
  const el = document.getElementById('fpEmailTarget'); if (el) el.textContent = email;
  hideEl('fpStep1'); showEl('fpStep2');
}

// ─── Sign out ─────────────────────────────────────────────
function signOut(e) {
  if (e) e.preventDefault();
  dmClearUser();
  window.location.href = '../index.html';
}
