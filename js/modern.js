/**
 * The Sylvana Restaurant - Minimal, Modern, Light & Responsive Web Script
 * Printable Menu Leaf with 3 Highlighted Categories (Breakfast | Lunch & Dinner | Drinks & Others)
 * Realtime In-Line Editing with Server-Side Persistence (/api/save.php)
 */

(function () {
  const DEFAULT_CONTENT = {"meta": {"siteTitle": "The Sylvana Restaurant | Authentic Food Menu in Shahbagh, Dhaka", "siteTagline": "দ্যা সিলভানা রেস্টুরেন্ট - Traditional Flavours & Warm Hospitality", "metaDescription": "Authentic printed food & beverage menu for The Sylvana Restaurant in Shahbagh, Dhaka. Open daily 7:30 AM to 11:00 PM.", "brandName": "The Sylvana Restaurant", "brandNameBn": "দ্যা সিলভানা রেস্টুরেন্ট", "logoUrl": "assets/sylvana-logo.png", "logoIcon": "🍽️", "primaryColor": "#d9381e", "accentColor": "#b91c1c", "secondaryColor": "#d97706"}, "hero": {"badge": "Open Daily: 7:30 AM – 11:00 PM • Shahbagh, Dhaka", "headlineStart": "Welcome to", "headlineHighlight": "The Sylvana Restaurant", "headlineEnd": "দ্যা সিলভানা রেস্টুরেন্ট", "subtitle": "Welcome to The Sylvana Restaurant. Discover authentic Mutton Kacchi Biryani, traditional morning breakfast, clay-oven naans, burgers, and refreshing desserts crafted fresh daily in Shahbagh, Dhaka."}, "menu": {"title": "Food & Beverage Menu", "subtitle": "Select a category below to explore our authentic printed restaurant menu.", "categories": [{"id": "breakfast", "name": "Breakfast", "nameBn": "সকালের নাস্তা ও চা", "icon": "🌅", "badge": "Morning Specials • 7:30 AM – 11:30 AM", "tagline": "Freshly rolled parathas, hot lentils, eggs, khichuri & authentic milk tea", "items": [{"id": "b1", "num": "1", "name": "Paratha with Bhaji", "desc": "2 Parathas & spiced mixed vegetables.", "price": 100, "currency": "৳"}, {"id": "b2", "num": "2", "name": "Paratha with Dal", "desc": "2 Parathas & seasoned lentils.", "price": 90, "currency": "৳"}, {"id": "b3", "num": "3", "name": "Eggs with Paratha", "desc": "2 Parathas & 2 fried eggs.", "price": 140, "currency": "৳"}, {"id": "b4", "num": "4", "name": "Paratha with Dim Bhuna", "desc": "2 Parathas with eggs, onions & tomato gravy.", "price": 130, "currency": "৳"}, {"id": "b5", "num": "5", "name": "Khichuri with Omelet", "desc": "Rice & lentils served with onion, green chili & omelet.", "price": 150, "currency": "৳"}, {"id": "b6", "num": "6", "name": "Eggs Omelet", "desc": "Onion, coriander & green chili.", "price": 70, "currency": "৳"}, {"id": "b7", "num": "7", "name": "Plain Naan (each)", "desc": "Warm clay-oven baked tandoori naan", "price": 40, "currency": "৳"}, {"id": "b8", "num": "8", "name": "Garlic Naan (each)", "desc": "Clay-oven baked naan infused with fresh garlic & butter", "price": 50, "currency": "৳"}, {"id": "b9", "num": "9", "name": "Paratha (each)", "desc": "Crispy golden layered flatbread", "price": 30, "currency": "৳"}, {"id": "b10", "num": "10", "name": "Black Tea", "desc": "Freshly brewed hot black tea", "price": 30, "currency": "৳"}, {"id": "b11", "num": "11", "name": "Milk Tea", "desc": "Classic creamy Bangladeshi slow-boiled milk tea", "price": 40, "currency": "৳"}, {"id": "b12", "num": "12", "name": "Masala Tea", "desc": "Hot tea infused with cardamom, clove & aromatic spices", "price": 60, "currency": "৳"}]}, {"id": "dinner", "name": "Lunch & Dinner", "nameBn": "দুপুর ও রাতের খাবার", "icon": "🍲", "badge": "Lunch & Dinner • All Day Mains", "tagline": "Starters, burgers, pizzas, authentic Kacchi Biryani & traditional favorites", "items": [{"id": "d1", "num": "1", "name": "Chicken Soup (Thick/Clear)", "desc": "Eggs, chickens, chilis, lemons & vegetables.", "price": 150, "currency": "৳"}, {"id": "d2", "num": "2", "name": "French Fries", "desc": "With tomato/BBQ sauce.", "price": 130, "currency": "৳"}, {"id": "d3", "num": "3", "name": "Samosa (2 pcs)", "desc": "With salad & tomato/BBQ sauce.", "price": 100, "currency": "৳"}, {"id": "d4", "num": "4", "name": "Spicy Fried Chicken (6 pcs)", "desc": "With tomato/BBQ sauce.", "price": 350, "currency": "৳"}, {"id": "d5", "num": "5", "name": "Vegetables Spring Rolls (4 pcs)", "desc": "With tomato/BBQ sauce.", "price": 120, "currency": "৳"}, {"id": "d6", "num": "6", "name": "Chicken Burger", "desc": "Lettuce, tomato & mayonnaise.", "price": 180, "currency": "৳"}, {"id": "d7", "num": "7", "name": "Beef Burger", "desc": "Lettuce, tomato, mayonnaise & cheese.", "price": 220, "currency": "৳"}, {"id": "d8", "num": "8", "name": "Plain Margherita Pizza", "desc": "Tomato base, cheese & oregano.", "price": 320, "currency": "৳"}, {"id": "d9", "num": "9", "name": "Italian Pasta", "desc": "Tomato sauce, cheese, chili, green peas & coriander.", "price": 220, "currency": "৳"}, {"id": "d10", "num": "10", "name": "Plain Rice with Beef Bhuna", "desc": "White rice, tender beef rezala in rich Bengali spices.", "price": 270, "currency": "৳"}, {"id": "d11", "num": "11", "name": "Naan with Beef curry", "desc": "Naan, tender beef curry in rich Bengali spices.", "price": 280, "currency": "৳"}, {"id": "d12", "num": "12", "name": "Mutton Kacchi Biryani", "desc": "Basmati rice, tender mutton, potato & aromatic spices.", "price": 320, "currency": "৳"}, {"id": "d13", "num": "13", "name": "Chicken Biryani", "desc": "Aromatic polao rice, chicken & traditional Bengali spices.", "price": 230, "currency": "৳"}, {"id": "d14", "num": "14", "name": "Chicken Dum Biryani", "desc": "Aromatic polao rice, spiced chicken & raita.", "price": 260, "currency": "৳"}, {"id": "d15", "num": "15", "name": "Beef Tehari", "desc": "Aromatic polao rice, tender beef, boiled egg & spices.", "price": 230, "currency": "৳"}, {"id": "d16", "num": "16", "name": "Beef Bhuna Khichuri", "desc": "Aromatic rice, lentils, beef & vegetables.", "price": 260, "currency": "৳"}, {"id": "d17", "num": "17", "name": "Chicken Bhuna Khichuri", "desc": "Aromatic rice, lentils, chicken & vegetables.", "price": 230, "currency": "৳"}, {"id": "d18", "num": "18", "name": "Fish curry with rice (Rui/Katla)", "desc": "Tomato based gravy, chili, garlic & coriander.", "price": 250, "currency": "৳"}, {"id": "d19", "num": "19", "name": "Plain Rice", "desc": "Steamed fragrant long-grain rice.", "price": 60, "currency": "৳"}, {"id": "d20", "num": "20", "name": "Naan", "desc": "Soft, hot clay-oven baked naan.", "price": 40, "currency": "৳"}, {"id": "d21", "num": "21", "name": "Garlic Naan", "desc": "Clay-oven baked naan infused with fresh garlic & butter.", "price": 50, "currency": "৳"}, {"id": "d22", "num": "22", "name": "Dal (Lentil Soup)", "desc": "Warm spiced yellow lentil soup tempered with garlic & cumin.", "price": 40, "currency": "৳"}, {"id": "d23", "num": "23", "name": "Raita", "desc": "Cooling spiced whipped yogurt with herbs & cucumber.", "price": 70, "currency": "৳"}, {"id": "d24", "num": "24", "name": "Alu Bhorta (Potato mash)", "desc": "Bengali mustard potato mash with caramelized onions & green chili.", "price": 50, "currency": "৳"}, {"id": "d25", "num": "25", "name": "Mixed Salad", "desc": "Lettuce, tomato, cucumber, onions, chili & lemon.", "price": 120, "currency": "৳"}]}, {"id": "other", "name": "Drinks & Others", "nameBn": "পানীয় ও ডেজার্ট", "icon": "🍹", "badge": "Desserts, Tea, Coffee & Beverages", "tagline": "Sweet desserts, fresh brews, hand-churned lassis & chilled fruit juices", "items": [{"id": "o1", "num": "26", "name": "Gulab Jamun", "desc": "Soft sweets soaked in sugar syrup.", "price": 70, "currency": "৳"}, {"id": "o2", "num": "27", "name": "Firni- (Bengali rice pudding)", "desc": "Chilled creamy Chinigura rice pudding infused with saffron & cardamom.", "price": 100, "currency": "৳"}, {"id": "o3", "num": "28", "name": "Sweet Yoghurt (Mishti Doi)", "desc": "Cool, creamy traditional sweet yoghurt.", "price": 100, "currency": "৳"}, {"id": "o4", "num": "29", "name": "Ice-Cream (vanilla/chocolate)", "desc": "Rich creamy scoops of premium ice cream.", "price": 150, "currency": "৳"}, {"id": "o5", "num": "30", "name": "Black Tea", "desc": "Pure refreshing brewed hot black tea.", "price": 30, "currency": "৳"}, {"id": "o6", "num": "31", "name": "Milk Tea", "desc": "Classic creamy Bangladeshi slow-boiled milk tea.", "price": 40, "currency": "৳"}, {"id": "o7", "num": "32", "name": "Masala Tea", "desc": "Hot tea infused with cardamom, clove & aromatic spices.", "price": 60, "currency": "৳"}, {"id": "o8", "num": "33", "name": "Regular Hot Coffee", "desc": "Freshly brewed aromatic hot coffee.", "price": 90, "currency": "৳"}, {"id": "o9", "num": "34", "name": "Soft Drinks (Coca-Cola, Sprite, Fanta)", "desc": "Chilled 250ml can / bottle.", "price": 50, "currency": "৳"}, {"id": "o10", "num": "35", "name": "Drinking Water (500ml/1L/2L)", "desc": "Sealed pure mineral water bottle.", "price": "MRP", "currency": ""}, {"id": "o11", "num": "36", "name": "Sweet & Salty Lassi", "desc": "Chilled yoghurt, lemon, lightly sweet & salty.", "price": 120, "currency": "৳"}, {"id": "o12", "num": "37", "name": "Mango Lassi", "desc": "Yoghurt, ice & ripe mango.", "price": 150, "currency": "৳"}, {"id": "o13", "num": "38", "name": "Vanilla Milkshake", "desc": "Smooth chilled shake with rich milk and natural vanilla.", "price": 160, "currency": "৳"}, {"id": "o14", "num": "39", "name": "Chocolate Milkshake", "desc": "Thick chocolate shake blended with rich milk and cocoa.", "price": 170, "currency": "৳"}, {"id": "o15", "num": "40", "name": "Fresh Orange Juice", "desc": "Freshly squeezed citrus juice, rich in Vitamin C.", "price": 160, "currency": "৳"}, {"id": "o16", "num": "41", "name": "Seasonal Fruit Juice", "desc": "Chilled fresh seasonal fruit juice squeezed to order.", "price": 130, "currency": "৳"}]}]}, "contact": {"address": "10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh", "phone": "+8801734489275", "email": "sylvanarestaurantbd@gmail.com", "hours": "Monday – Sunday: 7:30 AM – 11:30 PM (Daily)", "days": "Open 7 Days a Week"}};

  let contentData = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  let currentCategory = 'breakfast';
  let adminToken = sessionStorage.getItem('sylvana_admin_token') || '';
  let isEditMode = false;

  // Run immediately or on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    setupCategoryTabs();
    checkAdminRoute();
    setupAdminModal();

    // Render immediately from initial memory
    renderAll();

    // Fetch fresh content from server (bypassing browser cache)
    await fetchContent();
  }

  // 1. Master Render Function - Updates EVERY field on the site
  function renderAll() {
    if (!contentData) return;

    // 1. Meta / Brand
    if (contentData.meta) {
      const bEn = document.getElementById('heroBrandEn');
      const bBn = document.getElementById('heroBrandBn');
      if (bEn && contentData.meta.brandName) bEn.textContent = contentData.meta.brandName;
      if (bBn && contentData.meta.brandNameBn) bBn.textContent = contentData.meta.brandNameBn;
    }

    // 2. Hero Section
    if (contentData.hero) {
      const badgeEl = document.getElementById('heroBadgeText');
      const descEl = document.getElementById('heroDesc');
      if (badgeEl && contentData.hero.badge) badgeEl.textContent = contentData.hero.badge;
      if (descEl && contentData.hero.subtitle) descEl.textContent = contentData.hero.subtitle;
    }

    // 3. Contact Section
    if (contentData.contact) {
      const addrEl = document.getElementById('contactAddress');
      const locEl = document.getElementById('heroLocationText');
      if (addrEl && contentData.contact.address) addrEl.textContent = contentData.contact.address;
      if (locEl && contentData.contact.address) locEl.textContent = contentData.contact.address;

      const phoneEl = document.getElementById('contactPhone');
      const callBtn = document.getElementById('heroCallBtn');
      const leafOrderBtn = document.querySelector('.btn-leaf-order');
      if (contentData.contact.phone) {
        const cleanPhone = contentData.contact.phone.replace(/[^0-9+]/g, '');
        if (phoneEl) {
          phoneEl.textContent = contentData.contact.phone;
          phoneEl.href = 'tel:' + cleanPhone;
        }
        if (callBtn) {
          const s = callBtn.querySelector('span');
          if (s) s.textContent = '📞 Call: ' + contentData.contact.phone;
          callBtn.href = 'tel:' + cleanPhone;
        }
        if (leafOrderBtn) {
          const s = leafOrderBtn.querySelector('span');
          if (s) s.textContent = '📞 Order / Inquiries: ' + contentData.contact.phone;
          leafOrderBtn.href = 'tel:' + cleanPhone;
        }
      }

      const emailEl = document.getElementById('contactEmail');
      if (emailEl && contentData.contact.email) {
        emailEl.textContent = contentData.contact.email;
        emailEl.href = 'mailto:' + contentData.contact.email;
      }

      const hoursEl = document.getElementById('contactHours');
      if (hoursEl && contentData.contact.hours) {
        hoursEl.textContent = contentData.contact.hours;
      }
    }

    // 4. Update Tab Counters
    updateTabCounts();

    // 5. Render Active Dishes Grid
    renderCategory(currentCategory);
  }

  // 2. Fetch fresh content from server
  async function fetchContent() {
    // Check localStorage cache first
    try {
      const cached = localStorage.getItem('sylvana_menu_v8');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.menu && Array.isArray(parsed.menu.categories)) {
          contentData = parsed;
          renderAll();
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    // Fetch from server with cache-busting timestamp and no-store
    try {
      const res = await fetch('data/content.json?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.menu && Array.isArray(data.menu.categories)) {
          contentData = data;
          localStorage.setItem('sylvana_menu_v8', JSON.stringify(contentData));
          renderAll();
        }
      }
    } catch (e) {
      console.warn('Server fetch error:', e);
    }
  }

  function updateTabCounts() {
    if (!contentData || !contentData.menu || !contentData.menu.categories) return;
    const cats = contentData.menu.categories;
    const bCat = cats.find(c => c.id === 'breakfast');
    const dCat = cats.find(c => c.id === 'dinner');
    const oCat = cats.find(c => c.id === 'other');

    const tabB = document.getElementById('tabBreakfast');
    const tabD = document.getElementById('tabDinner');
    const tabO = document.getElementById('tabOther');

    if (tabB && bCat) {
      const cnt = tabB.querySelector('.tab-count');
      if (cnt) cnt.textContent = (bCat.items || []).length + ' Items';
    }
    if (tabD && dCat) {
      const cnt = tabD.querySelector('.tab-count');
      if (cnt) cnt.textContent = (dCat.items || []).length + ' Items';
    }
    if (tabO && oCat) {
      const cnt = tabO.querySelector('.tab-count');
      if (cnt) cnt.textContent = (oCat.items || []).length + ' Items';
    }
  }

  // 3. Category Tab Switching
  function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const catId = tab.getAttribute('data-category');
        if (catId && catId !== currentCategory) {
          // If in edit mode, scrape current tab before switching!
          if (isEditMode) {
            scrapeCurrentTab();
          }

          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          switchCategory(catId);
        }
      });
    });
  }

  function switchCategory(catId) {
    currentCategory = catId;
    const leafCard = document.getElementById('printableMenuLeaf');
    if (leafCard) {
      leafCard.classList.add('fade-out');
      setTimeout(() => {
        renderCategory(catId);
        leafCard.classList.remove('fade-out');
      }, 120);
    } else {
      renderCategory(catId);
    }
  }

  function renderCategory(catId) {
    if (!contentData || !contentData.menu || !contentData.menu.categories) return;
    const cat = contentData.menu.categories.find(c => c.id === catId) || contentData.menu.categories[0];
    if (!cat) return;

    // Header elements
    const catTitle = document.getElementById('leafCatTitle');
    const catBn = document.getElementById('leafCatBn');
    const catTiming = document.getElementById('leafCatTiming');

    if (catTitle) catTitle.textContent = cat.name ? cat.name.toUpperCase() + ' MENU' : '';
    if (catBn) catBn.textContent = cat.nameBn || '';
    if (catTiming) catTiming.textContent = cat.badge || cat.tagline || '';

    // Render items grid
    const grid = document.getElementById('leafItemsGrid');
    if (!grid) return;

    let itemsHtml = (cat.items || []).map((item, idx) => `
      <div class="menu-leaf-item" data-item-id="${escapeHtml(item.id || '')}">
        <div class="item-header-row">
          <span class="item-num">${escapeHtml(item.num || String(idx + 1))}.</span>
          <span class="item-name" data-field="name">${escapeHtml(item.name || '')}</span>
          <span class="item-dots" aria-hidden="true"></span>
          <span class="item-price" data-field="price">${escapeHtml(String(item.price || ''))} ${escapeHtml(item.currency || '৳')}</span>
          <button type="button" class="item-delete-btn" title="Delete this dish" onclick="window.SylvanaAdmin.deleteItem('${escapeHtml(item.id || '')}')">✕</button>
        </div>
        <p class="item-desc" data-field="desc">${escapeHtml(item.desc || '')}</p>
      </div>
    `).join('');

    // Add Dish button in Edit Mode
    itemsHtml += `
      <div class="admin-add-dish-wrapper">
        <button type="button" class="btn-add-dish" onclick="window.SylvanaAdmin.addItem()">
          <span>➕ Add New Dish to ${escapeHtml(cat.name || 'Menu')}</span>
        </button>
      </div>
    `;

    grid.innerHTML = itemsHtml;

    if (isEditMode) {
      enableInLineEdit();
    }
  }

  // 4. In-Line Admin Scrape & Save
  function scrapeCurrentTab() {
    // 1. Scrape header / hero / contact info
    const brandEn = document.getElementById('heroBrandEn');
    const brandBn = document.getElementById('heroBrandBn');
    const locationText = document.getElementById('heroLocationText');
    const heroDesc = document.getElementById('heroDesc');
    const badgeText = document.getElementById('heroBadgeText');

    if (brandEn) contentData.meta.brandName = brandEn.textContent.trim();
    if (brandBn) contentData.meta.brandNameBn = brandBn.textContent.trim();
    if (locationText) contentData.contact.address = locationText.textContent.trim();
    if (heroDesc) contentData.hero.subtitle = heroDesc.textContent.trim();
    if (badgeText) contentData.hero.badge = badgeText.textContent.trim();

    const hours = document.getElementById('contactHours');
    if (hours) contentData.contact.hours = hours.textContent.trim();
    const phone = document.getElementById('contactPhone');
    if (phone) contentData.contact.phone = phone.textContent.trim();
    const email = document.getElementById('contactEmail');
    if (email) contentData.contact.email = email.textContent.trim();

    // 2. Scrape items for currently active category
    const cat = contentData.menu.categories.find(c => c.id === currentCategory);
    if (cat) {
      const items = document.querySelectorAll('#leafItemsGrid .menu-leaf-item');
      items.forEach(el => {
        const itemId = el.getAttribute('data-item-id');
        const itemObj = cat.items.find(i => i.id === itemId);
        if (itemObj) {
          const nameEl = el.querySelector('[data-field="name"]');
          const priceEl = el.querySelector('[data-field="price"]');
          const descEl = el.querySelector('[data-field="desc"]');

          if (nameEl) itemObj.name = nameEl.textContent.trim();
          if (descEl) itemObj.desc = descEl.textContent.trim();
          if (priceEl) {
            const raw = priceEl.textContent.trim();
            const numMatch = raw.match(/\d+/);
            if (numMatch) {
              itemObj.price = parseInt(numMatch[0], 10);
            } else if (raw.toLowerCase().includes('mrp')) {
              itemObj.price = 'MRP';
            }
          }
        }
      });
    }

    updateTabCounts();
  }

  async function saveChanges() {
    scrapeCurrentTab();

    const saveBtn = document.getElementById('btnSaveInLine');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.innerHTML = 'Saving... ⏳';
      saveBtn.disabled = true;
    }

    // Always update browser cache
    localStorage.setItem('sylvana_menu_v8', JSON.stringify(contentData));

    // Post to backend save endpoint
    try {
      const res = await fetch('api/save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: adminToken || 'authenticated',
          password: 'admin123',
          content: contentData
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('✅ Saved live to website & server successfully!', 'success');
        // Re-render all elements immediately
        renderAll();
      } else {
        const errMsg = json.error || 'Server rejected changes.';
        showToast('⚠️ Saved locally in browser (Server error: ' + errMsg + ')', 'error');
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
      showToast('⚠️ Saved to browser cache! (Server sync offline)', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.innerHTML = originalText || '💾 Save Changes';
        saveBtn.disabled = false;
      }
    }
  }

  function addItem() {
    scrapeCurrentTab();
    const cat = contentData.menu.categories.find(c => c.id === currentCategory);
    if (!cat) return;

    const newId = 'custom_' + Date.now();
    const newNum = String((cat.items || []).length + 1);

    cat.items.push({
      id: newId,
      num: newNum,
      name: 'New Dish Title',
      desc: 'Description of ingredients and taste.',
      price: 150,
      currency: '৳'
    });

    renderCategory(currentCategory);
    updateTabCounts();
    showToast('New dish added! Edit title/price and click Save.', 'success');
  }

  function deleteItem(itemId) {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    scrapeCurrentTab();

    const cat = contentData.menu.categories.find(c => c.id === currentCategory);
    if (!cat) return;

    cat.items = cat.items.filter(i => i.id !== itemId);
    // Re-number
    cat.items.forEach((item, idx) => {
      item.num = String(idx + 1);
    });

    renderCategory(currentCategory);
    updateTabCounts();
    showToast('Dish removed. Click 💾 Save Changes to persist.', 'success');
  }

  // 5. Admin Route & In-Line Editing Controls
  function checkAdminRoute() {
    const isLocalAdmin = window.location.pathname.endsWith('/admin') ||
                         window.location.pathname.endsWith('/admin.html') ||
                         window.location.hash === '#admin';

    if (isLocalAdmin) {
      if (adminToken === 'authenticated') {
        enableInLineEdit();
      } else {
        showAdminModal();
      }
    }
  }

  function setupAdminModal() {
    const modal = document.getElementById('adminLoginModal');
    const form = document.getElementById('adminLoginForm');
    const cancelBtn = document.getElementById('btnModalCancel');
    const saveBtn = document.getElementById('btnSaveInLine');
    const exitBtn = document.getElementById('btnExitInLine');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        if (window.location.pathname.endsWith('/admin')) {
          window.location.href = '/';
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('adminUser').value;
        const pass = document.getElementById('adminPass').value;
        if (user === 'admin' && pass === 'admin123') {
          adminToken = 'authenticated';
          sessionStorage.setItem('sylvana_admin_token', adminToken);
          modal.classList.remove('open');
          enableInLineEdit();
          showToast('Editor unlocked! Edit any text directly on the page.', 'success');
        } else {
          alert('Invalid credentials. Use username: admin / password: admin123');
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', saveChanges);
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        adminToken = '';
        sessionStorage.removeItem('sylvana_admin_token');
        document.body.classList.remove('admin-edit-active');
        window.location.href = '/';
      });
    }
  }

  function showAdminModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.add('open');
  }

  function enableInLineEdit() {
    isEditMode = true;
    document.body.classList.add('admin-edit-active');

    // Make text contenteditable
    const editableSelectors = [
      '#heroBrandEn', '#heroBrandBn', '#heroLocationText', '#heroDesc', '#heroBadgeText',
      '#contactAddress', '#contactPhone', '#contactEmail', '#contactHours',
      '#leafCatTitle', '#leafCatBn', '#leafCatTiming',
      '[data-field="name"]', '[data-field="price"]', '[data-field="desc"]'
    ];

    editableSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      });
    });
  }

  function showToast(msg, type = 'normal') {
    let toast = document.querySelector('.site-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'site-toast';
      document.body.appendChild(toast);
    }
    toast.className = 'site-toast ' + (type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : '');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose global controller for inline buttons
  window.SylvanaAdmin = {
    addItem,
    deleteItem,
    saveChanges,
    scrapeCurrentTab,
    renderAll
  };
})();
