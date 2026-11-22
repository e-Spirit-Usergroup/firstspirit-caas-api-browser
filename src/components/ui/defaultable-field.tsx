import type { ComponentProps } from "react";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/tw-utils";

/** Makes an input that still holds its default value look inactive, until it is focused. */
export const inactiveInputClass =
	"border-dashed bg-muted/40 text-muted-foreground focus:border-solid focus:bg-transparent focus:text-foreground dark:bg-input/10 dark:focus:bg-input/30";

type DefaultableFieldProps = Omit<
	ComponentProps<typeof FormField>,
	"labelClassName"
> & {
	/** True while the field holds its default value (and is therefore not sent). */
	isDefault: boolean;
};

/**
 * A form field for an optional request parameter. While it holds its default
 * value its label is muted; focusing the field makes it look active again.
 * Pair it with `inactiveInputClass` on the input.
 */
function DefaultableField({ isDefault, ...props }: DefaultableFieldProps) {
	return (
		<div
			className={cn(
				isDefault &&
					"[&_label]:text-muted-foreground focus-within:[&_label]:text-foreground",
			)}
		>
			{/* Label and the narrow input sit on one line, so keep some space between them */}
			<FormField {...props} labelClassName="pr-3" />
		</div>
	);
}

export { DefaultableField };
