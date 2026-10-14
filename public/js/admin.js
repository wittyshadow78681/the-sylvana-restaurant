/**
 * The Sylvana Restaurant - Admin Studio & In-Line Leaflet Editor
 * Direct in-line content editing and live mutation engine.
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'sylvana_admin_token';
  let isDirty = false;
  let cachedContent = null;

  // Initialize Admin Module
  document.addEventListener('DOMContentLoaded', () => {
    initAdminSession();
  });

  async function initAdminSession() {
    const isAdminPage = window.location.pathname.startsWith('/admin') ||
                        document.body.classList.contains('admin-mode');

    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      const isValid = await verifyToken(token);
      if (isValid) {
        enableInlineEditing();
      } else {
        localStorage.removeItem(TOKEN_KEY);
        if (isAdminPage) {
          showAuthModal();
        }
      }
    } else if (isAdminPage) {
      showAuthModal();
    }

    setupAdminDockEvents();
    setupAuthModalEvents();
  }

  async function verifyToken(token) {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.valid === true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function showAuthModal() {
    const modal = document.getElementById('authModalOverlay');
    if (modal) {
      modal.style.display = 'flex';
      const userField = document.getElementById('adminUserField');
      if (userField) userField.focus();
    }
  }

  function hideAuthModal() {
    const modal = document.getElementById('authModalOverlay');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function setupAuthModalEvents() {
    const btnLogin = document.getElementById('btnLoginSubmit');
    const form = document.getElementById('adminLoginForm');

    if (btnLogin) {
      btnLogin.addEventListener('click', handleLogin);
    }
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
      });
    }

    // Allow Enter key in inputs
    const inputs = document.querySelectorAll('.modal-input');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleLogin();
        }
      });
    });
  }

  async function handleLogin() {
    const userField = document.getElementById('adminUserField');
    const passField = document.getElementById('adminPassField');
    const errDiv = document.getElementById('loginErrorMsg');

    const username = userField ? userField.value.trim() : '';
    const password = passField ? passField.value.trim() : '';

    if (!username || !password) {
      showLoginError('Please enter both username and password');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        hideAuthModal();
        enableInlineEditing();
        showToast('🔓 Admin Studio unlocked! In-line editing active.');
      } else {
        showLoginError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      showLoginError('Connection failure: ' + err.message);
    }
  }

  function showLoginError(msg) {
    const errDiv = document.getElementById('loginErrorMsg');
    if (errDiv) {
      errDiv.innerText = msg;
      errDiv.style.display = 'block';
    }
  }

  function enableInlineEditing() {
    document.body.classList.add('admin-mode');

    const dock = document.getElementById('adminDock');
    if (dock) dock.style.display = 'flex';

    // Editable elements
    const editableSelectors = [
      '#brandName',
      '#brandNameBn',
      '#brandTagline',
      '#introStory',
      '#contactAddress',
      '#contactPhone',
      '#contactEmail',
      '#contactHours',
      '.dish-name',
      '.dish-price-val',
      '.dish-desc'
    ];

    editableSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');

        el.addEventListener('input', () => {
          markDirty();
        });
      });
    });
  }

  function markDirty() {
    isDirty = true;
    const saveBtn = document.getElementById('btnSaveLeaflet');
    if (saveBtn) {
      saveBtn.classList.add('dirty');
      saveBtn.innerHTML = '<span class="btn-icon">💾</span> <span class="btn-label">Save Changes *</span>';
    }
  }

  function markClean() {
    isDirty = false;
    const saveBtn = document.getElementById('btnSaveLeaflet');
    if (saveBtn) {
      saveBtn.classList.remove('dirty');
      saveBtn.innerHTML = '<span class="btn-icon">💾</span> <span class="btn-label">Save Changes</span>';
    }
  }

  function setupAdminDockEvents() {
    const btnSave = document.getElementById('btnSaveLeaflet');
    const btnDiscard = document.getElementById('btnDiscardLeaflet');
    const btnReset = document.getElementById('btnResetDefaults');
    const btnLogout = document.getElementById('btnLogoutLeaflet');

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        saveAllChanges();
      });
    }

    if (btnDiscard) {
      btnDiscard.addEventListener('click', () => {
        if (confirm('Discard any unsaved changes and reload original content?')) {
          window.location.reload();
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', async () => {
        if (confirm('Are you sure you want to restore factory default menu and content?')) {
          await resetFactoryDefaults();
        }
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch {}
          localStorage.removeItem(TOKEN_KEY);
        }
        window.location.href = '/';
      });
    }
  }

  /**
   * Reads all in-line modified DOM values, constructs updated JSON payload,
   * and persists via PUT /api/content.
   */
  async function saveAllChanges() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      showAuthModal();
      return;
    }

    const saveBtn = document.getElementById('btnSaveLeaflet');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="btn-icon">⏳</span> <span class="btn-label">Saving...</span>';
    }

    try {
      // 1. Fetch current content base structure
      let base = cachedContent;
      if (!base) {
        const curRes = await fetch('/api/content');
        if (curRes.ok) {
          base = await curRes.json();
        } else {
          base = {};
        }
      }

      if (!base.meta) base.meta = {};
      if (!base.about) base.about = {};
      if (!base.contact) base.contact = {};
      if (!base.menu) base.menu = {};
      if (!Array.isArray(base.menu.items)) base.menu.items = [];

      // 2. Scrape Header fields
      const brandNameEl = document.getElementById('brandName');
      const brandNameBnEl = document.getElementById('brandNameBn');
      const brandTaglineEl = document.getElementById('brandTagline');
      const introStoryEl = document.getElementById('introStory');

      if (brandNameEl) {
        base.meta.brandName = brandNameEl.innerText.trim();
        if (base.hero) base.hero.headlineHighlight = base.meta.brandName;
      }
      if (brandNameBnEl) {
        base.meta.brandNameBn = brandNameBnEl.innerText.trim();
        if (base.about) base.about.bengaliTitle = base.meta.brandNameBn;
      }
      if (brandTaglineEl) {
        base.meta.siteTagline = brandTaglineEl.innerText.trim();
        if (base.hero) base.hero.subtitle = base.meta.siteTagline;
      }
      if (introStoryEl) {
        base.about.story1 = introStoryEl.innerText.trim();
      }

      // 3. Scrape Contact fields
      const addrEl = document.getElementById('contactAddress');
      const phoneEl = document.getElementById('contactPhone');
      const emailEl = document.getElementById('contactEmail');
      const hoursEl = document.getElementById('contactHours');

      if (addrEl) base.contact.address = addrEl.innerText.trim();
      if (phoneEl) {
        const rawPhone = phoneEl.innerText.trim();
        base.contact.phone = rawPhone;
      }
      if (emailEl) {
        const rawEmail = emailEl.innerText.trim();
        base.contact.email = rawEmail;
      }
      if (hoursEl) base.contact.hours = hoursEl.innerText.trim();

      // 4. Scrape Menu Item changes
      const itemMap = new Map();
      base.menu.items.forEach(it => {
        if (it && it.id) itemMap.set(it.id, it);
      });

      document.querySelectorAll('.dish-item[data-item-id]').forEach(node => {
        const id = node.getAttribute('data-item-id');
        let it = itemMap.get(id);
        if (!it) {
          it = { id: id };
          base.menu.items.push(it);
          itemMap.set(id, it);
        }

        const nameEl = node.querySelector('.dish-name');
        const priceEl = node.querySelector('.dish-price-val');
        const descEl = node.querySelector('.dish-desc');

        if (nameEl) it.name = nameEl.innerText.trim();
        if (priceEl) {
          const rawPrice = priceEl.innerText.trim().replace(/[^\d.]/g, '');
          const parsed = parseFloat(rawPrice);
          it.price = isNaN(parsed) ? 0 : parsed;
        }
        if (descEl) it.description = descEl.innerText.trim();
      });

      // 5. Send PUT /api/content
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
          'If-Match': '*'
        },
        body: JSON.stringify(base)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        cachedContent = base;
        markClean();
        showToast('✅ Menu Leaflet saved successfully! Changes are live.');
      } else {
        showToast('❌ Save failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      showToast('❌ Connection error: ' + err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (!isDirty) {
          saveBtn.innerHTML = '<span class="btn-icon">💾</span> <span class="btn-label">Save Changes</span>';
        }
      }
    }
  }

  async function resetFactoryDefaults() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      const res = await fetch('/api/content/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🔄 Factory defaults restored. Reloading...');
        setTimeout(() => window.location.reload(), 800);
      } else {
        showToast('❌ Reset failed: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      showToast('❌ Reset error: ' + err.message);
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('adminToast');
    if (toast) {
      toast.innerText = msg;
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 4000);
    } else {
      alert(msg);
    }
  }

  // Expose global methods
  window.saveAllChanges = saveAllChanges;
  window.enableInlineEditing = enableInlineEditing;
  window.initAdminSession = initAdminSession;
})();
