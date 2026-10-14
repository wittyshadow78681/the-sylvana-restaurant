/**
 * The Sylvana Restaurant - Minimal, Modern, Light & Responsive Web Script
 * Features 4 Authentic Menu Pages with Interactive Fullscreen Lightbox
 */

(function () {
  let contentData = null;
  let adminToken = sessionStorage.getItem('sylvana_admin_token') || '';
  let isEditMode = false;
  let currentLightboxIndex = 0;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await fetchContent();
    setupLightboxEvents();
    checkAdminRoute();
    setupAdminModal();
  }

  // 1. Fetch content
  async function fetchContent() {
    // Check localStorage cache first for client-side persistence
    try {
      const cached = localStorage.getItem('sylvana_content_data');
      if (cached) {
        contentData = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('localStorage parse error:', e);
    }

    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        contentData = await res.json();
        localStorage.setItem('sylvana_content_data', JSON.stringify(contentData));
      } else if (!contentData) {
        throw new Error('API returned ' + res.status);
      }
    } catch (e) {
      if (!contentData) {
        console.warn('Falling back to static data/content.json:', e);
        try {
          const fallback = await fetch('data/content.json');
          contentData = await fallback.json();
          localStorage.setItem('sylvana_content_data', JSON.stringify(contentData));
        } catch (err) {
          console.error('Failed to load menu data:', err);
        }
      }
    }

    if (contentData) {
      renderAll();
    }
  }

  // 2. Render all 3 sections
  function renderAll() {
    renderHero();
    renderMenuPages();
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
      heroDesc.textContent = hero.subtitle || 'Discover the vibrant taste of Dhaka with our authentic Mutton Kacchi Biryani, traditional morning breakfast, clay-oven naans, burgers, and refreshing beverages crafted fresh every day at Shahbagh, Dhaka.';
    }

    const heroCallBtn = document.getElementById('heroCallBtn');
    if (heroCallBtn && contact.phone) {
      heroCallBtn.href = 'tel:' + contact.phone;
      heroCallBtn.textContent = '📞 Call: ' + contact.phone;
    }
  }

  // 3. Render 4 Authentic Menu Pages
  function renderMenuPages() {
    const grid = document.getElementById('menuCardsGrid');
    if (!grid || !contentData.menu || !contentData.menu.pages) return;

    grid.innerHTML = contentData.menu.pages.map((page, idx) => `
      <article class="menu-page-card" data-page-index="${idx}" tabindex="0" role="button" aria-label="Open ${escapeHtml(page.title)}">
        <div class="menu-page-thumb-wrap">
          <img src="${escapeHtml(page.image)}" alt="${escapeHtml(page.title)}" class="menu-page-thumb" loading="lazy" onerror="this.onerror=null;this.src='assets/sylvana-logo.png'">
          <span class="menu-page-badge">${escapeHtml(page.badge || `Page ${page.pageNumber}`)}</span>
          <div class="menu-page-overlay">
            <span class="menu-page-zoom-pill">🔍 Click to View Full Menu</span>
          </div>
        </div>
        <div class="menu-page-card-body">
          <h3 class="menu-page-card-title" data-page-field="title">${escapeHtml(page.title)}</h3>
          <div class="menu-page-card-bn" data-page-field="titleBn">${escapeHtml(page.titleBn || '')}</div>
          <p class="menu-page-card-summary" data-page-field="summary">${escapeHtml(page.summary || '')}</p>
          <div class="menu-page-card-btn">
            <span>📖 View High-Res Page ${page.pageNumber}</span>
          </div>
        </div>
      </article>
    `).join('');

    // Attach click and enter key handlers
    grid.querySelectorAll('.menu-page-card').forEach(card => {
      const open = () => {
        const idx = parseInt(card.getAttribute('data-page-index'), 10);
        openLightbox(idx);
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    renderLightboxThumbnails();

    if (isEditMode) {
      grid.querySelectorAll('[data-page-field]').forEach(f => f.setAttribute('contenteditable', 'true'));
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

  // 4. Interactive Fullscreen Menu Lightbox
  function setupLightboxEvents() {
    const lightbox = document.getElementById('menuLightbox');
    const overlay = document.getElementById('lightboxOverlay');
    const closeBtn = document.getElementById('lightboxCloseBtn');
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');

    if (overlay) overlay.addEventListener('click', closeLightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
      });
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!lightbox || !lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(index) {
    if (!contentData || !contentData.menu || !contentData.menu.pages) return;
    const pages = contentData.menu.pages;
    if (index < 0 || index >= pages.length) return;

    currentLightboxIndex = index;
    const page = pages[index];

    const lightbox = document.getElementById('menuLightbox');
    const counter = document.getElementById('lightboxCounter');
    const title = document.getElementById('lightboxTitle');
    const mainImg = document.getElementById('lightboxMainImg');
    const directLink = document.getElementById('lightboxDirectLink');

    if (counter) counter.textContent = `Page ${page.pageNumber} of ${pages.length}`;
    if (title) title.textContent = page.title;
    if (mainImg) {
      mainImg.src = page.image;
      mainImg.alt = page.title;
    }
    if (directLink) directLink.href = page.image;

    updateActiveThumbnail(index);

    if (lightbox) {
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLightbox() {
    const lightbox = document.getElementById('menuLightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function navigateLightbox(direction) {
    if (!contentData || !contentData.menu || !contentData.menu.pages) return;
    const pages = contentData.menu.pages;
    let newIndex = currentLightboxIndex + direction;
    if (newIndex < 0) newIndex = pages.length - 1;
    if (newIndex >= pages.length) newIndex = 0;
    openLightbox(newIndex);
  }

  function renderLightboxThumbnails() {
    const thumbsBar = document.getElementById('lightboxThumbsBar');
    if (!thumbsBar || !contentData || !contentData.menu || !contentData.menu.pages) return;

    thumbsBar.innerHTML = contentData.menu.pages.map((page, idx) => `
      <button type="button" class="lightbox-thumb-btn ${idx === currentLightboxIndex ? 'active' : ''}" data-thumb-index="${idx}" title="Jump to Page ${page.pageNumber}">
        <img src="${escapeHtml(page.image)}" alt="Page ${page.pageNumber}">
      </button>
    `).join('');

    thumbsBar.querySelectorAll('.lightbox-thumb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-thumb-index'), 10);
        openLightbox(idx);
      });
    });
  }

  function updateActiveThumbnail(index) {
    const thumbsBar = document.getElementById('lightboxThumbsBar');
    if (!thumbsBar) return;
    thumbsBar.querySelectorAll('.lightbox-thumb-btn').forEach(btn => {
      const idx = parseInt(btn.getAttribute('data-thumb-index'), 10);
      if (idx === index) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // 5. Admin Authentication & In-Line Edit Activation
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
    ['heroBrandEn', 'heroBrandBn', 'heroLocationText', 'heroDesc', 'contactAddress', 'contactHours', 'menuSectionTitle', 'menuSectionSub'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('contenteditable', 'true');
    });

    document.querySelectorAll('[data-page-field]').forEach(f => {
      f.setAttribute('contenteditable', 'true');
    });

    showToast('✏️ In-Line Edit Mode: Click on any headline or menu page summary to edit.');
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

    // Collect menu section titles
    const menuTitle = document.getElementById('menuSectionTitle');
    if (menuTitle && contentData.menu) contentData.menu.title = menuTitle.textContent.trim();

    const menuSub = document.getElementById('menuSectionSub');
    if (menuSub && contentData.menu) contentData.menu.subtitle = menuSub.textContent.trim();

    // Collect page values
    document.querySelectorAll('.menu-page-card').forEach(card => {
      const idx = parseInt(card.getAttribute('data-page-index'), 10);
      if (contentData.menu && contentData.menu.pages && contentData.menu.pages[idx]) {
        const page = contentData.menu.pages[idx];
        const titleEl = card.querySelector('[data-page-field="title"]');
        if (titleEl) page.title = titleEl.textContent.trim();

        const titleBnEl = card.querySelector('[data-page-field="titleBn"]');
        if (titleBnEl) page.titleBn = titleBnEl.textContent.trim();

        const sumEl = card.querySelector('[data-page-field="summary"]');
        if (sumEl) page.summary = sumEl.textContent.trim();
      }
    });

    // Collect contact values
    const contactAddress = document.getElementById('contactAddress');
    if (contactAddress) contentData.contact.address = contactAddress.textContent.trim();

    const contactHours = document.getElementById('contactHours');
    if (contactHours) contentData.contact.hours = contactHours.textContent.trim();

    // Always cache in localStorage for instant persistence across page refreshes
    try {
      localStorage.setItem('sylvana_content_data', JSON.stringify(contentData));
    } catch (err) {
      console.warn('localStorage save error:', err);
    }

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
        showToast('💾 Saved successfully! Content updated on server & local.');
      } else {
        const err = await res.json();
        showToast('💾 Saved locally! (Server notice: ' + (err.error || res.statusText) + ')');
      }
    } catch (e) {
      console.log('Static hosting mode - saved locally:', e);
      showToast('💾 Saved successfully to local storage!');
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
