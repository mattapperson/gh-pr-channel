import { z } from 'zod';

//#region PR Info

const PrInfoSchema = z.object({
  number: z.number(),
  title: z.string(),
  url: z.string(),
  headRefName: z.string(),
  baseRefName: z.string(),
  author: z.object({ login: z.string() }),
  state: z.string(),
});

const RepoInfoSchema = z.object({
  owner: z.object({ login: z.string() }),
  name: z.string(),
});

type PrInfo = z.infer<typeof PrInfoSchema> & {
  owner: string;
  repo: string;
};

//#endregion

//#region Comments

const GhIssueCommentSchema = z.object({
  id: z.number(),
  body: z.string(),
  user: z.object({ login: z.string() }),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string(),
});

const GhReviewCommentSchema = z.object({
  id: z.number(),
  body: z.string(),
  user: z.object({ login: z.string() }),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string(),
  path: z.string(),
  line: z.number().nullable(),
  start_line: z.number().nullable(),
  original_line: z.number().nullable(),
  original_start_line: z.number().nullable(),
  side: z.enum(['LEFT', 'RIGHT']).nullable().catch(null),
  diff_hunk: z.string().nullable().catch(null),
  in_reply_to_id: z.number().nullable().catch(null),
  pull_request_review_id: z.number().nullable().catch(null),
  subject_type: z.string().nullable().catch(null),
});

const GhIssueCommentListSchema = z.array(GhIssueCommentSchema);
const GhReviewCommentListSchema = z.array(GhReviewCommentSchema);

const CommentType = {
  PrLevel: 'pr_level',
  InlineReview: 'inline_review',
} as const;

type CommentType = (typeof CommentType)[keyof typeof CommentType];

type NormalizedComment = {
  id: number;
  type: CommentType;
  author: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  filePath: string | null;
  line: number | null;
  startLine: number | null;
  side: 'LEFT' | 'RIGHT' | null;
  diffHunk: string | null;
  inReplyToId: number | null;
  reviewId: number | null;
};

//#endregion

//#region CI Checks

const GhCheckSchema = z.object({
  name: z.string(),
  state: z.string(),
  conclusion: z.string().nullable().catch(null),
  detailsUrl: z.string().nullable().catch(null),
  completedAt: z.string().nullable().catch(null),
});

const GhCheckListSchema = z.array(GhCheckSchema);

type GhCheck = z.infer<typeof GhCheckSchema>;

type CiCheckState = {
  name: string;
  state: string;
  conclusion: string | null;
  detailsUrl: string | null;
  completedAt: string | null;
};

//#endregion

//#region Channel Event Meta

type CommentMeta = {
  comment_id: string;
  comment_type: string;
  author: string;
  file_path: string;
  line: string;
  start_line: string;
  pr_number: string;
  review_id: string;
  in_reply_to_id: string;
  is_initial_load: string;
  created_at: string;
  html_url: string;
};

type CiCheckMeta = {
  check_name: string;
  conclusion: string;
  run_id: string;
  is_initial_load: string;
};

//#endregion

export {
  PrInfoSchema,
  RepoInfoSchema,
  GhIssueCommentListSchema,
  GhReviewCommentListSchema,
  GhCheckListSchema,
  CommentType,
};
export type {
  PrInfo,
  NormalizedComment,
  GhCheck,
  CiCheckState,
  CommentMeta,
  CiCheckMeta,
};
