import type { IconVariant } from "@/components/icons/icon";
import Icon from "@/components/icons/icon";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type CheckboxFieldWithTooltipProps = {
	id: string;
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	tooltipIcon: IconVariant;
	tooltipIconColor: string;
	tooltipText: string;
};

function CheckboxFieldWithTooltip({
	id,
	label,
	checked,
	onCheckedChange,
	tooltipIcon,
	tooltipIconColor,
	tooltipText,
}: CheckboxFieldWithTooltipProps) {
	return (
		<div className="flex items-center gap-2">
			<Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			<Tooltip>
				<TooltipTrigger>
					<Icon icon={tooltipIcon} className={`size-5 ${tooltipIconColor}`} />
				</TooltipTrigger>
				<TooltipContent className="max-w-64">
					<p>{tooltipText}</p>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}

export { CheckboxFieldWithTooltip };
