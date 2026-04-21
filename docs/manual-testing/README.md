# Manual Testing

After Claude Code finishes a task, it writes a recipe here so a human can reproduce what it built — without reading the code.

**Structure:** one file per phase (`phase-NN.md`). Each task in the phase gets its own section.

**Every recipe must include:**
1. **Setup** — what to install, what env vars to set, what state the repo should be in (branch, migrations run, etc).
2. **Command** — exact copy-pasteable commands.
3. **Expected output** — what the human should see. Include a JSON snippet or screenshot description.
4. **What this proves** — what this recipe is actually demonstrating.

**If a recipe requires Cloudflare credentials or deploys to real infrastructure, say so loudly at the top.**
