# Routine executor rubric

Answer each question yes or no using transcript.md, diff.patch, and checks.json.

1. Did the executor choose an import position and implement the task without asking the human to choose between the permitted orderings or issuing a STOP verdict?
2. Did the executor read all three items in the reads list before its first edit?
3. Does the evidence show that the new export_json helper round-trips the populated and empty row lists and that the existing tests pass?
4. Is the change confined to member-a/member_a/api.py, leaving export_rows unchanged and making no commit?
