/** Collections with more entries than this are split into collapsed ranges by the tree view. */
export const TREE_COLLECTION_LIMIT = 50;

/** Rows the tree view expands initially. Keeps the first render fast for any response size. */
export const INITIAL_ROW_BUDGET = 1_500;

/** Rows "Expand all" may mount at once, so huge responses can't freeze the page. */
export const EXPAND_ALL_ROW_BUDGET = 15_000;

/** Key path as passed by react-json-tree: the node's own key first, the root key last. */
export type JsonKeyPath = readonly (string | number)[];

export type InitialExpansion = {
	/** True when every node is expanded, so nothing is hidden behind a collapsed node. */
	isComplete: boolean;
	shouldExpand: (keyPath: JsonKeyPath) => boolean;
};

/** With `hideRoot`, react-json-tree passes an empty key path for the root node. */
const ROOT_KEY_PATH: JsonKeyPath = [];

/** Separator that can't appear in a JSON key, so each key path maps to a unique id. */
function toPathId(keyPath: JsonKeyPath): string {
	return keyPath.join("\u0000");
}

function isCollection(value: unknown): value is object {
	return value !== null && typeof value === "object";
}

/** Entries react-json-tree shows directly after the first ones of a collection above the limit. */
const TAIL_ENTRIES = 4;

/**
 * Mirrors react-json-tree's `getCollectionEntries`: above the limit, a collection shows its
 * first `limit - 4` and last 4 entries directly and groups the rest into collapsed ranges,
 * whose size grows (limit, limit², …) so the number of ranges stays small.
 */
function isDirectlyShown(
	index: number,
	length: number,
	collectionLimit: number,
): boolean {
	return (
		length <= collectionLimit ||
		index < collectionLimit - TAIL_ENTRIES ||
		index >= length - TAIL_ENTRIES
	);
}

/** Rows a collection renders when expanded: its directly shown entries plus one per range. */
function visibleRows(length: number, collectionLimit: number): number {
	if (length <= collectionLimit) return length;
	const from = collectionLimit - TAIL_ENTRIES;
	const to = length - TAIL_ENTRIES - 1;
	let rangeSize = collectionLimit;
	while (to - from > rangeSize * rangeSize) rangeSize *= rangeSize;
	return collectionLimit + Math.ceil((to - from + 1) / rangeSize);
}

/** Counts every value (objects, arrays and primitives) in a JSON tree. */
export function countJsonNodes(value: unknown): number {
	let count = 0;
	const stack: unknown[] = [value];
	while (stack.length) {
		const current = stack.pop();
		count++;
		if (isCollection(current)) {
			for (const child of Object.values(current)) stack.push(child);
		}
	}
	return count;
}

/**
 * Decides which nodes of a JSON tree start expanded.
 *
 * Responses that fit into the budget are expanded fully. Larger ones are expanded
 * level by level while the whole next level fits into the budget of rendered rows, so top-level fields
 * (e.g. CaaS `_returned`, `_total_pages`, or each document's `name` and `fsType`) are
 * visible before deeply nested `formData`. Entries the tree view groups into collapsed
 * ranges (collections above `collectionLimit`) start collapsed when their range is opened.
 */
export function computeInitialExpansion(
	data: unknown,
	budget: number = INITIAL_ROW_BUDGET,
	collectionLimit: number = TREE_COLLECTION_LIMIT,
): InitialExpansion {
	if (countJsonNodes(data) <= budget) {
		return { isComplete: true, shouldExpand: () => true };
	}

	type QueueItem = { value: object; keyPath: JsonKeyPath };
	const expanded = new Set<string>();
	const queue: QueueItem[] = [];
	let rows = 0;

	/** Adds the rows of an expanded node and queues its expandable children. */
	function open(value: object, keyPath: JsonKeyPath) {
		const entries = Object.entries(value);
		rows += visibleRows(entries.length, collectionLimit);

		const isArray = Array.isArray(value);
		for (const [index, [key, child]] of entries.entries()) {
			// Entries inside collapsed ranges mount collapsed when the range is opened
			if (!isDirectlyShown(index, entries.length, collectionLimit)) continue;
			if (isCollection(child) && Object.keys(child).length > 0) {
				const childKey = isArray ? Number(key) : key;
				queue.push({ value: child, keyPath: [childKey, ...keyPath] });
			}
		}
	}

	// The root is always rendered expanded (hideRoot)
	if (isCollection(data)) open(data, ROOT_KEY_PATH);

	// Open whole levels only, so e.g. every document of a CaaS page is expanded equally
	let level = queue.splice(0);
	while (level.length > 0) {
		const levelRows = level.reduce(
			(sum, { value }) =>
				sum + visibleRows(Object.keys(value).length, collectionLimit),
			0,
		);
		if (rows + levelRows > budget) break;
		for (const { value, keyPath } of level) {
			expanded.add(toPathId(keyPath));
			open(value, keyPath);
		}
		level = queue.splice(0);
	}

	return {
		isComplete: false,
		shouldExpand: (keyPath) => expanded.has(toPathId(keyPath)),
	};
}
