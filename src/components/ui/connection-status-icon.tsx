import type React from "react";
import { cn } from "../../lib/tw-utils";
import type { ConnectionStatusType } from "../../types/connection-status";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
	connectionStatus?: ConnectionStatusType | null;
};

function ConnectionStatusIcon(props: Props) {
	const { connectionStatus, ...attributes } = props;

	return (
		<span
			{...attributes}
			className={cn("relative flex size-2.5", attributes.className)}
		>
			{connectionStatus === "connected" ? (
				<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
			) : null}
			<span
				className={cn(
					"relative inline-flex size-2.5 rounded-full",
					connectionStatus === "connected"
						? "bg-emerald-500"
						: connectionStatus === "disconnected"
							? "bg-red-500"
							: connectionStatus === "testing"
								? "bg-yellow-400"
								: connectionStatus === "untouched"
									? "bg-gray-500"
									: "bg-gray-500",
				)}
			/>
		</span>
	);
}

export default ConnectionStatusIcon;
