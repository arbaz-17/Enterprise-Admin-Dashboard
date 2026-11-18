
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  fullyParallel: false,
  workers: 1,

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  retries: 0,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

projects: [
  {
    name: "edge",
    use: {
      ...devices["Desktop Chrome"],
      channel: "msedge",
    },
  },
],

  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
