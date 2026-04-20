import { useTranslation } from 'react-i18next';
import { JSONTree } from 'react-json-tree';
import { JSONViewerTheme } from '@/lib/json-viewer-config';
import { cn } from '@/lib/tw-utils';

type Props = {
    // biome-ignore lint/suspicious/noExplicitAny: explicit any type allowed
    json?: any;
    className?: string;
};

export default function JSONViewer({ json, className }: Props) {
    const { t } = useTranslation();
    return (
        <div
            className={cn(
                'text-sm sm:text-base lg:text-sm xl:text-base rounded-md p-2 w-full',
                className
            )}
            style={{ backgroundColor: JSONViewerTheme.base00 }}
        >
            {json === null ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="flex flex-col gap-2">
                        <img
                            src="/undraw/undraw_code-sample_kpju.svg"
                            alt="wizard"
                            className="w-full max-w-48 max-h-48 mx-auto mt-4"
                        />
                        <p className="text-white">{t('app.json.noResponse')}</p>
                    </div>
                </div>
            ) : (
                <JSONTree
                    data={json}
                    theme={JSONViewerTheme}
                    invertTheme={false}
                    collectionLimit={10}
                    hideRoot={true}
                    shouldExpandNodeInitially={() => true}
                />
            )}
        </div>
    );
}
