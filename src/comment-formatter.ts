import { CommentType } from './types.js';
import type { NormalizedComment, CommentMeta, CiCheckState, CiCheckMeta } from './types.js';

//#region Comment Formatting

function formatCommentContent(
  comment: NormalizedComment,
  isInitialLoad: boolean,
): { content: string; meta: CommentMeta } {
  const meta: CommentMeta = {
    comment_id: String(comment.id),
    comment_type: comment.type,
    author: comment.author,
    file_path: comment.filePath ?? '',
    line: comment.line != null ? String(comment.line) : '',
    start_line: comment.startLine != null ? String(comment.startLine) : '',
    pr_number: '',
    review_id: comment.reviewId != null ? String(comment.reviewId) : '',
    in_reply_to_id:
      comment.inReplyToId != null ? String(comment.inReplyToId) : '',
    is_initial_load: isInitialLoad ? 'true' : 'false',
    created_at: comment.createdAt,
    html_url: comment.htmlUrl,
  };

  const body =
    comment.type === CommentType.InlineReview
      ? formatInlineReviewBody(comment)
      : formatPrLevelBody(comment);

  const attrs = formatXmlAttrs(meta);
  const content = `<pr-comment-context ${attrs}>\n${body}\n</pr-comment-context>`;

  return { content, meta };
}

function formatPrLevelBody(comment: NormalizedComment): string {
  const lines = [
    `## PR Comment by @${comment.author}`,
    '',
    blockquote(comment.body),
    '',
    `[View on GitHub](${comment.htmlUrl})`,
  ];
  return lines.join('\n');
}

function formatInlineReviewBody(comment: NormalizedComment): string {
  const lines = [`## Code Review Comment by @${comment.author}`, ''];

  const locationParts: string[] = [];
  if (comment.filePath) {
    locationParts.push(`**File:** \`${comment.filePath}\``);
  }
  if (comment.startLine != null && comment.line != null) {
    locationParts.push(`**Lines:** ${comment.startLine}-${comment.line}`);
  } else if (comment.line != null) {
    locationParts.push(`**Line:** ${comment.line}`);
  }
  if (comment.side) {
    locationParts.push(`(${comment.side} side)`);
  }
  if (locationParts.length > 0) {
    lines.push(locationParts.join(' '));
    lines.push('');
  }

  if (comment.diffHunk) {
    lines.push('```diff');
    lines.push(comment.diffHunk);
    lines.push('```');
    lines.push('');
  }

  lines.push(blockquote(comment.body));
  lines.push('');
  lines.push(`[View on GitHub](${comment.htmlUrl})`);

  return lines.join('\n');
}

//#endregion

//#region CI Check Formatting

function formatCiCheckContent(
  check: CiCheckState,
  compressedLogs: string | null,
  isInitialLoad: boolean,
): { content: string; meta: CiCheckMeta } {
  const runId = extractRunId(check.detailsUrl);

  const meta: CiCheckMeta = {
    check_name: check.name,
    conclusion: check.conclusion ?? check.state,
    run_id: runId,
    is_initial_load: isInitialLoad ? 'true' : 'false',
  };

  const body =
    check.conclusion === 'failure'
      ? formatFailedCheckBody(check, compressedLogs)
      : formatPassedCheckBody(check);

  const attrs = formatXmlAttrs(meta);
  const content = `<ci-check-context ${attrs}>\n${body}\n</ci-check-context>`;

  return { content, meta };
}

function formatFailedCheckBody(
  check: CiCheckState,
  compressedLogs: string | null,
): string {
  const lines = [
    `## CI Check Failed: ${check.name}`,
    '',
    `**Status:** failure`,
  ];

  if (check.detailsUrl) {
    lines.push(`**URL:** ${check.detailsUrl}`);
  }

  if (compressedLogs) {
    lines.push('');
    lines.push('### Failure Logs');
    lines.push('```');
    lines.push(compressedLogs);
    lines.push('```');
  }

  return lines.join('\n');
}

function formatPassedCheckBody(check: CiCheckState): string {
  return `## CI Check Passed: ${check.name}`;
}

//#endregion

//#region Helpers

function blockquote(text: string): string {
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

function formatXmlAttrs(record: Record<string, string>): string {
  return Object.entries(record)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}="${escapeXmlAttr(v)}"`)
    .join(' ');
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractRunId(detailsUrl: string | null): string {
  if (!detailsUrl) {
    return '';
  }
  const match = /\/runs\/(\d+)/.exec(detailsUrl);
  return match?.[1] ?? '';
}

//#endregion

export { formatCommentContent, formatCiCheckContent };
