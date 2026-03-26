import { z } from 'zod';

const EnvSchema = z.object({
  POLL_INTERVAL_MS: z.coerce.number().min(5_000).default(30_000),
  GH_PR_CHANNEL_DEBUG: z.coerce.boolean().default(false),
});

type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  return EnvSchema.parse(process.env);
}

export { loadEnv };
export type { Env };
