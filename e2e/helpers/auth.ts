import path from "node:path";

/** Where the logged-in learner storage state is cached by auth.setup.ts. */
export const AUTH_FILE = path.join(__dirname, "..", ".auth", "user.json");

export const E2E_USERNAME = process.env.E2E_USERNAME ?? "";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";

/** Auth routes are only checked when a test learner is configured. */
export const hasCreds = E2E_USERNAME !== "" && E2E_PASSWORD !== "";
