import type { ReactNode } from "react";

type ParameterGroupProps = {
	title: string;
	children: ReactNode;
};

function ParameterGroup({ title, children }: ParameterGroupProps) {
	return (
		<fieldset className="col-span-12 flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4">
			<legend className="px-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				{title}
			</legend>
			{children}
		</fieldset>
	);
}

export { ParameterGroup };
