import { useTranslation } from 'react-i18next';
import Icon from '@/components/icons/icon';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type UrlDisplayProps = {
    url: string;
    onCopy: () => void;
};

function UrlDisplay({ url, onCopy }: UrlDisplayProps) {
    const { t } = useTranslation();

    return (
        <div className="col-span-12 bg-blue-100 dark:bg-neutral-800 p-4 rounded-md text-blue-950 dark:text-blue-100">
            <span className="inline-flex items-center gap-1">
                <span className="font-semibold">
                    {t('app.form.decodedUrl')}
                </span>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={onCopy}
                                className="px-2.5 cursor-pointer"
                                aria-label={t(
                                    'app.form.copyUrlToClipboardBtn.label'
                                )}
                            >
                                <Icon icon="clipboard" className="size-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                            <p>{t('app.form.copyUrlToClipboardBtn.label')}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </span>
            <span className="mt-2 block bg-neutral-300 text-neutral-700 dark:bg-neutral-900 dark:text-blue-400 p-1.5 text-sm font-mono break-all rounded-sm">
                {url ? decodeURIComponent(url) : t('app.form.noUrlToDisplay')}
            </span>
        </div>
    );
}

export { UrlDisplay };
