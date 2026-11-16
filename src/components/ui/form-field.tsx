import type { ReactNode } from "react";

type FormFieldProps = {
	label: string;
	htmlFor?: string;
	error?: string;
	children: ReactNode;
};

function FormField({ label, htmlFor, error, children }: FormFieldProps) {
	return (
		<div className="min-w-0">
			<label
				htmlFor={htmlFor}
				className="text-sm font-medium mb-1.5 inline-block"
			>
				{label}
			</label>
			{children}
			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
		</div>
	);
}

export { FormField };
