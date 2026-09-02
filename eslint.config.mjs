import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);
const compat = new FlatCompat({ baseDirectory: directory });
export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "apps/web/next-env.d.ts", "**/*.config.mjs"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
