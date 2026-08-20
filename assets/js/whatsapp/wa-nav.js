// ===== DMFlow WhatsApp Module — Sidebar Nav =====
// Renders the shared sidebar into #waSidebarMount on every dashboard page.
// Isolated from the rest of the app's nav system.

(function () {
  const BASE = '/pages/app/whatsapp/';

  const ICONS = {
    overview:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" fill="currentColor"/></svg>',
    inbox:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12l2.5-7A2 2 0 017.4 4h9.2a2 2 0 011.9 1.4L21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h5l1.5 3h5L16 12h5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    contacts:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 4.5c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9M18.5 14.7c2 .6 3.5 2.4 3.5 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    audience:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    automations:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M10 6.5h4a3 3 0 013 3V14M6.5 10v4a3 3 0 003 3H14" stroke="currentColor" stroke-width="1.8"/></svg>',
    templates:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    flows:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="6" r="2.2" stroke="currentColor" stroke-width="1.8"/><circle cx="19" cy="12" r="2.2" stroke="currentColor" stroke-width="1.8"/><circle cx="5" cy="18" r="2.2" stroke="currentColor" stroke-width="1.8"/><path d="M7 7l10 4M7 17l10-4" stroke="currentColor" stroke-width="1.8"/></svg>',
    ai:         '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="7" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M12 7V3M9 3h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9.5" cy="12.5" r="1.1" fill="currentColor"/><circle cx="14.5" cy="12.5" r="1.1" fill="currentColor"/></svg>',
    catalog:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7l9-4 9 4-9 4-9-4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 7v10l9 4 9-4V7M12 11v10" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    products:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8V6a4 4 0 018 0v2" stroke="currentColor" stroke-width="1.8"/></svg>',
    orders:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 3h12l1 5H5l1-5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    campaigns:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11l17-7-5 17-4-7-8-3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    analytics:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    notif:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 20a2 2 0 004 0" stroke="currentColor" stroke-width="1.8"/></svg>',
    team:       '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="8" r="2.4" stroke="currentColor" stroke-width="1.8"/><path d="M21 20c0-2.3-1.7-4-4-4.6" stroke="currentColor" stroke-width="1.8"/></svg>',
    billing:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.8"/></svg>',
    settings:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 00-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    logs:       '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 3v4H5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 7a9 9 0 1 1-2.3 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 8v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    more:       '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>'
  };

  const MAIN_NAV = [
    { key: 'overview',    label: 'Overview',    href: 'overview.html',    icon: 'overview' },
    { key: 'inbox',       label: 'Inbox',        href: 'inbox.html',       icon: 'inbox' },
    { key: 'contacts',    label: 'Contacts',     href: 'contacts.html',    icon: 'contacts' },
    { key: 'audience',    label: 'Audience',     href: 'audience.html',    icon: 'audience' },
    { key: 'automations', label: 'Automations',  href: 'automations.html',icon: 'automations' },
    { key: 'templates',   label: 'Templates',    href: 'templates.html',  icon: 'templates' },
    { key: 'flows',       label: 'Flows',        href: 'flows.html',      icon: 'flows' },
    { key: 'ai',          label: 'AI Agent',     href: 'ai-agent.html',   icon: 'ai' },
    { key: 'catalog',     label: 'Catalog',      href: 'catalog.html',    icon: 'catalog' },
    { key: 'products',    label: 'Products',     href: 'products.html',  icon: 'products' },
    { key: 'orders',      label: 'Orders',       href: 'orders.html',    icon: 'orders' },
    { key: 'campaigns',   label: 'Campaigns',    href: 'campaigns.html', icon: 'campaigns' },
    { key: 'analytics',   label: 'Analytics',    href: 'analytics.html', icon: 'analytics' },
    { key: 'logs',        label: 'Automation Logs', href: 'logs.html',   icon: 'logs' }
  ];

  const BOTTOM_NAV = [
    { key: 'notifications', label: 'Notifications', href: 'notifications.html', icon: 'notif' },
    { key: 'team',          label: 'Team',          href: 'team.html',          icon: 'team' },
    { key: 'billing',       label: 'Billing & Usage', href: 'billing.html',     icon: 'billing' },
    { key: 'settings',      label: 'Settings',       href: 'settings.html',     icon: 'settings' }
  ];

  // The 5 items pinned to the mobile tab bar — highest-frequency actions first,
  // everything else (main + footer nav) lives behind "More".
  const TAB_KEYS = ['overview', 'inbox', 'automations', 'campaigns', 'analytics'];
  const ALL_ITEMS = [...MAIN_NAV, ...BOTTOM_NAV];
  const TAB_NAV  = TAB_KEYS.map(k => ALL_ITEMS.find(i => i.key === k)).filter(Boolean);
  const MORE_MAIN   = MAIN_NAV.filter(i => !TAB_KEYS.includes(i.key));
  const MORE_BOTTOM = BOTTOM_NAV.filter(i => !TAB_KEYS.includes(i.key));

  function link(item, active) {
    const badge = item.badge ? `<span class="wa-sb-badge">${item.badge}</span>` : `<span class="wa-sb-badge" style="display:none;"></span>`;
    return `<a class="wa-sb-link${active ? ' active' : ''}" data-nav-key="${item.key}" href="${BASE}${item.href}">${ICONS[item.icon] || ''}<span>${item.label}</span>${badge}</a>`;
  }

  function sheetLink(item, active) {
    const badge = item.badge ? `<span class="wa-sheet-badge">${item.badge}</span>` : `<span class="wa-sheet-badge" style="display:none;"></span>`;
    return `<a class="wa-sheet-link${active ? ' active' : ''}" data-nav-key="${item.key}" href="${BASE}${item.href}">
      <span class="wa-sheet-ico">${ICONS[item.icon] || ''}</span>
      <span>${item.label}</span>${badge}
    </a>`;
  }

  function tabLink(item, active) {
    const badge = item.badge ? `<span class="wa-tab-badge">${item.badge}</span>` : `<span class="wa-tab-badge" style="display:none;"></span>`;
    return `<a class="wa-tab-link${active ? ' active' : ''}" data-nav-key="${item.key}" href="${BASE}${item.href}">
      <span class="wa-tab-ico">${ICONS[item.icon] || ''}${badge}</span>
      <span class="wa-tab-label">${item.label}</span>
    </a>`;
  }

  function render(activeKey) {
    const mount = document.getElementById('waSidebarMount');
    if (!mount) return;
    const main = MAIN_NAV.map(i => link(i, i.key === activeKey)).join('');
    const bottom = BOTTOM_NAV.map(i => link(i, i.key === activeKey)).join('');

    // ----- Desktop / laptop sidebar (unchanged, shown ≥981px) -----
    const sidebarHtml = `
      <div class="wa-sidebar" id="waSidebar">
        <div class="wa-sb-brand">
          <div class="wa-sb-logo">W</div>
          <div class="wa-sb-brand-text">DM<span>Flow</span></div>
        </div>
        <div class="wa-sb-scroll">
          <div class="wa-sb-group-label">Workspace</div>
          ${main}
        </div>
        <div class="wa-sb-footer">
          ${bottom}
        </div>
      </div>`;

    // ----- Mobile bottom tab bar: 5 pinned tabs + "More" -----
    const tabsHtml = TAB_NAV.map(i => tabLink(i, i.key === activeKey)).join('');
    const isMoreActive = !TAB_KEYS.includes(activeKey);
    const moreTabHtml = `
      <button class="wa-tab-link wa-tab-more${isMoreActive ? ' active' : ''}" id="waMoreTabBtn" type="button">
        <span class="wa-tab-ico">${ICONS.more}</span>
        <span class="wa-tab-label">More</span>
      </button>`;

    const bottomBarHtml = `
      <nav class="wa-bottom-bar" id="waBottomBar">
        ${tabsHtml}
        ${moreTabHtml}
      </nav>`;

    // ----- "More" bottom sheet (mobile) -----
    const moreMainHtml   = MORE_MAIN.map(i => sheetLink(i, i.key === activeKey)).join('');
    const moreBottomHtml = MORE_BOTTOM.map(i => sheetLink(i, i.key === activeKey)).join('');
    const sheetHtml = `
      <div class="wa-sheet-overlay" id="waSheetOverlay"></div>
      <div class="wa-sheet" id="waMoreSheet" role="dialog" aria-modal="true" aria-label="More menu">
        <div class="wa-sheet-handle"></div>
        <div class="wa-sheet-head">
          <span>More</span>
          <button class="wa-sheet-close" id="waSheetCloseBtn" type="button" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="wa-sheet-scroll">
          <div class="wa-sheet-grid">${moreMainHtml}</div>
          <div class="wa-sheet-divider"></div>
          <div class="wa-sheet-grid">${moreBottomHtml}</div>
        </div>
      </div>`;

    mount.innerHTML = sidebarHtml + bottomBarHtml + sheetHtml;
    document.body.classList.add('wa-has-bottom-bar');
    bindSheetEvents();
    updateInboxBadge();
  }

  // ---- Real unread-count badge on Inbox (sidebar + tab bar + sheet) ----
  async function updateInboxBadge() {
    if (typeof API === 'undefined' || !API.getWhatsAppInbox) return;
    try {
      const res = await API.getWhatsAppInbox(1);
      const unread = (res.conversations || []).filter(c => c.unread).length || res.unreadCount || 0;
      const badgeHtml = unread > 0 ? String(unread) : '';
      document.querySelectorAll('[data-nav-key="inbox"] .wa-sb-badge, [data-nav-key="inbox"] .wa-tab-badge, [data-nav-key="inbox"] .wa-sheet-badge')
        .forEach(el => { el.textContent = badgeHtml; el.style.display = unread > 0 ? '' : 'none'; });
    } catch (e) { /* silent — badge just won't update */ }
  }

  function toggleMobile() {
    const sb = document.getElementById('waSidebar');
    if (sb) sb.classList.toggle('open');
  }

  // ---- More sheet open/close (with tap + swipe animation) ----
  function openSheet() {
    const overlay = document.getElementById('waSheetOverlay');
    const sheet   = document.getElementById('waMoreSheet');
    const btn     = document.getElementById('waMoreTabBtn');
    if (!overlay || !sheet) return;
    overlay.classList.add('open');
    sheet.classList.add('open');
    if (btn) btn.classList.add('pressed-open');
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    const overlay = document.getElementById('waSheetOverlay');
    const sheet   = document.getElementById('waMoreSheet');
    const btn     = document.getElementById('waMoreTabBtn');
    if (!overlay || !sheet) return;
    overlay.classList.remove('open');
    sheet.classList.remove('open');
    if (btn) btn.classList.remove('pressed-open');
    document.body.style.overflow = '';
  }

  function bindSheetEvents() {
    const moreBtn = document.getElementById('waMoreTabBtn');
    const overlay = document.getElementById('waSheetOverlay');
    const closeBtn = document.getElementById('waSheetCloseBtn');
    const sheet = document.getElementById('waMoreSheet');
    if (moreBtn) moreBtn.addEventListener('click', openSheet);
    if (overlay) overlay.addEventListener('click', closeSheet);
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);

    // Swipe-down-to-close on the handle/sheet
    if (sheet) {
      let startY = null;
      sheet.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
      sheet.addEventListener('touchmove', e => {
        if (startY == null) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
      }, { passive: true });
      sheet.addEventListener('touchend', e => {
        if (startY == null) return;
        const dy = (e.changedTouches[0].clientY - startY);
        sheet.style.transform = '';
        if (dy > 80) closeSheet();
        startY = null;
      });
    }

    // Ripple / bounce feedback on all tab links
    document.querySelectorAll('.wa-tab-link').forEach(el => {
      el.addEventListener('pointerdown', () => el.classList.add('tap'));
      el.addEventListener('pointerup', () => setTimeout(() => el.classList.remove('tap'), 160));
      el.addEventListener('pointerleave', () => el.classList.remove('tap'));
    });
  }

  window.WA_NAV = { render, toggleMobile, openSheet, closeSheet, updateInboxBadge };
})();
