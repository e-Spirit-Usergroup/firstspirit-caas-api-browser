/** Responses with more nodes than this are first rendered as a preview. */
export const PREVIEW_NODE_LIMIT = 100;

/** Counts every value (objects, arrays and primitives) in a JSON tree. */
export function countJsonNodes(value: unknown): number {
	let count = 0;
	const stack: unknown[] = [value];
	while (stack.length) {
		const current = stack.pop();
		count++;
		if (current && typeof current === "object") {
			for (const child of Object.values(current)) stack.push(child);
		}
	}
	return count;
}

/**
 * Returns a copy of the JSON tree that keeps only the first `budget` nodes
 * in document order, so the preview shows the beginning of the response.
 */
export function truncateJson(value: unknown, budget: number): unknown {
	let remaining = budget;

	function visit(current: unknown): unknown {
		remaining--;
		if (!current || typeof current !== "object") return current;

		if (Array.isArray(current)) {
			const items: unknown[] = [];
			for (const item of current) {
				if (remaining <= 0) break;
				items.push(visit(item));
			}
			return items;
		}

		const entries: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(current)) {
			if (remaining <= 0) break;
			entries[key] = visit(child);
		}
		return entries;
	}

	return visit(value);
}
