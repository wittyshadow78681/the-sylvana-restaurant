/**
 * The Sylvana Restaurant (দ্যা সিলভানা রেস্টুরেন্ট) - Public Single-Page Application Client
 * Streams and flows all content dynamically from the backend source of truth (/api/content)
 */

(function () {
  'use strict';

  // Application State
  const state = {
    content: null,
    isAnnualBilling: false,
    selectedSection: 'All',
    selectedCategory: 'All Dishes',
    menuSearchQuery: '',
    selectedShowcaseCategory: 'All',
    faqSearchQuery: '',
    activeFaqId: null,
    lastContentHash: ''
  };

  // DOM Cache
  const dom = {
    announcementBar: document.getElementById('announcementBar'),
    announcementBadge: document.getElementById('announcementBadge'),
    announcementText: document.getElementById('announcementText'),
    announcementLink: document.getElementById('announcementLink'),

    brandLogo: document.getElementById('brandLogo'),
    brandLogoImg: document.getElementById('brandLogoImg'),
    brandIcon: document.getElementById('brandIcon'),
    brandText: document.getElementById('brandText'),
    brandTagline: document.getElementById('brandTagline'),

    heroBadge: document.getElementById('heroBadge'),
    heroHeadline: document.getElementById('heroHeadline'),
    heroSubtitle: document.getElementById('heroSubtitle'),
    heroPrimaryCta: document.getElementById('heroPrimaryCta'),
    heroSecondaryCta: document.getElementById('heroSecondaryCta'),
    heroTrustBadge: document.getElementById('heroTrustBadge'),
    heroHighlights: document.getElementById('heroHighlights'),
    previewWidget: document.getElementById('previewWidget'),

    aboutBadge: document.getElementById('aboutBadge'),
    aboutTitle: document.getElementById('aboutTitle'),
    aboutBnTitle: document.getElementById('aboutBnTitle'),
    aboutStory1: document.getElementById('aboutStory1'),
    aboutStory2: document.getElementById('aboutStory2'),
    aboutChecklist: document.getElementById('aboutChecklist'),

    metricsGrid: document.getElementById('metricsGrid'),

    // Menu Elements
    menuEyebrow: document.getElementById('menuEyebrow'),
    menuTitle: document.getElementById('menuTitle'),
    menuSubtitle: document.getElementById('menuSubtitle'),
    menuSectionTabs: document.getElementById('menuSectionTabs'),
    menuSearchInput: document.getElementById('menuSearchInput'),
    menuSearchClear: document.getElementById('menuSearchClear'),
    menuCategoryTabs: document.getElementById('menuCategoryTabs'),
    currentCategoryLabel: document.getElementById('currentCategoryLabel'),
    menuItemCount: document.getElementById('menuItemCount'),
    menuGrid: document.getElementById('menuGrid'),

    // Showcase
    showcaseEyebrow: document.getElementById('showcaseEyebrow'),
    showcaseTitle: document.getElementById('showcaseTitle'),
    showcaseSubtitle: document.getElementById('showcaseSubtitle'),
    filterTabs: document.getElementById('filterTabs'),
    showcaseGrid: document.getElementById('showcaseGrid'),

    // Features & Reviews
    featuresEyebrow: document.getElementById('featuresEyebrow'),
    featuresTitle: document.getElementById('featuresTitle'),
    featuresSubtitle: document.getElementById('featuresSubtitle'),
    featuresGrid: document.getElementById('featuresGrid'),

    testimonialsEyebrow: document.getElementById('testimonialsEyebrow'),
    testimonialsTitle: document.getElementById('testimonialsTitle'),
    testimonialsSubtitle: document.getElementById('testimonialsSubtitle'),
    testimonialsGrid: document.getElementById('testimonialsGrid'),

    // Pricing / Platters
    pricingEyebrow: document.getElementById('pricingEyebrow'),
    pricingTitle: document.getElementById('pricingTitle'),
    pricingSubtitle: document.getElementById('pricingSubtitle'),
    pricingSwitch: document.getElementById('pricingSwitch'),
    pricingDiscountPill: document.getElementById('pricingDiscountPill'),
    pricingGrid: document.getElementById('pricingGrid'),

    // FAQs
    faqsEyebrow: document.getElementById('faqsEyebrow'),
    faqsTitle: document.getElementById('faqsTitle'),
    faqsSubtitle: document.getElementById('faqsSubtitle'),
    faqSearchInput: document.getElementById('faqSearchInput'),
    faqAccordion: document.getElementById('faqAccordion'),

    // Reservation Form
    reservationForm: document.getElementById('reservationForm'),
    reservationAlert: document.getElementById('reservationAlert'),
    resName: document.getElementById('resName'),
    resPhone: document.getElementById('resPhone'),
    resEmail: document.getElementById('resEmail'),
    resServiceType: document.getElementById('resServiceType'),
    resGuests: document.getElementById('resGuests'),
    resDateTime: document.getElementById('resDateTime'),
    resDishes: document.getElementById('resDishes'),

    // Contact
    contactTitle: document.getElementById('contactTitle'),
    contactSubtitle: document.getElementById('contactSubtitle'),
    contactEmail: document.getElementById('contactEmail'),
    contactPhone: document.getElementById('contactPhone'),
    contactAddress: document.getElementById('contactAddress'),
    contactHours: document.getElementById('contactHours'),
    socialLinks: document.getElementById('socialLinks'),

    // Footer
    footerBrandText: document.getElementById('footerBrandText'),
    footerDesc: document.getElementById('footerDesc'),
    footerNav: document.getElementById('footerNav'),
    footerCopyright: document.getElementById('footerCopyright'),

    syncToast: document.getElementById('syncToast'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    navLinks: document.getElementById('navLinks')
  };

  /**
   * Helper: Hash string to detect content source mutations
   */
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  /**
   * Helper: Sanitize text for safe HTML output
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Fetch Content Source from REST API
   */
  async function fetchContentSource(isInitial = false) {
    try {
      let response;
      try {
        response = await fetch('/api/content?t=' + Date.now(), {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('API status: ' + response.status);
      } catch (apiErr) {
        // Fallback for static hosts (e.g. GitHub Pages)
        response = await fetch('data/content.json?t=' + Date.now());
      }

      if (!response.ok) {
        throw new Error('Failed to fetch source content: ' + response.statusText);
      }

      const text = await response.text();
      const currentHash = hashString(text);

      if (currentHash === state.lastContentHash && !isInitial) {
        return; // No change in source data
      }

      state.lastContentHash = currentHash;
      state.content = JSON.parse(text);

      renderAll();

      if (!isInitial) {
        showSyncToast('Restaurant data synchronized & updated');
      }
    } catch (err) {
      console.warn('Error syncing content from source:', err);
    }
  }

  /**
   * Show Realtime Sync Notification Toast
   */
  function showSyncToast(message) {
    if (!dom.syncToast) return;
    dom.syncToast.innerHTML = `
      <span class="sync-spinner"></span>
      <span>${escapeHtml(message)}</span>
    `;
    dom.syncToast.classList.add('show');
    setTimeout(() => {
      dom.syncToast.classList.remove('show');
    }, 3500);
  }

  /**
   * Render All Site Components from Content State
   */
  function renderAll() {
    const data = state.content;
    if (!data) return;

    renderMeta(data.meta);
    renderSectionHeaders(data.sectionHeaders);
    renderHero(data.hero);
    renderAbout(data.about);
    renderMetrics(data.metrics);
    renderMenu(data.menu);
    renderShowcase(data.showcase);
    renderFeatures(data.features);
    renderPricing(data.pricing);
    renderTestimonials(data.testimonials);
    renderFaqs(data.faqs);
    renderContact(data.contact);
    renderFooter(data.footer, data.meta);
  }

  /**
   * Render Site Meta & Announcement
   */
  function renderMeta(meta) {
    if (!meta) return;

    if (meta.siteTitle) {
      document.title = meta.siteTitle;
    }

    if (meta.metaDescription) {
      const metaTag = document.querySelector('meta[name="description"]');
      if (metaTag) metaTag.setAttribute('content', meta.metaDescription);
    }

    if (meta.brandName && dom.brandText) {
      dom.brandText.textContent = meta.brandName;
    }

    if (dom.brandTagline) {
      const bn = meta.brandNameBn || 'দ্যা সিলভানা রেস্টুরেন্ট';
      dom.brandTagline.textContent = `${bn} • Shahbagh, Dhaka`;
    }

    if (meta.logoUrl && dom.brandLogoImg) {
      dom.brandLogoImg.src = meta.logoUrl;
      dom.brandLogoImg.style.display = 'inline-block';
    }

    // Dynamic Theme Colors
    if (meta.primaryColor) {
      document.documentElement.style.setProperty('--primary', meta.primaryColor);
    }
    if (meta.accentColor) {
      document.documentElement.style.setProperty('--accent', meta.accentColor);
    }

    // Announcement bar
    if (meta.announcement && meta.announcement.enabled && dom.announcementBar) {
      dom.announcementBar.style.display = 'block';
      if (dom.announcementBadge) dom.announcementBadge.textContent = meta.announcement.badge || 'OPEN DAILY';
      if (dom.announcementText) dom.announcementText.textContent = meta.announcement.text || '';
      if (dom.announcementLink) {
        dom.announcementLink.textContent = meta.announcement.linkText || 'Reserve Table';
        dom.announcementLink.setAttribute('href', meta.announcement.linkUrl || '#reservation');
      }
    } else if (dom.announcementBar) {
      dom.announcementBar.style.display = 'none';
    }
  }

  /**
   * Render Section Headers
   */
  function renderSectionHeaders(headers) {
    if (!headers) return;

    if (headers.menu) {
      if (dom.menuEyebrow && headers.menu.eyebrow) dom.menuEyebrow.textContent = headers.menu.eyebrow;
      if (dom.menuTitle && headers.menu.title) dom.menuTitle.textContent = headers.menu.title;
      if (dom.menuSubtitle && headers.menu.subtitle) dom.menuSubtitle.textContent = headers.menu.subtitle;
    }

    if (headers.features) {
      if (dom.featuresEyebrow && headers.features.eyebrow) dom.featuresEyebrow.textContent = headers.features.eyebrow;
      if (dom.featuresTitle && headers.features.title) dom.featuresTitle.textContent = headers.features.title;
      if (dom.featuresSubtitle && headers.features.subtitle) dom.featuresSubtitle.textContent = headers.features.subtitle;
    }

    if (headers.showcase) {
      if (dom.showcaseEyebrow && headers.showcase.eyebrow) dom.showcaseEyebrow.textContent = headers.showcase.eyebrow;
      if (dom.showcaseTitle && headers.showcase.title) dom.showcaseTitle.textContent = headers.showcase.title;
      if (dom.showcaseSubtitle && headers.showcase.subtitle) dom.showcaseSubtitle.textContent = headers.showcase.subtitle;
    }

    if (headers.testimonials) {
      if (dom.testimonialsEyebrow && headers.testimonials.eyebrow) dom.testimonialsEyebrow.textContent = headers.testimonials.eyebrow;
      if (dom.testimonialsTitle && headers.testimonials.title) dom.testimonialsTitle.textContent = headers.testimonials.title;
      if (dom.testimonialsSubtitle && headers.testimonials.subtitle) dom.testimonialsSubtitle.textContent = headers.testimonials.subtitle;
    }

    if (headers.pricing) {
      if (dom.pricingEyebrow && headers.pricing.eyebrow) dom.pricingEyebrow.textContent = headers.pricing.eyebrow;
      if (dom.pricingTitle && headers.pricing.title) dom.pricingTitle.textContent = headers.pricing.title;
      if (dom.pricingSubtitle && headers.pricing.subtitle) dom.pricingSubtitle.textContent = headers.pricing.subtitle;
    }

    if (headers.faqs) {
      if (dom.faqsEyebrow && headers.faqs.eyebrow) dom.faqsEyebrow.textContent = headers.faqs.eyebrow;
      if (dom.faqsTitle && headers.faqs.title) dom.faqsTitle.textContent = headers.faqs.title;
      if (dom.faqsSubtitle && headers.faqs.subtitle) dom.faqsSubtitle.textContent = headers.faqs.subtitle;
    }
  }

  /**
   * Render Hero Section
   */
  function renderHero(hero) {
    if (!hero) return;

    if (dom.heroBadge) {
      dom.heroBadge.innerHTML = `
        <span class="eyebrow-pulse"></span>
        <span>${escapeHtml(hero.badge || '✨ Authentic Culinary Heritage in Shahbagh, Dhaka')}</span>
      `;
    }

    if (dom.heroHeadline) {
      const start = escapeHtml(hero.headlineStart || 'Welcome to');
      const highlight = escapeHtml(hero.headlineHighlight || 'The Sylvana Restaurant');
      const end = escapeHtml(hero.headlineEnd || 'দ্যা সিলভানা রেস্টুরেন্ট');
      dom.heroHeadline.innerHTML = `${start} <span class="gradient-text">${highlight}</span> <span class="bn-title">${end}</span>`;
    }

    if (dom.heroSubtitle) {
      dom.heroSubtitle.textContent = hero.subtitle || '';
    }

    if (dom.heroPrimaryCta && hero.primaryCta) {
      dom.heroPrimaryCta.textContent = hero.primaryCta.text || 'Explore 38 Dishes →';
      dom.heroPrimaryCta.setAttribute('href', hero.primaryCta.url || '#menu');
    }

    if (dom.heroSecondaryCta && hero.secondaryCta) {
      dom.heroSecondaryCta.textContent = hero.secondaryCta.text || 'Book a Table';
      dom.heroSecondaryCta.setAttribute('href', hero.secondaryCta.url || '#reservation');
    }

    if (dom.heroTrustBadge) {
      dom.heroTrustBadge.textContent = hero.trustBadge || '📍 10, Shahbagh Biponi Bithan, Dhaka-1000 • Open 7 Days: 7:00 AM – 11:30 PM';
    }

    // Highlights list
    if (dom.heroHighlights && Array.isArray(hero.highlights)) {
      dom.heroHighlights.innerHTML = hero.highlights.map(item => `
        <div class="highlight-item">
          <span class="highlight-check">✓</span>
          <span>${escapeHtml(item)}</span>
        </div>
      `).join('');
    }

    // Hero Widget Card
    if (dom.previewWidget && hero.previewCard) {
      const pc = hero.previewCard;
      dom.previewWidget.innerHTML = `
        <div class="widget-header">
          <div class="widget-title-area">
            <img src="/assets/sylvana-logo.png" alt="Logo" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px;" onerror="this.style.display='none'">
            <strong style="color: #fff; font-size: 1.05rem;">${escapeHtml(pc.title || 'The Sylvana Restaurant')}</strong>
          </div>
          <span class="widget-status-pill">
            <span class="eyebrow-pulse"></span>
            ${escapeHtml(pc.status || 'Dine-in & Takeaway Open')}
          </span>
        </div>
        <div class="widget-bengali-banner">
          দ্যা সিলভানা রেস্টুরেন্ট — শাহবাগে সেরা খাবারের ঠিকানা
        </div>
        <div class="widget-stats-grid">
          <div class="widget-stat-box">
            <div class="widget-stat-label">${escapeHtml(pc.metric1 ? pc.metric1.label : 'Daily Service')}</div>
            <div class="widget-stat-val gradient-text">${escapeHtml(pc.metric1 ? pc.metric1.value : '7:00 AM - 11:30 PM')}</div>
          </div>
          <div class="widget-stat-box">
            <div class="widget-stat-label">${escapeHtml(pc.metric2 ? pc.metric2.label : 'Location')}</div>
            <div class="widget-stat-val" style="color: #f59e0b;">${escapeHtml(pc.metric2 ? pc.metric2.value : 'Shahbagh, Dhaka')}</div>
          </div>
        </div>
        <div class="widget-menu-peek">
          <div class="peek-item">
            <span class="peek-dish">Mutton Kacchi Biryani</span>
            <span class="peek-price">320 ৳</span>
          </div>
          <div class="peek-item">
            <span class="peek-dish">Plain Rice with Beef Bhuna</span>
            <span class="peek-price">270 ৳</span>
          </div>
          <div class="peek-item">
            <span class="peek-dish">Paratha with Dim Bhuna</span>
            <span class="peek-price">130 ৳</span>
          </div>
        </div>
        <div class="widget-activity-bar">
          <span style="color: #cbd5e1; font-size: 0.825rem;">
            📞 Hotline: <a href="tel:+8801734489275" style="color: #f59e0b; text-decoration: none; font-weight: 600;">+8801734489275</a>
          </span>
          <span class="badge" style="background: rgba(230, 57, 23, 0.2); color: #f87171;">100% Halal</span>
        </div>
      `;
    }
  }

  /**
   * Render About Our Heritage Section
   */
  function renderAbout(about) {
    if (!about) return;
    if (dom.aboutBadge && about.badge) dom.aboutBadge.textContent = about.badge;
    if (dom.aboutTitle && about.title) dom.aboutTitle.textContent = about.title;
    if (dom.aboutBnTitle && about.bengaliTitle) dom.aboutBnTitle.textContent = about.bengaliTitle;
    if (dom.aboutStory1 && about.story1) dom.aboutStory1.textContent = about.story1;
    if (dom.aboutStory2 && about.story2) dom.aboutStory2.textContent = about.story2;

    if (dom.aboutChecklist && Array.isArray(about.highlights)) {
      dom.aboutChecklist.innerHTML = about.highlights.map(h => `
        <div class="check-row">
          <span class="check-bullet">✔</span>
          <span>${escapeHtml(h)}</span>
        </div>
      `).join('');
    }
  }

  /**
   * Render Metrics Strip
   */
  function renderMetrics(metrics) {
    if (!dom.metricsGrid || !Array.isArray(metrics)) return;

    dom.metricsGrid.innerHTML = metrics.map(m => `
      <div class="metric-card">
        <div class="metric-value">${escapeHtml(m.value)}</div>
        <div class="metric-label">${escapeHtml(m.label)}</div>
        <div class="metric-desc">${escapeHtml(m.desc)}</div>
      </div>
    `).join('');
  }

  /**
   * Render Interactive Categorized Menu (Breakfast, Lunch & Dinner, Traditional Meals & Favourites, Drinks & Desserts)
   */
  function renderMenu(menu) {
    if (!menu || !Array.isArray(menu.items)) return;

    const items = menu.items;

    // 1. Setup Dining Section Tabs (Breakfast, Lunch & Dinner, Traditional Meals, Drinks & Desserts)
    if (dom.menuSectionTabs) {
      dom.menuSectionTabs.querySelectorAll('.section-tab-btn').forEach(btn => {
        const sec = btn.getAttribute('data-section');
        btn.classList.toggle('active', sec === state.selectedSection);
        btn.onclick = () => {
          state.selectedSection = sec;
          state.selectedCategory = 'All Dishes';
          renderMenu(state.content.menu);
        };
      });
    }

    // 2. Build Category Tabs for currently selected section
    const relevantItems = state.selectedSection === 'All'
      ? items
      : items.filter(it => it.section === state.selectedSection ||
          (state.selectedSection === 'Breakfast' && (it.category === 'Breakfast Menu' || it.category === 'Tea Item')) ||
          (state.selectedSection === 'Lunch & Dinner' && (it.category === 'Soups & Appetizers' || it.category === 'Gourmet Burgers' || it.category === 'Pizza & Pasta')) ||
          (state.selectedSection === 'Traditional Meals & Favourites' && it.category === 'Traditional Meals & Favourites') ||
          (state.selectedSection === 'Drinks & Desserts' && (it.category === 'Desserts' || it.category === 'Tea, Coffee & Refreshments' || it.category === 'Lassis, Milkshakes & Juice'))
        );

    const categories = ['All Dishes'];
    relevantItems.forEach(it => {
      if (it.category && !categories.includes(it.category)) {
        categories.push(it.category);
      }
    });

    if (dom.menuCategoryTabs) {
      dom.menuCategoryTabs.innerHTML = categories.map(cat => `
        <button class="menu-cat-btn ${cat === state.selectedCategory ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `).join('');

      dom.menuCategoryTabs.querySelectorAll('.menu-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedCategory = btn.getAttribute('data-cat');
          renderMenu(state.content.menu);
        });
      });
    }

    // 3. Filter Items by Section, Category & Search Query
    let filtered = items;

    if (state.selectedSection !== 'All') {
      filtered = filtered.filter(it =>
        it.section === state.selectedSection ||
        (state.selectedSection === 'Breakfast' && (it.category === 'Breakfast Menu' || it.category === 'Tea Item')) ||
        (state.selectedSection === 'Lunch & Dinner' && (it.category === 'Soups & Appetizers' || it.category === 'Gourmet Burgers' || it.category === 'Pizza & Pasta')) ||
        (state.selectedSection === 'Traditional Meals & Favourites' && it.category === 'Traditional Meals & Favourites') ||
        (state.selectedSection === 'Drinks & Desserts' && (it.category === 'Desserts' || it.category === 'Tea, Coffee & Refreshments' || it.category === 'Lassis, Milkshakes & Juice'))
      );
    }

    if (state.selectedCategory !== 'All Dishes') {
      if (state.selectedCategory === 'Tea, Coffee & Refreshments') {
        filtered = filtered.filter(it => it.category === 'Tea, Coffee & Refreshments' || it.category === 'Tea Item');
      } else {
        filtered = filtered.filter(it => it.category === state.selectedCategory);
      }
    }

    const search = state.menuSearchQuery.toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(it =>
        (it.name && it.name.toLowerCase().includes(search)) ||
        (it.description && it.description.toLowerCase().includes(search)) ||
        (it.category && it.category.toLowerCase().includes(search)) ||
        (it.section && it.section.toLowerCase().includes(search)) ||
        (it.badge && it.badge.toLowerCase().includes(search)) ||
        (it.dietary && it.dietary.toLowerCase().includes(search)) ||
        (it.price && String(it.price).includes(search))
      );
    }

    // Update status indicators
    if (dom.currentCategoryLabel) {
      const secLabel = state.selectedSection !== 'All' ? `[${state.selectedSection}] ` : '';
      dom.currentCategoryLabel.textContent = `${secLabel}${state.selectedCategory}` + (search ? ` (Search: "${search}")` : '');
    }
    if (dom.menuItemCount) dom.menuItemCount.textContent = filtered.length;

    // 4. Render Dish Cards
    if (dom.menuGrid) {
      if (filtered.length === 0) {
        dom.menuGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
            <div style="font-size: 2rem; margin-bottom: 8px;">🍽️</div>
            <h4>No dishes matched "${escapeHtml(state.menuSearchQuery)}" in ${escapeHtml(state.selectedCategory)}</h4>
            <p style="margin-top: 6px; font-size: 0.9rem;">Try searching for another dish like "Biryani", "Paratha", "Tea", or "Beef", or reset the category filter.</p>
            <button type="button" class="btn btn-secondary btn-sm" id="btnResetMenuFilter" style="margin-top: 16px;">
              Show All Dishes
            </button>
          </div>
        `;
        const resetBtn = document.getElementById('btnResetMenuFilter');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            state.selectedSection = 'All';
            state.selectedCategory = 'All Dishes';
            state.menuSearchQuery = '';
            if (dom.menuSearchInput) dom.menuSearchInput.value = '';
            if (dom.menuSearchClear) dom.menuSearchClear.style.display = 'none';
            renderMenu(state.content.menu);
          });
        }
        return;
      }

      dom.menuGrid.innerHTML = filtered.map(dish => {
        const icon = dish.icon || '🍛';
        const imgHtml = dish.imageUrl
          ? `<img src="${escapeAttr(dish.imageUrl)}" alt="${escapeAttr(dish.name)}" class="dish-card-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
          : '';
        const iconBoxStyle = dish.imageUrl ? 'style="display:none;"' : '';
        const iconBoxHtml = `<div class="dish-icon-box" ${iconBoxStyle}>${icon}</div>`;

        const badgeHtml = dish.badge
          ? `<span class="dish-badge-pill dish-badge-special">${escapeHtml(dish.badge)}</span>`
          : '';
        const dietaryHtml = dish.dietary
          ? `<span class="dish-badge-pill dish-badge-category">${escapeHtml(dish.dietary)}</span>`
          : '';

        return `
          <div class="dish-card" data-id="${escapeHtml(dish.id)}">
            <div class="dish-top">
              <div style="display: flex; align-items: center; gap: 10px;">
                ${imgHtml}
                ${iconBoxHtml}
              </div>
              <div class="dish-badges">
                ${badgeHtml}
                <span class="dish-badge-pill dish-badge-category">${escapeHtml(dish.category)}</span>
                ${dietaryHtml}
              </div>
            </div>

            <h3 class="dish-title">${escapeHtml(dish.name)}</h3>
            <p class="dish-desc">${escapeHtml(dish.description || 'Authentic dish prepared fresh daily with Sylvana heritage spices.')}</p>

            <div class="dish-footer">
              <div class="dish-price-tag">
                <span>${dish.price}</span>
                <span class="currency-sym">${escapeHtml(dish.currency || '৳')}</span>
              </div>
              <button type="button" class="dish-order-btn" data-dish="${escapeHtml(dish.name)}" data-price="${dish.price}">
                Reserve / Order &rarr;
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Quick Order button handler: auto-populates reservation form!
      dom.menuGrid.querySelectorAll('.dish-order-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dishName = btn.getAttribute('data-dish');
          const price = btn.getAttribute('data-price');
          selectDishForReservation(dishName, price);
        });
      });
    }
  }

  /**
   * Auto-fill Table Reservation form when clicking "Reserve / Order" on a dish card
   */
  function selectDishForReservation(dishName, price) {
    if (dom.resDishes) {
      const current = dom.resDishes.value.trim();
      const addition = `${dishName} (${price} ৳)`;
      if (current.includes(dishName)) {
        // already added
      } else {
        dom.resDishes.value = current ? `${current}, ${addition}` : addition;
      }
    }

    const reservationSection = document.getElementById('reservation');
    if (reservationSection) {
      reservationSection.scrollIntoView({ behavior: 'smooth' });
      if (dom.resName) dom.resName.focus();
    }

    showSyncToast(`Added "${dishName}" to your reservation request`);
  }

  /**
   * Render Showcase (Chef's Signature Favourites)
   */
  function renderShowcase(items) {
    if (!dom.showcaseGrid || !Array.isArray(items)) return;

    const categories = ['All'];
    items.forEach(it => {
      if (it.category && !categories.includes(it.category)) {
        categories.push(it.category);
      }
    });

    if (dom.filterTabs) {
      dom.filterTabs.innerHTML = categories.map(cat => `
        <button class="filter-btn ${cat === state.selectedShowcaseCategory ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `).join('');

      dom.filterTabs.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedShowcaseCategory = btn.getAttribute('data-cat');
          renderShowcase(state.content.showcase);
        });
      });
    }

    const filtered = state.selectedShowcaseCategory === 'All'
      ? items
      : items.filter(it => it.category === state.selectedShowcaseCategory);

    dom.showcaseGrid.innerHTML = filtered.map(it => {
      const tagsHtml = Array.isArray(it.tags)
        ? `<div class="showcase-tags">${it.tags.map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('')}</div>`
        : '';

      return `
        <div class="showcase-card">
          <div class="showcase-banner" style="background: ${it.gradient || 'linear-gradient(135deg, #b91c1c, #d97706)'};">
            <span class="showcase-category-pill">${escapeHtml(it.category)}</span>
          </div>
          <div class="showcase-body">
            <h3 class="showcase-title">${escapeHtml(it.title)}</h3>
            <p class="showcase-summary">${escapeHtml(it.summary)}</p>
            ${tagsHtml}
            <a href="${escapeHtml(it.link || '#menu')}" class="btn btn-secondary btn-sm" style="width: fit-content; margin-top: auto;">
              View on Menu →
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Features (Why Dine With Us)
   */
  function renderFeatures(features) {
    if (!dom.featuresGrid || !Array.isArray(features)) return;

    dom.featuresGrid.innerHTML = features.map(f => {
      const bulletsHtml = Array.isArray(f.bullets)
        ? `<ul class="feature-bullets">${f.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';

      return `
        <div class="feature-card">
          <div class="feature-top">
            <div class="feature-icon-box" style="background: rgba(230, 57, 23, 0.15); color: #f87171; border: 1px solid rgba(230, 57, 23, 0.3);">
              🍽️
            </div>
            <span class="feature-tag">${escapeHtml(f.tag || 'Heritage')}</span>
          </div>
          <h3 class="feature-title">${escapeHtml(f.title)}</h3>
          <p class="feature-desc">${escapeHtml(f.description)}</p>
          ${bulletsHtml}
        </div>
      `;
    }).join('');
  }

  /**
   * Render Testimonials
   */
  function renderTestimonials(testimonials) {
    if (!dom.testimonialsGrid || !Array.isArray(testimonials)) return;

    dom.testimonialsGrid.innerHTML = testimonials.map(t => {
      const stars = '★'.repeat(t.rating || 5);
      return `
        <div class="testimonial-card">
          <div class="star-rating" style="color: #f59e0b;">${stars}</div>
          <p class="testimonial-quote">"${escapeHtml(t.quote)}"</p>
          <div class="testimonial-author">
            <div class="author-avatar" style="background: linear-gradient(135deg, var(--primary), #991b1b);">${escapeHtml(t.avatar || 'SR')}</div>
            <div class="author-info">
              <h4>${escapeHtml(t.name)}</h4>
              <p>${escapeHtml(t.role)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Pricing / Set Meals & Platters
   */
  function renderPricing(pricing) {
    if (!dom.pricingGrid || !pricing || !Array.isArray(pricing.plans)) return;

    if (dom.pricingDiscountPill && pricing.billingAnnualDiscount) {
      dom.pricingDiscountPill.textContent = pricing.billingAnnualDiscount;
    }

    dom.pricingGrid.innerHTML = pricing.plans.map(p => {
      const price = state.isAnnualBilling ? p.annualPrice : p.monthlyPrice;
      const period = state.isAnnualBilling ? '৳ (Group Special)' : '৳ (Standard)';
      const badgeHtml = p.badge
        ? `<div class="popular-badge" style="background: linear-gradient(135deg, var(--primary), #b91c1c);">${escapeHtml(p.badge)}</div>`
        : '';

      const featuresHtml = Array.isArray(p.features)
        ? `<ul class="plan-features-list">${p.features.map(f => `<li><span class="check-icon" style="color: var(--accent);">✓</span> ${escapeHtml(f)}</li>`).join('')}</ul>`
        : '';

      return `
        <div class="pricing-card ${p.featured ? 'featured' : ''}">
          ${badgeHtml}
          <h3 class="plan-name">${escapeHtml(p.name)}</h3>
          <p class="plan-desc">${escapeHtml(p.description)}</p>
          <div class="plan-price-box">
            <span class="amount" style="color: var(--accent);">${price}</span>
            <span class="period" style="font-size: 0.95rem; font-weight: 600;">${period}</span>
          </div>
          ${featuresHtml}
          <a href="#reservation" class="btn ${p.featured ? 'btn-primary' : 'btn-secondary'}" style="width: 100%;">
            ${escapeHtml(p.buttonText || 'Reserve Feast')}
          </a>
        </div>
      `;
    }).join('');
  }

  /**
   * Render FAQs Accordion
   */
  function renderFaqs(faqs) {
    if (!dom.faqAccordion || !Array.isArray(faqs)) return;

    const query = state.faqSearchQuery.toLowerCase().trim();
    const filtered = query
      ? faqs.filter(f => (f.question && f.question.toLowerCase().includes(query)) || (f.answer && f.answer.toLowerCase().includes(query)))
      : faqs;

    if (filtered.length === 0) {
      dom.faqAccordion.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 24px;">
          No questions matched your search.
        </div>
      `;
      return;
    }

    dom.faqAccordion.innerHTML = filtered.map((f, idx) => {
      const isOpen = state.activeFaqId ? (f.id === state.activeFaqId) : (idx === 0 && !query);
      return `
      <div class="faq-item ${isOpen ? 'open' : ''}" data-id="${escapeHtml(f.id)}">
        <button class="faq-question-btn" type="button">
          <span>${escapeHtml(f.question)}</span>
          <span class="faq-chevron">▼</span>
        </button>
        <div class="faq-answer">
          ${escapeHtml(f.answer)}
        </div>
      </div>
    `;
    }).join('');

    dom.faqAccordion.querySelectorAll('.faq-question-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        dom.faqAccordion.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
          state.activeFaqId = item.getAttribute('data-id');
        } else {
          state.activeFaqId = null;
        }
      });
    });
  }

  /**
   * Render Contact Information
   */
  function renderContact(contact) {
    if (!contact) return;

    if (dom.contactTitle && contact.title) dom.contactTitle.textContent = contact.title;
    if (dom.contactSubtitle && contact.subtitle) dom.contactSubtitle.textContent = contact.subtitle;

    if (dom.contactEmail && contact.email) {
      dom.contactEmail.textContent = contact.email;
      dom.contactEmail.setAttribute('href', 'mailto:' + contact.email);
    }
    if (dom.contactPhone && contact.phone) {
      dom.contactPhone.textContent = contact.phone;
      dom.contactPhone.setAttribute('href', 'tel:' + contact.phone);
    }
    if (dom.contactAddress && contact.address) dom.contactAddress.textContent = contact.address;
    if (dom.contactHours && contact.hours) dom.contactHours.textContent = contact.hours;

    if (dom.socialLinks && contact.social) {
      const s = contact.social;
      dom.socialLinks.innerHTML = `
        <a href="${escapeHtml(s.twitter || 'https://facebook.com/sylvanarestaurantbd')}" target="_blank" rel="noopener" class="social-btn" title="Facebook">FB</a>
        <a href="${escapeHtml(s.github || 'https://instagram.com/sylvanarestaurantbd')}" target="_blank" rel="noopener" class="social-btn" title="Instagram">IG</a>
        <a href="https://wa.me/8801734489275" target="_blank" rel="noopener" class="social-btn" title="WhatsApp">WA</a>
        <a href="tel:+8801734489275" class="social-btn" title="Call Direct">📞</a>
      `;
    }
  }

  /**
   * Render Footer Information
   */
  function renderFooter(footer, meta) {
    if (!footer) return;

    if (dom.footerBrandText && meta && meta.brandName) {
      dom.footerBrandText.textContent = meta.brandName;
    }
    if (dom.footerDesc && footer.description) {
      dom.footerDesc.textContent = footer.description;
    }
    if (dom.footerCopyright && footer.copyright) {
      dom.footerCopyright.textContent = footer.copyright;
    }

    if (dom.footerNav && Array.isArray(footer.links)) {
      dom.footerNav.innerHTML = footer.links.map(l => `
        <li><a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a></li>
      `).join('');
    }
  }

  /**
   * Setup Event Listeners
   */
  function setupListeners() {
    // Menu live search input
    if (dom.menuSearchInput) {
      dom.menuSearchInput.addEventListener('input', (e) => {
        state.menuSearchQuery = e.target.value;
        if (dom.menuSearchClear) {
          dom.menuSearchClear.style.display = state.menuSearchQuery ? 'block' : 'none';
        }
        if (state.content && state.content.menu) {
          renderMenu(state.content.menu);
        }
      });
    }

    // Menu search clear button
    if (dom.menuSearchClear) {
      dom.menuSearchClear.addEventListener('click', () => {
        state.menuSearchQuery = '';
        if (dom.menuSearchInput) dom.menuSearchInput.value = '';
        dom.menuSearchClear.style.display = 'none';
        if (state.content && state.content.menu) {
          renderMenu(state.content.menu);
        }
      });
    }

    // Pricing switch
    if (dom.pricingSwitch) {
      dom.pricingSwitch.addEventListener('click', () => {
        state.isAnnualBilling = !state.isAnnualBilling;
        dom.pricingSwitch.classList.toggle('active', state.isAnnualBilling);
        if (state.content && state.content.pricing) {
          renderPricing(state.content.pricing);
        }
      });
    }

    // FAQ search input
    if (dom.faqSearchInput) {
      dom.faqSearchInput.addEventListener('input', (e) => {
        state.faqSearchQuery = e.target.value;
        if (state.content && state.content.faqs) {
          renderFaqs(state.content.faqs);
        }
      });
    }

    // Table Reservation & Order Inquiry Form Submission
    if (dom.reservationForm) {
      dom.reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = dom.reservationForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        const name = dom.resName.value.trim();
        const phone = dom.resPhone.value.trim();
        const email = dom.resEmail.value.trim();
        const serviceType = dom.resServiceType ? dom.resServiceType.value : 'Table Reservation';
        const guests = dom.resGuests ? dom.resGuests.value : '3-4 Persons';
        const dateTime = dom.resDateTime ? dom.resDateTime.value.trim() : 'As soon as possible';
        const dishes = dom.resDishes ? dom.resDishes.value.trim() : 'None specified';

        const subject = `[${serviceType}] ${name} (${guests}, ${dateTime})`;
        const messageBody = `Customer Name: ${name}
Phone / Mobile: ${phone}
Email: ${email}
Service Requested: ${serviceType}
Guests / Servings: ${guests}
Preferred Date & Time: ${dateTime}

Dishes / Special Requests:
${dishes}`;

        const payload = {
          name: name,
          email: email,
          subject: subject,
          message: messageBody
        };

        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="sync-spinner"></span> Submitting Reservation...';

          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (res.ok && data.success) {
            dom.reservationAlert.style.display = 'block';
            dom.reservationAlert.className = 'form-alert success';
            dom.reservationAlert.innerHTML = `
              <strong>✓ Reservation Received!</strong><br>
              Thank you, ${escapeHtml(name)}. We have received your booking request for ${escapeHtml(guests)}. Our team at Shahbagh will prepare your table. For urgent requests, call <a href="tel:+8801734489275" style="color: #fff; text-decoration: underline;">+8801734489275</a>.
            `;
            dom.reservationForm.reset();
          } else {
            dom.reservationAlert.style.display = 'block';
            dom.reservationAlert.className = 'form-alert error';
            dom.reservationAlert.textContent = data.error || 'Failed to submit reservation.';
          }
        } catch (err) {
          dom.reservationAlert.style.display = 'block';
          dom.reservationAlert.className = 'form-alert error';
          dom.reservationAlert.textContent = 'Network error while submitting: ' + err.message;
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          setTimeout(() => {
            if (dom.reservationAlert) dom.reservationAlert.style.display = 'none';
          }, 9000);
        }
      });
    }

    // Mobile nav toggle
    if (dom.mobileMenuBtn && dom.navLinks) {
      dom.mobileMenuBtn.addEventListener('click', () => {
        dom.navLinks.classList.toggle('mobile-active');
      });

      dom.navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          dom.navLinks.classList.remove('mobile-active');
        });
      });
    }
  }

  // Initialize
  async function init() {
    setupListeners();
    await fetchContentSource(true);

    // Continuous Realtime Source Sync (poll every 4 seconds)
    setInterval(() => {
      fetchContentSource(false);
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
