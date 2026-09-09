import { checkRuntimeConfig } from "../apps/web/lib/runtime-config";
const result = checkRuntimeConfig();
if (!result.ok) { console.error(result.error); process.exit(1); }
console.log(`Runtime configuration shape is valid for ${process.env.NODE_ENV ?? "development"}.`);
