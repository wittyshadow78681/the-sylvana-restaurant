/**
 * The Sylvana Restaurant - Public Client Application Script
 * Minimal, Fast, and Dynamic Menu Synchronizer
 */

(function () {
  'use strict';

  let currentContent = null;

  /**
   * Fetches latest content from /api/content (or static fallback)
   * and synchronizes the DOM elements.
   */
  async function fetchContentSource() {
    try {
      const res = await fetch('/api/content', { credentials: 'omit' });
      if (!res.ok) {
        throw new Error('Failed to fetch /api/content: ' + res.status);
      }
      const data = await res.json();
      currentContent = data;
      applyContentToDOM(data);
      return data;
    } catch (err) {
      console.warn('Could not sync with /api/content, attempting static fallback:', err.message);
      try {
        const fallbackRes = await fetch('/data/content.json');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          currentContent = fallbackData;
          applyContentToDOM(fallbackData);
          return fallbackData;
        }
      } catch (fbErr) {
        console.warn('Static fallback also unavailable:', fbErr.message);
      }
      return null;
    }
  }

  /**
   * Applies content model values to DOM elements safely.
   */
  function applyContentToDOM(data) {
    if (!data) return;

    // Brand and Intro Elements
    if (data.meta) {
      if (data.meta.brandName) {
        const el = document.getElementById('brandName');
        if (el && !el.matches(':focus')) el.innerText = data.meta.brandName;
      }
      if (data.meta.brandNameBn) {
        const el = document.getElementById('brandNameBn');
        if (el && !el.matches(':focus')) el.innerText = data.meta.brandNameBn;
      }
      if (data.meta.siteTagline) {
        const el = document.getElementById('brandTagline');
        if (el && !el.matches(':focus')) el.innerText = data.meta.siteTagline;
      }
    }

    if (data.about && data.about.story1) {
      const el = document.getElementById('introStory');
      if (el && !el.matches(':focus')) el.innerText = data.about.story1;
    }

    // Contact Details
    if (data.contact) {
      if (data.contact.address) {
        const el = document.getElementById('contactAddress');
        if (el && !el.matches(':focus')) el.innerText = data.contact.address;
      }
      if (data.contact.phone) {
        const el = document.getElementById('contactPhone');
        if (el && !el.matches(':focus')) {
          el.innerHTML = `<a href="tel:${data.contact.phone}">${data.contact.phone}</a>`;
        }
      }
      if (data.contact.email) {
        const el = document.getElementById('contactEmail');
        if (el && !el.matches(':focus')) {
          el.innerHTML = `<a href="mailto:${data.contact.email}">${data.contact.email}</a>`;
        }
      }
      if (data.contact.hours) {
        const el = document.getElementById('contactHours');
        if (el && !el.matches(':focus')) el.innerText = data.contact.hours;
      }
    }

    // Menu Items
    if (data.menu && Array.isArray(data.menu.items)) {
      const itemMap = new Map();
      data.menu.items.forEach(it => {
        if (it && it.id) itemMap.set(it.id, it);
      });

      document.querySelectorAll('.dish-item[data-item-id]').forEach(node => {
        const id = node.getAttribute('data-item-id');
        const it = itemMap.get(id);
        if (it) {
          const nameEl = node.querySelector('.dish-name');
          const priceEl = node.querySelector('.dish-price-val');
          const descEl = node.querySelector('.dish-desc');

          if (nameEl && !nameEl.matches(':focus') && it.name) nameEl.innerText = it.name;
          if (priceEl && !priceEl.matches(':focus') && it.price !== undefined) priceEl.innerText = it.price;
          if (descEl && !descEl.matches(':focus') && it.description !== undefined) descEl.innerText = it.description;
        }
      });
    }
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    fetchContentSource();

    // Check for query param ?admin=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1' || params.get('admin') === 'true') {
      window.location.href = '/admin';
    }
  });

  // Expose on window for testing and global access
  window.fetchContentSource = fetchContentSource;
  window.applyContentToDOM = applyContentToDOM;
})();
