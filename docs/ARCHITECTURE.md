# Architecture

FoodBite uses a **modular monolith**: one Next.js application with explicit future domain boundaries rather than premature microservices. Next.js provides server-first rendering and route organization; TypeScript supplies strict contracts; PostgreSQL and Prisma provide a durable relational foundation; pnpm supports workspace evolution; shadcn/ui patterns and Tailwind provide tokenized UI composition; Zod and React Hook Form provide validation boundaries; Vitest and Playwright support unit and browser confidence.

Microservices, Kubernetes, Redis, Elasticsearch/OpenSearch, event streaming, and a separate backend service are not used yet because Phase 0 has no demonstrated scale or workflow need for them.

Future modules include auth, users, buyers, sellers, businesses, listings, inventory, cart, orders, payments, pickups, reviews, complaints, events, donations, notifications, analytics, moderation, and admin.
