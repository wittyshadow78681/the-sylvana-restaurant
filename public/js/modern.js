/**
 * The Sylvana Restaurant - Minimal, Modern, Light & Responsive Web Script
 */

(function () {
  let contentData = null;
  let adminToken = sessionStorage.getItem('sylvana_admin_token') || '';
  let isEditMode = false;
  let activeCategory = 'All';

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await fetchContent();
    checkAdminRoute();
    setupAdminModal();
  }

  // 1. Fetch content
  async function fetchContent() {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        contentData = await res.json();
      } else {
        throw new Error('API returned ' + res.status);
      }
    } catch (e) {
      console.warn('Falling back to static data/content.json:', e);
      try {
        const fallback = await fetch('data/content.json');
        contentData = await fallback.json();
      } catch (err) {
        console.error('Failed to load menu data:', err);
      }
    }

    if (contentData) {
      renderAll();
    }
  }

  // 2. Render all 3 sections
  function renderAll() {
    renderHero();
    renderCategories();
    renderDishes();
    renderContact();

    if (isEditMode) {
      enableInLineEdit();
    }
  }

  function renderHero() {
    const meta = contentData.meta || {};
    const hero = contentData.hero || {};
    const contact = contentData.contact || {};

    const brandEn = document.getElementById('heroBrandEn');
    if (brandEn) brandEn.textContent = meta.brandName || 'The Sylvana Restaurant';

    const brandBn = document.getElementById('heroBrandBn');
    if (brandBn) brandBn.textContent = meta.brandNameBn || 'দ্যা সিলভানা রেস্টুরেন্ট';

    const locationText = document.getElementById('heroLocationText');
    if (locationText) locationText.textContent = contact.address || '10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh';

    const heroDesc = document.getElementById('heroDesc');
    if (heroDesc) {
      heroDesc.textContent = hero.subtitle || 'Authentic Bengali culinary traditions, fragrant Mutton Kacchi Biryani, hearty breakfast, and gourmet Continental dining crafted with passion in Shahbagh.';
    }

    const heroCallBtn = document.getElementById('heroCallBtn');
    if (heroCallBtn && contact.phone) {
      heroCallBtn.href = 'tel:' + contact.phone;
      heroCallBtn.textContent = '📞 Call: ' + contact.phone;
    }
  }

  function renderCategories() {
    const filterWrap = document.getElementById('categoryFilterWrap');
    if (!filterWrap || !contentData.menu || !contentData.menu.items) return;

    // Distinct categories
    const categories = ['All'];
    contentData.menu.items.forEach(dish => {
      if (dish.category && !categories.includes(dish.category)) {
        categories.push(dish.category);
      }
    });

    filterWrap.innerHTML = categories.map(cat => `
      <button class="filter-pill ${cat === activeCategory ? 'active' : ''}" type="button" data-cat="${escapeHtml(cat)}">
        ${escapeHtml(cat)}
      </button>
    `).join('');

    filterWrap.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        filterWrap.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderDishes();
      });
    });
  }

  function renderDishes() {
    const grid = document.getElementById('menuCardsGrid');
    if (!grid || !contentData.menu || !contentData.menu.items) return;

    const filtered = activeCategory === 'All'
      ? contentData.menu.items
      : contentData.menu.items.filter(d => d.category === activeCategory);

    grid.innerHTML = filtered.map(dish => `
      <article class="menu-card" data-dish-id="${dish.id}">
        <div class="menu-card-top">
          <h3 class="dish-name" data-field="name">${escapeHtml(dish.name)}</h3>
          <span class="dish-price-badge" data-field="price">৳ ${dish.price}</span>
        </div>
        <p class="dish-description" data-field="description">${escapeHtml(dish.description || 'Prepared fresh with traditional ingredients.')}</p>
        <div class="menu-card-bottom">
          <span class="dish-category-tag">${escapeHtml(dish.category || 'Menu Item')}</span>
          ${dish.badge ? `<span class="dish-special-pill" data-field="badge">${escapeHtml(dish.badge)}</span>` : ''}
        </div>
      </article>
    `).join('');

    if (isEditMode) {
      grid.querySelectorAll('[data-field]').forEach(f => f.setAttribute('contenteditable', 'true'));
    }
  }

  function renderContact() {
    const contact = contentData.contact || {};

    const address = document.getElementById('contactAddress');
    if (address) address.textContent = contact.address || '10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh';

    const phone = document.getElementById('contactPhone');
    if (phone) {
      phone.textContent = contact.phone || '+8801734489275';
      phone.href = 'tel:' + (contact.phone || '+8801734489275');
    }

    const email = document.getElementById('contactEmail');
    if (email) {
      email.textContent = contact.email || 'sylvanarestaurantbd@gmail.com';
      email.href = 'mailto:' + (contact.email || 'sylvanarestaurantbd@gmail.com');
    }

    const hours = document.getElementById('contactHours');
    if (hours) hours.textContent = contact.hours || 'Monday – Sunday: 7:00 AM – 11:30 PM (Daily)';
  }

  // 3. Admin Authentication & In-Line Edit Activation
  function checkAdminRoute() {
    const isAdmin = window.location.pathname.includes('/admin') || window.location.search.includes('admin=1');
    if (isAdmin) {
      if (adminToken) {
        verifyAdminSession();
      } else {
        openModal();
      }
    }
  }

  function setupAdminModal() {
    const modal = document.getElementById('adminLoginModal');
    const lockBtn = document.getElementById('adminLockBtn');
    const cancelBtn = document.getElementById('btnModalCancel');
    const form = document.getElementById('adminLoginForm');

    if (lockBtn) {
      lockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isEditMode) {
          disableInLineEdit();
        } else if (adminToken) {
          enableInLineEdit();
        } else {
          openModal();
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value;
        const pass = document.getElementById('adminPass').value;

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
          });

          const data = await res.json();
          if (res.ok && data.token) {
            adminToken = data.token;
            sessionStorage.setItem('sylvana_admin_token', adminToken);
            closeModal();
            showToast('✅ Logged in! In-Line Edit Mode is now active.');
            enableInLineEdit();
          } else {
            alert('Invalid credentials. Default: admin / admin123');
          }
        } catch (err) {
          if (user === 'admin' && pass === 'admin123') {
            adminToken = 'offline_token';
            sessionStorage.setItem('sylvana_admin_token', adminToken);
            closeModal();
            showToast('✅ In-Line Edit Mode active (Local).');
            enableInLineEdit();
          } else {
            alert('Login error: ' + err.message);
          }
        }
      });
    }

    // Floating Toolbar handlers
    const saveBtn = document.getElementById('btnSaveInLine');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveChanges);
    }

    const exitBtn = document.getElementById('btnExitInLine');
    if (exitBtn) {
      exitBtn.addEventListener('click', disableInLineEdit);
    }
  }

  function openModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.add('open');
  }

  function closeModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.remove('open');
  }

  async function verifyAdminSession() {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': 'Bearer ' + adminToken }
      });
      if (res.ok) {
        enableInLineEdit();
      } else {
        openModal();
      }
    } catch (e) {
      enableInLineEdit();
    }
  }

  function enableInLineEdit() {
    isEditMode = true;
    document.body.classList.add('admin-edit-active');

    // Make text headers and elements editable
    ['heroBrandEn', 'heroBrandBn', 'heroLocationText', 'heroDesc', 'contactAddress', 'contactHours'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('contenteditable', 'true');
    });

    document.querySelectorAll('[data-field]').forEach(f => {
      f.setAttribute('contenteditable', 'true');
    });

    showToast('✏️ In-Line Edit Mode: Click on any headline, dish, or price to edit.');
  }

  function disableInLineEdit() {
    isEditMode = false;
    document.body.classList.remove('admin-edit-active');

    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.removeAttribute('contenteditable');
    });

    showToast('In-Line Edit Mode closed.');
  }

  async function saveChanges() {
    if (!contentData) return;

    // Collect hero values
    const brandEn = document.getElementById('heroBrandEn');
    if (brandEn) contentData.meta.brandName = brandEn.textContent.trim();

    const brandBn = document.getElementById('heroBrandBn');
    if (brandBn) contentData.meta.brandNameBn = brandBn.textContent.trim();

    const locationText = document.getElementById('heroLocationText');
    if (locationText) contentData.contact.address = locationText.textContent.trim();

    const heroDesc = document.getElementById('heroDesc');
    if (heroDesc) contentData.hero.subtitle = heroDesc.textContent.trim();

    // Collect dish values
    document.querySelectorAll('.menu-card').forEach(card => {
      const id = card.getAttribute('data-dish-id');
      const item = contentData.menu.items.find(i => i.id === id);
      if (item) {
        const nameEl = card.querySelector('[data-field="name"]');
        if (nameEl) item.name = nameEl.textContent.trim();

        const priceEl = card.querySelector('[data-field="price"]');
        if (priceEl) {
          const num = parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) item.price = num;
        }

        const descEl = card.querySelector('[data-field="description"]');
        if (descEl) item.description = descEl.textContent.trim();

        const badgeEl = card.querySelector('[data-field="badge"]');
        if (badgeEl) item.badge = badgeEl.textContent.trim();
      }
    });

    // Collect contact values
    const contactAddress = document.getElementById('contactAddress');
    if (contactAddress) contentData.contact.address = contactAddress.textContent.trim();

    const contactHours = document.getElementById('contactHours');
    if (contactHours) contentData.contact.hours = contactHours.textContent.trim();

    // PUT to server
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + adminToken,
          'If-Match': '*'
        },
        body: JSON.stringify(contentData)
      });

      if (res.ok) {
        showToast('💾 Saved successfully! Content updated on server.');
      } else {
        const err = await res.json();
        showToast('⚠️ Notice: ' + (err.error || res.statusText));
      }
    } catch (e) {
      console.error('Save failed:', e);
      showToast('✅ Saved locally in memory.');
    }
  }

  function showToast(msg) {
    let toast = document.getElementById('siteToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'siteToast';
      toast.className = 'site-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
