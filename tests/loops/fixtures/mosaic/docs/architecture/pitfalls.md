# Pitfalls Catalog

> One-line scope: general starter traps and project-specific pitfalls.
>
> Area affinity: cross-area
> Part of [Architecture docs](README.md)

> These starter traps are general checks, not decisions or measured incidents of this project; apply a trap only where current project evidence supports it. New project pitfalls get the next global P-number (see the [extension rules](README.md#extension-rules)); read [records rule 7](../process/records.md#rules) when adding one.

---

## Catalog

- **P-23 · The simplest shape is the one nobody tests.** Larger cases can pass while a general-case guard rejects the smallest valid input.
  **Rule:** for behavior keyed to a sequence, establish the minimum valid arity N, test N before N+1,
  and implement the minimum case or explain why it is impossible rather than silently excluding it.

- **P-24 · A long run whose output you discarded is a run you pay for twice.** A filtered summary can hide whether failures share one cause.
  **Rule:** retain the complete output independently of what you display, following [verification](../process/verification.md#evidence-handling).
  Read and classify the actual errors before treating a failure count as evidence of product regressions.

- **P-31 · A guard can exit successfully without checking anything.** A manual hook invocation proves nothing unless it receives the input its installed interface expects.
  **Rule:** invoke checks through their documented contract; for `guard-main`, supply its documented JSON stdin payload and inspect the result.
  Decide what observable output proves the check ran, and cite that output and the invocation with any green check; an exit code alone is not evidence.

- **P-34 · Shared or interpreted context silently claims input you meant literally.** A command can consume ambient files or interpret text the caller assumed was private or literal.
  **Rule:** identify shared inputs and parsing layers before running it; use explicit file scope and literal-safe input,
  and coordinate access to shared mutable state rather than assuming an isolated output destination isolates the inputs.

- **P-38 · Evidence you believe exists, and never checked, is not evidence.** Silence from an unproven diagnostic channel cannot show that a defect is absent.
  **Rule:** send a safe, predictable signal through the channel and confirm it arrives before relying on silence.
  A diagnostic that points to another channel must also establish that the channel is actually written. Related: **P-31**.

