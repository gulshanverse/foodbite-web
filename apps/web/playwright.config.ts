import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3000", ...devices["Desktop Chrome"] },
  webServer: { command: "pnpm dev", url: "http://127.0.0.1:3000", reuseExistingServer: true },
});
