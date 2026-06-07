// ===== DMFlow Main JS =====

// ── FAQ accordion ──────────────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Close all open items first
  document.querySelectorAll('.faq-item.open').forEach(el => {
    if (el !== item) el.classList.remove('open');
  });

  item.classList.toggle('open', !isOpen);
}

// ── Mobile nav ────────────────────────────────────────────────
function toggleMobileNav() {
  const drawer  = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobOverlay');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open', !isOpen);
  overlay.classList.toggle('show', !isOpen);
  document.body.style.overflow = !isOpen ? 'hidden' : '';
}
function closeMobileNav() {
  const drawer  = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobOverlay');
  if (!drawer) return;
  drawer.classList.remove('open');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

// Close drawer on ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileNav();
});

// ── Smooth scroll for anchor links ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = document.querySelector('.nav')?.offsetHeight || 64;
        window.scrollTo({ top: target.offsetTop - navH - 8, behavior: 'smooth' });
        closeMobileNav();
      }
    });
  });
});

// ── Sticky nav shadow on scroll ───────────────────────────────
(function() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 20
      ? '0 2px 24px rgba(0,0,0,0.09)'
      : '';
  }, { passive: true });
})();

// ── Counter animation for stat numbers (intersection observer) ──
(function() {
  const nums = document.querySelectorAll('.proof-stat-num, .stat-card-val');
  if (!nums.length || !window.IntersectionObserver) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el  = entry.target;
      const raw = el.textContent.replace(/[^0-9.]/g, '');
      const end = parseFloat(raw);
      if (!end) return;
      const suffix = el.innerHTML.replace(/[0-9.]/g, '').replace(raw, '');
      let start = 0;
      const dur = 1200;
      const step = 16;
      const iv = setInterval(() => {
        start += end / (dur / step);
        if (start >= end) { start = end; clearInterval(iv); }
        el.textContent = Number.isInteger(end)
          ? Math.floor(start) + suffix
          : start.toFixed(1) + suffix;
        // restore inner spans
        el.innerHTML = Math.floor(start >= end ? end : start) + suffix;
      }, step);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
})();

// ── Toast utility (global) ────────────────────────────────────
function showToast(msg, type = 'success') {
  const colors = { success: '#22c55e', error: '#ef4444', info: '#7C3AED' };
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type]||colors.success};color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 24px rgba(0,0,0,0.2);animation:dmfUp .3s ease;max-width:320px;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// Inject toast keyframe once
if (!document.getElementById('dmf-toast-style')) {
  const s = document.createElement('style');
  s.id = 'dmf-toast-style';
  s.textContent = '@keyframes dmfUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}';
  document.head.appendChild(s);
}
