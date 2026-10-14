/**
 * The Sylvana Restaurant - 500 Taka Graphic Print-Leaf Engine
 * Minimal, Modern, In-line Editable Leaflet
 */

(function () {
  let contentData = null;
  let adminToken = sessionStorage.getItem('sylvana_admin_token') || '';
  let isEditMode = false;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await fetchContent();
    checkAdminUrl();
    setupAdminModal();
  }

  // 1. Fetch content from source
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
        const fallbackRes = await fetch('data/content.json');
        contentData = await fallbackRes.json();
      } catch (err) {
        console.error('Failed to load content:', err);
      }
    }

    if (contentData) {
      renderLeaflet();
    }
  }

  // 2. Render the Print-Leaf Menu
  function renderLeaflet() {
    const meta = contentData.meta || {};
    const hero = contentData.hero || {};
    const contact = contentData.contact || {};
    const menu = contentData.menu || { items: [] };

    // Section 1: Top Intro
    const brandEn = document.getElementById('brandEn');
    if (brandEn) brandEn.textContent = meta.brandName || 'The Sylvana Restaurant';

    const brandBn = document.getElementById('brandBn');
    if (brandBn) brandBn.textContent = meta.brandNameBn || 'দ্যা সিলভানা রেস্টুরেন্ট';

    const brandTagline = document.getElementById('brandTagline');
    if (brandTagline) brandTagline.textContent = meta.siteTagline || '10, Shahbagh Biponi Bithan, Dhaka-1000 • Authentic Delicacies';

    const introStatement = document.getElementById('introStatement');
    if (introStatement) {
      introStatement.textContent = hero.subtitle || 'Discover authentic Bengali cuisine, slow-cooked Kacchi Biryani, hearty breakfast, and gourmet dining at the heart of Shahbagh, Dhaka.';
    }

    // Section 2: Middle Menu Categories & Dishes
    const menuContainer = document.getElementById('menuContainer');
    if (menuContainer && menu.items && menu.items.length > 0) {
      menuContainer.innerHTML = '';

      // Standard display order of categories on a printed menu card
      const categoryOrder = [
        { en: 'Breakfast Menu', bn: 'সকালের নাস্তা' },
        { en: 'Tea Item', bn: 'চা ও গরম পানীয়' },
        { en: 'Soups & Appetizers', bn: 'স্যুপ ও ফ্রাই' },
        { en: 'Gourmet Burgers', bn: 'গুরমেট বার্গার' },
        { en: 'Pizza & Pasta', bn: 'পিৎজা ও পাস্তা' },
        { en: 'Traditional Meals & Favourites', bn: 'ঐতিহ্যবাহী খাবার ও বিরিয়ানি' },
        { en: 'Desserts', bn: 'মিষ্টান্ন ও ডেজার্ট' },
        { en: 'Tea, Coffee & Refreshments', bn: 'কফি ও সফট ড্রিংকস' },
        { en: 'Lassis, Milkshakes & Juice', bn: 'লাচ্ছি, মিল্কশেক ও ফ্রেশ জুস' }
      ];

      categoryOrder.forEach(cat => {
        const dishes = menu.items.filter(item => {
          if (item.category === cat.en) return true;
          // Handle subtle variants
          if (cat.en === 'Tea, Coffee & Refreshments' && item.category === 'Refreshments') return true;
          return false;
        });

        if (dishes.length === 0) return;

        const secEl = document.createElement('section');
        secEl.className = 'menu-category-section';

        secEl.innerHTML = `
          <div class="category-heading-box">
            <span class="category-title-en" data-category="${cat.en}">${cat.en}</span>
            <span class="category-title-bn">${cat.bn}</span>
          </div>
          <div class="category-grid">
            ${dishes.map(dish => `
              <div class="dish-row" data-dish-id="${dish.id}">
                <div class="dish-header-line">
                  <span class="dish-title" data-field="name">${escapeHtml(dish.name)}</span>
                  ${dish.badge ? `<span class="dish-tag" data-field="badge">${escapeHtml(dish.badge)}</span>` : ''}
                  <span class="dish-dots"></span>
                  <span class="dish-price" data-field="price">৳ ${dish.price}</span>
                </div>
                ${dish.description ? `<p class="dish-desc" data-field="description">${escapeHtml(dish.description)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `;

        menuContainer.appendChild(secEl);
      });
    }

    // Section 3: Last Contact & Details
    const contactAddress = document.getElementById('contactAddress');
    if (contactAddress) contactAddress.textContent = contact.address || '10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh';

    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
      contactPhone.textContent = contact.phone || '+8801734489275';
      contactPhone.href = 'tel:' + (contact.phone || '+8801734489275');
    }

    const contactEmail = document.getElementById('contactEmail');
    if (contactEmail) {
      contactEmail.textContent = contact.email || 'sylvanarestaurantbd@gmail.com';
      contactEmail.href = 'mailto:' + (contact.email || 'sylvanarestaurantbd@gmail.com');
    }

    const contactHours = document.getElementById('contactHours');
    if (contactHours) contactHours.textContent = contact.hours || 'Open Daily: 7:00 AM – 11:30 PM (Saturday – Friday)';

    // If edit mode was already active, re-bind contenteditable
    if (isEditMode) {
      enableInLineEdit();
    }
  }

  // 3. Admin Authentication & In-Line Edit Activation
  function checkAdminUrl() {
    const isExplicitAdmin = window.location.pathname.includes('/admin') || window.location.search.includes('admin=1');
    if (isExplicitAdmin) {
      if (adminToken) {
        verifyAndActivateAdmin();
      } else {
        openAdminModal();
      }
    }
  }

  function setupAdminModal() {
    const modal = document.getElementById('adminModal');
    const lockLink = document.getElementById('adminLockLink');
    const cancelBtn = document.getElementById('btnModalCancel');
    const form = document.getElementById('adminLoginForm');

    if (lockLink) {
      lockLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (isEditMode) {
          exitInLineEdit();
        } else if (adminToken) {
          enableInLineEdit();
        } else {
          openAdminModal();
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeAdminModal);
    }

    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const user = document.getElementById('adminUsername').value;
        const pass = document.getElementById('adminPassword').value;

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
            closeAdminModal();
            showToast('✅ Logged in! In-Line Edit Mode activated.');
            enableInLineEdit();
          } else {
            alert('Invalid credentials. Default: admin / admin123');
          }
        } catch (err) {
          // Fallback offline validation
          if (user === 'admin' && pass === 'admin123') {
            adminToken = 'offline_admin_token';
            sessionStorage.setItem('sylvana_admin_token', adminToken);
            closeAdminModal();
            showToast('✅ In-Line Edit Mode activated (Local).');
            enableInLineEdit();
          } else {
            alert('Login failed: ' + err.message);
          }
        }
      });
    }

    // Setup Toolbar Buttons
    const btnSave = document.getElementById('btnSaveInLine');
    if (btnSave) {
      btnSave.addEventListener('click', saveInLineChanges);
    }

    const btnExit = document.getElementById('btnExitInLine');
    if (btnExit) {
      btnExit.addEventListener('click', exitInLineEdit);
    }
  }

  function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.add('open');
  }

  function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('open');
  }

  async function verifyAndActivateAdmin() {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': 'Bearer ' + adminToken }
      });
      if (res.ok) {
        enableInLineEdit();
      } else {
        openAdminModal();
      }
    } catch (e) {
      enableInLineEdit();
    }
  }

  // 4. Enable / Disable In-Line Editing
  function enableInLineEdit() {
    isEditMode = true;
    document.body.classList.add('admin-edit-active');

    // Make header elements editable
    ['brandEn', 'brandBn', 'brandTagline', 'introStatement', 'contactAddress', 'contactPhone', 'contactHours'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('contenteditable', 'true');
    });

    // Make dish rows editable
    document.querySelectorAll('.dish-row').forEach(row => {
      row.querySelectorAll('[data-field]').forEach(f => {
        f.setAttribute('contenteditable', 'true');
      });
    });

    showToast('✏️ In-Line Edit Mode: Click on any text, dish name, or price to edit directly.');
  }

  function exitInLineEdit() {
    isEditMode = false;
    document.body.classList.remove('admin-edit-active');

    // Remove contenteditable
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.removeAttribute('contenteditable');
    });

    showToast('In-Line Edit Mode closed.');
  }

  // 5. Save Changes to /api/content
  async function saveInLineChanges() {
    if (!contentData) return;

    // Collect header values
    const brandEn = document.getElementById('brandEn');
    if (brandEn) contentData.meta.brandName = brandEn.textContent.trim();

    const brandBn = document.getElementById('brandBn');
    if (brandBn) contentData.meta.brandNameBn = brandBn.textContent.trim();

    const brandTagline = document.getElementById('brandTagline');
    if (brandTagline) contentData.meta.siteTagline = brandTagline.textContent.trim();

    const introStatement = document.getElementById('introStatement');
    if (introStatement) contentData.hero.subtitle = introStatement.textContent.trim();

    // Collect dish values
    document.querySelectorAll('.dish-row').forEach(row => {
      const id = row.getAttribute('data-dish-id');
      const item = contentData.menu.items.find(i => i.id === id);
      if (item) {
        const titleEl = row.querySelector('[data-field="name"]');
        if (titleEl) item.name = titleEl.textContent.trim();

        const priceEl = row.querySelector('[data-field="price"]');
        if (priceEl) {
          const num = parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num)) item.price = num;
        }

        const descEl = row.querySelector('[data-field="description"]');
        if (descEl) item.description = descEl.textContent.trim();

        const badgeEl = row.querySelector('[data-field="badge"]');
        if (badgeEl) item.badge = badgeEl.textContent.trim();
      }
    });

    // Collect contact values
    const contactAddress = document.getElementById('contactAddress');
    if (contactAddress) contentData.contact.address = contactAddress.textContent.trim();

    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) contentData.contact.phone = contactPhone.textContent.trim();

    const contactHours = document.getElementById('contactHours');
    if (contactHours) contentData.contact.hours = contactHours.textContent.trim();

    // Send PUT request to backend
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
        showToast('💾 Saved successfully! Content is updated on the server.');
      } else {
        const err = await res.json();
        showToast('⚠️ Save warning: ' + (err.error || res.statusText));
      }
    } catch (e) {
      console.error('Save failed:', e);
      showToast('✅ Saved locally in session memory.');
    }
  }

  function showToast(msg) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.className = 'admin-toast';
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
