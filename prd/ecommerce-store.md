# E-commerce Storefront (Single-Store B2C)

> Single-merchant online shop built with **Laravel 13**, **React 19**, **Vite**, and **Inertia.js**.

| Field | Value |
|---|---|
| **Document version** | 4.0 |
| **Status** | Draft for client review |
| **Prepared by** | [Developer / Agency Name] |
| **Prepared for** | [Client Name / Store Name] |
| **Date** | 08 September 2026 |
| **Project type** | B2C e-commerce web application |
| **Delivery window** | 5–6 weeks (28–38 working days) |
| **Package price** | PHP 45,000 (range PHP 40,000 – 58,000 depending on options) |
| **Stack** | Laravel 13 + PHP 8.4 + React 19 + Vite + Inertia.js + MySQL 8 |

### Revision history

| Ver | Date | Summary of changes |
|---|---|---|
| 1.0 | [date] | Initial generic e-commerce draft. |
| 2.0 | [date] | Added acceptance criteria, payment/webhook spec, tax and shipping rules, RBAC, testing, change control, commercials. |
| 3.x | 08 Sep 2026 | Temporarily retargeted to liquor retail (withdrawn). |
| **4.0** | **08 Sep 2026** | **Retargeted to a general B2C storefront. Removed age gate, alcohol taxonomy, liquor-ban controls, and ID-on-delivery. Added simple product variants (up to two option dimensions). Stack remains Laravel 13 + React 19 (Vite) + Inertia.js.** |

This document describes software behavior. It is not legal advice. The client is responsible for business permits, product claims, and privacy compliance. The system provides configurable store policies (Section 6); it cannot guarantee legal compliance on its own.

**Product category is not assumed.** Open question Q-1 must be answered before catalog work starts. Until then, examples use generic retail products.

### Approvals (required before Phase 1 starts)

| Role | Name | Signature | Date |
|---|---|---|---|
| Client / Owner | ______________ | ____________ | __________ |
| Project Lead | ______________ | ____________ | __________ |

## Table of contents

1. [Executive Summary](#1-executive-summary)
2. [Business Objectives and Success Metrics](#2-business-objectives-and-success-metrics)
3. [Scope, Assumptions, Dependencies](#3-scope-assumptions-dependencies)
4. [Users, Roles and Permissions](#4-users-roles-and-permissions)
5. [Product Domain Model — Catalog](#5-product-domain-model--catalog)
6. [Store Policies, Service Areas and Operating Rules](#6-store-policies-service-areas-and-operating-rules)
7. [UI / UX Design Specification](#7-ui--ux-design-specification)
8. [Technology Stack](#8-technology-stack)
9. [System Architecture](#9-system-architecture)
10. [Functional Requirements — Storefront](#10-functional-requirements--storefront)
11. [Functional Requirements — Cart and Checkout](#11-functional-requirements--cart-and-checkout)
12. [Functional Requirements — Orders and Delivery](#12-functional-requirements--orders-and-delivery)
13. [Functional Requirements — Inventory](#13-functional-requirements--inventory)
14. [Functional Requirements — Payments](#14-functional-requirements--payments)
15. [Functional Requirements — Shipping, Packing and Tax](#15-functional-requirements--shipping-packing-and-tax)
16. [Functional Requirements — Discounts and Bundles](#16-functional-requirements--discounts-and-bundles)
17. [Functional Requirements — Customer Accounts](#17-functional-requirements--customer-accounts)
18. [Functional Requirements — Admin Panel](#18-functional-requirements--admin-panel)
19. [Notifications](#19-notifications)
20. [Data Model](#20-data-model)
21. [Validation Rules Reference](#21-validation-rules-reference)
22. [Security Requirements](#22-security-requirements)
23. [Non-Functional Requirements](#23-non-functional-requirements)
24. [SEO, Analytics and Accessibility](#24-seo-analytics-and-accessibility)
25. [Error Handling and Logging](#25-error-handling-and-logging)
26. [Testing and Acceptance (UAT)](#26-testing-and-acceptance-uat)
27. [Deployment, Hosting and Backups](#27-deployment-hosting-and-backups)
28. [Development Phases and Milestones](#28-development-phases-and-milestones)
29. [Commercials and Payment Schedule](#29-commercials-and-payment-schedule)
30. [Change Control](#30-change-control)
31. [Warranty, Support and Handover](#31-warranty-support-and-handover)
32. [Risks and Mitigations](#32-risks-and-mitigations)
33. [Out of Scope](#33-out-of-scope)
34. [Glossary](#34-glossary)
35. [Open Questions for the Client](#35-open-questions-for-the-client)

Also: [Approvals](#approvals-required-before-phase-1-starts) · [Acceptance form](#acceptance-form)

---

## 1. Executive summary

This project delivers a single-merchant B2C e-commerce site. Customers browse a catalog, filter and search products, add items to a cart, and check out with Cash on Delivery or one online payment gateway.

The owner manages products, stock, orders, promotions, delivery areas, and store settings from an admin panel without a developer.

The stack is Laravel 13 with a React 19 frontend compiled by Vite. Laravel owns routing, validation, sessions, and business logic. Inertia.js renders React pages from those controllers so the UI is a modern SPA without a separate public API. Document head tags (title, meta, canonical, Open Graph, JSON-LD) are emitted on the first HTML response so the catalog stays SEO-indexable.

The initial release is a single store, not a marketplace.

This is **not** an age-restricted or licensed-goods build. Age gates, identity-on-delivery, and category-specific regulated catalogs are out of scope unless quoted later.

---

## 2. Business objectives and success metrics

### 2.1 Objectives

- **O-1** Sell products online with a clear, mobile-first browsing and checkout experience.
- **O-2** Give the owner full catalog, stock, and order control without a developer.
- **O-3** Support COD (still common in the Philippines) plus one online payment gateway.
- **O-4** Prevent overselling.
- **O-5** Limit delivery to areas the client is willing and able to serve.
- **O-6** Keep prices, fees, and totals honest: all money is computed server-side.

### 2.2 Success metrics (30 days after go-live)

| Metric | Target |
|---|---|
| Orders delivered to blocked areas | Zero |
| Overselling incidents | Zero |
| Owner publishes a new product listing | Under 4 minutes, unaided |
| Homepage load (broadband, cached) | Under 2.5 seconds |
| Mobile checkout on a 375px viewport | No blocking layout defect |
| Critical bugs during warranty | Resolved within 3 business days |

### 2.3 Non-goals

Not in v1: marketing automation, loyalty programs, B2B wholesale pricing, marketplace / multi-vendor, POS sync with a physical store, or native mobile apps.

---

## 3. Scope, assumptions, dependencies

### 3.1 In scope

- Storefront: home, catalog, faceted filtering, search, product detail, cart, checkout.
- Catalog with categories, brands, images, SEO fields, and simple variants (Section 5).
- Store policies: serviceable delivery areas, optional ordering hours, legal pages (Section 6).
- Custom theme per the design specification (Section 7), using the client’s brand colors.
- Customer accounts, address book, order history.
- Guest checkout.
- COD plus **one** online payment gateway.
- Order lifecycle, packing slips, email notifications.
- Inventory with low-stock alerts.
- Promo codes and curated bundle products (single SKU).
- Admin: dashboard, catalog, inventory, orders, customers, promos, settings.
- Deployment, documentation, training.

### 3.2 Decisions locked for v4

- **D-1** Guest checkout is allowed.
- **D-2** A product may have **simple variants** with up to **two option dimensions** (for example Color and Size). Each variant is its own SKU with its own stock. A parent with no variants is a simple product. A true three-or-more-dimension matrix, or per-variant price lists beyond an optional override, is an add-on.
- **D-3** Prices are displayed VAT-inclusive when VAT is enabled. Currency is PHP only.
- **D-4** Stock is deducted at order creation, with a release window for unpaid online-payment orders.
- **D-5** Delivery is limited to an allow-list of serviceable areas. Everything outside it is blocked at checkout. Unlisted addresses default to **block**.
- **D-6** Storefront theme is **light-first**, with the client’s brand accent. No theme switcher in v1. Admin uses the same token system.
- **D-7** Refunds are processed manually by the owner in the gateway dashboard; admin then marks the order Refunded.
- **D-8** Delivery is fulfilled by the client’s own riders or a third-party courier booked manually. No courier API in v1.

### 3.3 Assumptions

- **A-1** Client provides product data, photography (or approves a shoot as a separate cost), and categories before Phase 3.
- **A-2** Client provides hosting (PHP 8.4+, Node.js LTS at deploy for Vite builds, MySQL 8.x, SSL, queue worker capable), domain, and SMTP or a transactional email service.
- **A-3** Client completes payment gateway onboarding. Start early.
- **A-4** Client supplies the list of serviceable delivery areas and fee rules.
- **A-5** Content is in English unless Q-19 says otherwise (multi-language is out of scope).
- **A-6** One client decision maker approves each milestone within 3 business days.

### 3.4 Client responsibilities

- Supply product data, imagery, and the serviceable-area list on schedule.
- Complete gateway and email onboarding.
- Perform UAT within 5 business days of the UAT build.
- Hold any required business permits; supply Terms, Privacy, Shipping, and Returns copy (or approve developer-drafted placeholders).

### 3.5 External dependencies

| Dependency | Owner | Needed by | Risk if late |
|---|---|---|---|
| Brand assets (logo, colors, fonts) | Client | Phase 2 | Design stall |
| Product data + photos | Client | Phase 3 | Catalog stalls |
| Serviceable-area list + fees | Client | Phase 4 | Checkout logic blocked |
| Gateway merchant account | Client | Phase 5 | Launch COD-only |
| SMTP / email service | Client | Phase 5 | No order emails |
| Hosting + domain + SSL | Client | Phase 7 | Cannot deploy |

---

## 4. Users, roles and permissions

### 4.1 Personas

**First-time shopper.** Low trust, price-sensitive, often on mobile. Needs clear shipping cost, photos, and a short checkout.

**Repeat customer.** Knows the brand, reorders, uses saved addresses. Needs fast search, order history, reorder.

**Gift buyer.** Cares about presentation and delivery date. Needs gift note and optional hide-prices on the packing slip.

**Store administrator (owner).** Non-technical. Needs fast listing creation, today’s orders, stock adjustments, promo codes.

**Fulfilment staff.** Packs and dispatches. Should see orders and stock, not pricing, promos, or settings.

### 4.2 Permission matrix

| Capability | Guest | Customer | Staff | Admin |
|---|---|---|---|---|
| Browse catalog | Y | Y | Y | Y |
| Add to cart / checkout | Y | Y | — | — |
| View own order history | — | Y | — | — |
| Manage own addresses / profile | — | Y | — | — |
| Admin dashboard | — | — | Y | Y |
| View / search all orders | — | — | Y | Y |
| Update order status | — | — | Y | Y |
| Print picking / packing slip | — | — | Y | Y |
| Update payment status | — | — | — | Y |
| Cancel order | — | — | — | Y |
| Create / edit products and pricing | — | — | — | Y |
| Adjust inventory | — | — | Y | Y |
| Manage categories / brands | — | — | — | Y |
| Manage promos and bundles | — | — | — | Y |
| View customer list | — | — | Y | Y |
| Store settings / admin users | — | — | — | Y |
| Delivery areas / ordering hours | — | — | — | Y |

Implementation: role column plus Laravel Policies and admin middleware. Menu hiding is cosmetic; every admin route is authorization-checked server-side.

---

## 5. Product domain model — catalog

Categories, brands, and attributes are **admin-editable**. The lists below are a starting structure, not a hardcoded taxonomy. Replace them with the client’s real tree after Q-1 and Q-8.

### 5.1 Category taxonomy (two levels)

```
[Top-level category]
 |-- Subcategory A
 |-- Subcategory B
 `-- Subcategory C
```

Example starter tree (replaced during Phase 3 once the client supplies the real catalog):

```
Featured
New arrivals
Best sellers
[Category 1]
[Category 2]
Sale
```

**BR-5.1** Categories are two levels. A third level is an add-on.
**BR-5.2** A category or brand with products cannot be deleted, only deactivated or emptied first.

### 5.2 Simple products and variants

```
Product (parent)
 |-- optional Variant SKU (Color=Blue, Size=M)  stock, price override, image
 |-- optional Variant SKU (Color=Blue, Size=L)
 `-- or no variants: the parent itself is the purchasable SKU
```

| Concept | Rule |
|---|---|
| Simple product | One SKU, one stock, one price |
| Variant product | Parent + 1–2 option dimensions; each combination is a SKU with stock |
| Option dimensions in v1 | Up to two (e.g. Color, Size). Labels are admin-defined |
| Price | Parent price by default; variant may override |
| Images | Parent gallery; a variant may have its own primary image |
| Out of stock | Variant cannot be added to cart; sibling variants remain buyable |

**BR-5.3** Cart lines always point at a purchasable SKU (the simple product or a specific variant), never at a parent that has variants.
**BR-5.4** SKU is unique across active simple products and variants.
**BR-5.5** Soft-deleted products return 404 on the storefront.

### 5.3 Product attributes

**Universal:** name, slug, SKU, brand (optional), category, short description, description, price, compare-at price, stock, status, featured flag, primary image, gallery, weight (optional, grams), meta title, meta description.

**Optional extra fields** (shown when filled; not a regulated alcohol schema): material, dimensions, warranty note, care instructions.

**BR-5.6** Empty optional fields are omitted on the product page, not rendered blank.

### 5.4 Merchandising collections (homepage)

| Collection | Source |
|---|---|
| Shop by category | Top-level category tiles |
| Featured / staff picks | Manually ordered list |
| New arrivals | Latest active products |
| On sale | Products with compare-at price > price |
| Last pieces | Stock at or below low-stock threshold (optional row) |

---

## 6. Store policies, service areas and operating rules

This section replaces age-restriction / licensed-goods controls. It covers the operational rules the shop must enforce.

### 6.1 Serviceable delivery areas

- **FR-P01 M** Admin maintains a list of serviceable areas (province / city / barangay or postal code) with allow or block, optional per-area delivery fee, and optional same-day flag.
- **FR-P02 M** Checkout validates the delivery address against the list before payment. Blocked areas show a clear message naming the area, with a contact option.
- **FR-P03 S** A “check if we deliver to you” widget on the homepage and cart.

**BR-6.1** Area rules are evaluated server-side at order placement, not only in the browser.
**BR-6.2** If an address matches no rule, the default is **block**.

### 6.2 Ordering hours and pause sales

- **FR-P04 S** Admin can define permitted ordering hours (for example 08:00–22:00).
- **FR-P05 M** Admin can toggle a global “Store paused” switch with a custom banner (stocktake, holiday, outage).
- **FR-P06 S** Scheduled pause windows with start and end datetimes.

**BR-6.3** When paused (or outside hours, if hours are enabled), browsing stays available but Add to Cart and Checkout are disabled in the UI and rejected server-side, with the next available time when hours apply.
**BR-6.4** Times use Asia/Manila.

### 6.3 Legal and policy pages

- **FR-P07 M** Static pages: Terms of Sale, Privacy Notice, Shipping & Delivery, Returns Policy, Contact.
- **FR-P08 M** Footer shows business name, address, contact, and policy links on every page.
- **FR-P09 M** Checkout requires an unchecked-by-default agreement to Terms of Sale.

### 6.4 Store policy settings (admin-configurable, not hardcoded)

| Setting | Default |
|---|---|
| Default for unlisted delivery areas | Block |
| Permitted ordering hours | Off (always open) |
| Global store-paused toggle + message | Off |
| COD maximum order value | Client-supplied |
| Guest checkout | On |
| VAT enabled / VAT rate | Client-supplied (typically 12%) |

### 6.5 Acceptance criteria

- **AC-P1** Placing an order to a blocked city fails at checkout with a message naming that city; no payment is initiated.
- **AC-P2** With an unlisted address and default set to block, checkout is refused.
- **AC-P3** Toggling store paused immediately blocks new orders sitewide within one page load, with no deployment.
- **AC-P4** Outside permitted hours (when enabled), Add to Cart and Checkout are disabled in the UI and rejected server-side.
- **AC-P5** Submitting checkout without accepting Terms, via direct POST, is rejected with HTTP 422 and no order is created.
- **AC-P6** Footer policy links appear on every storefront page.

---

## 7. UI / UX design specification

The built interface is checked against this section during UAT. Brand colors, logo, and any typeface the client supplies replace the placeholders after M2 sign-off.

### 7.1 Design direction

Concept: a clean, contemporary retail shop. The product image is the loudest element. Chrome is quiet. Light canvas, one brand accent, generous spacing, restrained type.

Principles:

- **P-1** Product first. Imagery leads; UI recedes.
- **P-2** One accent color, used for the primary action on a screen.
- **P-3** Space over borders. Separate content with whitespace, not heavy boxes.
- **P-4** Legibility is non-negotiable. Minimum contrast is enforced (7.10).
- **P-5** Fast over fancy. Motion clarifies cause and effect only.
- **P-6** Honest states. Out of stock, low stock, restricted area, and paused sales are shown early, never discovered at payment.

Anti-patterns: auto-rotating carousels, modal newsletter popups on first paint, more than two typefaces, icon-only controls without labels.

### 7.2 Color system

Defined as CSS custom properties in `_tokens.scss`, imported once into the Vite React bundle. React components consume tokens; hex values are never duplicated as literals in JSX.

| Role | Token | Placeholder hex | Usage |
|---|---|---|---|
| Canvas | `--shop-bg` | `#F7F5F2` | Page background |
| Surface | `--shop-surface` | `#FFFFFF` | Cards, panels |
| Surface raised | `--shop-surface-2` | `#FFFFFF` | Modals, dropdowns, drawer |
| Hairline | `--shop-border` | `#E6E1D8` | Dividers, input borders |
| Text primary | `--shop-text` | `#1A1714` | Headings, body |
| Text secondary | `--shop-text-muted` | `#6B6560` | Metadata, helper text |
| Text disabled | `--shop-text-dim` | `#9A948C` | Disabled states |
| Accent | `--shop-accent` | `#1F6B4A` | Primary CTA (replaced by brand color) |
| Accent hover | `--shop-accent-hi` | `#2A8A60` | Hover / focus |
| Accent pressed | `--shop-accent-lo` | `#18563B` | Active / pressed |
| Accent contrast | `--shop-on-accent` | `#FFFFFF` | Text on accent buttons |
| Success | `--shop-success` | `#2F7D4A` | In stock, confirmations |
| Warning | `--shop-warning` | `#C4841D` | Low stock |
| Danger | `--shop-danger` | `#C0564B` | Errors, out of stock |
| Info | `--shop-info` | `#3D6F99` | Neutral notices |

**BR-7.1** Accent is reserved for the primary action on a screen. A page has at most one filled accent button above the fold.
**BR-7.2** Destructive actions use danger, never accent.
**BR-7.3** Client brand colors replace placeholders at M2. Any new pairing must meet 7.10 contrast.

### 7.3 Typography

- Display / headings: client brand serif or a self-hosted Grotesk (e.g. “Source Serif 4” or Inter). Two typefaces maximum.
- Body / UI: Inter, 400/500/600.
- Numeric (prices): Inter with `tabular-nums`.

| Token | Size (rem) | Line | Weight | Usage |
|---|---|---|---|---|
| display | 2.75 | 1.15 | 600 | Homepage hero only |
| h1 | 2.25 | 1.20 | 600 | Page title, product name (desktop) |
| h2 | 1.75 | 1.25 | 600 | Section heading |
| h3 | 1.375 | 1.30 | 600 | Card group heading |
| h4 | 1.125 | 1.35 | 600 | Product card name |
| body-lg | 1.0625 | 1.60 | 400 | Product description |
| body | 1.0 | 1.60 | 400 | Default |
| body-sm | 0.9375 | 1.55 | 400 | Helper, metadata |
| caption | 0.8125 | 1.45 | 500 | Badges, labels |
| price-lg | 1.5 | 1.20 | 600 | PDP price |
| price | 1.125 | 1.20 | 600 | Card price |

**BR-7.4** Body copy never below 15px on any viewport.
**BR-7.5** Prices always use tabular figures.
**BR-7.6** Headings on mobile drop one step in the scale.
**BR-7.7** Fonts self-hosted with `font-display: swap`.

### 7.4 Spacing, radius, elevation

Spacing scale (4px base): 4, 8, 12, 16, 24, 32, 48, 64, 96.

- Component padding: 16 mobile / 24 desktop
- Gap between cards: 16 / 24
- Section vertical rhythm: 48 / 80
- Page gutter: 16 / 24 / 32
- Max content width: 1280px, centered

Radius: inputs/buttons 6px; cards 10px; modals 14px; images 8px; pills 999px.

Elevation: `e0` flat; `e1` light card shadow; `e2` hover/dropdown; `e3` drawer/modal.

### 7.5 Grid and breakpoints

| Breakpoint | Width | Catalog columns | Nav |
|---|---|---|---|
| xs | < 576px | 2 | Hamburger + optional bottom bar |
| sm | 576–767 | 2 | Hamburger |
| md | 768–991 | 3 | Condensed horizontal |
| lg | 992–1199 | 4 | Full horizontal |
| xl | ≥ 1200 | 4 | Full horizontal + mega menu |

**BR-7.8** Two columns on mobile, not one.

### 7.6 Iconography and imagery

Icons: Lucide React, 20px default, 1.5px stroke, inherit text color.

Product photography (content brief):

- Consistent background and lighting across the catalog.
- Primary image square 1:1, minimum 1200×1200, WebP delivered.
- Gallery: additional angles as the client supplies.
- No broken-image icons; branded placeholder when missing.

**BR-7.9** Images auto-converted to WebP with JPEG fallback; three sizes (thumb 300, card 600, detail 1200).
**BR-7.10** Every image has descriptive alt text: “[Brand] [Name]”.

### 7.7 Motion

Duration: 150ms micro, 220ms standard, 300ms drawer/modal. Easing: `cubic-bezier(0.2, 0, 0, 1)`.
**BR-7.11** Honor `prefers-reduced-motion`. No animation exceeds 300ms. No parallax. No auto-rotating carousels.

### 7.8 Component specifications

#### 7.8.1 Header (sticky)

Desktop: logo, category nav, search, account, cart with count badge.
Mobile: menu, logo, search, cart.
Height 64px desktop / 56px mobile. Announcement bar above the header is dismissible and admin-editable. Cart badge pulses 150ms when an item is added.

#### 7.8.2 Product card

1:1 image, brand caption, name (max 2 lines), price, optional compare-at (struck), stock line when ≤ 10, Add to Cart on hover (desktop) / always visible (touch).

Badge priority: OUT OF STOCK > SALE > NEW > FEATURED. At most two badges.
Out-of-stock: image at 45% opacity; button replaced by “Out of stock” (or “Notify me” if the add-on is purchased).

#### 7.8.3 Catalog with faceted filters

Sidebar 260px at lg+; bottom sheet on mobile triggered by sticky “Filter (n)”. Facets: category, brand, price range, in-stock only, and variant options present in the result set (e.g. Size, Color). Sort: Featured, Newest, Price low–high, Price high–low, Name A–Z. Filters write to the URL query string (shareable, back-button safe). Grid updates via Inertia/fetch with skeleton state.

#### 7.8.4 Product detail

Desktop: gallery left, title/price/variants/qty/CTA right, then description and specs, then related products.
Mobile: full-bleed swipeable gallery, then title block, then **sticky bottom bar** with price and Add to Cart.

Variant selectors are buttons or swatches. Unavailable combinations are visible but disabled, with a short explanation. Quantity is bounded by that variant’s stock.

#### 7.8.5 Cart drawer (primary) and cart page (fallback)

400px right drawer on desktop, full-screen sheet on mobile. Opens after Add to Cart. Line image, name, selected options, qty stepper, line price, remove. Totals: subtotal, discount, delivery, packing (if any), grand total. Free-delivery progress when a threshold is enabled.

#### 7.8.6 Checkout

Single-page accordion: Contact → Delivery → Payment → Review. No global site nav (logo returns to store with confirm if cart is non-empty). Order summary sticky at lg+; on mobile an expandable “Show order summary — PHP x” bar. Delivery-area check on city/postal blur. Place Order shows the total, spinner on submit, disabled against double clicks. Terms checkbox unchecked by default.

#### 7.8.7 Order confirmation

Order number, email receipt line, delivery address, estimated delivery, payment method, Track / Continue shopping.

#### 7.8.8 Form controls and buttons

Inputs 44px (48px touch). Focus: 2px accent outline with 2px offset. Errors describe the fix. Validation on blur and on submit; values preserved after failed submit.

| Variant | Use |
|---|---|
| Primary (accent fill) | One per view: Add to Cart, Place Order |
| Secondary (outline) | Secondary actions |
| Ghost | Tertiary / inline |
| Danger | Cancel, delete |

Sizes: sm 36px, md 44px, lg 52px (mobile CTA, full width). A button that triggers a request is disabled while in flight.

#### 7.8.9 Feedback

Toasts: bottom-right desktop, top mobile, 4s auto-dismiss; errors persist until dismissed.
Skeletons match final layout; never a full-page centered spinner.
Empty states: one-line explanation + one action (empty cart, no results, no orders).
Error pages: styled 403 / 404 / 419 / 429 / 500 with search and category links.

#### 7.8.10 Admin panel UI

Fixed 240px left sidebar (collapses to 64px icon rail), top bar with breadcrumb, search, account. Content max-width 1440px. Same tokens as the storefront.

**BR-7.12** Data tables: sticky header, hairline separators, right-aligned numeric columns with tabular figures, row click opens detail.
**BR-7.13** Status is a labelled pill, never color alone.
**BR-7.14** Destructive actions require explicit confirmation naming the record.
**BR-7.15** Unsaved-changes warning on navigate-away.
**BR-7.16** Product form panels: Basics, Pricing, Variants, Inventory, Media, SEO.
**BR-7.17** Admin usable at 1280px minimum; tablet supported for order processing.

### 7.9 Interaction and content rules

- **BR-7.18** Prices render as `PHP 1,234.00` with thousands separators and two decimals.
- **BR-7.19** Stock: “In stock” (>10), “Only N left” (1–10), “Out of stock” (0). Exact counts only at 10 or below.
- **BR-7.20** Error copy names the problem and the fix.
- **BR-7.21** No dead ends: every empty or blocked state offers a next step.
- **BR-7.22** Touch targets minimum 44×44px with 8px spacing.

### 7.10 Accessibility (WCAG 2.1 AA target)

Full keyboard operability including filters, cart drawer, and checkout. Skip-to-content as first focusable. Labels on all inputs; errors via `aria-describedby` and a live region. Async updates announced politely. Semantic landmarks, one h1 per page. `prefers-reduced-motion` honored. Contrast at least 4.5:1 for text.

### 7.11 Design deliverables and approval

1. Style tile (color, type, buttons, one product card) — client approval before any page build.
2. High-fidelity mockups: Home, Catalog, Product Detail, Cart, Checkout, Order Confirmation — desktop and mobile.
3. Component sheet: buttons, inputs, badges, toasts, empty states.
4. Built pages reviewed against this section during UAT.

Two rounds of visual revisions are included per screen. Further rounds are billable (Section 30).

### 7.12 UI acceptance criteria

- **AC-U1** Colors, type sizes, spacing, and radii resolve from tokens in 7.2–7.4.
- **AC-U2** Text/background pairings measure at least 4.5:1 (3:1 for 24px+ text and UI boundaries).
- **AC-U3** Interactive elements have hover, focus, active, disabled, and loading states.
- **AC-U4** Full purchase flow completes by keyboard only.
- **AC-U5** Full purchase flow completes on a 375×667 viewport with no horizontal scroll and no clipped content.
- **AC-U6** Catalog grid: 2 columns at 375px, 3 at 768px, 4 at 992px.
- **AC-U7** Cart drawer opens within 300ms of Add to Cart, traps focus, closes on Escape.
- **AC-U8** Product detail omits empty attribute rows.
- **AC-U9** Skeleton loaders (not spinners) during catalog filtering.
- **AC-U10** `prefers-reduced-motion` disables transform/slide animation.
- **AC-U11** Out-of-stock Add to Cart is non-functional in the UI and rejected server-side.
- **AC-U12** Mobile PDP keeps price and Add to Cart pinned while scrolling.
- **AC-U13** Empty states are designed, never blank regions.
- **AC-U14** Zoom to 200% keeps content readable and reachable.
- **AC-U15** Images lazy-load below the fold and reserve space (CLS under 0.1).
- **AC-U16** Selecting an out-of-stock variant does not add a line; the CTA explains why.

---

## 8. Technology stack

| Layer | Technology | Rationale |
|---|---|---|
| Backend framework | Laravel 13 | Fast, mature, well-staffed |
| Language | PHP 8.4+ | Framework requirement |
| Frontend | React 19 | Storefront and admin UI |
| Build | Vite + `laravel-vite-plugin` + `@vitejs/plugin-react` | HMR in development; minified bundles in production |
| Page bridge | Inertia.js | Laravel controllers render React pages; no separate public API |
| Database | MySQL 8.x (InnoDB) | Transactions + row locking |
| Styling | Custom SCSS tokens | Section 7 tokens as CSS custom properties (no Bootstrap) |
| Client requests | Inertia visits + `fetch` | Cart, filters, quantity, drawers |
| Auth | Laravel session + CSRF | Inertia shares the CSRF token |
| ORM | Eloquent | Parameterized by default |
| Web server | Nginx or Apache | Client hosting dependent |
| Cache | Laravel Cache | Facets, category tree, settings |
| Queue | Laravel Queue (database driver) | Emails, webhooks, image jobs |
| Scheduler | Laravel Scheduler | Stock release, digests, pauses |
| Images | Intervention Image | WebP + 3 sizes |
| Fonts | Self-hosted WOFF2 | No third-party render block |
| Email templates | Blade | Transactional mail only |
| Dependencies | Composer + NPM | PHP packages and React/Vite |
| VCS | Git (private) | History + handover |
| Errors | Laravel Log (optional Sentry, client-funded) | Diagnostics |

Versions are pinned in `composer.lock` and `package-lock.json` at the start of Phase 1 and are not upgraded mid-project except for security patches.

---

## 9. System architecture

### 9.1 Request lifecycle

```
                    CUSTOMER (browser)
                           |
                  HTTPS / Inertia / fetch
                           |
                           v
                 +---------------------+
                 |  Nginx / Apache     |
                 +----------+----------+
                            |
                            v
                 +---------------------+
                 |  Laravel Routes     |
                 |  + Middleware       |  auth, throttle, csrf, role,
                 +----------+----------+  EnsureStoreOpen
                            |
                            v
                 +---------------------+
                 |    Controllers      |  thin: no business logic
                 |  Inertia::render()  |  React pages, or JSON for
                 |                     |  cart/filter partials
                 +----------+----------+
                            |
              +-------------+-------------+
              v                           v
      +---------------+          +------------------+
      |   Services    |          |  Form Requests   |
      | Cart, Order,  |          |  (validation)    |
      | Inventory,    |          +------------------+
      | Payment,      |
      | Discount,     |
      | Shipping,     |
      | StorePolicy   |
      +-------+-------+
              |
              v
      +---------------+          +------------------+
      |   Eloquent    |          |  Queue Workers   |
      |    Models     |          |  mail, webhooks, |
      +-------+-------+          |  image resize    |
              |                  +---------+--------+
              v                            |
          +-------+                  +-----------+
          | MySQL |                  |   SMTP    |
          +-------+                  +-----------+
```

### 9.2 Layer rules

Controllers resolve the request, call one service, return an Inertia page or JSON. Form Requests own validation. Services own business rules and wrap state changes in transactions. Models own relationships and scopes. Policies own authorization. Jobs own anything slow or failure-prone.

`StorePolicyService` (areas, pause, hours, terms) is called from `CartService` and `OrderService`, not scattered through controllers.

### 9.3 Directory structure

```
app/
|-- Http/
|   |-- Controllers/
|   |   |-- Store/   Catalog, Product, Cart, Checkout, Account
|   |   `-- Admin/   Dashboard, Product, Order, Inventory, Coupon, Setting
|   |-- Requests/
|   `-- Middleware/  EnsureUserIsAdmin, EnsureStoreOpen
|-- Models/
|-- Services/        Cart, Order, Inventory, Payment, Discount, Shipping, StorePolicy
|-- Jobs/
|-- Policies/
`-- Support/Money.php

resources/
|-- scss/            _tokens.scss, _components.scss, app.scss
|-- js/
|   |-- app.jsx      Vite + React + Inertia entry
|   |-- Pages/Store/ and Pages/Admin/
|   |-- Components/
|   `-- Layouts/     StoreLayout, AdminLayout, CheckoutLayout
`-- views/
    |-- app.blade.php    Inertia root shell only
    `-- emails/          Blade transactional templates
```

### 9.4 Order placement flow

`OrderService::place()` opens a DB transaction, then:

1. `StorePolicyService::assertStoreOpen()`
2. `StorePolicyService::assertDeliverable(address)`
3. `DiscountService::validate(coupon)`
4. `ShippingService::quote(address, items)`
5. `InventoryService::lockAndDeduct(items)` — `SELECT … FOR UPDATE`
6. Order + order items created with price / name / SKU / option snapshots
7. `PaymentService::initiate(COD | gateway)`

Commit, then dispatch `SendOrderConfirmation` (queued). Any failure rolls the whole transaction back: no stock moved, no order row, no payment initiated.

### 9.5 Environments

| Env | Purpose |
|---|---|
| Local | Laragon, seeded demo catalog |
| Staging | Client-accessible, gateway sandbox, noindex, mail catcher |
| Production | Live domain, real keys, backups enabled |

Differences live only in `.env`; no environment branching in code.

---

## 10. Functional requirements — storefront

Priority: **M** = Must, **S** = Should, **C** = Could.

### 10.1 Homepage

| ID | Pri | Requirement |
|---|---|---|
| FR-101 | M | Hero with one editable promotional image, headline, and CTA |
| FR-102 | M | Shop-by-category tiles |
| FR-103 | M | Featured / staff picks row (max 8) |
| FR-104 | M | New arrivals row |
| FR-105 | M | Trust strip: delivery areas, speed, payment methods |
| FR-106 | M | Footer: business details, policy links, contact, social |
| FR-107 | S | On-sale row |
| FR-108 | S | Editable announcement bar |

**AC-1** Homepage renders with no console errors and no PHP notices.
**AC-2** Merchandising rows are admin-controlled without a deployment.
**AC-3** Cart count updates without reload after Add to Cart.
**AC-4** Navigation collapses to a working menu below 768px.
**AC-5** Homepage renders a sensible layout with an empty catalog.
**AC-6** Footer policy links appear on every page (AC-P6).

### 10.2 Catalog and faceted filtering

| ID | Pri | Requirement |
|---|---|---|
| FR-111 | M | Paginated grid of active products, 12 per page default (24 at xl) |
| FR-112 | M | Category and subcategory browsing with breadcrumbs |
| FR-113 | M | Facets: category, brand, price range, in-stock only |
| FR-114 | M | Sort: Featured, Newest, Price low–high, Price high–low, Name A–Z |
| FR-115 | M | Keyword search across name, brand, SKU, description |
| FR-116 | M | Filters and sort reflected in the URL query string |
| FR-117 | S | Facet option counts |
| FR-118 | S | Variant-option facets (size, color) when those options exist |
| FR-119 | C | Search suggestions as you type |

**BR-10.1** Only active products with a price are listed.
**BR-10.2** Out-of-stock products remain listed but cannot be carted.
**BR-10.3** Search is case- and accent-insensitive and matches partial words.
**BR-10.4** Soft-deleted products return 404.
**BR-10.5** Facet queries are cached and invalidated on catalog change.

**AC-7** Pagination preserves filters and sort.
**AC-8** Searching a known SKU returns exactly that product.
**AC-9** No-result search shows a designed empty state with a filter-clearing action.
**AC-10** Combining three facets returns only products matching all three.
**AC-11** A 500-product catalog meets the performance budget in Section 23.
**AC-12** Copying the filtered URL into a new browser reproduces the same results.

### 10.3 Product detail

| ID | Pri | Requirement |
|---|---|---|
| FR-121 | M | Full detail per Section 7.8.4 |
| FR-122 | M | Variant selectors when variants exist; simple add-to-cart otherwise |
| FR-123 | M | Image gallery with thumbnails and zoom |
| FR-124 | M | Quantity selector bounded by stock; async Add to Cart |
| FR-125 | M | Delivery estimate line when the customer’s area is known |
| FR-126 | S | Related products from the same category or brand (max 4) |
| FR-127 | S | Brand page listing that brand’s products |
| FR-128 | C | “Notify me when back in stock” |

**AC-13** Quantity cannot exceed stock or fall below 1, client and server.
**AC-14** Add to Cart opens the cart drawer with the correct line and total, including selected options.
**AC-15** Adding an out-of-stock, inactive, or unspecified-required-variant product is rejected with a clear message.
**AC-16** Empty attributes are omitted (AC-U8).
**AC-17** Unknown slug returns the styled 404.

---

## 11. Functional requirements — cart and checkout

### 11.1 Cart

| ID | Pri | Requirement |
|---|---|---|
| FR-201 | M | Add product; adding an existing SKU line increments quantity |
| FR-202 | M | Update quantity via debounced request with live recalculation |
| FR-203 | M | Remove line; clear cart |
| FR-204 | M | Show subtotal, discount, delivery, packing (if any), grand total |
| FR-205 | M | Guest carts by session; customer carts in the database |
| FR-206 | M | Merge guest cart into customer cart on login |
| FR-207 | M | Cart drawer plus a full cart page fallback |
| FR-208 | S | Promo code entry in cart and checkout |
| FR-209 | S | Free-delivery progress indicator |
| FR-210 | S | Warn when a line’s stock has dropped below the cart quantity |

**BR-11.1** Quantity is an integer ≥ 1 and ≤ available stock for that SKU.
**BR-11.2** All totals are computed server-side. Browser-posted amounts are ignored.
**BR-11.3** Unit prices are re-read from the database on every recalculation.
**BR-11.4** Inactive or deleted products are dropped from the cart with a notice.
**BR-11.5** Carts older than 30 days are purged by a scheduled job.
**BR-11.6** Money uses `DECIMAL(12,2)` or integer centavos. Never floats.

**AC-20** Quantity change updates line, subtotal, fees, and total without a page reload.
**AC-21** A tampered price or total has no effect on the charged amount.
**AC-22** Requesting more than available stock is rejected, naming the available quantity.
**AC-23** A guest cart survives login and is merged, not replaced.
**AC-24** Totals reconcile to the centavo after 20 successive operations.

### 11.2 Checkout

| ID | Pri | Requirement |
|---|---|---|
| FR-211 | M | Collect email, mobile, recipient name, street, barangay, city, province, postal code, delivery notes |
| FR-212 | M | Saved-address selection for logged-in customers |
| FR-213 | M | Delivery-area validation with inline feedback |
| FR-214 | M | Delivery (and packing, if any) recalculated on address change |
| FR-215 | M | Payment method selection (COD / online); COD hidden above the COD maximum |
| FR-216 | M | Terms acceptance checkbox gating submit |
| FR-217 | M | Duplicate-submission protection via idempotency token |
| FR-218 | M | Confirmation page and queued confirmation email |
| FR-219 | S | Create-an-account option during guest checkout |
| FR-220 | S | Save the entered address to the address book |
| FR-221 | S | Gift message and “hide prices on packing slip” |
| FR-222 | C | Preferred delivery date/time window |

**BR-11.7** Final server-side validation immediately before writing the order: store open, area deliverable, products active, stock sufficient, prices current, coupon valid, fees recomputed, terms accepted.
**BR-11.8** On failure the customer returns to checkout with a specific message; nothing charged, nothing deducted.
**BR-11.9** Order number format `ORD-YYYYMMDD-NNNN`, unique index in MySQL.
**BR-11.10** PH mobile format: `09XXXXXXXXX` or `+639XXXXXXXXX`.

**AC-26** Double-clicking Place Order creates exactly one order.
**AC-27** A concurrent purchase of the last unit causes one success and one clean failure.
**AC-28** Changing province updates fees before payment.
**AC-29** Required-field errors appear inline and preserve entered values.
**AC-30** Guest orders are retrievable by order number plus email.
**AC-31** The amount sent to the gateway equals the server-computed total.
**AC-32** Section 6 policy criteria (AC-P1 to AC-P5) hold at checkout.

---

## 12. Functional requirements — orders and delivery

### 12.1 Order record

Order number, customer or guest details, line items (product_id, name, SKU, selected options, unit price snapshot, qty, line total), subtotal / discount / delivery / packing / VAT / grand total, payment method and status, order status, delivery address snapshot, customer note, admin note, gift flags, status history.

**BR-12.1** Name, SKU, options, price, and address are snapshotted. Later catalog edits never alter order history.

### 12.2 Status lifecycle

```
Pending --> Confirmed --> Packing --> Out for Delivery --> Delivered
   |            |            |               |
   +------------+------------+---------------+--> Cancelled
```

| From | Allowed to | Side effect |
|---|---|---|
| Pending | Confirmed, Cancelled | Cancel restores stock |
| Confirmed | Packing, Cancelled | Cancel restores stock |
| Packing | Out for Delivery, Cancelled | Cancel restores stock |
| Out for Delivery | Delivered, Cancelled | Cancel restores stock |
| Delivered | (terminal) | — |
| Cancelled | (terminal) | — |

Payment status: Unpaid, Pending, Paid, Failed, Refunded (manual).

**BR-12.2** Invalid transitions are rejected server-side.
**BR-12.3** Every change writes an audit row: actor, from, to, timestamp, note.
**BR-12.4** Stock restoration happens in the same transaction as the status change.
**BR-12.5** COD orders start Pending / Unpaid. Online orders sit Pending / Pending until the webhook confirms, then Confirmed / Paid.
**BR-12.6** Orders are never hard-deleted.

### 12.3 Customer tracking

- **FR-301 M** Paginated order list: number, date, total, payment status, status.
- **FR-302 M** Order detail with items, totals, address, and status timeline.
- **FR-303 M** Guest lookup by order number + email.
- **FR-304 S** Customer-initiated cancellation request while status is Pending.
- **FR-305 S** Reorder: add previous line items to the cart in one action.

**AC-33** A customer cannot open another customer’s order (403/404 on ID guessing).
**AC-34** Customer-visible status always matches the last admin update.
**AC-35** Guest lookup fails when the email does not match.
**AC-36** Cancelling restores exactly the quantities deducted.
**AC-37** Reorder skips products that are now inactive or out of stock and says which were skipped.

---

## 13. Functional requirements — inventory

- **FR-401 M** Integer stock per purchasable SKU (simple product or variant).
- **FR-402 M** Admin sets stock on create and adjusts later with a reason.
- **FR-403 M** Every movement logged: actor, delta, resulting quantity, reason, reference (order / manual / cancellation).
- **FR-404 M** Per-product (or per-variant) low-stock threshold with a store-wide default.
- **FR-405 M** Low-stock and out-of-stock lists in admin.
- **FR-406 S** Optional backorder flag per SKU, default OFF.
- **FR-407 S** CSV stock import for periodic bulk updates.

**BR-13.1** Stock deducted at order creation inside the order transaction.
**BR-13.2** Deduction uses `SELECT … FOR UPDATE` on the SKU row so two concurrent checkouts cannot sell the last unit.
**BR-13.3** Unpaid online orders are auto-cancelled after 60 minutes (configurable), restoring stock.
**BR-13.4** Stock never goes negative unless backorder is explicitly enabled.
**BR-13.5** Manual adjustments bypass order logic but are always logged.

**AC-38** Two simultaneous checkouts for the last unit: one succeeds, one fails cleanly. Final stock is 0, never negative.
**AC-39** An abandoned online payment releases stock within the configured window.
**AC-40** The movement log reconciles: opening ± movements = current stock.
**AC-41** Setting stock to 0 flips the storefront badge immediately.

---

## 14. Functional requirements — payments

### 14.1 Methods

1. **Cash on Delivery.** Order created Pending / Unpaid. Admin marks Paid on delivery. Store setting caps the maximum COD value; above it COD is hidden.
2. **One online gateway** (client’s choice: PayMongo, Xendit, Maya, or a bank gateway). Hosted/redirect checkout is required so no card data touches this application.

Only **one** gateway is in the base package. Additional gateways are add-ons.

### 14.2 Online payment flow

1. Create order (Pending/Pending) and deduct stock.
2. `PaymentService` creates a gateway session.
3. Redirect to the gateway hosted page.
4. Browser success/failure return is informational only.
5. **Webhook is authoritative:** verify signature → mark Paid → Confirmed → queue emails.

**BR-14.1** The webhook, not the browser redirect, determines payment status.
**BR-14.2** Webhook signature/HMAC verified; unverified requests get 401 and are logged.
**BR-14.3** Webhook handling is idempotent by event ID.
**BR-14.4** Webhook amount and currency must match the order; a mismatch flags the order for manual review instead of marking it Paid.
**BR-14.5** All gateway traffic logged (secrets redacted), retained 90 days.
**BR-14.6** Keys live only in `.env`.
**BR-14.7** Refunds are performed in the gateway dashboard; admin then sets payment status to Refunded.
**BR-14.8** A scheduled reconciliation job polls pending payments in case a webhook is lost.

**AC-43** Sandbox success marks Paid/Confirmed and emails the customer even if the browser was closed after redirect.
**AC-44** Replaying a webhook twice changes nothing the second time.
**AC-45** A bad-signature webhook is rejected and logged.
**AC-46** A mismatched-amount webhook does not mark the order Paid.
**AC-47** Failed payment leaves the order retryable and stock held until release.
**AC-48** No card number, CVV, or full PAN is ever stored or logged.

---

## 15. Functional requirements — shipping, packing and tax

### 15.1 Delivery fees

- **FR-501 M** Default flat delivery fee in settings.
- **FR-502 M** Rate overrides by area group or per city.
- **FR-503 M** Free-delivery threshold, toggleable.
- **FR-504 M** Delivery only to allow-listed areas (Section 6.1).
- **FR-505 S** Same-day / next-day indicator per area, shown on PDP and checkout.
- **FR-506 C** Weight-based tiers if the client supplies product weights.

### 15.2 Packing / handling fee

- **FR-511 S** Optional flat or order-value handling fee, labelled separately in cart, checkout, order, and email. Off by default.
- **FR-512 S** Admin can type a courier tracking reference onto the order (manual booking in v1).

**BR-15.1** Delivery and packing fees are recomputed server-side at order placement and snapshotted onto the order.
**BR-15.2** Free-delivery thresholds apply to the delivery fee only, never to packing, unless the client says otherwise.

### 15.3 Tax

**BR-15.3** Prices are VAT-inclusive when VAT is enabled (D-3).
**BR-15.4** The order stores the VAT component as `total × rate / (100 + rate)` when VAT is on (12/112 for 12%).
**BR-15.5** VAT rate and VAT-registered status are settings, not hardcoded.
**BR-15.6** BIR-compliant official receipts are **out of scope**. The system issues a commercial order confirmation, not an official receipt.

**AC-49** Checkout fees equal the fees saved on the order.
**AC-50** Crossing the free-delivery threshold zeroes the delivery fee and restores it if the cart drops below.
**AC-51** Totals reconcile: subtotal − discount + delivery + packing = total.
**AC-52** With VAT enabled the displayed VAT component matches the formula; disabling VAT removes VAT wording sitewide.

---

## 16. Functional requirements — discounts and bundles

- **FR-601 M** Promo codes: code, type (percentage / fixed / free delivery), value, minimum purchase, start and end dates, total usage limit, per-customer limit, active flag.
- **FR-602 M** Apply and remove a code in cart or checkout with specific rejection reasons.
- **FR-603 M** Discount shown as its own line everywhere it appears.
- **FR-604 S** Restrict a code to specific categories, brands, or products.
- **FR-605 S** Curated bundle products sold as a single SKU with its own price and stock.
- **FR-606 C** Quantity-break pricing.
- **FR-607 C** Auto-applied promotions without a code.

**BR-16.1** One code per order in v1; codes do not stack.
**BR-16.2** Discounts apply to the item subtotal only, never to delivery or packing, unless the code type is free delivery.
**BR-16.3** Discounts are capped so the total can never go negative.
**BR-16.4** Validity is re-checked at order placement, not only when applied.
**BR-16.5** Usage counters increment on successful order creation and decrement if that order is cancelled.
**BR-16.6** Codes are stored uppercase and matched case-insensitively.
**BR-16.7** Each rejection reason produces a distinct message.

**AC-54** Expired, below-minimum, over-limit, and unknown codes each produce their own message.
**AC-55** A code at its usage limit is refused on the next attempt.
**AC-56** Removing items so the cart falls below the minimum removes the discount and recalculates.
**AC-57** Per-customer limits hold across guest and logged-in use of the same email.
**AC-58** Cancelling an order restores the code’s remaining usage.
**AC-59** A category-restricted code ignores non-matching lines when computing the discount base.

---

## 17. Functional requirements — customer accounts

- **FR-701 M** Registration: name, email (unique), mobile, password.
- **FR-702 M** Login, logout, remember me.
- **FR-703 M** Password reset via emailed expiring token.
- **FR-704 M** Profile edit (name, mobile, password with current-password confirmation).
- **FR-705 M** Address book with a default address.
- **FR-706 M** Order history and detail.
- **FR-707 S** Email verification before the first order (configurable).
- **FR-708 C** Wishlist.

Account nav: Profile, Addresses, Orders, Sign out.

**BR-17.1** Password minimum 8 characters, checked against the compromised-password rule where available.
**BR-17.2** Login is rate limited and failure messages are generic.
**BR-17.3** Addresses referenced by orders are soft-deleted only.
**BR-17.4** Customers can never reach admin routes.

**AC-60** Duplicate email registration is blocked with a clear message.
**AC-61** Reset links are single-use and expire in 60 minutes.
**AC-62** Changing the password invalidates other sessions.
**AC-63** Deleting an address does not alter past orders.
**AC-64** A customer hitting `/admin` receives 403.

---

## 18. Functional requirements — admin panel

### 18.1 Dashboard

Widgets: today’s orders, today’s sales, pending orders, out-for-delivery count, low-stock list, out-of-stock list, recent 10 orders, top 5 sellers this month, store-paused indicator.

**BR-18.1** Sales figures exclude Cancelled orders and state clearly whether they count Paid only or all non-cancelled orders.

### 18.2 Product management

Create, edit, duplicate, deactivate. Panels: Basics, Pricing, Variants, Inventory, Media, SEO.

**BR-18.2** Images: JPG/PNG/WebP, max 2 MB, max 6 per product, MIME-validated and re-encoded; three sizes generated automatically.
**BR-18.3** SKU unique across active simple products and variants.
**BR-18.4** Products appearing on any order are soft-deleted only.
**BR-18.5** Saving a variant product with no purchasable variant SKUs is rejected.
**BR-18.6** Brand is a managed entity, not free text, so brand facets stay clean.

### 18.3 Category and brand management

Create, edit, deactivate, reorder; two levels of category. Brands with optional logo and description for brand landing pages.

### 18.4 Order administration

List with search (order number, name, email, mobile), filters (status, payment, date range, method, area), and CSV export.

- **FR-801 M** Update status within allowed transitions only.
- **FR-802 M** Update payment status (admin only).
- **FR-803 M** Cancel with mandatory reason; stock restored.
- **FR-804 M** Internal admin notes.
- **FR-805 M** Printable picking list and packing slip, with option to hide prices for gift orders.
- **FR-806 S** Manual tracking reference, included in the dispatch email.
- **FR-807 S** CSV export of filtered orders.

### 18.5 Customer management

List, search, detail (contact, addresses, order count, lifetime spend). Admin can deactivate an account. Passwords are never viewable.

### 18.6 Store operations

- **FR-811 M** Manage the serviceable-area allow/block list and per-area fees.
- **FR-812 S** Set permitted ordering hours.
- **FR-813 M** Global store-paused toggle with a custom banner message.
- **FR-814 M** Set COD maximum.

### 18.7 Store settings

Store name, logo, favicon, contact details, address, currency, delivery fees, free-delivery threshold, optional packing fee, VAT settings, low-stock default, gateway toggle, unpaid-order release window, social links, policy page content, announcement bar, maintenance mode.

**BR-18.7** Settings are cached; the cache is invalidated on save.

**AC-66** Every admin action is permission-checked server-side per Section 4.2.
**AC-67** A new product appears on the storefront immediately after saving.
**AC-68** Invalid status transitions are rejected with a message.
**AC-69** Order search works on partial order number, name, email, and mobile.
**AC-70** Non-image or oversized uploads are rejected clearly.
**AC-71** Changing fees affects new checkouts only, never existing orders.
**AC-72** Staff cannot open settings, pricing, or promo pages.
**AC-73** Toggling store paused takes effect sitewide within one page load.

---

## 19. Notifications

All emails are queued so a slow mail server never blocks checkout.

| Event | To | Contents |
|---|---|---|
| Order placed | Customer | Number, items, totals, address, payment instructions |
| Order placed | Admin | New order alert with admin link |
| Payment received | Customer | Confirmation, order confirmed |
| Out for delivery | Customer | Dispatch note, tracking if set |
| Delivered | Customer | Thank you, support contact |
| Cancelled | Customer | Reason and next steps |
| Password reset | Customer | Expiring link |
| Welcome | Customer | Account created |
| Low stock digest (daily) | Admin | Items at or below threshold |

**BR-19.1** Emails use the store name, logo, and reply-to from settings. Email-safe light layout (dark templates render inconsistently across clients).
**BR-19.2** Failed jobs retry 3 times, then land in `failed_jobs` and are surfaced in admin.
**BR-19.3** Templates are Blade-based and editable without touching send logic.
**BR-19.4** SMS is out of scope in v1.

**AC-75** Every listed email fires on its event in staging with correct data.
**AC-76** Checkout completes normally when SMTP is unreachable.
**AC-77** Emails render correctly in Gmail web, Gmail mobile, and Outlook.

---

## 20. Data model

### 20.1 Core tables

```
users                 id, name, email(unique), phone, password, role,
                      email_verified_at, is_active, timestamps, softdeletes
brands                id, name, slug(unique), logo, description, is_active
categories            id, parent_id(nullable), name, slug(unique), description,
                      image, sort_order, is_active
products              id, category_id, brand_id, name, slug(unique), sku(unique,nullable if variants),
                      short_description, description, price, compare_at_price,
                      stock_quantity, low_stock_threshold, allow_backorder,
                      weight_grams, has_variants, is_featured, is_active,
                      meta_title, meta_description, timestamps, softdeletes
product_options       id, product_id, name (e.g. Color), sort_order
product_option_values id, product_option_id, value (e.g. Blue), sort_order
product_variants      id, product_id, sku(unique), price_override, stock_quantity,
                      image_path, is_active
product_variant_values id, variant_id, option_value_id
product_images        id, product_id, path, path_webp, alt_text, is_primary, sort_order
inventory_logs        id, product_id, variant_id(nullable), user_id, change_qty,
                      resulting_qty, reason, reference_type, reference_id, created_at
delivery_areas        id, province, city, barangay(nullable), postal_code(nullable),
                      mode(allow|block), delivery_fee, same_day_eligible, is_active
addresses             id, user_id, label, recipient_name, phone, line1, line2,
                      barangay, city, province, postal_code, is_default,
                      timestamps, softdeletes
carts                 id, user_id(nullable), session_id(nullable), coupon_id, expires_at
cart_items            id, cart_id, product_id, variant_id(nullable), quantity, unit_price_snapshot
orders                id, order_number(unique), user_id(nullable), guest_email,
                      customer_name, customer_email, customer_phone,
                      subtotal, discount_amount, coupon_code, delivery_fee,
                      packing_fee, vat_amount, total,
                      payment_method, payment_status, order_status,
                      shipping_* snapshot fields, delivery_area_id,
                      customer_note, admin_note, gift_message, hide_prices,
                      terms_accepted_at, placed_at, timestamps
order_items           id, order_id, product_id(nullable), variant_id(nullable),
                      product_name_snapshot, sku_snapshot, options_snapshot,
                      unit_price, quantity, line_total
order_status_logs     id, order_id, user_id, from_status, to_status, note, created_at
payments              id, order_id, gateway, gateway_reference(unique), amount,
                      currency, status, payload_json, paid_at, timestamps
shipments             id, order_id, courier, tracking_number, dispatched_at, delivered_at
coupons               id, code(unique), type, value, minimum_purchase,
                      starts_at, ends_at, usage_limit, per_customer_limit,
                      used_count, scope_type, scope_id, is_active
coupon_usages         id, coupon_id, order_id, user_id(nullable), email
settings              id, key(unique), value, type, group
```

### 20.2 Relationships

```
users -- addresses, orders, carts
brands -- products
categories -- products
products -- product_options -- product_option_values
products -- product_variants -- product_variant_values
products -- product_images, inventory_logs
orders -- order_items, order_status_logs, payments, shipments
coupons -- coupon_usages -- orders
delivery_areas -- orders
```

### 20.3 Data rules

**BR-20.1** Money as `DECIMAL(12,2)` unsigned or integer centavos. Never FLOAT.
**BR-20.2** Indexes on: `products(slug)`, `products(sku)`, `products(category_id, is_active)`, `products(brand_id)`, `product_variants(sku)`, `orders(order_number)`, `orders(user_id, created_at)`, `orders(order_status)`, `order_items(order_id)`, `payments(gateway_reference)`, `coupons(code)`, `cart_items(cart_id)`, `delivery_areas(province, city)`.
**BR-20.3** Foreign keys restrict or set-null; never cascade-delete orders.
**BR-20.4** Timestamps stored UTC, displayed Asia/Manila.
**BR-20.5** Soft deletes on users, products, categories, brands, addresses.

---

## 21. Validation rules reference

| Field | Rules |
|---|---|
| Name | required, 2–100 chars |
| Email | required, valid, max 150, unique on users |
| Password | required, min 8, confirmed, not compromised |
| Mobile | required, PH format `09XXXXXXXXX` or `+639XXXXXXXXX` |
| Postal code | required, 4 digits |
| Province / City | required, from the maintained list |
| Terms accepted | required, must be true at checkout |
| Product name | required, 2–200 chars |
| SKU | required on purchasable SKUs, alphanumeric plus dash/underscore, unique |
| Price | required, numeric, ≥ 0, max 9,999,999.99 |
| Stock quantity | required, integer, ≥ 0 |
| Cart quantity | required, integer, ≥ 1, ≤ available stock |
| Coupon code | 3–30 chars, alphanumeric plus dash, unique, uppercase |
| Discount percentage | 1–100 |
| Discount fixed | > 0, ≤ 9,999,999.99 |
| Image upload | mimes:jpg,jpeg,png,webp, max 2048 KB, max 4000×4000 |
| Delivery area | must resolve to an allow rule, or default-allow setting |
| Free text | escaped on output; rich text sanitized on save |

**BR-21.1** Every field is validated server-side. Client-side validation is convenience only.
**BR-21.2** Messages are specific and actionable (BR-7.20).

---

## 22. Security requirements

### 22.1 Authentication and session

Passwords hashed with bcrypt/argon2, never logged or emailed. Session cookies HttpOnly, Secure, SameSite=Lax. Session regenerated on login and password change. Reset tokens single-use, 60-minute expiry. Admin accounts separated by role.

### 22.2 Authorization

Admin routes protected by auth plus role middleware. Record-scoped actions checked with Policies against the authenticated user, not the URL parameter. IDOR tested explicitly (AC-33).

### 22.3 Input and output

All input through Form Requests. All database access via Eloquent or bound query builder; no concatenated SQL. React JSX escapes by default; raw HTML only for sanitized admin-authored rich text. CSRF on every state-changing request including Inertia visits and fetch calls.

### 22.4 Rate limiting

| Endpoint | Limit |
|---|---|
| Login | 5 / minute / IP + email |
| Registration | 5 / hour / IP |
| Password reset request | 3 / hour / email |
| Coupon apply | 10 / minute / session |
| Checkout submit | 5 / minute / session |
| Search / filter | 30 / minute / IP |
| Guest order lookup | 10 / hour / IP |
| Payment webhook | exempt from throttle, protected by signature |

### 22.5 File upload

Extension and MIME validated; images re-encoded to strip payloads and EXIF; stored on a disk with no PHP execution; randomized filenames; size and dimension limits enforced.

### 22.6 Transport and configuration

HTTPS enforced with HSTS. Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and a CSP covering self-hosted fonts and the gateway domain. `APP_DEBUG=false` in production. `.env` excluded from Git. Dependencies audited before go-live.

### 22.7 Commercial integrity

Prices, discounts, delivery fees, packing fees, VAT, inventory, and totals are always computed server-side from database values. Browser-submitted amounts are ignored (AC-21, AC-31).

### 22.8 Privacy

A Privacy Notice consistent with the Philippine Data Privacy Act of 2012 (RA 10173) is published. Purchase history is not shared with third parties beyond the payment gateway and the delivery provider. Full legal compliance (DPO, registration) is the client’s responsibility.

---

## 23. Non-functional requirements

### 23.1 Performance budget

Measured on production hosting with 500 products seeded.

| Page / action | Server response | Fully loaded |
|---|---|---|
| Homepage | < 400 ms | < 2.5 s |
| Catalog with 3 facets | < 600 ms | < 3.0 s |
| Product detail | < 400 ms | < 2.5 s |
| Add to cart (async) | < 300 ms | — |
| Filter update (async) | < 500 ms | — |
| Checkout submit | < 1.5 s | — |
| Admin order list (50 rows) | < 800 ms | — |

Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms on 4G mobile.

Techniques: eager loading (no N+1), indexes per BR-20.2, cached facets and settings, responsive WebP with reserved dimensions, lazy loading below the fold, self-hosted subset fonts, Vite-bundled minified assets.

### 23.2 Capacity

Sized for up to 100 concurrent visitors, 5,000 products, and 500 orders per month on entry-level VPS hosting. Beyond that, hosting must be upgraded and scaling work quoted separately.

### 23.3 Availability

99% monthly uptime target, dependent on the hosting provider.

### 23.4 Responsive

Per Section 7.5. Every customer flow, including checkout, must be completable at 375px width with no horizontal scrolling.

### 23.5 Browser support

Latest two stable versions of Chrome, Edge, Firefox, and Safari (desktop and iOS). No Internet Explorer.

### 23.6 Maintainability

PSR-12 with Laravel Pint. ESLint on the React tree. Design tokens defined once in `_tokens.scss`. No business logic in React pages or Blade email templates. No hardcoded credentials or magic numbers; use settings and config.

---

## 24. SEO, analytics and accessibility

### 24.1 SEO

- Readable slugs, e.g. `/shop/shirts/classic-oxford`.
- Unique, editable title and meta description per product, category, and brand.
- Brand landing pages.
- Open Graph and Twitter cards using the product image.
- XML sitemap and robots.txt; staging disallows all.
- Canonical URLs on paginated and faceted listings; filtered combinations are `noindex,follow`.
- schema.org Product markup with brand, price, availability; Organization markup with address. These tags, plus title, meta, canonical, and Open Graph, are emitted on the first HTML response (Inertia head), not only after hydration.
- Descriptive alt text (BR-7.10).
- Designed 404 with search and category links.

### 24.2 Analytics

GA4 with e-commerce events: `view_item_list`, `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`. Search Console verification. Meta Pixel/CAPI and tag-manager container design are out of scope unless quoted.

### 24.3 Accessibility

Per Section 7.10, targeting WCAG 2.1 AA. A formal audited certification is out of scope.

---

## 25. Error handling and logging

- Branded error pages for 403, 404, 419, 429, 500 (Section 7.8.9).
- Users never see stack traces, SQL, or file paths.
- Async errors return `{ success, message, errors{} }` and render as inline messages or toasts.
- Application errors logged with request context (route, user, input minus secrets), daily rotation.
- Dedicated log channel for payments/webhooks, retained 90 days minimum.
- Queue failures recorded in `failed_jobs` and surfaced in the admin dashboard.
- Optional Sentry if the client funds a plan.

---

## 26. Testing and acceptance (UAT)

### 26.1 Developer testing

Automated feature tests for the highest-risk paths:

- checkout blocked by paused store and by restricted area
- cart totals, discount capping, fee engine
- inventory deduction under concurrency (including variants)
- order placement and rollback on failure
- webhook signature verification and idempotency
- authorization boundaries (customer vs staff vs admin)

Manual testing against every acceptance criterion, including AC-U1 to AC-U16.

Security checks: tampered price and total, IDOR on orders and addresses, CSRF, file upload abuse, rate limits, direct POST bypass of terms acceptance.

### 26.2 UAT process

1. Developer delivers staging URL, test accounts (customer, staff, admin), a sandbox payment card, and a UAT checklist generated from the AC list.
2. Client tests within 5 business days.
3. Client logs issues in one consolidated list, each marked Blocker, Major, or Minor with steps to reproduce and a screenshot.
4. Developer fixes Blockers and Majors; Minors are triaged.
5. Client re-tests and signs the acceptance form.

### 26.3 Definition of done (per feature)

All acceptance criteria pass. No console errors, no PHP warnings. Works at 375px. Keyboard accessible. Authorization enforced server-side. Matches the design tokens in Section 7. Relevant automated test passes. Pint and ESLint clean.

### 26.4 Acceptance and deemed acceptance

The system is accepted when all Blocker and Major issues are resolved and the client signs the acceptance form. If the client reports no issues within 10 business days of the UAT build, or begins selling commercially on the system, the release is deemed accepted and the warranty period begins.

### 26.5 Bug vs change request

A **bug** contradicts this document and is fixed free. A **change** is anything this document does not specify, or specifies differently, and follows Section 30. Subjective visual preferences beyond the two included revision rounds are changes, not bugs.

---

## 27. Deployment, hosting and backups

### 27.1 Hosting requirements (client-provided)

PHP 8.4+ with mbstring, openssl, pdo_mysql, gd or imagick, curl, fileinfo, zip. Node.js LTS at deploy time for `npm ci` and `npm run build` (not required as a persistent production process). MySQL 8.x. Composer or a deploy pipeline. SSL. Ability to run a persistent queue worker (supervisor/systemd, or a frequent cron fallback) and a scheduler cron entry. SSH or equivalent deploy access.

### 27.2 Deployment steps

1. Provision database and `.env`.
2. Deploy code; `composer install --no-dev --optimize-autoloader`; `npm ci`; `npm run build`.
3. `php artisan migrate --force`; `storage:link`; config/route/view cache.
4. Configure the queue worker and scheduler cron (unpaid-order release, low-stock digest, cart purge, scheduled pauses).
5. Force HTTPS, `APP_DEBUG=false`, verify security headers and CSP.
6. Set delivery areas, fees, VAT, COD maximum.
7. Smoke test: place a live COD order, place a low-value live gateway order, confirm both emails.
8. Submit sitemap, enable analytics, remove staging noindex.

### 27.3 Backups

Daily database backup with 7-day retention; weekly full backup including product images; documented restore procedure tested once before handover. Backup storage costs are the client’s.

### 27.4 Rollback

The previous release tag and a pre-deployment database dump are retained so a failed deployment can be reverted the same day.

---

## 28. Development phases and milestones

**Phase 1 — Foundation** · 3–4 days  
Laravel 13 install, Vite + React 19 + Inertia scaffold, Git, environment, schema and migrations, customer and admin authentication, roles and policies, admin React shell.  
**M1:** login works; schema reviewed and approved.

**Phase 2 — Design system** · 4–5 days  
Tokens in SCSS, React component library, style tile and key mockups using the client’s brand.  
**M2:** CLIENT SIGNS OFF ON THE STYLE TILE AND HOME/PDP MOCKUPS. No page building starts before this approval.

**Phase 3 — Catalog** · 5–7 days  
Brands, categories, products, simple variants, image pipeline, listing, faceted filtering, search, product detail.  
**M3:** client can browse a seeded catalog on staging.

**Phase 4 — Cart and store policies** · 3–4 days  
Delivery-area rules, store-paused control, cart service, cart drawer, async cart.  
**M4:** area block, pause-sales, and cart acceptance criteria pass on staging.

**Phase 5 — Checkout, payments, orders** · 6–8 days  
Checkout flow, fee engine, order creation with inventory locking, gateway integration, webhooks, order lifecycle, queued emails, promo codes.  
**M5:** sandbox online payment produces a Paid, Confirmed order end to end.

**Phase 6 — Admin panel** · 5–7 days  
Dashboard, product/category/brand/variant management, inventory, customers, orders, packing slips, promos, settings.  
**M6:** client can run the shop unaided.

**Phase 7 — Testing and deployment** · 4–5 days  
Functional, security, responsive, cross-browser and accessibility testing, UAT support, bug fixing, production deployment, training, documentation.  
**M7:** go-live and signed acceptance.

**Total: 30–40 working days** (about 5–6 calendar weeks, allowing overlap between phases 2 and 3).

Schedule assumptions: content and imagery delivered on time, approvals within 3 business days, style tile approved at M2 without a full restart, gateway approved before Phase 5, no scope changes. Delays move the finish date day-for-day.

---

## 29. Commercials and payment schedule

### 29.1 Base package — PHP 45,000

Included:

- Laravel 13 application with React 19 (Vite) and MySQL
- Custom light-first theme built to Section 7, including style tile, mockups for 6 key screens, and a component library
- Catalog with brands, categories, and simple variants (up to two option dimensions)
- Faceted filtering, search, sorting
- Cart drawer with async updates
- Guest and registered checkout
- Customer accounts, addresses, order history
- COD plus **one** online payment gateway with webhooks
- Order lifecycle, packing slips
- Inventory with low-stock alerts
- Promo codes and curated bundle products
- Serviceable delivery areas and store-paused control
- Admin dashboard and store settings
- SEO basics, structured data, GA4
- Production deployment
- Admin manual and one training session (up to 2 hours, recorded)
- 30-day bug-fix warranty

### 29.2 Payment schedule

| Milestone | Share | Amount |
|---|---|---|
| Signing of this PRD (mobilization) | 40% | PHP 18,000 |
| Design sign-off at M2 | 15% | PHP 6,750 |
| Completion of Phase 5 (M5) | 25% | PHP 11,250 |
| Acceptance and go-live (M7) | 20% | PHP 9,000 |

Work pauses if a milestone payment is more than 5 business days late.

### 29.3 Optional add-ons (indicative)

| Item | Indicative price |
|---|---|
| Third (or more) variant dimension | PHP 8,000 – 12,000 |
| Additional payment gateway | PHP 6,000 – 10,000 |
| Product reviews and ratings | PHP 5,000 – 8,000 |
| Wishlist | PHP 3,000 – 5,000 |
| “Notify me when back in stock” | PHP 4,000 – 6,000 |
| Quantity-break / wholesale pricing | PHP 6,000 – 9,000 |
| Delivery time-slot booking | PHP 8,000 – 12,000 |
| Courier API (rates + tracking) | PHP 12,000 – 20,000 |
| Blog / editorial CMS | PHP 8,000 – 12,000 |
| Bulk product import/export (CSV) | PHP 5,000 – 8,000 |
| Product photography | Quoted with the photographer |
| Monthly maintenance retainer | PHP 4,000 – 7,000 / month |

### 29.4 Exclusions

Domain, hosting, SSL, email service, gateway fees and transaction charges, product photography, stock imagery, paid fonts or plugins, copywriting, product data entry beyond a sample set, legal review of terms and privacy content, and maintenance after the warranty period.

---

## 30. Change control

1. Any request outside this document is submitted in writing as a Change Request.
2. The developer responds within 2 business days with cost and schedule impact.
3. Work starts only after written approval.
4. Approved changes become numbered addenda to this document and the delivery date is adjusted.
5. Small changes may be absorbed at the developer’s discretion; this sets no precedent.
6. Two rounds of visual revisions are included per screen. Design direction changes after M2 sign-off are billable at the add-on rate.

---

## 31. Warranty, support and handover

### 31.1 Warranty

30 calendar days from go-live, covering defects where the system does not behave as specified here.

Not covered: new features, content changes, hosting or gateway outages, third-party changes, changes in law requiring new functionality, or issues caused by client edits to code, database, or server.

| Severity | Response target during warranty |
|---|---|
| Blocker (cannot take orders) | Same business day |
| Major (feature broken, workaround) | 2 business days |
| Minor (cosmetic) | 5 business days |

### 31.2 Handover deliverables

Source code in a Git repository transferred to the client. Database schema and migrations. `.env` template with documented variables (no secrets committed). Design token reference and component documentation. Admin manual covering products, variants, orders, inventory, and promos. Deployment and backup/restore notes. One recorded training session. Confirmation that all developer-created credentials are handed over or rotated.

### 31.3 After warranty

Support continues under a monthly retainer or an ad-hoc hourly rate, agreed separately.

---

## 32. Risks and mitigations

| ID | Risk | Impact | Likely | Mitigation |
|---|---|---|---|---|
| R-1 | Payment gateway onboarding delayed | High | Medium | Start in week 1. Feature-flag the gateway so the store can launch COD-only. |
| R-2 | Product photography missing or inconsistent | High | High | Photography spec issued at kickoff. Branded placeholder. Shoot quoted separately. |
| R-3 | Client needs a third variant dimension mid-build | Medium | Medium | D-2 documents the two-dimension cap. Priced as an add-on before work starts. |
| R-4 | Design direction rejected after pages are built | High | Medium | Style tile approval gate at M2 with payment attached. |
| R-5 | Overselling under concurrency | High | Low | Row-level locking; explicit concurrency test (AC-38). |
| R-6 | Delivery to a blocked area | High | Low | Server-side area validation; default-block for unlisted addresses. |
| R-7 | Weak hosting cannot run a queue worker | Medium | Medium | Requirements verified in 27.1 before Phase 1. |
| R-8 | Lost payment webhook | High | Low | Idempotent handler, retries, scheduled reconciliation poll. |
| R-9 | Scope creep | High | High | Section 30 change control; exclusions in Section 33. |
| R-10 | Slow client feedback | Medium | Medium | 3-business-day approval rule and deemed acceptance (26.4). |
| R-11 | Product category needs extra regulated flows (age, licences, prescriptions) | High | Low | Out of scope. Quote as a change if Q-1 reveals it. |

---

## 33. Out of scope

Excluded from v1 to hold the price and the 5–6 week window:

| | |
|---|---|
| Marketplace / multi-vendor | Loyalty points, rewards, referrals |
| Multiple warehouses or store locations | Affiliate program |
| POS or physical-store inventory sync | Subscriptions |
| ERP or accounting integration | Gift cards and store credit |
| Shopee / Lazada / marketplace feeds | Product reviews and ratings |
| Courier API (live rates, booking, automated tracking) | Wishlist |
| Delivery time-slot booking | “Notify me when back in stock” |
| Third-party KYC / ID verification | Blog / CMS |
| Live chat or chatbot | Abandoned-cart email campaigns |
| Automated gateway refunds | CRM and marketing automation |
| BIR-compliant official receipts | Multi-language, multi-currency |
| Complex tax / excise engine | Native mobile application |
| B2B wholesale pricing tiers | Advanced BI dashboards |
| Variant matrices beyond two dimensions | Theme switcher / dark mode toggle |
| Bulk CSV product import/export | Data migration from an existing store |
| Age gates, licensed-goods catalogs, ID-on-delivery | AI recommendations |

Any of these can be scoped and quoted as a later phase.

---

## 34. Glossary

| Term | Meaning |
|---|---|
| AC | Acceptance criterion; a testable pass/fail statement |
| Blade | Laravel’s template engine. Used for transactional emails only |
| COD | Cash on Delivery |
| Design token | A named design value (color, size, spacing) defined once and referenced everywhere |
| Facet | A filterable product attribute such as brand or price |
| IDOR | Insecure Direct Object Reference; reaching another user’s record by changing an ID |
| Idempotent | Repeating an operation produces no additional effect |
| Inertia.js | Laravel page bridge: controllers return React pages instead of HTML templates |
| PDP | Product Detail Page |
| React | UI library for the storefront and admin. Bundled by Vite |
| SKU | Stock Keeping Unit; a unique purchasable code (simple product or variant) |
| Snapshot | A copy of data stored on the order so later catalog edits do not change history |
| UAT | User Acceptance Testing |
| Variant | A purchasable combination of up to two option dimensions on a parent product |
| Vite | Frontend build tool. HMR in development; production asset bundles |
| Webhook | A server-to-server callback, here from the payment gateway |

---

## 35. Open questions for the client

Each of these blocks a design or build decision. Answer before Phase 1.

### Catalog

- **Q-1** What do you sell? (Category mix, examples of 10 typical products.) This is the most important question in the document.
- **Q-2** Roughly how many SKUs at launch, and across which categories?
- **Q-3** Do products need size/color (or similar) variants? If yes, which two dimensions matter?
- **Q-4** Do you have product photography? Is it consistent? If not, do you want a shoot quoted?
- **Q-5** Do you sell gift sets, bundles, or digital goods?
- **Q-6** Do you have existing product data in a spreadsheet or another store to migrate?

### Commerce

- **Q-7** Which payment gateway, and has merchant onboarding started?
- **Q-8** Which cities do you deliver to? Please supply the list and fees.
- **Q-9** Do you want a free-delivery threshold? At what amount?
- **Q-10** Is the business VAT-registered?
- **Q-11** Do you deliver with your own riders, a third-party courier, or both?
- **Q-12** Do you need a COD maximum?

### Operations and design

- **Q-13** Do you need staff accounts with limited access, or admin only?
- **Q-14** Which email address sends order emails, and do you have SMTP or an email service?
- **Q-15** Do you have brand assets (logo, colors, fonts)? The design in Section 7 assumes a light canvas with one brand accent.
- **Q-16** Who supplies Terms of Sale, Privacy Notice, Shipping, and Returns copy?
- **Q-17** Do you need ordering-hour limits, or should the store accept orders 24/7?

---

## Acceptance form

We confirm that the system described in this document, version 4.0, has been delivered and tested, and that all Blocker and Major issues raised during UAT have been resolved.

| | |
|---|---|
| Client representative | ______________________  Date: ______________ |
| Signature | ______________________ |
| Developer | ______________________  Date: ______________ |
| Signature | ______________________ |

Warranty period: 30 calendar days from the date signed above.

---

*End of document.*
