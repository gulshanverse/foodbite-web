# UI/UX

The shell uses a warm off-white surface, deep teal text, and coral action color to feel trustworthy, modern, local, and sustainable without relying on excessive green or decorative eco clichés. Responsive layout, semantic headings, visible focus states, and meaningful link labels are part of the foundation.

## Phase 2 seller experience

The seller dashboard uses real database metrics and an explicit empty state; it never presents fabricated activity. Business maintenance and surplus listing creation use labeled semantic forms with visible focus states, native controls, status messages, and mobile-friendly grid layouts. Listing and inventory tables scroll horizontally on narrow screens and expose status as text, not color alone.

The listing form captures basic details, quantity and integer-rupee input, food information, and pickup window, then saves a draft. Seller-facing copy says that food information and handling details are seller-provided and does not claim FoodBite guarantees safety or regulatory verification. Image metadata requires meaningful alt text. Buyer marketplace and purchasing interfaces remain deferred.

## Phase 3 buyer marketplace

Public discovery uses `/explore` as the primary entry point and `/food/:slug` for details. The experience emphasizes food name, business, current and original integer-rupee prices, derived discount, food type, real inventory availability, pickup end, and optional reliable distance. Category chips and native filter controls preserve URL state so searches can be shared and revisited.

Food cards use a clear `View details` action and intentionally do not show a working Buy Now, cart, checkout, or payment control. Empty, no-match, unavailable, expired, and database-unavailable states use explanatory copy without fake cards or internal errors. Public browsing does not require login; the save/favorite control is an authenticated buyer action and communicates sign-in failure without exposing backend details.
