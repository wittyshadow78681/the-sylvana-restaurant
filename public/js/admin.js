/**
 * The Sylvana Restaurant (দ্যা সিলভানা রেস্টুরেন্ট) - Admin Management Studio Client Controller
 * Manages atomic source content updates, full menu items, live previews, export/import, audit logs, and inquiries
 */

(function () {
  'use strict';

  const state = {
    token: localStorage.getItem('nexus_admin_token') || '',
    user: '',
    content: null,
    contentETag: '',
    isDirty: false,
    activeTab: 'overview',
    stats: null,
    messages: [],
    auditLogs: [],
    splitPreviewOpen: false,
    menuSearchQuery: '',
    menuCategoryFilter: 'ALL'
  };

  // Helper: Toast Notification
  function showToast(message, type = 'success') {
    const toast = document.getElementById('adminToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `admin-toast show ${type}`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // API Request Wrapper with Auth Header
  async function apiRequest(endpoint, options = {}) {
    options.headers = options.headers || {};
    if (state.token) {
      options.headers['Authorization'] = 'Bearer ' + state.token;
    }
    if (options.body && typeof options.body === 'object') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired or unauthorized');
    }
    return res;
  }

  function handleUnauthorized() {
    state.token = '';
    localStorage.removeItem('nexus_admin_token');
    document.getElementById('loginModal').style.display = 'flex';
  }

  // Check Login Status
  async function checkAuth() {
    if (!state.token) {
      document.getElementById('loginModal').style.display = 'flex';
      return false;
    }
    try {
      const res = await apiRequest('/api/auth/verify');
      const data = await res.json();
      if (res.ok && data.valid) {
        state.user = data.username;
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('adminUserDisplay').textContent = data.username;
        return true;
      } else {
        handleUnauthorized();
        return false;
      }
    } catch {
      handleUnauthorized();
      return false;
    }
  }

  // Load Content Source
  async function loadSourceContent() {
    try {
      const res = await apiRequest('/api/content?t=' + Date.now());
      if (res.ok) {
        state.contentETag = res.headers.get('ETag') || '';
        state.content = await res.json();
        populateAllForms();
        populateRawJsonEditor();
        setDirty(false);
      }
    } catch (err) {
      showToast('Error loading source data: ' + err.message, 'error');
    }
  }

  // Load Admin Stats & Logs
  async function loadAdminAuxData() {
    try {
      // Stats
      const statsRes = await apiRequest('/api/stats');
      if (statsRes.ok) {
        state.stats = await statsRes.json();
        renderOverviewStats();
      }

      // Messages / Reservations
      const msgRes = await apiRequest('/api/messages');
      if (msgRes.ok) {
        state.messages = await msgRes.json();
        renderMessagesInbox();
      }

      // Audit Log
      const auditRes = await apiRequest('/api/audit-log');
      if (auditRes.ok) {
        state.auditLogs = await auditRes.json();
        renderAuditLogTable();
      }
    } catch (err) {
      console.warn('Aux data load error:', err);
    }
  }

  function setDirty(isDirty) {
    state.isDirty = isDirty;
    const dirtyEl = document.getElementById('dirtyIndicator');
    if (dirtyEl) {
      dirtyEl.style.display = isDirty ? 'inline-flex' : 'none';
    }
  }

  // =========================================================================
  // POPULATE FORMS FROM SOURCE
  // =========================================================================
  function populateAllForms() {
    const c = state.content;
    if (!c) return;

    // Meta & Brand
    if (c.meta) {
      setValue('metaSiteTitle', c.meta.siteTitle);
      setValue('metaSiteTagline', c.meta.siteTagline);
      setValue('metaBrandName', c.meta.brandName);
      setValue('metaBrandNameBn', c.meta.brandNameBn || 'দ্যা সিলভানা রেস্টুরেন্ট');
      setValue('metaLogoUrl', c.meta.logoUrl || '/assets/sylvana-logo.png');
      setValue('metaLogoIcon', c.meta.logoIcon || '🍽️');
      setValue('metaDescription', c.meta.metaDescription);
      setValue('metaPrimaryColor', c.meta.primaryColor || '#e63917');
      setValue('metaAccentColor', c.meta.accentColor || '#f59e0b');

      if (c.meta.announcement) {
        setChecked('announcementEnabled', c.meta.announcement.enabled);
        setValue('announcementBadge', c.meta.announcement.badge);
        setValue('announcementText', c.meta.announcement.text);
        setValue('announcementLinkText', c.meta.announcement.linkText);
        setValue('announcementLinkUrl', c.meta.announcement.linkUrl);
      }
    }

    // Hero
    if (c.hero) {
      setValue('heroBadgeText', c.hero.badge);
      setValue('heroHeadlineStart', c.hero.headlineStart);
      setValue('heroHeadlineHighlight', c.hero.headlineHighlight);
      setValue('heroHeadlineEnd', c.hero.headlineEnd);
      setValue('heroSubtitleText', c.hero.subtitle);
      setValue('heroPrimaryCtaText', c.hero.primaryCta ? c.hero.primaryCta.text : '');
      setValue('heroPrimaryCtaUrl', c.hero.primaryCta ? c.hero.primaryCta.url : '');
      setValue('heroSecondaryCtaText', c.hero.secondaryCta ? c.hero.secondaryCta.text : '');
      setValue('heroSecondaryCtaUrl', c.hero.secondaryCta ? c.hero.secondaryCta.url : '');
      setValue('heroTrustBadgeText', c.hero.trustBadge);
      setValue('heroHighlightsList', Array.isArray(c.hero.highlights) ? c.hero.highlights.join('\n') : '');

      if (c.hero.previewCard) {
        setValue('heroPreviewTitle', c.hero.previewCard.title);
        setValue('heroPreviewMetric1Label', c.hero.previewCard.metric1 ? c.hero.previewCard.metric1.label : '');
        setValue('heroPreviewMetric1Val', c.hero.previewCard.metric1 ? c.hero.previewCard.metric1.value : '');
        setValue('heroPreviewMetric2Label', c.hero.previewCard.metric2 ? c.hero.previewCard.metric2.label : '');
        setValue('heroPreviewMetric2Val', c.hero.previewCard.metric2 ? c.hero.previewCard.metric2.value : '');
        setValue('heroPreviewStatus', c.hero.previewCard.status);
      }
    }

    // About Our Heritage
    if (c.about) {
      setValue('aboutBadgeInput', c.about.badge);
      setValue('aboutTitleInput', c.about.title);
      setValue('aboutBnTitleInput', c.about.bengaliTitle);
      setValue('aboutStory1Input', c.about.story1);
      setValue('aboutStory2Input', c.about.story2);
      setValue('aboutHighlightsInput', Array.isArray(c.about.highlights) ? c.about.highlights.join('\n') : '');
    }

    // Menu Section Header
    if (c.sectionHeaders && c.sectionHeaders.menu) {
      setValue('menuEyebrowInput', c.sectionHeaders.menu.eyebrow);
      setValue('menuTitleInput', c.sectionHeaders.menu.title);
      setValue('menuSubtitleInput', c.sectionHeaders.menu.subtitle);
    }

    // Section Headers
    if (c.sectionHeaders) {
      const sh = c.sectionHeaders;
      if (sh.features) {
        setValue('featuresEyebrowInput', sh.features.eyebrow);
        setValue('featuresTitleInput', sh.features.title);
        setValue('featuresSubtitleInput', sh.features.subtitle);
      }
      if (sh.showcase) {
        setValue('showcaseEyebrowInput', sh.showcase.eyebrow);
        setValue('showcaseTitleInput', sh.showcase.title);
        setValue('showcaseSubtitleInput', sh.showcase.subtitle);
      }
      if (sh.testimonials) {
        setValue('testimonialsEyebrowInput', sh.testimonials.eyebrow);
        setValue('testimonialsTitleInput', sh.testimonials.title);
        setValue('testimonialsSubtitleInput', sh.testimonials.subtitle);
      }
      if (sh.pricing) {
        setValue('pricingEyebrowInput', sh.pricing.eyebrow);
        setValue('pricingTitleInput', sh.pricing.title);
        setValue('pricingSubtitleInput', sh.pricing.subtitle);
      }
      if (sh.faqs) {
        setValue('faqsEyebrowInput', sh.faqs.eyebrow);
        setValue('faqsTitleInput', sh.faqs.title);
        setValue('faqsSubtitleInput', sh.faqs.subtitle);
      }
    }

    // Dynamic Lists
    renderMenuEditor();
    renderMetricsEditor();
    renderFeaturesEditor();
    renderShowcaseEditor();
    renderTestimonialsEditor();
    renderPricingEditor();
    renderFaqsEditor();

    // Contact & Location
    if (c.contact) {
      setValue('contactTitleInput', c.contact.title);
      setValue('contactSubtitleInput', c.contact.subtitle);
      setValue('contactEmailInput', c.contact.email);
      setValue('contactPhoneInput', c.contact.phone);
      setValue('contactAddressInput', c.contact.address);
      setValue('contactHoursInput', c.contact.hours);
      if (c.contact.social) {
        setValue('socialTwitter', c.contact.social.twitter);
        setValue('socialGithub', c.contact.social.github);
        setValue('socialLinkedin', c.contact.social.linkedin);
        setValue('socialDiscord', c.contact.social.discord);
      }
    }

    // Footer
    if (c.footer) {
      setValue('footerDescInput', c.footer.description);
      setValue('footerCopyrightInput', c.footer.copyright);
      if (Array.isArray(c.footer.links)) {
        setValue('footerLinksInput', c.footer.links.map(l => `${l.label || ''} | ${l.url || '#'}`).join('\n'));
      }
    }
  }

  // =========================================================================
  // COLLECT FORMS TO SOURCE JSON
  // =========================================================================
  function collectFormToContent() {
    const c = JSON.parse(JSON.stringify(state.content || {}));

    // Meta
    c.meta = c.meta || {};
    c.meta.siteTitle = getValue('metaSiteTitle');
    c.meta.siteTagline = getValue('metaSiteTagline');
    c.meta.brandName = getValue('metaBrandName');
    c.meta.brandNameBn = getValue('metaBrandNameBn');
    c.meta.logoUrl = getValue('metaLogoUrl');
    c.meta.logoIcon = getValue('metaLogoIcon');
    c.meta.metaDescription = getValue('metaDescription');
    c.meta.primaryColor = getValue('metaPrimaryColor');
    c.meta.accentColor = getValue('metaAccentColor');
    c.meta.announcement = {
      enabled: getChecked('announcementEnabled'),
      badge: getValue('announcementBadge'),
      text: getValue('announcementText'),
      linkText: getValue('announcementLinkText'),
      linkUrl: getValue('announcementLinkUrl')
    };

    // Hero
    c.hero = c.hero || {};
    c.hero.badge = getValue('heroBadgeText');
    c.hero.headlineStart = getValue('heroHeadlineStart');
    c.hero.headlineHighlight = getValue('heroHeadlineHighlight');
    c.hero.headlineEnd = getValue('heroHeadlineEnd');
    c.hero.subtitle = getValue('heroSubtitleText');
    c.hero.primaryCta = {
      text: getValue('heroPrimaryCtaText'),
      url: getValue('heroPrimaryCtaUrl')
    };
    c.hero.secondaryCta = {
      text: getValue('heroSecondaryCtaText'),
      url: getValue('heroSecondaryCtaUrl')
    };
    c.hero.trustBadge = getValue('heroTrustBadgeText');
    c.hero.highlights = getValue('heroHighlightsList').split('\n').map(s => s.trim()).filter(Boolean);
    c.hero.previewCard = {
      title: getValue('heroPreviewTitle'),
      metric1: { label: getValue('heroPreviewMetric1Label'), value: getValue('heroPreviewMetric1Val') },
      metric2: { label: getValue('heroPreviewMetric2Label'), value: getValue('heroPreviewMetric2Val') },
      status: getValue('heroPreviewStatus'),
      sourceStatus: 'Fresh Halal Cuisine'
    };

    // About
    c.about = c.about || {};
    c.about.badge = getValue('aboutBadgeInput');
    c.about.title = getValue('aboutTitleInput');
    c.about.bengaliTitle = getValue('aboutBnTitleInput');
    c.about.story1 = getValue('aboutStory1Input');
    c.about.story2 = getValue('aboutStory2Input');
    c.about.highlights = getValue('aboutHighlightsInput').split('\n').map(s => s.trim()).filter(Boolean);

    // Section Headers
    c.sectionHeaders = c.sectionHeaders || {};
    c.sectionHeaders.menu = {
      eyebrow: getValue('menuEyebrowInput'),
      title: getValue('menuTitleInput'),
      subtitle: getValue('menuSubtitleInput')
    };
    c.sectionHeaders.features = {
      eyebrow: getValue('featuresEyebrowInput'),
      title: getValue('featuresTitleInput'),
      subtitle: getValue('featuresSubtitleInput')
    };
    c.sectionHeaders.showcase = {
      eyebrow: getValue('showcaseEyebrowInput'),
      title: getValue('showcaseTitleInput'),
      subtitle: getValue('showcaseSubtitleInput')
    };
    c.sectionHeaders.testimonials = {
      eyebrow: getValue('testimonialsEyebrowInput'),
      title: getValue('testimonialsTitleInput'),
      subtitle: getValue('testimonialsSubtitleInput')
    };
    c.sectionHeaders.pricing = {
      eyebrow: getValue('pricingEyebrowInput'),
      title: getValue('pricingTitleInput'),
      subtitle: getValue('pricingSubtitleInput')
    };
    c.sectionHeaders.faqs = {
      eyebrow: getValue('faqsEyebrowInput'),
      title: getValue('faqsTitleInput'),
      subtitle: getValue('faqsSubtitleInput')
    };

    // Full Menu Collection
    c.menu = collectMenu();

    // Dynamic Lists
    c.metrics = collectMetrics();
    c.features = collectFeatures();
    c.showcase = collectShowcase();
    c.testimonials = collectTestimonials();
    c.pricing = collectPricing();
    c.faqs = collectFaqs();

    // Contact & Footer
    c.contact = c.contact || {};
    c.contact.title = getValue('contactTitleInput');
    c.contact.subtitle = getValue('contactSubtitleInput');
    c.contact.email = getValue('contactEmailInput');
    c.contact.phone = getValue('contactPhoneInput');
    c.contact.address = getValue('contactAddressInput');
    c.contact.hours = getValue('contactHoursInput');
    c.contact.social = {
      twitter: getValue('socialTwitter'),
      github: getValue('socialGithub'),
      linkedin: getValue('socialLinkedin'),
      discord: getValue('socialDiscord')
    };

    c.footer = c.footer || {};
    c.footer.description = getValue('footerDescInput');
    c.footer.copyright = getValue('footerCopyrightInput');
    const footerLinksRaw = getValue('footerLinksInput');
    if (footerLinksRaw) {
      c.footer.links = footerLinksRaw.split('\n')
        .map(line => {
          const parts = line.split('|');
          return { label: (parts[0] || '').trim(), url: (parts[1] || '#').trim() };
        })
        .filter(l => l.label);
    }

    return c;
  }

  // =========================================================================
  // DEDICATED FULL MENU MANAGEMENT (38 Dishes)
  // =========================================================================
  function renderMenuEditor() {
    const listEl = document.getElementById('menuEditorList');
    if (!listEl) return;

    const menu = state.content.menu || { items: [] };
    let items = menu.items || [];

    const totalCountEl = document.getElementById('adminDishCountLabel');
    if (totalCountEl) totalCountEl.textContent = `Total: ${items.length} dishes in database`;

    // Filter items in editor by search & category
    const search = state.menuSearchQuery.toLowerCase().trim();
    const cat = state.menuCategoryFilter;

    let displayList = items.map((it, originalIndex) => ({ it, originalIndex }));

    if (cat !== 'ALL') {
      displayList = displayList.filter(entry => entry.it.category === cat);
    }

    if (search) {
      displayList = displayList.filter(entry =>
        (entry.it.name && entry.it.name.toLowerCase().includes(search)) ||
        (entry.it.description && entry.it.description.toLowerCase().includes(search)) ||
        (entry.it.category && entry.it.category.toLowerCase().includes(search)) ||
        (entry.it.price && String(entry.it.price).includes(search))
      );
    }

    if (displayList.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: var(--admin-dim); padding: 40px; background: var(--admin-card-bg); border-radius: 8px;">
          No dishes match your filter criteria.
        </div>
      `;
      return;
    }

    listEl.innerHTML = displayList.map((entry, displayIdx) => {
      const d = entry.it;
      const idx = entry.originalIndex;
      const isFirst = displayIdx === 0;
      const isLast = displayIdx === displayList.length - 1;

      return `
        <div class="item-card-row dish-admin-row" data-index="${idx}">
          <div class="item-card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="item-index-badge">#${idx + 1}</span>
              <span style="font-size: 1.2rem;">${d.icon || '🍲'}</span>
              <strong style="color: #fff; font-size: 1rem;">${escapeHtml(d.name)}</strong>
              <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                ${d.price} ৳
              </span>
              ${d.isSpecial ? '<span style="background: rgba(230, 57, 23, 0.25); color: #ff6b4a; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 600;">⭐ Special</span>' : ''}
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-secondary-tool btn-admin-action btn-move-dish-up" data-display-idx="${displayIdx}" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''} title="Move Dish Up">⬆</button>
              <button type="button" class="btn-secondary-tool btn-admin-action btn-move-dish-down" data-display-idx="${displayIdx}" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed;"' : ''} title="Move Dish Down">⬇</button>
              <button type="button" class="btn-danger-tool btn-admin-action btn-del-dish" data-index="${idx}">Delete</button>
            </div>
          </div>

          <div class="form-row-3">
            <div class="admin-field">
              <label class="admin-label">Dish Name</label>
              <input type="text" class="admin-input d-name" value="${escapeAttr(d.name)}">
            </div>
            <div class="admin-field">
              <label class="admin-label">Dining Section</label>
              <select class="admin-select d-sec">
                <option value="Breakfast" ${d.section === 'Breakfast' ? 'selected' : ''}>Breakfast (সকালের নাস্তা)</option>
                <option value="Lunch & Dinner" ${d.section === 'Lunch & Dinner' ? 'selected' : ''}>Lunch & Dinner (দুপুর ও রাতের খাবার)</option>
                <option value="Traditional Meals & Favourites" ${d.section === 'Traditional Meals & Favourites' ? 'selected' : ''}>Traditional Meals & Favourites (ঐতিহ্যবাহী খাবার)</option>
                <option value="Drinks & Desserts" ${d.section === 'Drinks & Desserts' ? 'selected' : ''}>Drinks & Desserts (মিষ্টি ও পানীয়)</option>
              </select>
            </div>
            <div class="admin-field">
              <label class="admin-label">Category</label>
              <select class="admin-select d-cat">
                <option value="Breakfast Menu" ${d.category === 'Breakfast Menu' ? 'selected' : ''}>Breakfast Menu</option>
                <option value="Tea Item" ${d.category === 'Tea Item' ? 'selected' : ''}>Tea Item</option>
                <option value="Soups & Appetizers" ${d.category === 'Soups & Appetizers' ? 'selected' : ''}>Soups & Appetizers</option>
                <option value="Gourmet Burgers" ${d.category === 'Gourmet Burgers' ? 'selected' : ''}>Gourmet Burgers</option>
                <option value="Pizza & Pasta" ${d.category === 'Pizza & Pasta' ? 'selected' : ''}>Pizza & Pasta</option>
                <option value="Traditional Meals & Favourites" ${d.category === 'Traditional Meals & Favourites' ? 'selected' : ''}>Traditional Meals & Favourites</option>
                <option value="Desserts" ${d.category === 'Desserts' ? 'selected' : ''}>Desserts</option>
                <option value="Tea, Coffee & Refreshments" ${d.category === 'Tea, Coffee & Refreshments' ? 'selected' : ''}>Tea, Coffee & Refreshments</option>
                <option value="Lassis, Milkshakes & Juice" ${d.category === 'Lassis, Milkshakes & Juice' ? 'selected' : ''}>Lassis, Milkshakes & Juice</option>
              </select>
            </div>
          </div>

          <div class="form-row-3">
            <div class="admin-field">
              <label class="admin-label">Price in BDT (৳)</label>
              <input type="number" class="admin-input d-price" value="${d.price}" min="0">
            </div>
            <div class="admin-field">
              <label class="admin-label">Special Badge (e.g. Morning Special, Old Dhaka Royal)</label>
              <input type="text" class="admin-input d-badge" value="${escapeAttr(d.badge || '')}">
            </div>
            <div class="admin-field">
              <label class="admin-label">Dietary Label</label>
              <select class="admin-select d-diet">
                <option value="Non-Veg" ${d.dietary === 'Non-Veg' ? 'selected' : ''}>Non-Veg</option>
                <option value="Vegetarian" ${d.dietary === 'Vegetarian' ? 'selected' : ''}>Vegetarian</option>
                <option value="Beverage" ${d.dietary === 'Beverage' ? 'selected' : ''}>Beverage</option>
                <option value="Dessert" ${d.dietary === 'Dessert' ? 'selected' : ''}>Dessert</option>
                <option value="Fish" ${d.dietary === 'Fish' ? 'selected' : ''}>Fish</option>
                <option value="Fresh Juice" ${d.dietary === 'Fresh Juice' ? 'selected' : ''}>Fresh Juice</option>
                <option value="Comfort Food" ${d.dietary === 'Comfort Food' ? 'selected' : ''}>Comfort Food</option>
              </select>
            </div>
          </div>

          <div class="form-row-3">
            <div class="admin-field">
              <label class="admin-label">Icon Emoji (e.g. 🥞, 🍖, ☕, 🥤, 🍔)</label>
              <input type="text" class="admin-input d-ico" value="${escapeAttr(d.icon || '🍲')}">
            </div>
            <div class="admin-field">
              <label class="admin-label">Image URL / File Path (Optional)</label>
              <input type="text" class="admin-input d-img" value="${escapeAttr(d.imageUrl || '')}" placeholder="https://... or /assets/dish.jpg">
            </div>
            <div class="admin-field" style="display: flex; align-items: flex-end; padding-bottom: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; color: #fff; cursor: pointer; font-size: 0.9rem; user-select: none;">
                <input type="checkbox" class="d-special" ${d.isSpecial ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--admin-accent);">
                <span>⭐ Chef's Special / Featured</span>
              </label>
            </div>
          </div>

          <div class="admin-field">
            <label class="admin-label">Dish Description & Ingredients</label>
            <textarea class="admin-textarea d-desc" rows="2">${escapeHtml(d.description)}</textarea>
          </div>
        </div>
      `;
    }).join('');

    // Delete Dish Handlers
    listEl.querySelectorAll('.btn-del-dish').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-index'), 10);
        const dishName = (state.content.menu.items[i] && state.content.menu.items[i].name) || 'this dish';
        if (!confirm(`Are you sure you want to delete "${dishName}" from the menu?`)) {
          return;
        }
        saveLiveDishInputs();
        state.content.menu.items.splice(i, 1);
        renderMenuEditor();
        setDirty(true);
        showToast(`"${dishName}" deleted from menu.`);
      });
    });

    // Move Dish Up
    listEl.querySelectorAll('.btn-move-dish-up').forEach(btn => {
      btn.addEventListener('click', () => {
        saveLiveDishInputs();
        const dIdx = parseInt(btn.getAttribute('data-display-idx'), 10);
        if (dIdx > 0 && dIdx < displayList.length) {
          const curOrigIdx = displayList[dIdx].originalIndex;
          const targetOrigIdx = displayList[dIdx - 1].originalIndex;
          const temp = state.content.menu.items[curOrigIdx];
          state.content.menu.items[curOrigIdx] = state.content.menu.items[targetOrigIdx];
          state.content.menu.items[targetOrigIdx] = temp;
          renderMenuEditor();
          setDirty(true);
        }
      });
    });

    // Move Dish Down
    listEl.querySelectorAll('.btn-move-dish-down').forEach(btn => {
      btn.addEventListener('click', () => {
        saveLiveDishInputs();
        const dIdx = parseInt(btn.getAttribute('data-display-idx'), 10);
        if (dIdx >= 0 && dIdx < displayList.length - 1) {
          const curOrigIdx = displayList[dIdx].originalIndex;
          const targetOrigIdx = displayList[dIdx + 1].originalIndex;
          const temp = state.content.menu.items[curOrigIdx];
          state.content.menu.items[curOrigIdx] = state.content.menu.items[targetOrigIdx];
          state.content.menu.items[targetOrigIdx] = temp;
          renderMenuEditor();
          setDirty(true);
        }
      });
    });

    listEl.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => setDirty(true));
    });
  }

  function saveLiveDishInputs() {
    const rows = document.querySelectorAll('#menuEditorList .dish-admin-row');
    rows.forEach(r => {
      const idx = parseInt(r.getAttribute('data-index'), 10);
      if (state.content.menu.items[idx]) {
        state.content.menu.items[idx].name = r.querySelector('.d-name').value;
        const secEl = r.querySelector('.d-sec');
        if (secEl) state.content.menu.items[idx].section = secEl.value;
        state.content.menu.items[idx].category = r.querySelector('.d-cat').value;
        state.content.menu.items[idx].price = parseFloat(r.querySelector('.d-price').value) || 0;
        state.content.menu.items[idx].badge = r.querySelector('.d-badge').value;
        state.content.menu.items[idx].dietary = r.querySelector('.d-diet').value;
        state.content.menu.items[idx].icon = r.querySelector('.d-ico').value;
        const imgEl = r.querySelector('.d-img');
        if (imgEl) state.content.menu.items[idx].imageUrl = imgEl.value;
        const specialEl = r.querySelector('.d-special');
        if (specialEl) state.content.menu.items[idx].isSpecial = specialEl.checked;
        state.content.menu.items[idx].description = r.querySelector('.d-desc').value;
      }
    });
  }

  function collectMenu() {
    saveLiveDishInputs();
    const items = state.content.menu.items || [];
    const existingCats = Array.isArray(state.content.menu.categories) ? state.content.menu.categories : [];
    const itemCats = items.map(it => it.category).filter(Boolean);
    const standardCats = [
      "All Dishes",
      "Breakfast Menu",
      "Tea Item",
      "Soups & Appetizers",
      "Gourmet Burgers",
      "Pizza & Pasta",
      "Traditional Meals & Favourites",
      "Desserts",
      "Tea, Coffee & Refreshments",
      "Lassis, Milkshakes & Juice"
    ];
    const catSet = new Set([...standardCats, ...existingCats, ...itemCats]);
    return {
      categories: Array.from(catSet),
      items: items
    };
  }

  // =========================================================================
  // DYNAMIC LIST RENDERERS & COLLECTORS (Metrics, Features, Showcase, etc.)
  // =========================================================================

  // 1. Metrics
  function renderMetricsEditor() {
    const listEl = document.getElementById('metricsEditorList');
    if (!listEl) return;
    const metrics = state.content.metrics || [];
    listEl.innerHTML = metrics.map((m, idx) => `
      <div class="item-card-row" data-index="${idx}">
        <div class="item-card-header">
          <span class="item-index-badge">Metric #${idx + 1}</span>
          <button type="button" class="btn-danger-tool btn-admin-action btn-del-metric" data-index="${idx}">Delete</button>
        </div>
        <div class="form-row-3">
          <div class="admin-field">
            <label class="admin-label">Display Value</label>
            <input type="text" class="admin-input m-val" value="${escapeAttr(m.value)}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Label</label>
            <input type="text" class="admin-input m-lbl" value="${escapeAttr(m.label)}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Icon Identifier</label>
            <select class="admin-select m-ico">
              <option value="star" ${m.icon === 'star' ? 'selected' : ''}>star</option>
              <option value="server" ${m.icon === 'server' ? 'selected' : ''}>server</option>
              <option value="activity" ${m.icon === 'activity' ? 'selected' : ''}>activity</option>
              <option value="zap" ${m.icon === 'zap' ? 'selected' : ''}>zap</option>
            </select>
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">Description / Subtitle</label>
          <input type="text" class="admin-input m-desc" value="${escapeAttr(m.desc)}">
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-del-metric').forEach(btn => {
      btn.addEventListener('click', () => {
        state.content.metrics = collectMetrics();
        const i = parseInt(btn.getAttribute('data-index'), 10);
        state.content.metrics.splice(i, 1);
        renderMetricsEditor();
        setDirty(true);
      });
    });

    listEl.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', () => setDirty(true));
    });
  }

  function collectMetrics() {
    const rows = document.querySelectorAll('#metricsEditorList .item-card-row');
    const arr = [];
    rows.forEach((r, idx) => {
      arr.push({
        id: 'm' + (idx + 1),
        value: r.querySelector('.m-val').value,
        label: r.querySelector('.m-lbl').value,
        icon: r.querySelector('.m-ico').value,
        desc: r.querySelector('.m-desc').value
      });
    });
    return arr;
  }

  // 2. Features (Quality Pillars)
  function renderFeaturesEditor() {
    const listEl = document.getElementById('featuresEditorList');
    if (!listEl) return;
    const features = state.content.features || [];
    listEl.innerHTML = features.map((f, idx) => `
      <div class="item-card-row" data-index="${idx}">
        <div class="item-card-header">
          <span class="item-index-badge">Pillar #${idx + 1}</span>
          <button type="button" class="btn-danger-tool btn-admin-action btn-del-feature" data-index="${idx}">Delete</button>
        </div>
        <div class="form-row-2">
          <div class="admin-field">
            <label class="admin-label">Pillar Title</label>
            <input type="text" class="admin-input f-title" value="${escapeAttr(f.title)}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Category Tag</label>
            <input type="text" class="admin-input f-tag" value="${escapeAttr(f.tag)}">
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">Description</label>
          <textarea class="admin-textarea f-desc" rows="2">${escapeHtml(f.description)}</textarea>
        </div>
        <div class="admin-field">
          <label class="admin-label">Key Bullets (one per line)</label>
          <textarea class="admin-textarea f-bullets" rows="3">${Array.isArray(f.bullets) ? escapeHtml(f.bullets.join('\n')) : ''}</textarea>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-del-feature').forEach(btn => {
      btn.addEventListener('click', () => {
        state.content.features = collectFeatures();
        const i = parseInt(btn.getAttribute('data-index'), 10);
        state.content.features.splice(i, 1);
        renderFeaturesEditor();
        setDirty(true);
      });
    });

    listEl.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => setDirty(true));
    });
  }

  function collectFeatures() {
    const rows = document.querySelectorAll('#featuresEditorList .item-card-row');
    const arr = [];
    rows.forEach((r, idx) => {
      arr.push({
        id: 'f' + (idx + 1),
        title: r.querySelector('.f-title').value,
        tag: r.querySelector('.f-tag').value,
        icon: 'star',
        description: r.querySelector('.f-desc').value,
        bullets: r.querySelector('.f-bullets').value.split('\n').map(s => s.trim()).filter(Boolean)
      });
    });
    return arr;
  }

  // 3. Showcase (Chef's Specials)
  function renderShowcaseEditor() {
    const listEl = document.getElementById('showcaseEditorList');
    if (!listEl) return;
    const items = state.content.showcase || [];
    listEl.innerHTML = items.map((it, idx) => `
      <div class="item-card-row" data-index="${idx}">
        <div class="item-card-header">
          <span class="item-index-badge">Special #${idx + 1}</span>
          <button type="button" class="btn-danger-tool btn-admin-action btn-del-showcase" data-index="${idx}">Delete</button>
        </div>
        <div class="form-row-2">
          <div class="admin-field">
            <label class="admin-label">Dish Title</label>
            <input type="text" class="admin-input s-title" value="${escapeAttr(it.title)}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Category</label>
            <input type="text" class="admin-input s-cat" value="${escapeAttr(it.category)}">
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">Summary</label>
          <textarea class="admin-textarea s-sum" rows="2">${escapeHtml(it.summary)}</textarea>
        </div>
        <div class="form-row-2">
          <div class="admin-field">
            <label class="admin-label">Tags (comma-separated e.g. 320 ৳, House Special)</label>
            <input type="text" class="admin-input s-tags" value="${Array.isArray(it.tags) ? escapeAttr(it.tags.join(', ')) : ''}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Gradient Style (CSS)</label>
            <input type="text" class="admin-input s-grad" value="${escapeAttr(it.gradient || 'linear-gradient(135deg, #b91c1c, #d97706)')}">
          </div>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-del-showcase').forEach(btn => {
      btn.addEventListener('click', () => {
        state.content.showcase = collectShowcase();
        const i = parseInt(btn.getAttribute('data-index'), 10);
        state.content.showcase.splice(i, 1);
        renderShowcaseEditor();
        setDirty(true);
      });
    });

    listEl.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => setDirty(true));
    });
  }

  function collectShowcase() {
    const rows = document.querySelectorAll('#showcaseEditorList .item-card-row');
    const arr = [];
    rows.forEach((r, idx) => {
      arr.push({
        id: 's' + (idx + 1),
        title: r.querySelector('.s-title').value,
        category: r.querySelector('.s-cat').value,
        summary: r.querySelector('.s-sum').value,
        tags: r.querySelector('.s-tags').value.split(',').map(s => s.trim()).filter(Boolean),
        gradient: r.querySelector('.s-grad').value,
        link: '#menu'
      });
    });
    return arr;
  }

  // 4. Testimonials
  function renderTestimonialsEditor() {
    const listEl = document.getElementById('testimonialsEditorList');
    if (!listEl) return;
    const testimonials = state.content.testimonials || [];
    listEl.innerHTML = testimonials.map((t, idx) => `
      <div class="item-card-row" data-index="${idx}">
        <div class="item-card-header">
          <span class="item-index-badge">Review #${idx + 1}</span>
          <button type="button" class="btn-danger-tool btn-admin-action btn-del-testi" data-index="${idx}">Delete</button>
        </div>
        <div class="form-row-3">
          <div class="admin-field">
            <label class="admin-label">Guest Name</label>
            <input type="text" class="admin-input t-name" value="${escapeAttr(t.name)}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Role / Affiliation</label>
            <input type="text" class="admin-input t-role" value="${escapeAttr(t.role)}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Rating (1 to 5 Stars)</label>
            <input type="number" class="admin-input t-rate" min="1" max="5" value="${t.rating || 5}">
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">Review Quote</label>
          <textarea class="admin-textarea t-quote" rows="2">${escapeHtml(t.quote)}</textarea>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-del-testi').forEach(btn => {
      btn.addEventListener('click', () => {
        state.content.testimonials = collectTestimonials();
        const i = parseInt(btn.getAttribute('data-index'), 10);
        state.content.testimonials.splice(i, 1);
        renderTestimonialsEditor();
        setDirty(true);
      });
    });

    listEl.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => setDirty(true));
    });
  }

  function collectTestimonials() {
    const rows = document.querySelectorAll('#testimonialsEditorList .item-card-row');
    const arr = [];
    rows.forEach((r, idx) => {
      const name = r.querySelector('.t-name').value;
      const words = (name || '').trim().split(/\s+/).filter(Boolean);
      const initials = words.length > 0 ? words.map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'SR';
      arr.push({
        id: 't' + (idx + 1),
        name: name,
        role: r.querySelector('.t-role').value,
        rating: parseInt(r.querySelector('.t-rate').value, 10) || 5,
        avatar: initials,
        quote: r.querySelector('.t-quote').value
      });
    });
    return arr;
  }

  // 5. Pricing (Feasts & Platters)
  function renderPricingEditor() {
    const pricing = state.content.pricing || { plans: [] };
    setValue('pricingDiscountText', pricing.billingAnnualDiscount || '');

    const listEl = document.getElementById('pricingEditorList');
    if (!listEl) return;
    listEl.innerHTML = pricing.plans.map((p, idx) => `
      <div class="item-card-row" data-index="${idx}">
        <div class="item-card-header">
          <span class="item-index-badge">Platter #${idx + 1}: ${escapeHtml(p.name)}</span>
          <button type="button" class="btn-danger-tool btn-admin-action btn-del-plan" data-index="${idx}">Delete</button>
        </div>
        <div class="form-row-3">
          <div class="admin-field">
            <label class="admin-label">Platter Name</label>
            <input type="text" class="admin-input p-name" value="${escapeAttr(p.name)}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Standard Price (৳)</label>
            <input type="number" class="admin-input p-mprice" value="${p.monthlyPrice}">
          </div>
          <div class="admin-field">
            <label class="admin-label">Group / Discount Price (৳)</label>
            <input type="number" class="admin-input p-aprice" value="${p.annualPrice}">
          </div>
        </div>
        <div class="form-row-2">
          <div class="admin-field">
            <label class="admin-label">Highlighted / Featured Feast?</label>
            <select class="admin-select p-feat">
              <option value="true" ${p.featured ? 'selected' : ''}>Yes (Highlighted Card)</option>
              <option value="false" ${!p.featured ? 'selected' : ''}>No (Standard Card)</option>
            </select>
          </div>
          <div class="admin-field">
            <label class="admin-label">Badge Text (e.g. CHEF'S SIGNATURE)</label>
            <input type="text" class="admin-input p-badge" value="${escapeAttr(p.badge || '')}">
          </div>
        </div>
        <div class="admin-field">
          <label class="admin-label">Description</label>
          <input type="text" class="admin-input p-desc" value="${escapeAttr(p.description)}">
        </div>
        <div class="admin-field">
          <label class="admin-label">Button Text</label>
          <input type="text" class="admin-input p-btn" value="${escapeAttr(p.buttonText || 'Reserve Feast')}">
        </div>
        <div class="admin-field">
          <label class="admin-label">Included Dishes / Items (one per line)</label>
          <textarea class="admin-textarea p-feats" rows="4">${Array.isArray(p.features) ? escapeHtml(p.features.join('\n')) : ''}</textarea>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-del-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        state.content.pricing = collectPricing();
        const i = parseInt(btn.getAttribute('data-index'), 10);
        state.content.pricing.plans.splice(i, 1);
        renderPricingEditor();
        setDirty(true);
      });
    });

    listEl.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => setDirty(true));
    });
  }

  function collectPricing() {
    const discount = getValue('pricingDiscountText');
    const rows = document.querySelectorAll('#pricingEditorList .item-card-row');
    const plans = [];
    rows.forEach((r, idx) => {
      plans.push({
        id: 'p' + (idx + 1),
        name: r.querySelector('.p-name').value,
        monthlyPrice: parseFloat(r.querySelector('.p-mprice').value) || 0,
        annualPrice: parseFloat(r.querySelector('.p-aprice').value) || 0,
        featured: r.querySelector('.p-feat').value === 'true',
        badge: r.querySelector('.p-badge').value,
        description: r.querySelector('.p-desc').value,
        buttonText: r.querySelector('.p-btn').value,
        features: r.querySelector('.p-feats').value.split('\n').map(s => s.trim()).filter(Boolean)
      });
    });
    return {
      billingAnnualDiscount: discount,
      plans: plans
    };
  }

  // 6. FAQs
  function renderFaqsEditor() {
    const listEl = document.getElementById('faqsEditorList');
    if (!listEl) return;
    const faqs = state.content.faqs || [];
    listEl.innerHTML = faqs.map((q, idx) => `
      <div class="item-card-row" data-index="${idx}">
        <div class="item-card-header">
          <span class="item-index-badge">FAQ #${idx + 1}</span>
          <button type="button" class="btn-danger-tool btn-admin-action btn-del-faq" data-index="${idx}">Delete</button>
        </div>
        <div class="admin-field">
          <label class="admin-label">Question</label>
          <input type="text" class="admin-input q-quest" value="${escapeAttr(q.question)}">
        </div>
        <div class="admin-field">
          <label class="admin-label">Answer</label>
          <textarea class="admin-textarea q-ans" rows="3">${escapeHtml(q.answer)}</textarea>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-del-faq').forEach(btn => {
      btn.addEventListener('click', () => {
        state.content.faqs = collectFaqs();
        const i = parseInt(btn.getAttribute('data-index'), 10);
        state.content.faqs.splice(i, 1);
        renderFaqsEditor();
        setDirty(true);
      });
    });

    listEl.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => setDirty(true));
    });
  }

  function collectFaqs() {
    const rows = document.querySelectorAll('#faqsEditorList .item-card-row');
    const arr = [];
    rows.forEach((r, idx) => {
      arr.push({
        id: 'q' + (idx + 1),
        question: r.querySelector('.q-quest').value,
        answer: r.querySelector('.q-ans').value
      });
    });
    return arr;
  }

  // =========================================================================
  // RAW JSON SOURCE EDITOR
  // =========================================================================
  function populateRawJsonEditor() {
    const editor = document.getElementById('rawJsonSourceEditor');
    if (editor && state.content) {
      editor.value = JSON.stringify(state.content, null, 2);
    }
  }

  // Save All Changes to Backend Source of Truth
  async function saveAllChanges() {
    try {
      const saveBtn = document.getElementById('btnSaveAll');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '💾 Saving...';
      }

      let payload;
      if (state.activeTab === 'raw-source') {
        const rawText = document.getElementById('rawJsonSourceEditor').value;
        payload = JSON.parse(rawText);
      } else {
        payload = collectFormToContent();
      }

      const reqOptions = {
        method: 'PUT',
        body: payload,
        headers: {}
      };

      if (state.contentETag) {
        reqOptions.headers['If-Match'] = state.contentETag;
      }

      const res = await apiRequest('/api/content', reqOptions);
      const data = await res.json();

      if (res.status === 412) {
        showToast('⚠️ CONFLICT: Content was modified by another administrator! Refresh and reload before saving.', 'error');
        const dirtyEl = document.getElementById('dirtyIndicator');
        if (dirtyEl) {
          dirtyEl.style.display = 'inline-flex';
          dirtyEl.textContent = '⚠️ Concurrency Conflict (Server Modified)';
        }
        return;
      }

      if (res.ok && data.success) {
        state.content = payload;
        state.contentETag = data.etag || res.headers.get('ETag') || state.contentETag;
        populateAllForms();
        populateRawJsonEditor();
        setDirty(false);
        showToast('Restaurant content & menu successfully updated and saved!');

        reloadPreviewFrame();
        loadAdminAuxData();
      } else {
        showToast('Failed to save content: ' + (data.error || 'Server error'), 'error');
      }
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error');
    } finally {
      const saveBtn = document.getElementById('btnSaveAll');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save All Changes';
      }
    }
  }

  // Reset to Defaults
  async function resetToDefaults() {
    if (!confirm('Are you sure you want to restore factory default restaurant content? Any custom modifications will be replaced.')) {
      return;
    }
    try {
      const res = await apiRequest('/api/content/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Restored default restaurant content template!');
        await loadSourceContent();
        reloadPreviewFrame();
      } else {
        showToast('Failed to reset: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  }

  // Reload Live Split Preview Frame
  function reloadPreviewFrame() {
    const frame = document.getElementById('livePreviewFrame');
    if (frame) {
      frame.src = '/?t=' + Date.now();
    }
  }

  // Toggle Live Split Preview
  function toggleSplitPreview() {
    state.splitPreviewOpen = !state.splitPreviewOpen;
    const splitWrapper = document.getElementById('previewSplitWrapper');
    if (splitWrapper) {
      splitWrapper.classList.toggle('active', state.splitPreviewOpen);
      document.body.classList.toggle('split-preview-active', state.splitPreviewOpen);
      if (state.splitPreviewOpen) {
        reloadPreviewFrame();
      }
    }
  }

  // Overview Stats
  function renderOverviewStats() {
    const s = state.stats;
    if (!s) return;
    const dishesCount = (state.content && state.content.menu && state.content.menu.items) ? state.content.menu.items.length : 38;
    setHtml('statDishes', dishesCount + '+');
    setHtml('statUptime', formatUptime(s.uptimeSeconds));
    setHtml('statInquiries', s.messagesCount || '0');
    setHtml('statAudits', s.auditLogCount || '0');
  }

  function formatUptime(seconds) {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // Messages / Table Reservations Inbox
  function renderMessagesInbox() {
    const tableBody = document.getElementById('messagesTableBody');
    if (!tableBody) return;

    if (state.messages.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--admin-dim); padding: 30px;">No reservation inquiries received yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = state.messages.map(m => `
      <tr>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td><a href="mailto:${escapeAttr(m.email)}" style="color: var(--admin-accent);">${escapeHtml(m.email)}</a></td>
        <td><span class="admin-badge" style="font-size: 0.72rem;">${escapeHtml(m.subject)}</span></td>
        <td style="max-width: 380px; white-space: pre-wrap; font-size: 0.825rem; line-height: 1.5;">${escapeHtml(m.message)}</td>
        <td>
          <button type="button" class="btn-danger-tool btn-admin-action btn-del-msg" data-id="${escapeAttr(m.id)}" style="padding: 4px 10px; font-size: 0.75rem;">
            Delete
          </button>
        </td>
      </tr>
    `).join('');

    tableBody.querySelectorAll('.btn-del-msg').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const res = await apiRequest('/api/messages?id=' + encodeURIComponent(id), { method: 'DELETE' });
          if (res.ok) {
            showToast('Reservation deleted');
            loadAdminAuxData();
          }
        } catch (err) {
          showToast('Failed to delete message: ' + err.message, 'error');
        }
      });
    });
  }

  // Audit Log Table
  function renderAuditLogTable() {
    const tableBody = document.getElementById('auditLogTableBody');
    if (!tableBody) return;

    if (state.auditLogs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--admin-dim); padding: 30px;">No audit logs yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = state.auditLogs.map(l => `
      <tr>
        <td style="color: var(--admin-dim); font-size: 0.8rem;">${formatDate(l.timestamp)}</td>
        <td><span class="admin-badge" style="font-size: 0.65rem;">${escapeHtml(l.action)}</span></td>
        <td style="color: var(--admin-accent); font-weight: 600;">${escapeHtml(l.user)}</td>
        <td style="font-size: 0.85rem;">${escapeHtml(l.details)}</td>
      </tr>
    `).join('');
  }

  function formatDate(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
    } catch {
      return iso;
    }
  }

  // Helpers
  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  }
  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }
  function setChecked(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  }
  function getChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }
  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
  }

  // Setup Event Listeners
  function setupListeners() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        const prevTab = state.activeTab;
        if (prevTab === tab) return;

        if (prevTab === 'raw-source') {
          const rawEditor = document.getElementById('rawJsonSourceEditor');
          if (rawEditor) {
            try {
              const parsed = JSON.parse(rawEditor.value);
              state.content = parsed;
              populateAllForms();
            } catch (err) {
              showToast('Warning: Invalid JSON in editor. Changes not parsed: ' + err.message, 'error');
            }
          }
        } else if (tab === 'raw-source') {
          state.content = collectFormToContent();
          populateRawJsonEditor();
        }

        state.activeTab = tab;

        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const targetPane = document.getElementById('pane-' + tab);
        if (targetPane) targetPane.classList.add('active');

        if (tab === 'inbox' || tab === 'audit') {
          loadAdminAuxData();
        }
      });
    });

    // Form Dirty change tracker
    document.querySelectorAll('.admin-main input, .admin-main textarea, .admin-main select').forEach(el => {
      el.addEventListener('input', () => setDirty(true));
    });

    // Top Action Buttons
    document.getElementById('btnSaveAll').addEventListener('click', saveAllChanges);
    document.getElementById('btnResetDefaults').addEventListener('click', resetToDefaults);
    document.getElementById('btnTogglePreview').addEventListener('click', toggleSplitPreview);
    document.getElementById('btnClosePreview').addEventListener('click', toggleSplitPreview);

    // Split Preview Device Controls
    const desktopBtn = document.getElementById('btnPreviewDesktop');
    if (desktopBtn) {
      desktopBtn.addEventListener('click', () => {
        const frame = document.getElementById('livePreviewFrame');
        if (frame) frame.classList.remove('mobile-view');
      });
    }

    const mobileBtn = document.getElementById('btnPreviewMobile');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        const frame = document.getElementById('livePreviewFrame');
        if (frame) frame.classList.add('mobile-view');
      });
    }

    const refreshBtn = document.getElementById('btnRefreshPreview');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        reloadPreviewFrame();
      });
    }

    // Export Button
    document.getElementById('btnExportJson').addEventListener('click', () => {
      window.open('/api/content/export', '_blank');
    });

    // Import Button & Hidden File Input
    const fileInput = document.getElementById('importFileInput');
    document.getElementById('btnImportJson').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const jsonText = evt.target.result;
          const parsed = JSON.parse(jsonText);

          const res = await apiRequest('/api/content/import', {
            method: 'POST',
            body: parsed
          });

          const data = await res.json();
          if (res.ok && data.success) {
            showToast('JSON source successfully imported!');
            await loadSourceContent();
            reloadPreviewFrame();
          } else {
            showToast('Import error: ' + data.error, 'error');
          }
        } catch (parseErr) {
          showToast('Invalid JSON file: ' + parseErr.message, 'error');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });

    // Add Dish Button
    const btnAddDish = document.getElementById('btnAddDish');
    if (btnAddDish) {
      btnAddDish.addEventListener('click', () => {
        saveLiveDishInputs();
        state.content.menu.items.unshift({
          id: 'item-' + (state.content.menu.items.length + 1),
          name: 'New Sylvana Special Dish',
          section: 'Traditional Meals & Favourites',
          category: 'Traditional Meals & Favourites',
          price: 150,
          currency: '৳',
          description: 'Delicious authentic preparation with Sylvana signature spices.',
          badge: 'New Item',
          isSpecial: false,
          imageUrl: '',
          dietary: 'Non-Veg',
          icon: '🍲'
        });
        renderMenuEditor();
        setDirty(true);
        showToast('New dish added to menu! Remember to click Save.');
      });
    }

    // Admin Menu Search & Filter
    const adminMenuSearch = document.getElementById('adminMenuSearch');
    if (adminMenuSearch) {
      adminMenuSearch.addEventListener('input', (e) => {
        state.menuSearchQuery = e.target.value;
        renderMenuEditor();
      });
    }

    const adminCategoryFilter = document.getElementById('adminCategoryFilter');
    if (adminCategoryFilter) {
      adminCategoryFilter.addEventListener('change', (e) => {
        state.menuCategoryFilter = e.target.value;
        renderMenuEditor();
      });
    }

    // Add Metric Button
    document.getElementById('btnAddMetric').addEventListener('click', () => {
      state.content.metrics = collectMetrics();
      state.content.metrics.push({
        id: 'm' + (state.content.metrics.length + 1),
        value: '100%',
        label: 'New Metric',
        desc: 'Metric description',
        icon: 'star'
      });
      renderMetricsEditor();
      setDirty(true);
    });

    // Add Feature Button
    document.getElementById('btnAddFeature').addEventListener('click', () => {
      state.content.features = collectFeatures();
      state.content.features.push({
        id: 'f' + (state.content.features.length + 1),
        title: 'New Quality Pillar',
        tag: 'Heritage',
        icon: 'star',
        description: 'Provide an overview of this dining capability and quality.',
        bullets: ['Pure spices', 'Fresh preparation']
      });
      renderFeaturesEditor();
      setDirty(true);
    });

    // Add Showcase Button
    document.getElementById('btnAddShowcase').addEventListener('click', () => {
      state.content.showcase = collectShowcase();
      state.content.showcase.push({
        id: 's' + (state.content.showcase.length + 1),
        title: 'New Signature Special',
        category: 'Traditional Meals',
        summary: 'Special dish summary and preparation details.',
        tags: ['250 ৳', 'Special'],
        gradient: 'linear-gradient(135deg, #b91c1c, #d97706)',
        link: '#menu'
      });
      renderShowcaseEditor();
      setDirty(true);
    });

    // Add Testimonial Button
    document.getElementById('btnAddTestimonial').addEventListener('click', () => {
      state.content.testimonials = collectTestimonials();
      state.content.testimonials.push({
        id: 't' + (state.content.testimonials.length + 1),
        name: 'Guest Diner',
        role: 'Shahbagh Patron',
        avatar: 'GD',
        rating: 5,
        quote: 'Wonderful food and authentic flavour every time!'
      });
      renderTestimonialsEditor();
      setDirty(true);
    });

    // Add Pricing Feast Plan Button
    document.getElementById('btnAddPricingPlan').addEventListener('click', () => {
      state.content.pricing = collectPricing();
      state.content.pricing.plans = state.content.pricing.plans || [];
      state.content.pricing.plans.push({
        id: 'p' + (state.content.pricing.plans.length + 1),
        name: 'New Feast Combo',
        monthlyPrice: 350,
        annualPrice: 320,
        featured: false,
        badge: '',
        description: 'Generous platter combo tailored for groups.',
        buttonText: 'Reserve Feast',
        features: ['Main Dish', 'Side Dish', 'Drinks']
      });
      renderPricingEditor();
      setDirty(true);
    });

    // Add FAQ Button
    document.getElementById('btnAddFaq').addEventListener('click', () => {
      state.content.faqs = collectFaqs();
      state.content.faqs.push({
        id: 'q' + (state.content.faqs.length + 1),
        question: 'New Question?',
        answer: 'Provide a clear answer about The Sylvana Restaurant.'
      });
      renderFaqsEditor();
      setDirty(true);
    });

    // Login Form Submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('loginUsername').value;
      const pass = document.getElementById('loginPassword').value;
      const alertEl = document.getElementById('loginAlert');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          state.token = data.token;
          state.user = data.username;
          localStorage.setItem('nexus_admin_token', data.token);
          document.getElementById('loginModal').style.display = 'none';
          document.getElementById('adminUserDisplay').textContent = data.username;
          showToast('Welcome to The Sylvana Restaurant Studio, ' + data.username + '!');
          await loadSourceContent();
          await loadAdminAuxData();
        } else {
          alertEl.style.display = 'block';
          alertEl.textContent = data.error || 'Invalid credentials';
        }
      } catch (err) {
        alertEl.style.display = 'block';
        alertEl.textContent = 'Login error: ' + err.message;
      }
    });

    // Logout Button
    document.getElementById('btnLogout').addEventListener('click', async () => {
      try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
      } catch {}
      handleUnauthorized();
    });

    // Keyboard Shortcuts: Ctrl+S to save
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAllChanges();
      }
    });
  }

  // Initialize Admin Studio
  async function init() {
    setupListeners();
    const isAuthed = await checkAuth();
    if (isAuthed) {
      await loadSourceContent();
      await loadAdminAuxData();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
