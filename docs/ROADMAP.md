# FoodBite roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Production foundation and shell | Implemented |
| 1 | Authentication, users, profiles, sessions, and server-enforced RBAC | Implemented |
| 2 | Seller business, surplus listings, inventory, and seller-owned operations | Implemented |
| 3 | Buyer discovery, public marketplace, search, filters, details, and favorites | Implemented |
| 4 | Cart, single-seller checkout, reservations, orders, payment boundary, webhook idempotency, seller preparation, and pickup verification | Implemented |
| 5 | Donations, bulk buyers, notifications, and optional intelligence layers | Future |

Phase 4 deliberately leaves email verification, password reset, controlled admin provisioning, live payment-provider credentials, refund-provider execution, background reservation scheduling, production pickup-code delivery, and isolated PostgreSQL integration fixtures for subsequent hardening work. The application never fakes payment success when the provider is unconfigured.
