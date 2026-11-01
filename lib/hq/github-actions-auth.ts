import "server-only";

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * The identity a scheduled GitHub Actions job presents to a production
 * endpoint: GitHub's own short-lived OIDC token, verified against GitHub's
 * JWKS, with no shared secret to store, rotate or leak.
 *
 * Each job names its own audience AND its own workflow file, and both are
 * checked, so a token minted for one job cannot call another job's endpoint.
 * Adding a job is a `ScheduledJob` constant rather than a second copy of the
 * claim policy.
 */

/** Phase 8's own audience: due Wednesday reminders, period closure and the retention sweep. */
export const HQ_JOBS_AUDIENCE = "stnl-hq-jobs";

const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_JWKS = createRemoteJWKSet(
  new URL(`${GITHUB_ISSUER}/.well-known/jwks`),
);

// Immutable IDs prevent a deleted/renamed GitHub namespace from inheriting
// permission to call the production sync endpoint.
const REPOSITORY = "Superteam-Netherlands/website";
const REPOSITORY_ID = "1313967087";
const REPOSITORY_OWNER_ID = "278071737";
const MAIN_REF = "refs/heads/main";

/** One scheduled job: the audience its token is minted for, and the only workflow file allowed to mint it. */
type ScheduledJob = { audience: string; workflow: string };

export const HQ_JOBS_JOB: ScheduledJob = { audience: HQ_JOBS_AUDIENCE, workflow: "hq-jobs.yml" };

const workflowRef = (job: ScheduledJob) => `${REPOSITORY}/.github/workflows/${job.workflow}@${MAIN_REF}`;

/** Claim policy kept separate from signature verification so it is unit-testable. */
export function isTrustedJobClaims(payload: JWTPayload, job: ScheduledJob): boolean {
  return (
    payload.repository === REPOSITORY &&
    String(payload.repository_id) === REPOSITORY_ID &&
    String(payload.repository_owner_id) === REPOSITORY_OWNER_ID &&
    payload.ref === MAIN_REF &&
    payload.workflow_ref === workflowRef(job) &&
    payload.runner_environment === "github-hosted" &&
    (payload.event_name === "schedule" || payload.event_name === "workflow_dispatch")
  );
}

/**
 * Verifies GitHub's short-lived OIDC identity for one named job; no shared
 * secret is required. The audience is checked by `jwtVerify` itself, so a
 * token minted for another job fails before its claims are read, and the
 * workflow check then refuses a token minted with the right audience by the
 * wrong workflow file.
 */
async function isTrustedJobRequest(request: Request, job: ScheduledJob): Promise<boolean> {
  const header = request.headers.get("authorization");
  const match = /^Bearer ([^ ]+)$/.exec(header ?? "");
  if (!match) return false;

  try {
    const { payload } = await jwtVerify(match[1], GITHUB_JWKS, {
      algorithms: ["RS256"],
      audience: job.audience,
      issuer: GITHUB_ISSUER,
    });
    return isTrustedJobClaims(payload, job);
  } catch {
    return false;
  }
}
/** Phase 8's reminders, closures and retention sweep. Its own audience and its own workflow file. */
export const isTrustedHqJobsRequest = (request: Request): Promise<boolean> => isTrustedJobRequest(request, HQ_JOBS_JOB);
