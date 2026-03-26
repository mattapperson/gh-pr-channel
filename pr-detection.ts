import { $ } from 'zx';
import { PrInfoSchema, RepoInfoSchema } from './types.ts';
import type { PrInfo } from './types.ts';

$.verbose = false;

type DetectResult =
  | { found: true; pr: PrInfo }
  | { found: false; reason: string };

async function detectPr(): Promise<DetectResult> {
  const ghAvailable = await isGhAvailable();
  if (!ghAvailable) {
    return {
      found: false,
      reason:
        'gh CLI not found. Install it: https://cli.github.com/',
    };
  }

  const repoResult = await fetchRepoInfo();
  if (!repoResult.ok) {
    return { found: false, reason: repoResult.reason };
  }

  const prResult = await fetchPrInfo();
  if (!prResult.ok) {
    return { found: false, reason: prResult.reason };
  }

  return {
    found: true,
    pr: {
      ...prResult.data,
      owner: repoResult.owner,
      repo: repoResult.repo,
    },
  };
}

async function isGhAvailable(): Promise<boolean> {
  try {
    await $`gh --version`;
    return true;
  } catch {
    return false;
  }
}

async function fetchRepoInfo(): Promise<
  | { ok: true; owner: string; repo: string }
  | { ok: false; reason: string }
> {
  try {
    const result = await $`gh repo view --json owner,name`;
    const parsed = RepoInfoSchema.parse(JSON.parse(result.stdout));
    return { ok: true, owner: parsed.owner.login, repo: parsed.name };
  } catch {
    return {
      ok: false,
      reason:
        'Could not detect repository. Ensure you are in a GitHub repo with a remote.',
    };
  }
}

async function fetchPrInfo(): Promise<
  | { ok: true; data: Omit<PrInfo, 'owner' | 'repo'> }
  | { ok: false; reason: string }
> {
  try {
    const result =
      await $`gh pr view --json number,title,url,headRefName,baseRefName,author,state`;
    const parsed = PrInfoSchema.parse(JSON.parse(result.stdout));
    return { ok: true, data: parsed };
  } catch {
    return {
      ok: false,
      reason:
        'No pull request found for the current branch.',
    };
  }
}

export { detectPr };
export type { DetectResult };
