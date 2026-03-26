import { $ } from 'zx';
import {
  GhIssueCommentListSchema,
  GhReviewCommentListSchema,
  CommentType,
} from './types.js';
import type { PrInfo, NormalizedComment } from './types.js';

$.verbose = false;

async function fetchPrLevelCommentList(
  pr: PrInfo,
  since?: string,
): Promise<NormalizedComment[]> {
  const url = since
    ? `repos/${pr.owner}/${pr.repo}/issues/${pr.number}/comments?since=${since}`
    : `repos/${pr.owner}/${pr.repo}/issues/${pr.number}/comments`;

  try {
    const result = await $`gh api ${url} --paginate`;
    const raw = JSON.parse(result.stdout) as unknown;
    const commentList = GhIssueCommentListSchema.parse(raw);

    return commentList.map(
      (c): NormalizedComment => ({
        id: c.id,
        type: CommentType.PrLevel,
        author: c.user.login,
        body: c.body,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        htmlUrl: c.html_url,
        filePath: null,
        line: null,
        startLine: null,
        side: null,
        diffHunk: null,
        inReplyToId: null,
        reviewId: null,
      }),
    );
  } catch {
    return [];
  }
}

async function fetchReviewCommentList(
  pr: PrInfo,
  since?: string,
): Promise<NormalizedComment[]> {
  const url = since
    ? `repos/${pr.owner}/${pr.repo}/pulls/${pr.number}/comments?since=${since}`
    : `repos/${pr.owner}/${pr.repo}/pulls/${pr.number}/comments`;

  try {
    const result = await $`gh api ${url} --paginate`;
    const raw = JSON.parse(result.stdout) as unknown;
    const commentList = GhReviewCommentListSchema.parse(raw);

    return commentList.map(
      (c): NormalizedComment => ({
        id: c.id,
        type: CommentType.InlineReview,
        author: c.user.login,
        body: c.body,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        htmlUrl: c.html_url,
        filePath: c.path,
        line: c.line ?? c.original_line,
        startLine: c.start_line ?? c.original_start_line,
        side: c.side,
        diffHunk: c.diff_hunk,
        inReplyToId: c.in_reply_to_id,
        reviewId: c.pull_request_review_id,
      }),
    );
  } catch {
    return [];
  }
}

async function fetchAllCommentList(
  pr: PrInfo,
  since?: string,
): Promise<NormalizedComment[]> {
  const [prCommentList, reviewCommentList] = await Promise.all([
    fetchPrLevelCommentList(pr, since),
    fetchReviewCommentList(pr, since),
  ]);

  const all = [...prCommentList, ...reviewCommentList];
  all.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return all;
}

export { fetchAllCommentList, fetchPrLevelCommentList, fetchReviewCommentList };
