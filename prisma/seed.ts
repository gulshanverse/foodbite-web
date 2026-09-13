import { PrismaClient, type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

const categories = ["Meals", "Bakery", "Pizza", "Desserts", "Healthy", "Grocery", "Snacks", "Beverages", "Indian Food", "Other"];
const LOCAL_PASSWORD = "FoodBiteLocal!2026";
const LOCAL_DONATION_CODE = "246810";
const fixtureEnabled = process.env.FOODBITE_SEED_E2E === "true";

const ids = {
  business: "00000000-0000-4000-8000-000000000101",
  activeListing: "00000000-0000-4000-8000-000000000201",
  donationListing: "00000000-0000-4000-8000-000000000202",
  buyerNotification: "00000000-0000-4000-8000-000000000301",
  auditLog: "00000000-0000-4000-8000-000000000302",
};

const accounts: Array<{ email: string; role: UserRole; name: string }> = [
  { email: "buyer.e2e@foodbite.local", role: "BUYER", name: "Local E2E Buyer" },
  { email: "seller.e2e@foodbite.local", role: "SELLER", name: "Local E2E Seller" },
  { email: "ngo.e2e@foodbite.local", role: "NGO", name: "Local E2E NGO" },
  { email: "admin.e2e@foodbite.local", role: "SUPER_ADMIN", name: "Local E2E Admin" },
  { email: "moderator.e2e@foodbite.local", role: "MODERATOR", name: "Local E2E Moderator" },
  { email: "support.e2e@foodbite.local", role: "SUPPORT", name: "Local E2E Support" },
];

async function seedCategories() {
  for (const [sortOrder, name] of categories.entries()) {
    await prisma.foodCategory.upsert({
      where: { slug: name.toLowerCase().replace(/ /g, "-") },
      update: { name, sortOrder, isActive: true },
      create: { name, slug: name.toLowerCase().replace(/ /g, "-"), sortOrder },
    });
  }
}

async function seedE2EFixtures() {
  const passwordHash = await bcrypt.hash(LOCAL_PASSWORD, 12);
  const users = new Map<string, { id: string; role: UserRole }>();

  const legacyListingIds = ["00000000-0000-0000-0000-000000000201", "00000000-0000-0000-0000-000000000202"];
  const legacyBusinessId = "00000000-0000-0000-0000-000000000101";
  await prisma.order.deleteMany({ where: { items: { some: { listingId: { in: legacyListingIds } } } } });
  await prisma.reservation.deleteMany({ where: { listingId: { in: legacyListingIds } } });
  await prisma.favorite.deleteMany({ where: { listingId: { in: legacyListingIds } } });
  await prisma.cartItem.deleteMany({ where: { listingId: { in: legacyListingIds } } });
  await prisma.donationReservation.deleteMany({ where: { donation: { listingId: { in: legacyListingIds } } } });
  await prisma.donation.deleteMany({ where: { listingId: { in: legacyListingIds } } });
  await prisma.inventory.deleteMany({ where: { listingId: { in: legacyListingIds } } });
  await prisma.foodListing.deleteMany({ where: { id: { in: legacyListingIds } } });
  await prisma.businessOperatingHour.deleteMany({ where: { businessId: legacyBusinessId } });
  await prisma.sellerProfile.updateMany({ where: { businessId: legacyBusinessId }, data: { businessId: null } });
  await prisma.business.deleteMany({ where: { id: legacyBusinessId } });

  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, role: account.role, status: "ACTIVE", deletedAt: null, emailVerifiedAt: new Date() },
      create: { email: account.email, passwordHash, role: account.role, status: "ACTIVE", emailVerifiedAt: new Date() },
      select: { id: true, role: true },
    });
    users.set(account.email, user);
  }

  const buyer = users.get("buyer.e2e@foodbite.local")!;
  const seller = users.get("seller.e2e@foodbite.local")!;
  const ngo = users.get("ngo.e2e@foodbite.local")!;
  const admin = users.get("admin.e2e@foodbite.local")!;
  const meals = await prisma.foodCategory.findUniqueOrThrow({ where: { slug: "meals" } });
  const now = new Date();
  const pickupStart = new Date(now.getTime() + 60 * 60 * 1000);
  const pickupEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.buyerProfile.upsert({
    where: { userId: buyer.id },
    update: { name: "Local E2E Buyer", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
    create: { userId: buyer.id, name: "Local E2E Buyer", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  });

  await prisma.business.upsert({
    where: { id: ids.business },
    update: { name: "Local E2E Kitchen", type: "RESTAURANT", city: "Bengaluru", state: "Karnataka", verificationStatus: "VERIFIED", pickupAvailable: true },
    create: { id: ids.business, name: "Local E2E Kitchen", type: "RESTAURANT", city: "Bengaluru", state: "Karnataka", verificationStatus: "VERIFIED", pickupAvailable: true },
  });

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: { businessId: ids.business, verificationStatus: "VERIFIED" },
    create: { userId: seller.id, businessId: ids.business, verificationStatus: "VERIFIED" },
  });

  for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek += 1) {
    await prisma.businessOperatingHour.upsert({
      where: { businessId_dayOfWeek_openTime_closeTime: { businessId: ids.business, dayOfWeek, openTime: "09:00", closeTime: "21:00" } },
      update: {},
      create: { businessId: ids.business, dayOfWeek, openTime: "09:00", closeTime: "21:00" },
    });
  }

  const activeListing = await prisma.foodListing.upsert({
    where: { slug: "local-e2e-meal-box" },
    update: { sellerId: sellerProfile.id, categoryId: meals.id, status: "ACTIVE", pickupStart, pickupEnd, quantity: 20, originalPrice: 25000, sellingPrice: 12000 },
    create: { id: ids.activeListing, sellerId: sellerProfile.id, categoryId: meals.id, name: "Local E2E Meal Box", slug: "local-e2e-meal-box", description: "Development-only fixture listing for local verification.", listingType: "EXACT", foodType: "VEGETARIAN", originalPrice: 25000, sellingPrice: 12000, quantity: 20, unit: "BOX", pickupStart, pickupEnd, packagingInfo: "Sealed local test package", status: "ACTIVE", publishedAt: now },
  });
  await prisma.inventory.upsert({ where: { listingId: activeListing.id }, update: { totalQuantity: 20, availableQuantity: 20, reservedQuantity: 0, soldQuantity: 0 }, create: { listingId: activeListing.id, totalQuantity: 20, availableQuantity: 20 } });

  const donationListing = await prisma.foodListing.upsert({
    where: { slug: "local-e2e-donation-box" },
    update: { sellerId: sellerProfile.id, categoryId: meals.id, status: "ACTIVE", pickupStart, pickupEnd, quantity: 12, originalPrice: 0, sellingPrice: 0 },
    create: { id: ids.donationListing, sellerId: sellerProfile.id, categoryId: meals.id, name: "Local E2E Donation Box", slug: "local-e2e-donation-box", description: "Development-only donation fixture for local verification.", listingType: "EXACT", foodType: "VEGETARIAN", originalPrice: 0, sellingPrice: 0, quantity: 12, unit: "BOX", pickupStart, pickupEnd, status: "ACTIVE", publishedAt: now },
  });
  const existingDonation = await prisma.donation.findUnique({ where: { listingId: donationListing.id }, select: { id: true } });
  if (existingDonation) await prisma.donationReservation.deleteMany({ where: { donationId: existingDonation.id } });
  await prisma.inventory.upsert({ where: { listingId: donationListing.id }, update: { totalQuantity: 12, availableQuantity: 12, reservedQuantity: 0, soldQuantity: 0, donatedQuantity: 12 }, create: { listingId: donationListing.id, totalQuantity: 12, availableQuantity: 12, donatedQuantity: 12 } });
  await prisma.donation.upsert({ where: { listingId: donationListing.id }, update: { sellerId: sellerProfile.id, status: "AVAILABLE", quantity: 12, availableQuantity: 12, reservedQuantity: 0, collectedQuantity: 0, expiresAt: pickupEnd, pickupCodeHash: createHash("sha256").update(LOCAL_DONATION_CODE).digest("hex"), pickupCodeLast4: LOCAL_DONATION_CODE.slice(-4) }, create: { listingId: donationListing.id, sellerId: sellerProfile.id, status: "AVAILABLE", quantity: 12, availableQuantity: 12, expiresAt: pickupEnd, pickupCodeHash: createHash("sha256").update(LOCAL_DONATION_CODE).digest("hex"), pickupCodeLast4: LOCAL_DONATION_CODE.slice(-4) } });

  await prisma.cart.upsert({ where: { userId: buyer.id }, update: {}, create: { userId: buyer.id } });
  const cart = await prisma.cart.findUniqueOrThrow({ where: { userId: buyer.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.favorite.deleteMany({ where: { userId: buyer.id } });
  await prisma.notification.upsert({ where: { eventId_recipientId_type_channel: { eventId: "local-e2e-notification", recipientId: buyer.id, type: "OPERATIONAL_ALERT", channel: "IN_APP" } }, update: { title: "Local E2E notification", body: "Development-only unread notification.", readAt: null }, create: { id: ids.buyerNotification, eventId: "local-e2e-notification", recipientId: buyer.id, type: "OPERATIONAL_ALERT", channel: "IN_APP", title: "Local E2E notification", body: "Development-only unread notification." } });
  await prisma.notificationPreference.upsert({ where: { userId: buyer.id }, update: {}, create: { userId: buyer.id } });

  await prisma.nGOProfile.upsert({
    where: { userId: ngo.id },
    update: { organizationName: "Local E2E NGO", contactPerson: "Local E2E NGO", verificationStatus: "VERIFIED", serviceArea: "Bengaluru" },
    create: { userId: ngo.id, organizationName: "Local E2E NGO", contactPerson: "Local E2E NGO", verificationStatus: "VERIFIED", serviceArea: "Bengaluru" },
  });
  await prisma.auditLog.upsert({ where: { id: ids.auditLog }, update: { actorId: admin.id, action: "LOCAL_E2E_FIXTURE", resourceType: "SEED", resourceId: ids.business, metadata: { localOnly: true } }, create: { id: ids.auditLog, actorId: admin.id, action: "LOCAL_E2E_FIXTURE", resourceType: "SEED", resourceId: ids.business, metadata: { localOnly: true } } });

  console.log(`Seeded local-only E2E fixtures. Password for all local accounts: ${LOCAL_PASSWORD}; donation code: ${LOCAL_DONATION_CODE}`);
}

async function main() {
  await seedCategories();
  if (fixtureEnabled) await seedE2EFixtures();
  else console.log("Seeded categories only. Set FOODBITE_SEED_E2E=true for local-only E2E fixtures.");
}

main().finally(() => prisma.$disconnect());
