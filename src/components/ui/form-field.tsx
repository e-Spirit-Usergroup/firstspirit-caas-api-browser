import type { ReactNode } from "react";
import { cn } from "@/lib/tw-utils";

type FormFieldProps = {
	label: ReactNode;
	htmlFor?: string;
	error?: string;
	labelClassName?: string;
	children: ReactNode;
};

function FormField({
	label,
	htmlFor,
	error,
	labelClassName,
	children,
}: FormFieldProps) {
	return (
		<div className="min-w-0">
			<label
				htmlFor={htmlFor}
				className={cn(
					"text-sm font-medium mb-1.5 inline-block transition-colors",
					labelClassName,
				)}
			>
				{label}
			</label>
			{children}
			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
		</div>
	);
}

export { FormField };
