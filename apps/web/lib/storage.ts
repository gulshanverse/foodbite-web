import crypto from "node:crypto";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;
export function validateImageMetadata(input: { contentType: string; size: number; filename: string }) { if (!allowedTypes.has(input.contentType) || input.size <= 0 || input.size > maxBytes) throw new Error("Unsupported or oversized image"); if (!/^[a-zA-Z0-9._-]+$/.test(input.filename)) throw new Error("Unsafe filename"); return true; }
export function createSafeStorageKey(filename: string) { validateImageMetadata({ contentType: filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg", size: 1, filename }); return `listings/${crypto.randomUUID()}-${filename.toLowerCase()}`; }
export function isStorageConfigured() { return Boolean(process.env.STORAGE_ENDPOINT && process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY && process.env.STORAGE_BUCKET); }
export async function createUploadTarget() { if (!isStorageConfigured()) throw new Error("Object storage is not configured"); throw new Error("Storage adapter implementation is pending provider configuration"); }
