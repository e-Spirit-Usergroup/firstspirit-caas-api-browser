import { JSONTree } from "react-json-tree";
import { JSONViewerTheme } from "@/lib/json-viewer-config";
import { cn } from "@/lib/tw-utils";

type Props = {
	// biome-ignore lint/suspicious/noExplicitAny: explicit any type allowed
	json?: any;
	className?: string;
};

export default function JSONViewer({ json, className }: Props) {
	return (
		<div
			className={cn(
				"text-sm sm:text-base lg:text-sm xl:text-base rounded-lg p-2 w-full",
				className,
			)}
			style={{ backgroundColor: JSONViewerTheme.base00 }}
		>
			<JSONTree
				data={json}
				theme={JSONViewerTheme}
				invertTheme={false}
				collectionLimit={10}
				hideRoot={true}
				shouldExpandNodeInitially={() => true}
			/>
		</div>
	);
}
