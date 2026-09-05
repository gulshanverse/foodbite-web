# FoodBite Product Requirements

## Implemented
Phase 0 communicates the product promise, defines primary audiences, and establishes placeholder route groups.

## Planned
A pickup-first surplus food marketplace supporting SELL, DONATE, and BULK/CLEARANCE modes.

## Deferred
Discovery, listing workflows, checkout, payments, moderation, and operational analytics are intentionally deferred.

## Phase 2 — Implemented

Authenticated sellers can view a database-backed dashboard, maintain seller-owned business information, create surplus listing drafts, view seller-owned listings, publish eligible listings, pause or resume listings, and inspect inventory. The seller flow captures category, listing type, food type, integer paise pricing, quantity/unit, seller-provided food information, and pickup windows. FSSAI fields are collected for future verification; entering a number does not represent verification or a food-safety guarantee.

## Phase 3+ — Deferred

Buyer discovery, public marketplace listing detail, cart, checkout, orders, reservations, pickup QR, payments, delivery, moderation, admin verification, notifications, donations, bulk clearance, and intelligence layers remain deferred. Phase 2 does not create buyer-visible purchasing behavior.

## Phase 3 — Implemented

Public buyers can browse eligible real surplus listings through `/explore` and `/food/:slug`, with authenticated buyers retaining `/buyer/explore`. Discovery supports database-backed category browsing, search, food-type and price parameters, sorting, pagination, optional city/coordinate inputs, listing detail, seller business context, seller-provided food information, inventory availability, pickup windows, and database-backed favorites for active buyers.

Only listings with active status, positive inventory, future pickup end, an active seller account, and a business relationship are visible. Phase 3 remains discovery-only; cart, checkout, reservations, orders, payments, delivery, and pickup QR are not implemented.
