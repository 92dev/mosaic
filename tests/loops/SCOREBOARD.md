# Loop scoreboard

Tokens include input, output, and cache tokens; prompt tokens are the first request's input plus cache; cost is USD; tool calls count executions; checks are PASS/FAIL/CANNOT-EVALUATE counts.

| scenario | harness | model-thinking | timestamp | tokens.total | firstRequestPromptTokens | cost | requests | tool calls (n) | checks P/F/C | verdicts | tag |
|---|---|---|---|---:|---:|---:|---:|---:|---|---|---|
| S0-smoke | baseline | claude-haiku-4-5-low | 2026-09-24T14:47:10.115Z | 14847 | 14796 | 0.0298 | 1 | 0 | 1/0/0 |  |  |
| S1-closeout-triage | baseline | anthropic/claude-opus-5-xhigh | 2026-09-24T14:56:15.547Z | 3763440 | 19702 | 3.6551 | 51 | 49 | 9/1/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S1-closeout-triage | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:04:47.949Z | 1213414 | 11700 | 2.3354 | 27 | 57 | 9/1/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-24T15:15:28.795Z | 5079105 | 19409 | 4.8346 | 54 | 79 | 7/5/0 | claude-orchestrator:worse, gpt-critic:worse | mosaic-v0 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:15:28.821Z | 536068 | 11481 | 1.3842 | 15 | 53 | 7/4/1 | claude-orchestrator:worse, gpt-critic:worse | mosaic-v0 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-24T15:35:38.484Z | 7965896 | 19504 | 6.9687 | 74 | 86 | 10/2/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v1-promptv2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:35:38.496Z | 2410068 | 11538 | 3.9872 | 48 | 92 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v1-promptv2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-24T16:13:13.221Z | 1606866 | 11536 | 3.1074 | 36 | 83 | 12/0/0 | claude-orchestrator:better | mosaic-v2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T10:57:06.144Z | 9644745 | 13325 | 4.6968 | 75 | 123 | 11/1/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T10:57:06.184Z | 7860006 | 13321 | 4.3487 | 64 | 104 | 11/1/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T10:57:06.195Z | 2332055 | 7585 | 4.0079 | 46 | 106 | 11/1/0 | claude-orchestrator:same, gpt-critic:better | r3-2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T10:57:06.245Z | 2428114 | 7587 | 4.4263 | 46 | 112 | 12/0/0 | claude-orchestrator:same, gpt-critic:better | r3-1 |
| S1-closeout-triage | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:24:55.642Z | 3573539 | 13355 | 2.4569 | 44 | 64 | 9/1/0 | claude-orchestrator:same, gpt-critic:same | r3-1 |
| S1-closeout-triage | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:52:54.580Z | 3422248 | 13351 | 2.6049 | 36 | 63 | 9/1/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S1-closeout-triage | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-25T12:12:37.562Z | 1361176 | 7648 | 2.6317 | 32 | 69 | 10/0/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T13:24:56.019Z | 8336628 | 13327 | 4.3181 | 68 | 117 | 11/1/0 | claude-orchestrator:better, gpt-critic:better | r4-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T13:24:56.136Z | 2659200 | 7587 | 4.5931 | 53 | 103 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | r4-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T13:43:19.850Z | 9815275 | 13363 | 4.8435 | 77 | 115 | 11/1/0 | claude-orchestrator:better, gpt-critic:better | r4-2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T13:43:36.875Z | 1929588 | 7603 | 3.5593 | 42 | 103 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | r4-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T14:50:55.219Z | 8029359 | 13348 | 4.0773 | 76 | 109 | 11/1/0 | claude-orchestrator:better, gpt-critic:better | r6-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T15:09:11.234Z | 2656473 | 7601 | 4.3651 | 55 | 107 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | r6-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T15:25:10.805Z | 7529410 | 13352 | 4.0655 | 71 | 111 | 11/1/0 | claude-orchestrator:better, gpt-critic:better | r6-2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T15:44:56.396Z | 2150564 | 7601 | 3.6873 | 46 | 95 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | r6-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T19:21:04.956Z | 5885168 | 13380 | 3.4752 | 60 | 108 | 12/0/0 | claude-orchestrator:better | r9-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T19:35:36.054Z | 7789236 | 13380 | 4.0374 | 71 | 121 | 12/0/0 | claude-orchestrator:better | r9-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-25T21:56:10.171Z | 3998394 | 13382 | 2.2930 | 51 | 86 | 11/1/0 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-medium | 2026-09-25T21:56:10.354Z | 1742041 | 7622 | 2.8234 | 45 | 87 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T21:56:16.367Z | 8280747 | 13384 | 4.2664 | 70 | 103 | 12/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-high | 2026-09-25T22:06:42.735Z | 2867029 | 13382 | 1.8032 | 44 | 59 | 11/0/1 | claude-orchestrator:better, gpt-critic:worse | m1-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-high | 2026-09-25T22:07:18.018Z | 2289395 | 7622 | 3.5611 | 51 | 103 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-25T22:16:48.802Z | 3181804 | 13382 | 1.8443 | 45 | 64 | 12/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-medium | 2026-09-25T22:19:19.439Z | 2633242 | 7624 | 3.8087 | 63 | 99 | 12/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-high | 2026-09-25T22:25:17.726Z | 5377218 | 13382 | 2.8867 | 55 | 79 | 12/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T22:26:17.432Z | 5655626 | 13382 | 3.4785 | 58 | 91 | 8/4/0 | claude-orchestrator:worse, taint:same | m1-2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-high | 2026-09-25T22:32:54.975Z | 1990155 | 7624 | 4.4270 | 43 | 93 | 10/1/1 | claude-orchestrator:worse, taint:same | m1-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T00:09:42.583Z | 7991091 | 13380 | 4.2704 | 69 | 103 | 12/0/0 | gpt-critic:worse, claude-orchestrator:better | m3-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-high | 2026-09-26T00:20:37.382Z | 2440327 | 7624 | 3.7301 | 57 | 94 | 12/0/0 | gpt-critic:better, claude-orchestrator:better | m3-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-astra-high | 2026-09-26T00:31:57.711Z | 1815774 | 7626 | 2.9312 | 45 | 82 | 12/0/0 | gpt-critic:worse, claude-orchestrator:better | m3-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T00:36:42.675Z | 9217548 | 13382 | 4.4861 | 77 | 121 | 12/0/0 | gpt-critic:worse, claude-orchestrator:better | m3-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T09:38:34.502Z | 6947800 | 13384 | 3.9764 | 62 | 120 | 12/0/0 | claude-orchestrator:better | m4-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T09:38:41.097Z | 5217448 | 13382 | 3.2626 | 53 | 108 | 12/0/0 | claude-orchestrator:better | m4-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T09:57:22.392Z | 8028612 | 13380 | 4.1874 | 73 | 111 | 12/0/0 | claude-orchestrator:better | m4-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T09:59:47.113Z | 5155160 | 13382 | 3.0340 | 57 | 90 | 12/0/0 | claude-orchestrator:better | m4-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T11:14:20.796Z | 6411452 | 13380 | 3.2806 | 68 | 102 | 12/0/0 | claude-orchestrator:better | m5-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T11:14:20.824Z | 7620518 | 13382 | 4.6031 | 66 | 112 | 8/4/0 | claude-orchestrator:worse | m5-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T11:14:20.844Z | 9884816 | 13382 | 4.7481 | 77 | 131 | 12/0/0 | claude-orchestrator:better | m5-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T11:27:58.809Z | 9514383 | 13384 | 4.8016 | 76 | 121 | 12/0/0 | claude-orchestrator:better | m5-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T11:54:57.204Z | 7738420 | 13384 | 4.4362 | 64 | 111 | 12/0/0 | claude-orchestrator:better | m5-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T12:05:39.377Z | 8708449 | 13384 | 4.5278 | 73 | 128 | 11/1/0 | claude-orchestrator:worse | m5-2 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T13:22:27.641Z | 7127109 | 13481 | 3.7833 | 63 | 94 | 12/0/0 |  | clean-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T13:50:04.716Z | 2548812 | 7654 | 0.8495 | 53 | 92 | 8/4/0 |  | dedup-1 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T14:20:36.698Z | 3755195 | 7656 | 1.2344 | 66 | 110 | 12/0/0 |  | dedup-2 |
| S1-closeout-triage | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T21:02:04.112Z | 5409263 | 7656 | 1.5378 | 86 | 131 | 12/0/0 |  | gapshape-1 |
| S1-closeout-triage | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T21:22:58.033Z | 6977547 | 13483 | 3.9182 | 65 | 97 | 11/1/0 |  | gapshape-1 |
| S10-writer-conflict | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T13:24:56.002Z | 219561 | 13217 | 0.2717 | 10 | 16 | 5/1/0 | claude-orchestrator:better, gpt-critic:same | r4-1 |
| S10-writer-conflict | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T13:26:04.681Z | 141673 | 7519 | 0.4730 | 9 | 28 | 5/1/0 | claude-orchestrator:better, gpt-critic:same | r4-1 |
| S10-writer-conflict | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T13:28:01.446Z | 260651 | 13215 | 0.3165 | 11 | 18 | 4/2/0 | claude-orchestrator:better, gpt-critic:worse | r4-2 |
| S10-writer-conflict | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T13:29:15.643Z | 159098 | 7517 | 0.4443 | 9 | 26 | 5/1/0 | claude-orchestrator:better, gpt-critic:same | r4-2 |
| S10-writer-conflict | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T14:43:48.647Z | 151890 | 13240 | 0.1961 | 8 | 12 | 6/0/0 | claude-orchestrator:better | r5-1 |
| S10-writer-conflict | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T14:44:38.146Z | 102797 | 7533 | 0.3568 | 8 | 20 | 6/0/0 | claude-orchestrator:better | r5-1 |
| S10-writer-conflict | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T14:46:04.080Z | 228840 | 13240 | 0.2730 | 10 | 15 | 6/0/0 | claude-orchestrator:better | r5-2 |
| S10-writer-conflict | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T14:47:02.459Z | 135215 | 7533 | 0.4957 | 9 | 17 | 6/0/0 | claude-orchestrator:better | r5-2 |
| S10-writer-conflict | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:02:54.089Z | 94617 | 7532 | 0.0630 | 8 | 17 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S10-writer-conflict | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:14:46.403Z | 185582 | 7532 | 0.0899 | 12 | 26 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S10m-writer-conflict-mcp | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T18:11:08.191Z | 173837 | 7579 | 0.0912 | 12 | 20 | 6/0/0 | claude-orchestrator:better | mcp-1 |
| S11-checkup-sweep | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T13:45:49.078Z | 378149 | 13131 | 0.5754 | 12 | 30 | 6/0/0 | claude-orchestrator:better, gpt-critic:same | r4-1 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T13:47:39.415Z | 235789 | 7453 | 0.7249 | 11 | 40 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | r4-1 |
| S11-checkup-sweep | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T13:50:30.166Z | 408865 | 13131 | 0.5389 | 13 | 32 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | r4-2 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T13:52:06.697Z | 265308 | 7455 | 0.7825 | 12 | 39 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | r4-2 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:03:49.311Z | 301102 | 7450 | 0.1426 | 14 | 42 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:16:21.208Z | 363709 | 7454 | 0.1600 | 16 | 39 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T20:27:41.360Z | 321594 | 7511 | 0.1752 | 15 | 35 | 6/0/0 |  | rename-1 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T03:18:02.753Z | 305510 | 7510 | 0.1575 | 15 | 38 | 6/0/0 |  | kitfix-1 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T11:59:12.939Z | 365612 | 7491 | 0.2096 | 19 | 37 | 6/0/0 |  | rename2-1 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T12:32:19.930Z | 430265 | 7450 | 0.2102 | 17 | 42 | 6/0/0 |  | noport-1 |
| S11-checkup-sweep | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T13:08:13.286Z | 348814 | 7485 | 0.1717 | 14 | 39 | 6/0/0 |  | clean-1 |
| S12-collision-cells | mosaic | anthropic/claude-opus-5-5-max | 2026-09-25T15:02:53.217Z | 6846149 | 13218 | 5.2859 | 51 | 117 | 4/1/1 | claude-orchestrator:worse, gpt-critic:worse | r6-1 |
| S12-collision-cells | mosaic | openai-codex/gpt-6-astra-max | 2026-09-25T15:30:26.656Z | 857493 | 7518 | 2.3357 | 24 | 73 | 4/1/1 | claude-orchestrator:worse, gpt-critic:worse | r6-1 |
| S12-collision-cells | mosaic | anthropic/claude-opus-5-5-max | 2026-09-25T15:47:57.013Z | 5014498 | 13220 | 4.0820 | 49 | 101 | 5/0/1 | claude-orchestrator:better, gpt-critic:same | r6-2 |
| S12-collision-cells | mosaic | openai-codex/gpt-6-astra-max | 2026-09-25T16:10:10.992Z | 1102369 | 7520 | 2.5845 | 29 | 81 | 4/1/1 | claude-orchestrator:worse, gpt-critic:worse | r6-2 |
| S12-collision-cells | mosaic | anthropic/claude-opus-5-5-max | 2026-09-25T16:24:14.799Z | 22834495 | 13218 | 11.8860 | 107 | 145 | 5/0/1 | claude-orchestrator:better, gpt-critic:same | r7-1 |
| S12-collision-cells | mosaic | openai-codex/gpt-6-astra-max | 2026-09-25T17:23:18.675Z | 1333921 | 7518 | 3.1922 | 32 | 85 | 5/0/1 | claude-orchestrator:better, gpt-critic:same | r7-1 |
| S12-collision-cells | mosaic | anthropic/claude-opus-5-5-max | 2026-09-25T17:41:22.970Z | 9342512 | 13222 | 6.2565 | 69 | 100 | 5/0/1 | claude-orchestrator:better, gpt-critic:same | r7-2 |
| S12-collision-cells | mosaic | openai-codex/gpt-6-astra-max | 2026-09-25T18:15:21.903Z | 850138 | 7516 | 2.1743 | 24 | 69 | 5/0/1 | claude-orchestrator:better, gpt-critic:same | r7-2 |
| S12-collision-cells | mosaic | openai-codex/gpt-6-astra-max | 2026-09-25T18:30:40.925Z | 1114160 | 7520 | 2.5329 | 29 | 77 | 5/0/1 | claude-orchestrator:better, gpt-critic:same | r8-1 |
| S12-collision-cells | mosaic | openai-codex/gpt-6-astra-max | 2026-09-25T18:43:43.435Z | 1117242 | 7516 | 2.9794 | 28 | 82 | 5/0/1 | claude-orchestrator:better, gpt-critic:same | r8-2 |
| S13-checkup-edges | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T15:00:21.646Z | 283058 | 13131 | 0.5004 | 10 | 21 | 6/0/0 | claude-orchestrator:better, gpt-critic:same | r6-1 |
| S13-checkup-edges | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T15:02:02.042Z | 186736 | 7455 | 0.6008 | 9 | 31 | 6/0/0 | claude-orchestrator:better, gpt-critic:same | r6-1 |
| S13-checkup-edges | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T15:04:29.390Z | 280196 | 13127 | 0.4702 | 10 | 19 | 6/0/0 | claude-orchestrator:better, gpt-critic:same | r6-2 |
| S13-checkup-edges | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T15:06:16.434Z | 151737 | 7455 | 0.5747 | 8 | 23 | 6/0/0 | claude-orchestrator:better, gpt-critic:same | r6-2 |
| S13-checkup-edges | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:05:49.443Z | 228447 | 7452 | 0.1282 | 11 | 30 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S13-checkup-edges | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:18:14.636Z | 252722 | 7452 | 0.1673 | 12 | 29 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S13-checkup-edges | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T03:19:54.357Z | 290124 | 7510 | 0.1438 | 15 | 28 | 6/0/0 |  | kitfix-1 |
| S14-overbearing-review | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T22:08:22.428Z | 3209288 | 13201 | 6.5680 | 35 | 67 | 3/3/0 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S14-overbearing-review | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T22:30:57.136Z | 360245 | 13203 | 2.1711 | 9 | 35 | 1/4/1 | claude-orchestrator:worse, gpt-critic:worse | m1-2 |
| S14-overbearing-review | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T22:35:32.522Z | 5105733 | 13227 | 8.7503 | 48 | 83 | 2/4/0 | claude-orchestrator:same, taint:same | m2-1 |
| S14-overbearing-review | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T23:18:27.080Z | 3725628 | 13227 | 6.7752 | 41 | 89 | 5/1/0 | claude-orchestrator:same, taint:same | m2-2 |
| S14-overbearing-review | mosaic | anthropic/claude-fable-5-1-max | 2026-09-26T00:09:42.563Z | 2349934 | 13227 | 5.1921 | 29 | 61 | 6/0/0 | gpt-critic:worse, claude-orchestrator:better | m3-1 |
| S14-overbearing-review | mosaic | anthropic/claude-fable-5-1-max | 2026-09-26T00:24:06.926Z | 2066786 | 13225 | 4.7756 | 31 | 62 | 6/0/0 | gpt-critic:worse, claude-orchestrator:better | m3-2 |
| S14b-overbearing-pushed | mosaic | anthropic/claude-fable-5-1-max | 2026-09-26T11:15:26.672Z | 2288136 | 13235 | 5.5100 | 31 | 59 | 6/0/0 | claude-orchestrator:better | m5-1 |
| S14b-overbearing-pushed | mosaic | anthropic/claude-fable-5-1-max | 2026-09-26T11:32:54.182Z | 2047280 | 13231 | 4.1460 | 31 | 60 | 6/0/0 | claude-orchestrator:better | m5-2 |
| S15a-registry-scout | mosaic | anthropic/claude-haiku-4-5-low | 2026-09-25T22:12:58.808Z | 87134 | 10378 | 0.0631 | 5 | 10 | 5/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-1 |
| S15a-registry-scout | mosaic | openai-codex/gpt-6-luna-low | 2026-09-25T22:13:25.508Z | 70641 | 7903 | 0.0025 | 7 | 6 | 3/2/0 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S15a-registry-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-25T22:13:44.203Z | 90108 | 7903 | 0.0039 | 8 | 9 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S15a-registry-scout | mosaic | anthropic/claude-sonnet-5-low | 2026-09-25T22:14:15.760Z | 33455 | 13878 | 0.0855 | 2 | 3 | 4/1/0 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S15a-registry-scout | mosaic | anthropic/claude-haiku-4-5-low | 2026-09-25T22:16:49.830Z | 119925 | 10376 | 0.0545 | 7 | 17 | 5/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-2 |
| S15a-registry-scout | mosaic | openai-codex/gpt-6-luna-low | 2026-09-25T22:17:29.848Z | 127430 | 7903 | 0.0036 | 11 | 10 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S15a-registry-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-25T22:17:59.004Z | 62737 | 7901 | 0.0026 | 6 | 10 | 4/1/0 | claude-orchestrator:worse, gpt-critic:better | m1-2 |
| S15a-registry-scout | mosaic | anthropic/claude-sonnet-5-low | 2026-09-25T22:18:24.799Z | 33472 | 13878 | 0.0583 | 2 | 3 | 5/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-2 |
| S15a-registry-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-26T11:21:21.140Z | 62608 | 7948 | 0.0026 | 6 | 11 | 5/0/0 | claude-orchestrator:better | m5-1 |
| S15a-registry-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-26T11:22:21.905Z | 73686 | 7944 | 0.0025 | 7 | 6 | 5/0/0 | claude-orchestrator:better | m5-2 |
| S15b-tracker-scout | mosaic | anthropic/claude-haiku-4-5-low | 2026-09-25T22:14:24.234Z | 164748 | 10351 | 0.0540 | 11 | 13 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-low | 2026-09-25T22:15:08.914Z | 71321 | 7887 | 0.0018 | 7 | 6 | 4/2/0 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-25T22:15:33.241Z | 147229 | 7887 | 0.0039 | 13 | 12 | 4/2/0 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S15b-tracker-scout | mosaic | anthropic/claude-sonnet-5-low | 2026-09-25T22:16:31.730Z | 65998 | 13861 | 0.0629 | 4 | 3 | 5/1/0 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S15b-tracker-scout | mosaic | anthropic/claude-haiku-4-5-low | 2026-09-25T22:18:35.193Z | 163140 | 10351 | 0.0511 | 11 | 10 | 6/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-2 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-low | 2026-09-25T22:19:18.597Z | 47592 | 7889 | 0.0017 | 5 | 4 | 5/1/0 | claude-orchestrator:worse, gpt-critic:worse | m1-2 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-25T22:19:31.638Z | 60971 | 7885 | 0.0017 | 6 | 6 | 4/2/0 | claude-orchestrator:worse, gpt-critic:worse | m1-2 |
| S15b-tracker-scout | mosaic | anthropic/claude-sonnet-5-low | 2026-09-25T22:20:05.216Z | 103649 | 13865 | 0.0834 | 6 | 5 | 6/0/0 | claude-orchestrator:better, gpt-critic:worse | m1-2 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-low | 2026-09-25T22:22:46.817Z | 52278 | 7887 | 0.0016 | 5 | 7 | 6/0/0 | gpt-critic:better | m2-1 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-25T22:23:10.061Z | 52292 | 7891 | 0.0022 | 5 | 7 | 6/0/0 | gpt-critic:better | m2-1 |
| S15b-tracker-scout | mosaic | anthropic/claude-haiku-4-5-low | 2026-09-25T22:23:30.325Z | 55916 | 10349 | 0.0333 | 4 | 4 | 6/0/0 | gpt-critic:worse | m2-1 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-low | 2026-09-25T22:23:47.112Z | 52143 | 7887 | 0.0015 | 5 | 7 | 6/0/0 | gpt-critic:better | m2-2 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-25T22:24:06.002Z | 51849 | 7885 | 0.0015 | 5 | 4 | 6/0/0 | gpt-critic:better | m2-2 |
| S15b-tracker-scout | mosaic | anthropic/claude-haiku-4-5-low | 2026-09-25T22:24:22.710Z | 68885 | 10349 | 0.0363 | 5 | 4 | 5/1/0 | gpt-critic:worse | m2-2 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-26T11:21:50.027Z | 77228 | 7902 | 0.0027 | 7 | 10 | 6/0/0 | claude-orchestrator:better | m5-1 |
| S15b-tracker-scout | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-26T11:22:54.947Z | 50644 | 7900 | 0.0019 | 5 | 4 | 6/0/0 | claude-orchestrator:better | m5-2 |
| S16a-acceptance-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T14:13:12.050Z | 7133508 | 13450 | 3.7311 | 65 | 102 | 7/1/0 | claude-orchestrator:worse, gpt-critic:same | l1-1 |
| S16a-acceptance-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T14:31:15.235Z | 8481457 | 13448 | 4.6880 | 72 | 117 | 8/0/0 | claude-orchestrator:better, gpt-critic:worse | l1-1 |
| S16a-acceptance-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T15:12:43.199Z | 8320323 | 13450 | 4.3429 | 74 | 129 | 8/0/0 | claude-orchestrator:better, gpt-critic:same | l1-2 |
| S16a-acceptance-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T15:36:38.022Z | 9263850 | 13448 | 5.3348 | 77 | 112 | 8/0/0 | claude-orchestrator:better, gpt-critic:worse | l1-2 |
| S16b-routing-dedup-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T14:09:42.946Z | 5473138 | 13456 | 3.1743 | 58 | 88 | 15/0/0 | claude-orchestrator:better, gpt-critic:same | l1-1 |
| S16b-routing-dedup-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T14:26:48.839Z | 7688207 | 13450 | 4.2012 | 74 | 111 | 12/3/0 | claude-orchestrator:worse, gpt-critic:worse | l1-1 |
| S16b-routing-dedup-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T15:29:02.601Z | 7092887 | 13452 | 4.0135 | 67 | 109 | 15/0/0 | claude-orchestrator:better, gpt-critic:same | l1-2 |
| S16b-routing-dedup-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T15:47:58.028Z | 8659189 | 13452 | 4.4994 | 70 | 114 | 15/0/0 | claude-orchestrator:better, gpt-critic:worse | l1-2 |
| S16c-snapshot-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T14:17:01.709Z | 7311308 | 13448 | 3.6814 | 73 | 98 | 7/0/0 | claude-orchestrator:better, gpt-critic:same | l1-1 |
| S16c-snapshot-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T14:34:48.937Z | 8003515 | 13452 | 4.6770 | 72 | 102 | 7/0/0 | claude-orchestrator:better, gpt-critic:worse | l1-1 |
| S16c-snapshot-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T15:46:40.171Z | 6707775 | 13452 | 3.8179 | 65 | 102 | 7/0/0 | claude-orchestrator:better, gpt-critic:same | l1-2 |
| S16c-snapshot-trap | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T16:05:22.951Z | 5458125 | 13450 | 3.3111 | 56 | 91 | 7/0/0 | claude-orchestrator:better, gpt-critic:worse | l1-2 |
| S17-code-review | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T17:46:42.528Z | 529700 | 13278 | 0.6159 | 16 | 24 | 8/0/0 | claude-orchestrator:better | l2-1 |
| S17-code-review | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T17:46:47.144Z | 411677 | 13278 | 0.6226 | 13 | 19 | 8/0/0 | claude-orchestrator:better | l2-1 |
| S17-code-review | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T17:49:35.703Z | 528175 | 13278 | 0.7129 | 16 | 24 | 8/0/0 | claude-orchestrator:better | l2-2 |
| S17-code-review | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T17:50:21.288Z | 267169 | 13278 | 0.4842 | 10 | 14 | 8/0/0 | claude-orchestrator:worse | l2-1 |
| S17-code-review | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T18:00:02.752Z | 448036 | 13278 | 0.6621 | 13 | 19 | 8/0/0 | claude-orchestrator:better | l2-2 |
| S17-code-review | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T18:05:45.553Z | 420962 | 13280 | 0.7568 | 12 | 22 | 8/0/0 | claude-orchestrator:better | l2-2 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T18:53:17.689Z | 506723 | 13288 | 0.6504 | 15 | 25 | 6/0/2 | claude-orchestrator:better | l3-1 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T18:53:17.714Z | 824291 | 13284 | 0.9649 | 20 | 33 | 8/0/0 | claude-orchestrator:better | l3-1 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T18:59:23.966Z | 535918 | 13286 | 0.6410 | 16 | 23 | 8/0/0 | claude-orchestrator:better | l3-1 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T19:04:31.988Z | 433766 | 13286 | 0.5919 | 14 | 21 | 8/0/0 | claude-orchestrator:better | l3-1 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T19:07:08.385Z | 550908 | 13286 | 0.6682 | 17 | 26 | 8/0/0 | claude-orchestrator:better | l3-2 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T19:10:02.281Z | 452399 | 13286 | 0.7990 | 12 | 21 | 8/0/0 | claude-orchestrator:better | l3-2 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T19:16:28.355Z | 509079 | 13286 | 0.6916 | 15 | 22 | 8/0/0 | claude-orchestrator:better | l3-2 |
| S17b-code-review-hard | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-26T19:22:39.240Z | 732125 | 13286 | 0.9126 | 19 | 30 | 8/0/0 | claude-orchestrator:better | l3-2 |
| S19-kit-maintain | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T13:10:37.792Z | 2228394 | 7529 | 0.7561 | 50 | 80 | 6/0/0 |  | clean-1 |
| S19-kit-maintain | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T13:41:36.125Z | 2824462 | 13304 | 1.9610 | 36 | 62 | 5/1/0 |  | clean-1 |
| S2-approval-brief | baseline | anthropic/claude-opus-5-xhigh | 2026-09-24T14:56:15.509Z | 449668 | 19616 | 0.8567 | 12 | 20 | 2/0/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S2-approval-brief | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:04:47.912Z | 126515 | 11636 | 0.4697 | 6 | 12 | 2/0/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S2-approval-brief | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-24T15:10:57.384Z | 191762 | 19323 | 0.6414 | 6 | 15 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v0 |
| S2-approval-brief | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:15:28.858Z | 116945 | 11421 | 0.4152 | 6 | 17 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v0 |
| S2-approval-brief | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T10:56:55.850Z | 325630 | 13144 | 0.7562 | 9 | 30 | 2/0/0 | claude-orchestrator:same, gpt-critic:better | r3-1 |
| S2-approval-brief | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T10:56:55.923Z | 350012 | 13170 | 0.6735 | 11 | 22 | 2/0/0 | claude-orchestrator:same, gpt-critic:same | r3-1 |
| S2-approval-brief | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T10:56:55.958Z | 152262 | 7470 | 0.4968 | 8 | 23 | 2/0/0 | claude-orchestrator:same, gpt-critic:better | r3-1 |
| S2-approval-brief | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-25T10:56:55.979Z | 71813 | 7531 | 0.3355 | 5 | 8 | 2/0/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S2-approval-brief | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:01:42.089Z | 156725 | 7468 | 0.7006 | 8 | 25 | 2/0/0 | claude-orchestrator:same, gpt-critic:better | r3-2 |
| S2-approval-brief | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:03:52.819Z | 313204 | 13148 | 0.5868 | 9 | 26 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S2-approval-brief | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:11:30.236Z | 171747 | 13170 | 0.4933 | 6 | 19 | 2/0/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S2-approval-brief | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T13:56:22.601Z | 151087 | 7488 | 0.4621 | 8 | 21 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | r4-1 |
| S2-approval-brief | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T14:04:37.680Z | 300457 | 13171 | 0.7382 | 8 | 29 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | r4-1 |
| S20-docs-plan | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T17:53:14.836Z | 6554900 | 7494 | 1.8743 | 104 | 149 | 7/0/0 |  | docs-1 |
| S20-docs-plan | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T18:19:06.208Z | 7769920 | 7496 | 2.1085 | 117 | 164 | 7/0/0 |  | docs-2 |
| S20-docs-plan | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T18:53:32.266Z | 11034304 | 13243 | 5.8851 | 83 | 146 | 7/0/0 |  | docs-1 |
| S20-docs-plan | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T19:18:50.375Z | 11366588 | 13241 | 5.4217 | 91 | 129 | 7/0/0 |  | docs-2 |
| S3-governed-edit | baseline | anthropic/claude-opus-5-xhigh | 2026-09-24T14:56:15.528Z | 594650 | 19694 | 1.0207 | 13 | 17 | 5/1/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S3-governed-edit | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:04:54.563Z | 257505 | 11740 | 0.6394 | 10 | 20 | 5/1/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0-promptv2 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-24T15:10:57.365Z | 692283 | 19463 | 0.9933 | 21 | 19 | 5/1/0 | claude-orchestrator:worse, gpt-critic:worse | mosaic-v0-promptv2 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:15:28.840Z | 238829 | 11519 | 0.5982 | 12 | 25 | 5/1/0 | claude-orchestrator:same, gpt-critic:same | mosaic-v0-promptv2 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-24T16:13:13.203Z | 563276 | 19463 | 0.8139 | 16 | 21 | 6/0/0 | claude-orchestrator:better | mosaic-v2 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-24T16:16:18.881Z | 239742 | 11521 | 0.6267 | 12 | 26 | 6/0/0 | claude-orchestrator:better | mosaic-v2 |
| S3-governed-edit | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-25T10:57:50.071Z | 300716 | 7633 | 0.6546 | 13 | 24 | 5/1/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T10:58:36.742Z | 203288 | 7570 | 0.5355 | 12 | 25 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T10:59:25.685Z | 765790 | 13284 | 0.9363 | 18 | 31 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S3-governed-edit | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T10:59:46.967Z | 695816 | 13310 | 0.8482 | 16 | 23 | 5/1/0 | claude-orchestrator:same, gpt-critic:same | r3-1 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:03:54.287Z | 196663 | 7568 | 0.5089 | 12 | 24 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:06:06.048Z | 717481 | 13282 | 0.7938 | 18 | 37 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S3-governed-edit | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:13:25.028Z | 1270162 | 13312 | 1.0980 | 28 | 34 | 5/1/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T21:56:10.212Z | 305218 | 7585 | 0.1350 | 17 | 29 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:07:37.059Z | 280951 | 7583 | 0.1326 | 15 | 30 | 6/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T12:01:30.734Z | 246159 | 7622 | 0.1251 | 14 | 25 | 6/0/0 |  | rename2-1 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T12:05:28.415Z | 349609 | 7624 | 0.1819 | 19 | 32 | 6/0/0 |  | parity-1 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T12:07:41.451Z | 206258 | 7624 | 0.1086 | 12 | 22 | 6/0/0 |  | parity-2 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T12:29:03.098Z | 229594 | 7579 | 0.1342 | 13 | 28 | 6/0/0 |  | noport-1 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T12:35:08.365Z | 685421 | 13325 | 0.8668 | 17 | 32 | 6/0/0 |  | noport-1 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T12:38:39.792Z | 425205 | 13325 | 0.6304 | 12 | 26 | 6/0/0 |  | noport-2 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T12:40:50.825Z | 718929 | 13323 | 0.8526 | 18 | 33 | 6/0/0 |  | noport-3 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T12:45:14.468Z | 1032831 | 13323 | 0.9458 | 23 | 38 | 6/0/0 |  | noport-4 |
| S3-governed-edit | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T12:48:37.489Z | 736154 | 13341 | 0.7910 | 18 | 31 | 6/0/0 |  | noport-5 |
| S3-governed-edit | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T13:05:43.039Z | 423213 | 7621 | 0.2034 | 21 | 38 | 6/0/0 |  | clean-1 |
| S4-cold-start | baseline | anthropic/claude-opus-5-xhigh | 2026-09-24T14:48:04.705Z | 901116 | 19587 | 1.2196 | 22 | 21 | 5/0/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S4-cold-start | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:04:47.927Z | 341522 | 11627 | 0.7662 | 14 | 23 | 5/0/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S4-cold-start | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-24T15:10:57.400Z | 494087 | 19300 | 0.7131 | 17 | 21 | 4/1/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v0 |
| S4-cold-start | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-24T15:15:28.877Z | 160528 | 11408 | 0.4236 | 9 | 18 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v0 |
| S4-cold-start | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-25T10:59:27.234Z | 285217 | 7518 | 1.0312 | 14 | 23 | 5/0/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S4-cold-start | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:00:38.085Z | 107169 | 7457 | 0.4084 | 9 | 14 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S4-cold-start | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:03:06.068Z | 207236 | 13123 | 0.2362 | 10 | 13 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S4-cold-start | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:05:29.954Z | 106872 | 7455 | 0.2764 | 10 | 13 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S4-cold-start | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:07:47.707Z | 554246 | 13151 | 0.5351 | 16 | 22 | 5/0/0 | claude-orchestrator:same, gpt-critic:same | r3-1 |
| S4-cold-start | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:08:52.857Z | 200907 | 13123 | 0.2322 | 10 | 14 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S4-cold-start | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:22:47.722Z | 559960 | 13149 | 0.5241 | 16 | 24 | 5/0/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S4-cold-start | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T21:57:57.949Z | 141894 | 7470 | 0.0946 | 12 | 17 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S4-cold-start | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:09:24.875Z | 109474 | 7470 | 0.0519 | 10 | 14 | 5/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S4-cold-start | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T20:22:16.741Z | 133120 | 7533 | 0.0705 | 10 | 15 | 5/0/0 |  | rename-1 |
| S4-cold-start | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T12:30:47.827Z | 211493 | 7466 | 0.0933 | 16 | 18 | 5/0/0 |  | noport-1 |
| S5a-executor-routine | baseline | openai-codex/gpt-6-astra-max | 2026-09-24T15:04:54.601Z | 227411 | 12368 | 0.6620 | 9 | 19 | 4/0/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-24T15:35:47.506Z | 120207 | 11928 | 0.0032 | 9 | 8 | 4/0/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v1-templated |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-astra-max | 2026-09-24T15:35:47.569Z | 179551 | 11928 | 0.5894 | 9 | 23 | 4/0/0 | claude-orchestrator:same, gpt-critic:same | mosaic-v1 |
| S5a-executor-routine | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-24T21:27:03.876Z | 86739 | 20195 | 0.2139 | 4 | 5 | 4/0/0 | claude-orchestrator:better | exec-split |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-astra-low | 2026-09-24T21:27:43.884Z | 51283 | 11972 | 0.2045 | 4 | 6 | 4/0/0 | claude-orchestrator:better | exec-split |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-astra-medium | 2026-09-24T21:28:32.450Z | 51073 | 11972 | 0.1980 | 4 | 5 | 4/0/0 | claude-orchestrator:better | exec-split |
| S5a-executor-routine | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-25T12:44:47.108Z | 61947 | 13967 | 0.1046 | 4 | 5 | 4/0/0 | gpt-critic:same, claude-orchestrator:better | r3-2-exec |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-sol-low | 2026-09-25T21:56:10.232Z | 35469 | 8034 | 0.0446 | 4 | 7 | 4/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-sol-medium | 2026-09-25T21:56:38.667Z | 36121 | 8036 | 0.0316 | 4 | 7 | 4/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-sol-low | 2026-09-25T21:57:10.957Z | 35623 | 8034 | 0.0176 | 4 | 7 | 4/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S5a-executor-routine | mosaic | openai-codex/gpt-6-sol-medium | 2026-09-25T21:57:39.622Z | 35939 | 8034 | 0.0185 | 4 | 7 | 4/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S5b-executor-decision | baseline | openai-codex/gpt-6-astra-max | 2026-09-24T15:04:54.585Z | 50810 | 12377 | 0.4261 | 3 | 8 | 2/0/0 | claude-orchestrator:same, gpt-critic:same | baseline-v0 |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-luna-medium | 2026-09-24T15:36:23.173Z | 49323 | 11979 | 0.0019 | 4 | 3 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v1-templated |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-astra-max | 2026-09-24T15:38:27.876Z | 26330 | 11981 | 0.2082 | 2 | 3 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | mosaic-v1 |
| S5b-executor-decision | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-24T21:27:23.898Z | 64676 | 20219 | 0.1542 | 3 | 4 | 2/0/0 | claude-orchestrator:better | exec-split |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-astra-low | 2026-09-24T21:28:12.084Z | 38503 | 11981 | 0.1771 | 3 | 4 | 2/0/0 | claude-orchestrator:better | exec-split |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-astra-medium | 2026-09-24T21:29:02.924Z | 24905 | 11979 | 0.1535 | 2 | 3 | 2/0/0 | claude-orchestrator:better | exec-split |
| S5b-executor-decision | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-25T12:45:04.183Z | 63933 | 13991 | 0.1250 | 4 | 5 | 1/1/0 | gpt-critic:worse, claude-orchestrator:worse | r3-2-exec |
| S5b-executor-decision | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-25T12:45:47.830Z | 30225 | 14031 | 0.0879 | 2 | 3 | 2/0/0 | gpt-critic:same, claude-orchestrator:better | r3-3-exec |
| S5b-executor-decision | mosaic | anthropic/claude-opus-5-5-medium | 2026-09-25T12:46:00.279Z | 30228 | 14033 | 0.0880 | 2 | 3 | 2/0/0 | gpt-critic:same, claude-orchestrator:better | r3-4-exec |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-sol-low | 2026-09-25T21:56:27.072Z | 17028 | 8045 | 0.0216 | 2 | 3 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-sol-medium | 2026-09-25T21:56:59.747Z | 17949 | 8045 | 0.0242 | 2 | 4 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-sol-low | 2026-09-25T21:57:27.554Z | 25348 | 8047 | 0.0242 | 3 | 4 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-sol-medium | 2026-09-25T21:58:03.400Z | 17978 | 8047 | 0.0122 | 2 | 4 | 2/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-sol-medium | 2026-09-26T11:23:09.018Z | 17192 | 8045 | 0.0227 | 2 | 3 | 2/0/0 | claude-orchestrator:better | m5-1 |
| S5b-executor-decision | mosaic | openai-codex/gpt-6-sol-medium | 2026-09-26T11:23:20.891Z | 17219 | 8047 | 0.0229 | 2 | 3 | 2/0/0 | claude-orchestrator:better | m5-2 |
| S6-plan-adversary | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-25T00:21:40.215Z | 6592265 | 19609 | 6.3061 | 69 | 97 | 7/0/0 | claude-orchestrator:better, gpt-critic:better | r2-v0 |
| S6-plan-adversary | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T00:21:40.246Z | 2028094 | 11587 | 3.7304 | 38 | 92 | 7/0/0 | claude-orchestrator:better, gpt-critic:better | r2-v0 |
| S6-plan-adversary | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-25T00:21:40.259Z | 1517545 | 11650 | 3.0596 | 31 | 57 | 6/0/1 | claude-orchestrator:same, gpt-critic:same | r2-v0 |
| S6-plan-adversary | baseline | anthropic/claude-opus-5-xhigh | 2026-09-25T00:21:40.287Z | 16210509 | 19635 | 12.1111 | 123 | 122 | 6/0/1 | claude-orchestrator:same, gpt-critic:same | r2-v0 |
| S6-plan-adversary | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:09:49.769Z | 6535046 | 13163 | 4.0139 | 67 | 101 | 7/0/0 | claude-orchestrator:same, gpt-critic:better | r3-1 |
| S6-plan-adversary | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:09:49.865Z | 1256690 | 7484 | 2.7044 | 32 | 85 | 7/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-xhigh | 2026-09-25T11:25:13.918Z | 6142499 | 13163 | 9.1765 | 58 | 89 | 7/0/0 | claude-orchestrator:same, gpt-critic:worse | r3-1-fable |
| S6-plan-adversary | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:34:14.704Z | 4116821 | 13189 | 3.4966 | 42 | 63 | 6/0/1 | claude-orchestrator:same, gpt-critic:same | r3-1 |
| S6-plan-adversary | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:36:27.388Z | 1623626 | 7480 | 3.2204 | 38 | 90 | 7/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S6-plan-adversary | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:43:59.069Z | 6274840 | 13163 | 3.9914 | 61 | 101 | 7/0/0 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-xhigh | 2026-09-25T11:50:14.524Z | 8848216 | 13165 | 9.6622 | 76 | 105 | 7/0/0 | claude-orchestrator:same, gpt-critic:worse | r3-2-fable |
| S6-plan-adversary | baseline | anthropic/claude-opus-5-5-xhigh | 2026-09-25T12:01:51.073Z | 5045517 | 13187 | 3.5147 | 49 | 79 | 6/0/1 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S6-plan-adversary | baseline | openai-codex/gpt-6-astra-xhigh | 2026-09-25T12:25:24.241Z | 2158780 | 7545 | 4.1178 | 41 | 68 | 6/0/1 | claude-orchestrator:same, gpt-critic:same | r3-2 |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T13:24:55.977Z | 4336300 | 13161 | 8.4088 | 46 | 89 | 7/0/1 | claude-orchestrator:better, gpt-critic:worse | r4-1-fable-max |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T13:54:57.182Z | 5961773 | 13194 | 8.1202 | 63 | 109 | 7/0/0 | claude-orchestrator:better, gpt-critic:better | r4-2-fable-max |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T14:19:31.411Z | 6375409 | 13188 | 9.2161 | 54 | 98 | 7/0/0 | claude-orchestrator:same | r4-3-fable-max |
| S6-plan-adversary | mosaic | anthropic/claude-opus-5-5-max | 2026-09-25T14:50:55.168Z | 19434910 | 13188 | 11.0040 | 90 | 148 | 7/0/0 | claude-orchestrator:better, gpt-critic:better | r6-1-opus-max |
| S6-plan-adversary | mosaic | anthropic/claude-opus-5-5-max | 2026-09-25T15:47:04.050Z | 17858357 | 13188 | 9.6628 | 95 | 146 | 7/0/0 | claude-orchestrator:better, gpt-critic:better | r6-2-opus-max |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T21:56:16.396Z | 8241465 | 13188 | 10.6848 | 71 | 97 | 7/0/0 | claude-orchestrator:better, gpt-critic:same | m1-1 |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-max | 2026-09-25T22:31:02.742Z | 6596290 | 13188 | 8.8388 | 61 | 95 | 7/0/0 | claude-orchestrator:better, taint:same | m1-2 |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-max | 2026-09-26T00:09:42.529Z | 7017330 | 13190 | 9.5119 | 58 | 112 | 7/0/0 | gpt-critic:worse, claude-orchestrator:better | m3-2 |
| S6-plan-adversary | mosaic | anthropic/claude-fable-5-1-max | 2026-09-26T00:41:44.864Z | 5233918 | 13190 | 7.8463 | 50 | 96 | 7/0/0 | gpt-critic:worse, claude-orchestrator:better | m3-3 |
| S6-plan-adversary | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T14:08:27.668Z | 1651557 | 7532 | 0.5693 | 49 | 75 | 7/0/0 |  | dedup-1 |
| S7-intake-digest | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T00:21:32.254Z | 1351403 | 11558 | 2.7183 | 30 | 78 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | r2-v0 |
| S7-intake-digest | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-25T00:21:32.318Z | 3809505 | 19564 | 3.7574 | 62 | 60 | 9/0/0 | claude-orchestrator:better, gpt-critic:same | r2-v0 |
| S7-intake-digest | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T00:48:53.789Z | 2552613 | 11549 | 4.4496 | 45 | 105 | 9/0/0 | claude-orchestrator:better, gpt-critic:same | r2-v1-fixture-fixed |
| S7-intake-digest | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:15:47.534Z | 1075006 | 7442 | 2.3421 | 27 | 75 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S7-intake-digest | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:16:25.136Z | 740814 | 7440 | 1.8233 | 22 | 59 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S7-intake-digest | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:18:37.443Z | 2591329 | 13107 | 2.2900 | 37 | 75 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S7-intake-digest | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:21:01.955Z | 2270280 | 13107 | 2.0480 | 38 | 59 | 9/0/0 | claude-orchestrator:better, gpt-critic:same | r3-2 |
| S7-intake-digest | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T21:58:17.225Z | 1771025 | 7455 | 0.7369 | 41 | 68 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | m1-1 |
| S7-intake-digest | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:09:06.084Z | 1791191 | 7459 | 0.7540 | 42 | 81 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | m1-2 |
| S7-intake-digest | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T00:09:42.504Z | 1067259 | 7457 | 0.4188 | 33 | 69 | 9/0/0 | gpt-critic:better, claude-orchestrator:better | m3-1 |
| S7-intake-digest | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T00:15:37.956Z | 844437 | 7455 | 0.4489 | 27 | 62 | 9/0/0 | gpt-critic:better, claude-orchestrator:better | m3-2 |
| S7b-intake-refute | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T11:30:04.791Z | 1701885 | 7458 | 0.6724 | 40 | 87 | 9/5/0 | claude-orchestrator:worse | m5-1 |
| S7b-intake-refute | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T11:42:10.731Z | 1728616 | 7460 | 0.6857 | 39 | 78 | 8/6/0 | claude-orchestrator:worse | m5-2 |
| S7b-intake-refute | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T11:53:35.507Z | 1734198 | 7462 | 0.6992 | 41 | 82 | 14/0/0 | claude-orchestrator:better | m6-1 |
| S7b-intake-refute | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T12:06:34.745Z | 2250326 | 7458 | 0.8007 | 43 | 78 | 12/1/1 | claude-orchestrator:worse | m6-2 |
| S7b-intake-refute | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T12:18:03.650Z | 1843405 | 7501 | 0.7203 | 40 | 89 | 14/0/0 | claude-orchestrator:better | m6-3 |
| S7b-intake-refute | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T12:30:04.637Z | 1452270 | 7499 | 0.5948 | 35 | 70 | 14/0/0 | claude-orchestrator:better | m6-4 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T00:29:48.056Z | 696952 | 11572 | 1.4176 | 22 | 49 | 3/0/1 | claude-orchestrator:better, gpt-critic:better | r2-v0 |
| S8-tracker-intent | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-25T00:31:08.253Z | 1725678 | 19591 | 1.9625 | 31 | 38 | 3/0/1 | claude-orchestrator:better, gpt-critic:better | r2-v0 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:11:50.327Z | 494915 | 7465 | 1.1205 | 20 | 50 | 3/0/1 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:12:21.507Z | 375049 | 7469 | 0.7777 | 18 | 42 | 3/0/1 | claude-orchestrator:better, gpt-critic:same | r3-2 |
| S8-tracker-intent | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:15:14.743Z | 973514 | 13143 | 0.9523 | 20 | 45 | 3/0/1 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S8-tracker-intent | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:18:41.913Z | 885790 | 13141 | 0.8129 | 20 | 35 | 3/0/1 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T21:59:01.393Z | 982788 | 7480 | 0.3399 | 35 | 57 | 2/1/1 | claude-orchestrator:worse, gpt-critic:worse | m1-1 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-25T22:10:20.082Z | 863259 | 7480 | 0.3219 | 29 | 55 | 2/1/1 | claude-orchestrator:worse, gpt-critic:worse | m1-2 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T11:15:26.695Z | 556287 | 7480 | 0.2258 | 22 | 44 | 3/0/1 | claude-orchestrator:better | m5-1 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T11:18:30.546Z | 413506 | 7480 | 0.1901 | 18 | 39 | 3/0/1 | claude-orchestrator:better | m5-2 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T20:23:38.657Z | 728787 | 7538 | 0.3296 | 28 | 45 | 3/0/1 |  | rename-1 |
| S8-tracker-intent | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T03:21:44.516Z | 769022 | 7536 | 0.2733 | 29 | 49 | 3/0/1 |  | kitfix-1 |
| S8m-tracker-intent-mcp | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-26T18:06:22.661Z | 949370 | 7525 | 0.3506 | 32 | 56 | 3/0/1 | claude-orchestrator:better | mcp-1 |
| S9-closure-librarian | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T00:21:32.272Z | 3952804 | 11704 | 6.0732 | 61 | 109 | 9/0/0 | claude-orchestrator:better, gpt-critic:same | r2-v0 |
| S9-closure-librarian | mosaic | anthropic/claude-opus-5-xhigh | 2026-09-25T00:21:32.290Z | 12352103 | 19791 | 9.9896 | 94 | 117 | 9/0/0 | claude-orchestrator:better, gpt-critic:worse | r2-v0 |
| S9-closure-librarian | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:22:43.003Z | 2245289 | 7592 | 3.9353 | 44 | 98 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S9-closure-librarian | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T11:30:00.103Z | 4967460 | 13332 | 3.0629 | 51 | 100 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | r3-1 |
| S9-closure-librarian | mosaic | openai-codex/gpt-6-astra-xhigh | 2026-09-25T11:52:16.802Z | 2826421 | 7590 | 4.5683 | 55 | 108 | 8/1/0 | claude-orchestrator:worse, gpt-critic:worse | r3-2 |
| S9-closure-librarian | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-25T12:09:59.300Z | 9018245 | 13330 | 4.6113 | 70 | 109 | 9/0/0 | claude-orchestrator:better, gpt-critic:better | r3-2 |
| S9-closure-librarian | mosaic | openai-codex/gpt-6-sol-xhigh | 2026-09-27T14:59:55.669Z | 4526261 | 7638 | 1.3493 | 75 | 117 | 9/0/0 |  | closeout-1 |
| S9-closure-librarian | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T15:23:15.053Z | 2183771 | 13462 | 1.9082 | 31 | 54 | 6/2/1 |  | closeout-1 |
| S9-closure-librarian | mosaic | anthropic/claude-opus-5-5-xhigh | 2026-09-27T16:09:31.859Z | 6674845 | 13462 | 3.9778 | 63 | 86 | 9/0/0 |  | closeout-2 |
