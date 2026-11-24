import { type ReactNode, useMemo } from "react";
import { JSONViewerTheme } from "@/lib/json-viewer-config";

/** Above this length the raw JSON is shown without syntax highlighting to keep rendering fast. */
const HIGHLIGHT_CHAR_LIMIT = 300_000;

const TOKEN_PATTERN =
	/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function highlight(text: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(TOKEN_PATTERN)) {
		const index = match.index ?? 0;
		if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

		const [token, string, colon, literal] = match;
		let color: string;
		if (string !== undefined) {
			color = colon ? JSONViewerTheme.base0D : JSONViewerTheme.base0B;
		} else if (literal !== undefined) {
			color = JSONViewerTheme.base08;
		} else {
			color = JSONViewerTheme.base09;
		}

		nodes.push(
			<span key={index} style={{ color }}>
				{string ?? token}
			</span>,
		);
		if (colon) nodes.push(colon);
		lastIndex = index + token.length;
	}

	if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
	return nodes;
}

type RawJsonProps = {
	json: unknown;
};

function RawJson({ json }: RawJsonProps) {
	const content = useMemo(() => {
		const text = JSON.stringify(json, null, 2) ?? "";
		return text.length > HIGHLIGHT_CHAR_LIMIT ? text : highlight(text);
	}, [json]);

	return (
		<pre
			className="m-0 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap break-all"
			style={{ color: JSONViewerTheme.base05 }}
		>
			{content}
		</pre>
	);
}

export { RawJson };
