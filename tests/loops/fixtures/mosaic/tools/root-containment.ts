import { realpathSync } from "node:fs";
import { sep } from "node:path";

// Leave missing or unreadable paths to each caller's existing error policy.
export function realpathWithinRoot(root: string, candidate: string): string | null {
	const realRoot = realpathSync(root);
	const realCandidate = realpathSync(candidate);
	const prefix = realRoot.endsWith(sep) ? realRoot : `${realRoot}${sep}`;
	return realCandidate === realRoot || realCandidate.startsWith(prefix) ? realCandidate : null;
}
