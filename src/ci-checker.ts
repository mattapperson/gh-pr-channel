import { $ } from 'zx';
import { GhCheckListSchema } from './types.js';
import type { PrInfo, CiCheckState } from './types.js';

$.verbose = false;

const MAX_RAW_LOG_CHARS = 2_000;

//#region Check Fetching

async function fetchCheckList(pr: PrInfo): Promise<CiCheckState[]> {
  try {
    const result =
      await $`gh pr checks ${pr.number} --json name,state,conclusion,detailsUrl,completedAt`;
    const raw = JSON.parse(result.stdout) as unknown;
    return GhCheckListSchema.parse(raw);
  } catch {
    return [];
  }
}

//#endregion

//#region State Diffing

type CheckTransition = {
  check: CiCheckState;
  previousConclusion: string | null;
};

function diffCheckStateList(
  previous: Map<string, CiCheckState>,
  current: CiCheckState[],
): CheckTransition[] {
  const transitionList: CheckTransition[] = [];

  for (const check of current) {
    if (!check.conclusion) {
      continue;
    }

    const prev = previous.get(check.name);
    const prevConclusion = prev?.conclusion ?? null;

    if (prevConclusion !== check.conclusion) {
      transitionList.push({
        check,
        previousConclusion: prevConclusion,
      });
    }
  }

  return transitionList;
}

//#endregion

//#region Log Fetching

async function fetchFailureLogs(
  runId: string,
): Promise<string | null> {
  if (!runId) {
    return null;
  }

  const rtkAvailable = await isRtkAvailable();

  try {
    if (rtkAvailable) {
      return await fetchLogsWithRtk(runId);
    }
    return await fetchLogsRaw(runId);
  } catch {
    return null;
  }
}

async function isRtkAvailable(): Promise<boolean> {
  try {
    await $`rtk --version`;
    return true;
  } catch {
    return false;
  }
}

async function fetchLogsWithRtk(runId: string): Promise<string> {
  const result =
    await $`gh run view ${runId} --log-failed | rtk read -`;
  return result.stdout.trim();
}

async function fetchLogsRaw(runId: string): Promise<string> {
  const result = await $`gh run view ${runId} --log-failed`;
  const raw = result.stdout.trim();

  if (raw.length <= MAX_RAW_LOG_CHARS) {
    return raw;
  }

  const halfLimit = Math.floor(MAX_RAW_LOG_CHARS / 2);
  const head = raw.slice(0, halfLimit);
  const tail = raw.slice(-halfLimit);
  return `${head}\n\n... [truncated ${raw.length - MAX_RAW_LOG_CHARS} chars] ...\n\n${tail}`;
}

//#endregion

export { fetchCheckList, diffCheckStateList, fetchFailureLogs };
export type { CheckTransition };
