# 🍽️ The Sylvana Restaurant (দ্যা সিলভানা রেস্টুরেন্ট)
### High-Velocity Single-Page Culinary Experience & Backend Admin Studio

**The Sylvana Restaurant (দ্যা সিলভana রেস্টুরেন্ট)** is a single-page website and integrated Admin Studio engineered for high-performance dining experiences, instant menu management, and real-time table reservations. Built on a resilient **single source of truth** architecture, all website content flows dynamically from a centralized JSON store (`data/content.json`) and C# REST API with zero compilation delay and immediate hot synchronization.

---

## 🏛️ Brand & Identity

- **Brand Name**: The Sylvana Restaurant (দ্যা সিলভানা রেস্টুরেন্ট)
- **Tagline**: Authentic Bengali Delicacies, Global Grill & Artisanal Beverages
- **Location**: 10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh
- **Contact Phone**: `+8801734489275`
- **Contact Email**: `sylvanarestaurantbd@gmail.com`
- **Official Logo**: `public/assets/sylvana-logo.png` (warm terracotta culinary emblem)
- **Operating Hours**: Saturday – Thursday: 7:00 AM – 11:30 PM | Friday: 8:00 AM – 11:30 PM
- **Palette**: Warm terracotta red (`#e63917`), amber gold (`#f59e0b`), and rich charcoal/espresso dark background (`#120d0a`) with Bengali typography support via Google Fonts (`Hind Siliguri`).

---

## 🌟 Key Features

### 1. Public Single-Page Culinary Site (`/`)
- **Immersive Dining Aesthetic**: Elegant dark culinary theme, warm amber gradients, smooth navigation, and Bengali typography.
- **Announcement Banner**: Dismissible headline banner highlighting chef specials and offers.
- **Hero Section**: 
  - Eyebrow badge with Bengali welcome
  - Prominent call-to-actions ("Explore Full Menu" & "Book a Table")
  - Quick-glance operating hours, phone, and Shahbagh location
  - Live dining telemetry monitor
- **Culinary Heritage Story**: The heritage and passion of The Sylvana culinary tradition in Shahbagh, Dhaka.
- **Interactive Categorized Menu (38+ Dishes)**:
  - **9 Categories**:
    1. *Breakfast Menu* (Paratha with Bhaji, Dal, Dim Bhuna, Khichuri with Omelette, Eggs Omelette, Plain Naan, Paratha)
    2. *Tea Item* (Black Tea, Milk Tea, Masala Tea)
    3. *Soups & Appetizers* (Chicken Soup Thick/Clear, Thai Clear Soup, Wonthon, French Fries, Potato Wedges, Chicken Popcorn, Spring Rolls, Potato Mash)
    4. *Gourmet Burgers* (Classic Chicken Burger, Beef Burger, BBQ Burger, Tower Burger)
    5. *Pizza & Pasta* (Chicken Supreme Pizza, Margherita, Beef Bolognaise Pasta, White Sauce Chicken Pasta)
    6. *Traditional Meals & Favourites* (Mutton Kacchi Biryani, Beef Tehari, Chicken Roast with Polao, Beef Bhuna Khichuri)
    7. *Desserts* (Traditional Shahi Firni, Sweet Gulab Jamun, Vanilla/Chocolate Ice Cream)
    8. *Tea, Coffee & Refreshments* (Espresso, Cappuccino, Cafe Latte, Cold Coffee, Fresh Lime Soda, Mineral Water)
    9. *Lassis, Milkshakes & Juice* (Sweet Lassi, Mango Lassi, Chocolate Milkshake, Fresh Orange Juice, Seasonal Fruit Juice)
  - **Live Real-time Search & Instant Category Tabs**: Instant dish filtering by name, dietary label, or ingredient.
  - **Exact Pricing in ৳ (BDT)**: Authentic Bangladeshi Taka pricing formatted consistently.
  - **One-Click Reservation / Pre-order**: Clicking "Reserve / Order" automatically populates the selected dish into the Table Reservation form.
- **Chef's Curated Platters & Feasts**: Highlighting special dining sets and group banquets.
- **Guest Reviews & Testimonials**: Verified diner feedback and 5-star ratings.
- **Table Reservation & Order Inquiry Form**: Submits directly to the backend inbox (`POST /api/contact`).
- **Interactive Shahbagh Locator**: Google Maps embed, driving directions, phone call button, and address display.
- **Real-time Live Sync**: Automatically detects source updates and refreshes view without manual reload.

### 2. Backend Admin Control Studio (`/admin`)
- **Secure Authentication**: Token-based authentication (`POST /api/auth/login`) with session timeout.
  - **Default Username:** `admin`
  - **Default Password:** `admin123`
- **Visual Section Editors**:
  - **Brand & Metadata**: Bengali name, English title, tagline, phone, email, address, and operating hours.
  - **Hero & Announcement**: Header headlines, banners, call-to-action buttons.
  - **Menu Management**: Comprehensive dish editor with category filtering, add dish, edit details (name, price in ৳, category, badges, dietary flags, icon, description), delete, and move up/down reordering.
  - **Dining Pillars & Feasts**: Edit value propositions, special combos, and platters.
  - **FAQs Editor**: Add, edit, or delete customer inquiries.
  - **Contact & Social**: Manage address, coordinates, and social handles.
- **Table Reservations & Inquiries Inbox**: View, review, and delete customer table bookings submitted from the landing page.
- **Live Side-by-Side Preview**: Slide-out live iframe drawer showing real-time website updates on save.
- **Raw Source JSON Editor**: Direct access to edit underlying JSON source of truth with bidirectional synchronization.
- **Audit Log & Event History**: Records every save, reset, import, and message interaction.
- **One-Click Export / Import**: Download entire restaurant content as JSON or restore from backup.
- **Factory Reset**: Revert back to default factory content (`data/default_content.json`) anytime.

### 3. Native C# Backend Server (`NexusServer.exe`)
- **Zero External Dependencies**: Compiled using Windows built-in `csc.exe` (.NET Framework 4.5+).
- **Asynchronous Multi-Threaded Engine**: Built with `System.Net.HttpListener`.
- **Atomic File Persistence**: Updates write to `data/content.json.tmp` and atomic replace to eliminate corruptions.
- **Security Hardened**: Path traversal guards, payload size limits (10MB), and schema validation.

---

## 🚀 Quick Start Guide

### Start the Server:
Double-click `start.bat` or run via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1 -Port 5000
```

### URLs:
- **Public Website**: [http://localhost:5000/](http://localhost:5000/)
- **Backend Admin Studio**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **Source Data JSON API**: [http://localhost:5000/api/content](http://localhost:5000/api/content)
- **System Telemetry**: [http://localhost:5000/api/stats](http://localhost:5000/api/stats)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📡 REST API Reference

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/content` | No | Fetch the active content state (source of truth) |
| `PUT` | `/api/content` | Yes (Bearer / `?token=`) | Update content source atomically |
| `POST` | `/api/content/reset` | Yes (Bearer / `?token=`) | Reset content to factory default template |
| `GET` | `/api/content/export` | No | Export content JSON as downloadable attachment |
| `POST` | `/api/content/import` | Yes (Bearer / `?token=`) | Import and overwrite content from JSON payload |
| `POST` | `/api/auth/login` | No | Authenticate admin (`username`, `password`) |
| `GET` | `/api/auth/verify` | Yes (Bearer / `?token=`) | Validate session token |
| `POST` | `/api/auth/logout` | Yes (Bearer / `?token=`) | Invalidate session token |
| `POST` | `/api/contact` | No | Submit customer table reservation / inquiry |
| `GET` | `/api/messages` | Yes (Bearer / `?token=`) | Retrieve table reservations and messages |
| `DELETE` | `/api/messages?id={id}`| Yes (Bearer / `?token=`) | Delete reservation / message |
| `GET` | `/api/audit-log` | Yes (Bearer / `?token=`) | Retrieve modification audit history |
| `GET` | `/api/stats` | No | Retrieve server metrics, uptime, and request count |
| `GET` | `/api/health` | No | Health check ping |

---

## 🌐 Public Cloudflare Deployment

Deploy the website and admin studio onto a fast public temporary HTTPS URL at any time:

```powershell
# Double-click start_tunnel.bat or execute:
powershell -ExecutionPolicy Bypass -File .\start_tunnel.ps1
```
This boots `NexusServer.exe` and provisions a high-speed Cloudflare Edge tunnel (`*.trycloudflare.com`) with zero session timeouts, automatic SSL, and global CDN delivery.

---

## 🧪 Automated Testing

Run the full automated test suite covering all restaurant flows, edge cases, and server core:

```powershell
# 1. Complete Restaurant Brand & Data Flow Suite (35 assertions)
powershell -ExecutionPolicy Bypass -File .\test_restaurant_flow.ps1

# 2. Main End-to-End System & API Suite (30 assertions)
powershell -ExecutionPolicy Bypass -File .\test_suite.ps1

# 3. Security, Unicode UTF-8 & Edge Case Suite (8 assertions)
powershell -ExecutionPolicy Bypass -File .\test_edge_cases.ps1
```

All 73 test assertions pass with 100% success rate.
