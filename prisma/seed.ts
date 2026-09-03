import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const categories = ["Meals", "Bakery", "Pizza", "Desserts", "Healthy", "Grocery", "Snacks", "Beverages", "Indian Food", "Other"];
async function main() { for (const [sortOrder, name] of categories.entries()) await prisma.foodCategory.upsert({ where: { slug: name.toLowerCase().replace(/ /g, "-") }, update: { name, sortOrder }, create: { name, slug: name.toLowerCase().replace(/ /g, "-"), sortOrder } }); }
main().finally(() => prisma.$disconnect());
