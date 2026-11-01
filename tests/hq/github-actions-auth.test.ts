import { describe, expect, it } from "vitest";
import { vi } from "vitest";

// github-actions-auth.ts is server-only; the guard package throws outside a
// React Server environment, so stub it for the test runner.
vi.mock("server-only", () => ({}));

import {
  HQ_JOBS_AUDIENCE,
  HQ_JOBS_JOB,
  isTrustedHqJobsRequest,
  isTrustedJobClaims,
} from "@/lib/hq/github-actions-auth";

const claimsFor = (workflow: string) => ({
  repository: "Superteam-Netherlands/website",
  repository_id: "1313967087",
  repository_owner_id: "278071737",
  ref: "refs/heads/main",
  workflow_ref: `Superteam-Netherlands/website/.github/workflows/${workflow}@refs/heads/main`,
  runner_environment: "github-hosted",
  event_name: "schedule",
});

// Phase 8's requirement: "a new authenticated endpoint/audience limited to
// this work ... not shared privileges". The job has its own audience and its
// own workflow file, and a token from any other workflow is refused.
describe("scheduled HQ jobs identity", () => {
  const hqClaims = claimsFor("hq-jobs.yml");

  it("rejects an unauthenticated call before any key lookup", async () => {
    await expect(isTrustedHqJobsRequest(new Request("https://nl.superteam.fun/api/cron/hq-jobs"))).resolves.toBe(false);
  });

  it("gives the job its own audience and names the only workflow file allowed to mint it", () => {
    expect(HQ_JOBS_AUDIENCE).toBe("stnl-hq-jobs");
    expect(HQ_JOBS_JOB).toEqual({ audience: "stnl-hq-jobs", workflow: "hq-jobs.yml" });
  });

  it("accepts the HQ jobs workflow on main, scheduled or dispatched by hand", () => {
    expect(isTrustedJobClaims(hqClaims, HQ_JOBS_JOB)).toBe(true);
    expect(isTrustedJobClaims({ ...hqClaims, event_name: "workflow_dispatch" }, HQ_JOBS_JOB)).toBe(true);
  });

  it.each([
    ["another repository", { repository: "attacker/website" }],
    ["a recycled repository name", { repository_id: "999" }],
    ["another owner", { repository_owner_id: "999" }],
    ["a non-main ref", { ref: "refs/heads/feature" }],
    [
      "another workflow",
      {
        workflow_ref:
          "Superteam-Netherlands/website/.github/workflows/ci.yml@refs/heads/main",
      },
    ],
    ["a self-hosted runner", { runner_environment: "self-hosted" }],
    ["a pull request", { event_name: "pull_request" }],
  ])("rejects %s", (_label, changes) => {
    expect(isTrustedJobClaims({ ...hqClaims, ...changes }, HQ_JOBS_JOB)).toBe(false);
  });
});
