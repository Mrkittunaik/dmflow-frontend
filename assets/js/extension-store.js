// assets/js/extension-store.js
// Handles: lead capture -> tier/payment card -> waiting -> approved/download
// Also: footer "kittu" admin login -> admin dashboard (approve/reject/upload)
(function () {
  const API = (window.DMFLOW_API_URL || '').replace(/\/$/, '');
  const $ = (sel, root) => (root || document).querySelector(sel);

  let currentLeadId = null;
  let pollTimer = null;

  const PHONE_KEY = 'dmflow_ext_phone';
  const savePhone = (phone) => { try { localStorage.setItem(PHONE_KEY, phone); } catch (_) {} };
  const getSavedPhone = () => { try { return localStorage.getItem(PHONE_KEY) || ''; } catch (_) { return ''; } };
  const clearSavedPhone = () => { try { localStorage.removeItem(PHONE_KEY); } catch (_) {} };

  // ---------- open/close helpers ----------
  function openOverlay(id) { $('#' + id).classList.add('open'); }
  function closeOverlay(id) { $('#' + id).classList.remove('open'); }

  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-ext-close]')) {
      closeOverlay(e.target.closest('.ext-overlay').id);
    }
    if (e.target.classList.contains('ext-overlay')) {
      e.target.classList.remove('open');
    }
  });

  // ---------- Step 1: open lead form ----------
  function initDownloadButton() {
    const btn = $('#ext-download-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const savedPhone = getSavedPhone();
      if (savedPhone) {
        btn.disabled = true;
        const original = btn.textContent;
        btn.textContent = 'Checking...';
        const resumed = await tryResume(savedPhone);
        btn.disabled = false;
        btn.textContent = original;
        if (resumed) return;
      }
      resetLeadForm();
      openOverlay('ext-overlay-form');
    });
  }

  // Returning user: look up their existing lead by phone and jump straight
  // to the right screen (approved -> download, pending -> waiting).
  // Returns true if it handled things (caller should not open the fresh form).
  async function tryResume(phone) {
    try {
      const res = await fetch(`${API}/api/extension/leads/by-phone/${phone}`);
      if (!res.ok) { clearSavedPhone(); return false; }
      const data = await res.json();
      currentLeadId = data.id;

      if (data.status === 'approved') {
        openOverlay('ext-overlay-done');
        return true;
      }
      if (data.status === 'rejected') {
        clearSavedPhone();
        return false;
      }
      // pending / paid_pending_verification
      renderPaymentCard(data.tier, data.price, data.originalPrice, data.tierRank);
      $('#ext-wait-title').textContent = 'Waiting for verification';
      $('#ext-wait-sub').textContent = "We're verifying your payment. This usually takes a few minutes — keep this open.";
      openOverlay('ext-overlay-wait');
      startPolling();
      return true;
    } catch (_) {
      return false;
    }
  }

  function resetLeadForm() {
    $('#ext-name').value = '';
    $('#ext-phone').value = '';
    $('#ext-form-error').classList.remove('show');
  }

  function initLeadForm() {
    const form = $('#ext-lead-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#ext-name').value.trim();
      const phone = $('#ext-phone').value.trim();
      const errEl = $('#ext-form-error');
      errEl.classList.remove('show');

      if (name.length < 2) return showErr(errEl, 'Enter your full name');
      if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, '').slice(-10)))
        return showErr(errEl, 'Enter a valid 10-digit phone number');

      const submitBtn = $('#ext-lead-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait...';

      try {
        const res = await fetch(`${API}/api/extension/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');

        currentLeadId = data.id;
        savePhone(phone);
        renderPaymentCard(data.tier, data.price, data.originalPrice, data.tierRank);
        closeOverlay('ext-overlay-form');
        openOverlay('ext-overlay-pay');
      } catch (err) {
        showErr(errEl, err.message || 'Network error, try again');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Continue →';
      }
    });
  }

  function showErr(el, msg) {
    el.textContent = msg;
    el.classList.add('show');
  }

  // ---------- Step 2: payment card ----------
  function renderPaymentCard(tier, price, originalPrice, tierRank) {
    $('#ext-tier-tag').textContent = tier;
    $('#ext-price-amount').innerHTML =
      `₹${price}` + (originalPrice && originalPrice > price ? `<span>₹${originalPrice}</span>` : '');
    $('#ext-price-note').textContent =
      tierRank === 1
        ? "🎉 You're one of the first 10 members — special launch price!"
        : tierRank === 2
        ? 'Early member pricing — limited to first 100 members.'
        : 'Standard pricing.';

    // confetti only for tier 1 (first 10 members)
    const confettiWrap = $('#ext-confetti-wrap');
    confettiWrap.innerHTML = '';
    if (tierRank === 1) {
      fireConfetti(confettiWrap);
    }
  }

  function fireConfetti(wrap) {
    const colors = ['#C8FF00', '#7C3AED', '#FF9933', '#25D366', '#FFFFFF', '#FF6B6B'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'ext-confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = 1.4 + Math.random() * 1.2 + 's';
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      wrap.appendChild(piece);
    }
    setTimeout(() => { wrap.innerHTML = ''; }, 3200);
  }

  function initPaidButton() {
    const btn = $('#ext-paid-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!currentLeadId) return;
      btn.disabled = true;
      btn.textContent = 'Confirming...';
      try {
        await fetch(`${API}/api/extension/leads/${currentLeadId}/mark-paid`, { method: 'POST' });
      } catch (_) {}
      closeOverlay('ext-overlay-pay');
      openOverlay('ext-overlay-wait');
      startPolling();
      btn.disabled = false;
      btn.textContent = "I've Paid ✓";
    });
  }

  // ---------- Step 3: waiting + polling ----------
  function startPolling() {
    stopPolling();
    pollTimer = setInterval(checkStatus, 4000);
    checkStatus();
  }
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  async function checkStatus() {
    if (!currentLeadId) return;
    try {
      const res = await fetch(`${API}/api/extension/leads/${currentLeadId}/status`);
      const data = await res.json();
      if (data.status === 'approved') {
        stopPolling();
        closeOverlay('ext-overlay-wait');
        openOverlay('ext-overlay-done');
      } else if (data.status === 'rejected') {
        stopPolling();
        closeOverlay('ext-overlay-wait');
        $('#ext-wait-title').textContent = 'Payment not verified';
        $('#ext-wait-sub').textContent = 'Please contact support on WhatsApp for help.';
        openOverlay('ext-overlay-wait');
      }
    } catch (_) {}
  }

  function initDownloadFinal() {
    const btn = $('#ext-final-download-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!currentLeadId) return;
      window.location.href = `${API}/api/extension/download/${currentLeadId}`;
      clearSavedPhone();
    });
  }

  // ================= ADMIN =================
  let adminToken = null;

  function initAdminLink() {
    const link = $('#footer-admin-link');
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      $('#ext-admin-login-error').classList.remove('show');
      $('#ext-admin-password').value = '';
      openOverlay('ext-overlay-admin-login');
    });
  }

  function initAdminLoginForm() {
    const form = $('#ext-admin-login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = $('#ext-admin-password').value;
      const errEl = $('#ext-admin-login-error');
      try {
        const res = await fetch(`${API}/api/extension/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid password');
        adminToken = data.token;
        closeOverlay('ext-overlay-admin-login');
        openOverlay('ext-overlay-admin-dash');
        loadAdminLeads();
      } catch (err) {
        errEl.textContent = err.message || 'Invalid password';
        errEl.classList.add('show');
      }
    });
  }

  async function loadAdminLeads() {
    const tbody = $('#ext-admin-tbody');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
      const res = await fetch(`${API}/api/extension/admin/leads`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const leads = await res.json();
      if (!Array.isArray(leads) || leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No leads yet.</td></tr>';
        return;
      }
      tbody.innerHTML = leads
        .map(
          (l) => `
        <tr data-id="${l._id}">
          <td>${escapeHtml(l.name)}</td>
          <td>${escapeHtml(l.phone)}</td>
          <td>₹${l.price} <span style="color:var(--gray-400)">(${l.tier})</span></td>
          <td><span class="ext-status-pill ${l.status}">${l.status}</span></td>
          <td class="ext-admin-actions">
            ${
              l.status === 'pending'
                ? `<button class="approve-btn" data-action="approve" data-id="${l._id}">Approve</button>
                   <button class="reject-btn" data-action="reject" data-id="${l._id}">Reject</button>`
                : '—'
            }
          </td>
        </tr>`
        )
        .join('');
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="5">Failed to load leads.</td></tr>';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function initAdminTableActions() {
    const tbody = $('#ext-admin-tbody');
    if (!tbody) return;
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      btn.disabled = true;
      try {
        await fetch(`${API}/api/extension/admin/leads/${id}/${action}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        loadAdminLeads();
      } catch (_) {
        btn.disabled = false;
      }
    });
  }

  function initAdminUpload() {
    const form = $('#ext-admin-upload-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = $('#ext-admin-file');
      const statusEl = $('#ext-admin-upload-status');
      if (!fileInput.files.length) return;
      const fd = new FormData();
      fd.append('file', fileInput.files[0]);
      statusEl.textContent = 'Uploading...';
      try {
        const res = await fetch(`${API}/api/extension/admin/file`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: fd,
        });
        if (!res.ok) throw new Error('Upload failed');
        statusEl.textContent = '✓ Extension file uploaded';
        fileInput.value = '';
      } catch (err) {
        statusEl.textContent = 'Upload failed, try again';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDownloadButton();
    initLeadForm();
    initPaidButton();
    initDownloadFinal();
    initAdminLink();
    initAdminLoginForm();
    initAdminTableActions();
    initAdminUpload();
  });
})();
