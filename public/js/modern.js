/**
 * The Sylvana Restaurant - Minimal, Modern, Light & Responsive Web Script
 * Printable Menu Leaf with 3 Highlighted Categories (Breakfast | Dinner | Others)
 */

(function () {
  const DEFAULT_CONTENT = {"meta": {"siteTitle": "The Sylvana Restaurant | Authentic Food Menu in Shahbagh, Dhaka", "siteTagline": "দ্যা সিলভানা রেস্টুরেন্ট - Traditional Flavours & Warm Hospitality", "metaDescription": "Authentic Bengali cuisine, Kacchi Biryani, hearty breakfast, and refreshments at The Sylvana Restaurant in Shahbagh, Dhaka. Open 7:30 AM to 11:00 PM.", "brandName": "The Sylvana Restaurant", "brandNameBn": "দ্যা সিলভানা রেস্টুরেন্ট", "logoUrl": "assets/sylvana-logo.png", "logoIcon": "🍽️", "primaryColor": "#d9381e", "accentColor": "#b91c1c", "secondaryColor": "#d97706"}, "hero": {"badge": "✨ Open Daily: 7:30 AM – 11:00 PM • Shahbagh, Dhaka", "headlineStart": "Welcome to", "headlineHighlight": "The Sylvana Restaurant", "headlineEnd": "দ্যা সিলভানা রেস্টুরেন্ট", "subtitle": "Discover authentic Mutton Kacchi Biryani, traditional morning breakfast, clay-oven naans, burgers, and refreshing desserts crafted fresh daily in Shahbagh, Dhaka."}, "menu": {"title": "Food & Beverage Menu", "subtitle": "Select a category below to explore our authentic printed restaurant menu.", "categories": [{"id": "breakfast", "name": "Breakfast", "nameBn": "সকালের নাস্তা ও চা", "icon": "🌅", "badge": "Morning Specials • 7:30 AM – 11:30 AM", "tagline": "Freshly rolled parathas, hot lentils, eggs, khichuri & authentic milk tea", "items": [{"id": "b1", "num": "1", "name": "Paratha with Bhaji", "desc": "Flaky paratha served with spiced mixed vegetables", "price": 100, "currency": "৳"}, {"id": "b2", "num": "2", "name": "Paratha with Dal", "desc": "Golden paratha with warm, seasoned yellow lentils", "price": 90, "currency": "৳"}, {"id": "b3", "num": "3", "name": "Paratha with Dim Bhuna", "desc": "Paratha served with eggs in a rich onion and tomato gravy", "price": 130, "currency": "৳"}, {"id": "b4", "num": "4", "name": "Khichuri with Omelette", "desc": "Chinigura rice & yellow lentils served with onion & green chili omelette", "price": 150, "currency": "৳"}, {"id": "b5", "num": "5", "name": "Eggs Omelette", "desc": "Onion, coriander and green chili fresh omelette", "price": 70, "currency": "৳"}, {"id": "b6", "num": "6", "name": "Plain Naan (each)", "desc": "Warm clay-oven baked tandoori naan", "price": 40, "currency": "৳"}, {"id": "b7", "num": "7", "name": "Paratha (each)", "desc": "Crispy golden layered flatbread", "price": 30, "currency": "৳"}, {"id": "b8", "num": "8", "name": "Special Masala Tea", "desc": "Hot tea infused with cardamom, clove & aromatic spices", "price": 60, "currency": "৳"}, {"id": "b9", "num": "9", "name": "Milk Tea", "desc": "Classic creamy Bangladeshi slow-boiled milk tea", "price": 40, "currency": "৳"}, {"id": "b10", "num": "10", "name": "Black Tea", "desc": "Pure refreshing brewed hot black tea", "price": 30, "currency": "৳"}]}, {"id": "dinner", "name": "Dinner & Mains", "nameBn": "দুপুর ও রাতের খাবার", "icon": "🍲", "badge": "Lunch & Dinner • All Day Mains", "tagline": "Slow-cooked Kacchi Biryani, Tehari, rich beef curries, burgers, pizza & pasta", "items": [{"id": "d1", "num": "11", "name": "Mutton Kacchi Biryani", "desc": "Fragrant basmati rice layered with tender mutton, alu & secret aromatic spices", "price": 320, "currency": "৳"}, {"id": "d2", "num": "12", "name": "Old Dhaka Beef Tehari", "desc": "Fragrant short-grain rice cooked with tender beef cubes & mustard oil aroma", "price": 230, "currency": "৳"}, {"id": "d3", "num": "13", "name": "Chicken Dum Biryani", "desc": "Layered fragrant rice and spiced chicken, served with cool raita", "price": 260, "currency": "৳"}, {"id": "d4", "num": "14", "name": "Traditional Chicken Biryani", "desc": "Aromatic rice with juicy chicken and traditional Bengali spices", "price": 230, "currency": "৳"}, {"id": "d5", "num": "15", "name": "Plain Rice with Beef Bhuna", "desc": "Steamed fragrant rice served with tender beef in rich Bengali gravy", "price": 270, "currency": "৳"}, {"id": "d6", "num": "16", "name": "Naan with Beef Bhuna", "desc": "Clay-oven baked naan served with tender beef curry & spiced gravy", "price": 280, "currency": "৳"}, {"id": "d7", "num": "17", "name": "Fish Curry with Rice (Rui / Katla)", "desc": "Fresh sweetwater fish in tomato based gravy, chili, garlic & coriander", "price": 250, "currency": "৳"}, {"id": "d8", "num": "18", "name": "Beef Bhuna Khichuri", "desc": "Aromatic Chinigura rice and lentils with spicy beef bhuna", "price": 260, "currency": "৳"}, {"id": "d9", "num": "19", "name": "Chicken Bhuna Khichuri", "desc": "Aromatic rice and lentils with succulent chicken bhuna", "price": 230, "currency": "৳"}, {"id": "d10", "num": "20", "name": "Chicken Soup (Thick / Clear) (1:1)", "desc": "Eggs, shredded chicken, fresh lemon, chili & garden vegetables", "price": 150, "currency": "৳"}, {"id": "d11", "num": "21", "name": "Spicy Fried Chicken (6 pcs)", "desc": "Golden crispy chicken pieces served with tomato & BBQ sauce", "price": 350, "currency": "৳"}, {"id": "d12", "num": "22", "name": "Gourmet Beef Burger", "desc": "Flame-grilled beef patty, cheddar cheese, lettuce, tomato & mayo", "price": 220, "currency": "৳"}, {"id": "d13", "num": "23", "name": "Chicken Burger", "desc": "Crispy chicken patty, fresh lettuce, tomato & creamy mayonnaise", "price": 180, "currency": "৳"}, {"id": "d14", "num": "24", "name": "Plain Margherita Pizza", "desc": "Crisp thin crust, tomato sauce base, melted cheese & oregano", "price": 320, "currency": "৳"}, {"id": "d15", "num": "25", "name": "Italian Pasta", "desc": "Penne in rich savory tomato sauce, chili, cheese, green peas & coriander", "price": 220, "currency": "৳"}, {"id": "d16", "num": "26", "name": "French Fries", "desc": "Crisp golden potato fries served with dipping sauce", "price": 130, "currency": "৳"}, {"id": "d17", "num": "27", "name": "Samosa with Salad & Sauce (2 pcs)", "desc": "Crisp golden triangular pastry with savory spiced vegetable filling", "price": 100, "currency": "৳"}, {"id": "d18", "num": "28", "name": "Mixed Salad", "desc": "Sliced tomato, cucumber, onions, chili, lemon and crisp lettuce", "price": 120, "currency": "৳"}, {"id": "d19", "num": "29", "name": "Potato Mash (Alu Bhorta)", "desc": "Bengali mustard potato mash with caramelized onions & green chili", "price": 50, "currency": "৳"}, {"id": "d20", "num": "30", "name": "Tandoori Naan (each)", "desc": "Soft, hot clay-oven baked naan", "price": 40, "currency": "৳"}, {"id": "d21", "num": "31", "name": "Plain Steamed Rice", "desc": "Steamed fragrant long-grain rice", "price": 60, "currency": "৳"}, {"id": "d22", "num": "32", "name": "Dal (Yellow Lentil)", "desc": "Warm spiced lentil soup tempered with garlic & cumin", "price": 40, "currency": "৳"}]}, {"id": "other", "name": "Drinks & Others", "nameBn": "পানীয়, মিষ্টি ও ডেজার্ট", "icon": "🍹", "badge": "Beverages, Sweets & Refreshments", "tagline": "Hand-churned lassis, thick milkshakes, Gulab Jamun, Firni & fresh juices", "items": [{"id": "o1", "num": "33", "name": "Gulab Jamun / Golap Jamun", "desc": "Soft milk-based sweets soaked in warm cardamom & rose sugar syrup", "price": 70, "currency": "৳"}, {"id": "o2", "num": "34", "name": "Firni (Bengali Rice Pudding)", "desc": "Chilled creamy Chinigura rice pudding infused with saffron, cardamom & nuts", "price": 100, "currency": "৳"}, {"id": "o3", "num": "35", "name": "Sweet Yoghurt / Bogra Doi", "desc": "Cool, creamy traditional clay-pot sweet curd", "price": 100, "currency": "৳"}, {"id": "o4", "num": "36", "name": "Ice Cream (Vanilla / Chocolate)", "desc": "Rich creamy scoops of premium ice cream", "price": 150, "currency": "৳"}, {"id": "o5", "num": "37", "name": "Mango Lassi", "desc": "Creamy yogurt blended with ripe mango & crushed ice", "price": 150, "currency": "৳"}, {"id": "o6", "num": "38", "name": "Sweet / Salty Lassi", "desc": "Traditional chilled yogurt drink, smooth, creamy & refreshing", "price": 120, "currency": "৳"}, {"id": "o7", "num": "39", "name": "Chocolate Milkshake", "desc": "Thick chocolate shake blended with rich milk and cocoa", "price": 170, "currency": "৳"}, {"id": "o8", "num": "40", "name": "Vanilla Milkshake", "desc": "Smooth chilled whole milk shake with natural vanilla", "price": 160, "currency": "৳"}, {"id": "o9", "num": "41", "name": "Fresh Orange Juice", "desc": "Freshly squeezed citrus juice, rich in Vitamin C", "price": 160, "currency": "৳"}, {"id": "o10", "num": "42", "name": "Seasonal Fresh Fruit Juice", "desc": "Crisp chilled seasonal fruits squeezed to order", "price": 130, "currency": "৳"}, {"id": "o11", "num": "43", "name": "Regular Hot Coffee", "desc": "Freshly brewed aromatic hot coffee", "price": 90, "currency": "৳"}, {"id": "o12", "num": "44", "name": "Soft Drinks (Coca-Cola, Sprite, Fanta)", "desc": "Chilled 250ml can / bottle", "price": 50, "currency": "৳"}, {"id": "o13", "num": "45", "name": "Drinking Water (1L)", "desc": "Sealed pure mineral water bottle", "price": 40, "currency": "৳"}]}]}, "contact": {"address": "10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh", "phone": "+8801734489275", "email": "sylvanarestaurantbd@gmail.com", "hours": "Monday – Sunday: 7:30 AM – 11:00 PM (Daily)", "days": "Open 7 Days a Week"}};

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

    // Fetch fresh content in background
    await fetchContent();
  }

  // 1. Fetch content
  async function fetchContent() {
    try {
      const cached = localStorage.getItem('sylvana_menu_v5');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.menu && Array.isArray(parsed.menu.categories)) {
          contentData = parsed;
          renderCategory(currentCategory);
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    try {
      const res = await fetch('data/content.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data && data.menu && Array.isArray(data.menu.categories)) {
          contentData = data;
          localStorage.setItem('sylvana_menu_v5', JSON.stringify(contentData));
          renderCategory(currentCategory);
        }
      }
    } catch (e) {
      console.warn('Server fetch error:', e);
    }
  }

  // 2. Category Tab Switching
  function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const catId = tab.getAttribute('data-category');
        if (catId && catId !== currentCategory) {
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

    grid.innerHTML = (cat.items || []).map(item => `
      <div class="menu-leaf-item" data-item-id="${escapeHtml(item.id || '')}">
        <div class="item-header-row">
          <span class="item-num">${escapeHtml(item.num || '')}.</span>
          <span class="item-name" data-field="name">${escapeHtml(item.name || '')}</span>
          <span class="item-dots" aria-hidden="true"></span>
          <span class="item-price" data-field="price">${escapeHtml(String(item.price || ''))} ${escapeHtml(item.currency || '৳')}</span>
        </div>
        <p class="item-desc" data-field="desc">${escapeHtml(item.desc || '')}</p>
      </div>
    `).join('');

    if (isEditMode) {
      enableInLineEdit();
    }
  }

  // 3. Admin Route & In-Line Editing
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
          showToast('Editor unlocked successfully!');
        } else {
          alert('Invalid credentials. Use admin / admin123');
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
      });
    });
  }

  function saveChanges() {
    // Scrape updated fields back into contentData
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

    // Update items in current category
    const cat = contentData.menu.categories.find(c => c.id === currentCategory);
    if (cat) {
      const items = document.querySelectorAll('.menu-leaf-item');
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
            const pText = priceEl.textContent.replace(/[^0-9]/g, '');
            if (pText) itemObj.price = parseInt(pText, 10);
          }
        }
      });
    }

    localStorage.setItem('sylvana_menu_v5', JSON.stringify(contentData));
    showToast('Changes saved locally to browser!');
  }

  function showToast(msg) {
    let toast = document.querySelector('.site-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'site-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
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
})();
