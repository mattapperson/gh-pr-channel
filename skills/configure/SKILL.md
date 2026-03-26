# /github-pr:configure

Verify prerequisites and show the current channel status for the GitHub PR channel.

## Steps

1. **Check `gh` CLI**

   Run `gh --version`. If it fails, tell the user:
   > GitHub CLI is not installed. Install it from https://cli.github.com/

2. **Check `gh` auth**

   Run `gh auth status`. If it fails, tell the user:
   > GitHub CLI is not authenticated. Run `gh auth login` to set up.

3. **Check `rtk` (optional)**

   Run `rtk --version`. If it fails, note:
   > `rtk` is not installed (optional). CI failure logs will be truncated instead of compressed. Install for 60-90% token savings: `brew install rtk`

   If it succeeds, note:
   > `rtk` is installed. CI failure logs will be compressed automatically.

4. **Check current branch PR**

   Run `gh pr view --json number,title,url,state`. If it fails:
   > No pull request found for the current branch. The channel will idle until a PR is created.

   If it succeeds, display the PR number, title, state, and URL.

5. **Summary**

   Print a summary of all checks with pass/fail status and any next steps.
