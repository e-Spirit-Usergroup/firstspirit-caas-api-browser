import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@components/ui/tooltip';
import type { IconVariant } from '@/components/icons/icon';
import Icon from '@/components/icons/icon';
import { Checkbox } from '@/components/ui/checkbox';

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
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
            />
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Icon
                            icon={tooltipIcon}
                            className={`size-5 ${tooltipIconColor}`}
                        />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

export { CheckboxFieldWithTooltip };
