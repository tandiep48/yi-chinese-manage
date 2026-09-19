import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// lib/api and hooks are split into a manager half and a learner half. Nothing
// currently crosses that line; these rules keep it that way. Shared code lives
// at the lib/api root (client, constants, auth) and is deliberately unrestricted.
const LEARNER_ONLY = [
  "@/lib/api/learner/*",
  "@/hooks/book/*",
  "@/hooks/competition/*",
  "@/hooks/lesson/*",
  "@/hooks/practice/*",
  "@/hooks/profile/*",
  // "shared" means shared between learner domains, not between the two halves:
  // these hooks still reach into the learner api.
  "@/hooks/shared/*",
  "@/hooks/vocab/*",
];

const MANAGER_ONLY = ["@/lib/api/manage/*", "@/hooks/manage/*"];

const restrict = (patterns, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group: patterns, message }] }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/manage/**",
      "components/page/**",
      "components/shared/manager_ui/**",
    ],
    ignores: ["components/page/learner/**"],
    rules: restrict(
      LEARNER_ONLY,
      "Manager code cannot import learner api or hooks. Move the shared part to the lib/api root or lib/.",
    ),
  },
  {
    files: [
      "app/learner/**",
      "components/page/learner/**",
      "components/shared/customer_ui/**",
    ],
    rules: restrict(
      MANAGER_ONLY,
      "Learner code cannot import manager api or hooks. Move the shared part to the lib/api root or lib/.",
    ),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
