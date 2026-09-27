## Important

Referenced files (except `CLAUDE.md`) are never to be read without reasoning, you read only when relevant to your work.
[CLAUDE.md](CLAUDE.md) - Orientation: precedence rules, repo map, and workflow pointers; read this first

## Harness

Fixture houses two harness ports: `omp` (github: can1357/oh-my-pi) and `claude` (https://code.claude.com/docs).
When required to manage the harness itself (skills, agents, etc) always mirror — see [docs/workflow.md §7](docs/workflow.md)

## Divergence

- **Skills & agents**: `.omp/{skills,agents}/` and `.claude/{skills,agents}/`
  `omp`-only frontmatter: `thinkingLevel`, `read-summarize`, `spawns`.
- **Reviewer split**: `.claude` runs a single `reviewer` agent; `.omp` runs a dual pair —
  `claude-reviewer` + `gpt-reviewer`, dispatched together, both must `APPROVE`.
- **Cross-model work**: When applicable, use cross-model refutation via `gpt-6-sol` and `claude-opus-5`,
  having models refute each other provides much richer context and is a core principle to follow.
  The dual reviewers independently check the same diff.
- **Model config**: `executor` uses the `task` role, `gpt-reviewer` uses `gpt-6-sol`, and
  `plan-adversary` uses `gpt-6-sol`; `claude-reviewer` uses `claude-opus-5`.
  `registry-scout` and `context-scout` use the `smol` role.
  Claude Code retains its own single-reviewer model selectors.
- **Orchestration idiom**: agents are dispatched via `task`;
  a plan-adversary follow-up round arrives as an irc DM rather than a same-agent follow-up message.
- **Hooks**: `omp` uses TypeScript which is self-wired while `claude` has more diverse options defined in `settings.json`.

## Handling Out-Of-Usage

We work with multiple model subscriptions, you MIGHT encounter such errors dispatching agents.
Mitigate such issues:
- switch agent model between `GPT-family` and `Claude-family`.
- avoid multi-model workflows (dual-review and cross-model refutation)
- arm a periodic check for long works (night-task), check usage-limit
- clear restrictions imposed above once periodic check returns that limit is restored 
