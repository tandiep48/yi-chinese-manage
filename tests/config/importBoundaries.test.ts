// @vitest-environment node
import path from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

// Guards the manage/learner split in eslint.config.mjs. Without this, a new
// hooks domain folder that nobody adds to LEARNER_ONLY silently stops being
// enforced, and the two halves start reaching into each other again.

const ROOT = path.resolve(__dirname, "../..");
const RULE = "no-restricted-imports";

let eslint: ESLint;

// Resolving the flat config and booting the TS parser costs several seconds on
// the first lint. Pay it here so it is not charged to whichever test runs first.
beforeAll(async () => {
  eslint = new ESLint({ cwd: ROOT });
  await eslint.lintText("export default 1;\n", {
    filePath: path.join(ROOT, "app/manage/page.tsx"),
    warnIgnored: false,
  });
}, 60_000);

async function boundaryErrors(filePath: string, specifier: string) {
  const code = `import { thing } from "${specifier}";\nexport default thing;\n`;
  const [result] = await eslint.lintText(code, {
    filePath: path.join(ROOT, filePath),
    warnIgnored: false,
  });
  return result.messages.filter((m) => m.ruleId === RULE);
}

describe("manager code", () => {
  it.each([
    ["app/manage/page.tsx", "@/lib/api/learner/lessons"],
    ["app/manage/vocab/page.tsx", "@/hooks/vocab/useSavedWords"],
    ["components/page/vocab/VocabForm.tsx", "@/hooks/competition/useCompetitionRoom"],
    ["components/shared/manager_ui/Badge/Badge.tsx", "@/hooks/profile/useProfile"],
  ])("rejects %s importing %s", async (file, specifier) => {
    const errors = await boundaryErrors(file, specifier);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Manager code cannot import learner");
  }, 20_000);

  it.each([
    ["app/manage/page.tsx", "@/lib/api/manage/vocab"],
    ["app/manage/page.tsx", "@/lib/api/client"],
    ["components/page/passage/PassageForm.tsx", "@/hooks/manage/usePassage"],
  ])("allows %s importing %s", async (file, specifier) => {
    expect(await boundaryErrors(file, specifier)).toHaveLength(0);
  }, 20_000);
});

describe("learner code", () => {
  it.each([
    ["app/learner/profile/page.tsx", "@/hooks/manage/useUser"],
    ["components/page/learner/profile/ProfilePage.tsx", "@/lib/api/manage/vocab"],
    ["components/shared/customer_ui/Button/Button.tsx", "@/lib/api/manage/user"],
  ])("rejects %s importing %s", async (file, specifier) => {
    const errors = await boundaryErrors(file, specifier);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Learner code cannot import manager");
  }, 20_000);

  it.each([
    ["app/learner/profile/page.tsx", "@/hooks/profile/useProfile"],
    ["components/page/learner/vocab/VocabPage.tsx", "@/lib/api/learner/vocab"],
    ["app/learner/profile/page.tsx", "@/lib/api/client"],
  ])("allows %s importing %s", async (file, specifier) => {
    expect(await boundaryErrors(file, specifier)).toHaveLength(0);
  }, 20_000);
});

it("covers every learner hooks domain folder", async () => {
  const { readdirSync } = await import("node:fs");
  const domains = readdirSync(path.join(ROOT, "hooks"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "manage")
    .map((e) => e.name);

  for (const domain of domains) {
    const errors = await boundaryErrors("app/manage/page.tsx", `@/hooks/${domain}/anything`);
    expect(errors, `hooks/${domain} is not restricted from manager code`).toHaveLength(1);
  }
}, 30_000);
