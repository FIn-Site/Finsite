import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom", // or "node" if no DOM needed
    include: [
      "test/unit/**/*.test.js",        // all your unit tests
      "test/*.test.js"      // the one test outside unit folder
    ],
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "test/unit-test-results",
    },
  },
});