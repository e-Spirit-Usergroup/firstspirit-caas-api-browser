import type { ComponentProps } from "react";
import { JSONTree } from "react-json-tree";
import { type JsonKeyPath, TREE_COLLECTION_LIMIT } from "@/lib/json-preview";
import { JSONViewerTheme as base } from "@/lib/json-viewer-config";

type TreeProps = ComponentProps<typeof JSONTree>;

const MUTED = "#7d8696";
const GUIDE = "rgba(255, 255, 255, 0.08)";
/** Width reserved for the expand arrow, so values line up with the keys of expandable nodes. */
const ARROW_WIDTH = "1.25em";

const theme: TreeProps["theme"] = {
	extend: base,
	tree: {
		marginTop: 0,
		marginBottom: 0,
		marginLeft: 0,
		fontFamily:
			"ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, Consolas, monospace",
		fontSize: "0.8125rem",
		lineHeight: 1.7,
	},
	value: ({ style }) => ({
		style: {
			...style,
			paddingTop: 0,
			marginLeft: 0,
			paddingLeft: ARROW_WIDTH,
			textIndent: 0,
		},
	}),
	label: { color: base.base0D },
	valueLabel: { margin: "0 0.5em 0 0" },
	nestedNode: ({ style }, _keyPath, _nodeType, _expanded, expandable) => ({
		style: {
			...style,
			paddingTop: 0,
			marginLeft: 0,
			paddingLeft: expandable ? 0 : ARROW_WIDTH,
		},
	}),
	nestedNodeChildren: ({ style }) => ({
		style: {
			...style,
			marginLeft: "0.45em",
			paddingLeft: "0.8em",
			borderLeft: `1px solid ${GUIDE}`,
		},
	}),
	arrowContainer: ({ style }) => ({
		style: {
			...style,
			width: ARROW_WIDTH,
			paddingRight: 0,
			boxSizing: "border-box",
		},
	}),
	arrow: ({ style }) => ({
		style: { ...style, fontSize: "0.6em", lineHeight: "2.6em" },
	}),
	arrowSign: { color: MUTED },
	nestedNodeItemString: ({ style }) => ({
		style: { ...style, paddingLeft: "0.5em", color: MUTED },
	}),
	itemRange: ({ style }) => ({
		style: { ...style, paddingTop: 0, color: MUTED },
	}),
};

const labelRenderer: TreeProps["labelRenderer"] = ([key]) => (
	<span>
		{key}
		<span style={{ color: MUTED }}>:</span>
	</span>
);

/** Show only the key of an object or array, without a "{ } 2 keys" summary. */
const getItemString: TreeProps["getItemString"] = () => null;

type JsonTreeViewProps = {
	data: unknown;
	/** Read only when a node mounts; change the component's `key` to re-apply it. */
	shouldExpand: (keyPath: JsonKeyPath) => boolean;
};

function JsonTreeView({ data, shouldExpand }: JsonTreeViewProps) {
	return (
		<JSONTree
			data={data}
			theme={theme}
			invertTheme={false}
			collectionLimit={TREE_COLLECTION_LIMIT}
			hideRoot={true}
			shouldExpandNodeInitially={shouldExpand}
			labelRenderer={labelRenderer}
			getItemString={getItemString}
		/>
	);
}

export { JsonTreeView };
