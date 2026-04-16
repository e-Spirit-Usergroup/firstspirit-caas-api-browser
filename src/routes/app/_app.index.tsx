import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Navbar } from '@/components/app-navbar';
import { FilterSection } from '@/components/filter-section';
import Icon from '@/components/icons/icon';
import { PaginationControls } from '@/components/pagination-controls';
import { Button } from '@/components/ui/button';
import JSONViewer from '@/components/ui/json-viewer';
import { UrlDisplay } from '@/components/url-display';
import { buildCaaSRequest } from '@/lib/caas-request';
import { cn } from '@/lib/tw-utils';
import {
    getActiveProjectFromState,
    isCaaSConfigStoreInitialized,
    useCaaSConfigStore,
} from '@/stores/caas-config-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { AppFormData } from '@/types/app-form';
import type { PageInfos } from '@/types/page-infos';
import { stageColors, stageOptionTexts } from '@/types/stage';

export const Route = createFileRoute('/app/_app/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { t } = useTranslation();
    const filterSelectId = useId();
    const selectNameOrIdentifierId = useId();

    const { customers, activeSelection } = useCaaSConfigStore();
    const projectSettings = useMemo(
        () => getActiveProjectFromState({ customers, activeSelection }),
        [customers, activeSelection]
    );
    const databaseSchemas = projectSettings?.databaseSchemas;

    const [responseData, setResponseData] = useState(null);
    const [currentUrl, setCurrentUrl] = useState('');
    const [pageInfos, setPageInfos] = useState<PageInfos>({
        totalPages: 0,
        currentPage: 1,
    });
    const currentPageRef = useRef(1);
    const hasExecutedRequestRef = useRef(false);

    const { register, handleSubmit, setValue, watch } = useForm<AppFormData>();
    const { locale, setLocale, mode, np, rep, count } = useSettingsStore();
    const navigate = useNavigate();

    const filterType = watch('filterType');
    const schema = watch('schema');
    const entityType = watch('entityType');
    const useNameOrIdentifier = watch('useNameOrIdentifier');

    useEffect(() => {
        isCaaSConfigStoreInitialized()
            ? navigate({ to: '/app' })
            : navigate({ to: '/setup' });
    }, [navigate]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: We need the customer props as trigger
    useEffect(() => {
        setCurrentUrl('');
        setResponseData(null);
        hasExecutedRequestRef.current = false;
        currentPageRef.current = 1;
        setPageInfos({ totalPages: 0, currentPage: 1 });
    }, [
        activeSelection?.customerName,
        activeSelection?.stage,
        activeSelection?.projectName,
    ]);

    useEffect(() => {
        const projectLocales = projectSettings?.locales ?? [];
        if (!projectLocales.length) return;
        if (!locale || !projectLocales.includes(locale)) {
            setLocale(projectLocales[0]);
        }
    }, [projectSettings?.locales, locale, setLocale]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (!hasExecutedRequestRef.current) return;
        handleSubmit(onSubmit)();
    }, [mode, locale, handleSubmit]);

    async function onSubmit(data: AppFormData) {
        if (!projectSettings?.caasUrl || !projectSettings?.caasApiKey) {
            toast.error(t('app.form.error.missingUrl'));
            return;
        }
        hasExecutedRequestRef.current = true;

        const { url, effectivePage } = buildCaaSRequest(
            projectSettings.caasUrl,
            mode,
            currentPageRef.current,
            locale,
            data,
            { np, rep, count }
        );
        currentPageRef.current = effectivePage;
        setCurrentUrl(url);

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${projectSettings.caasApiKey}` },
        });
        const resData = await response.json();

        setPageInfos({
            totalPages: resData._total_pages,
            currentPage: effectivePage,
        });
        setResponseData(resData);
    }

    function paginate(direction: 'next' | 'previous') {
        if (
            direction === 'next' &&
            pageInfos.currentPage < pageInfos.totalPages
        ) {
            currentPageRef.current = pageInfos.currentPage + 1;
            setPageInfos((prev) => ({
                ...prev,
                currentPage: currentPageRef.current,
            }));
            handleSubmit(onSubmit)();
        } else if (direction === 'previous' && pageInfos.currentPage > 1) {
            currentPageRef.current = pageInfos.currentPage - 1;
            setPageInfos((prev) => ({
                ...prev,
                currentPage: currentPageRef.current,
            }));
            handleSubmit(onSubmit)();
        }
    }

    async function onCopyUrl() {
        if (currentUrl) {
            await navigator.clipboard.writeText(currentUrl);
            toast.success(t('app.form.copyUrlToClipboardBtn.success'));
        } else {
            toast.error(t('app.form.copyUrlToClipboardBtn.error'));
        }
    }

    return (
        <div className="mx-auto flex h-full w-full flex-col lg:flex-row">
            {/* Left Side - Form */}
            <div className="lg:flex-1 lg:h-screen p-4 overflow-y-scroll no-scrollbar items-center">
                <Navbar />
                <span
                    className={cn(
                        'inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium inset-ring mb-4',
                        activeSelection?.stage &&
                            stageColors[activeSelection.stage]
                    )}
                >
                    <span>
                        {activeSelection?.customerName}{' '}
                        {activeSelection?.stage &&
                            `${stageOptionTexts[activeSelection.stage]} `}
                        | {activeSelection?.projectName}
                    </span>
                    <span className="rounded-sm bg-gray-700 px-1 py-0.5 text-xs text-gray-100">
                        {mode?.toUpperCase()}
                    </span>
                </span>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-12 gap-4 mb-4 flex-1"
                >
                    <UrlDisplay url={currentUrl} onCopy={onCopyUrl} />
                    <FilterSection
                        filterType={filterType}
                        useNameOrIdentifier={useNameOrIdentifier}
                        schema={schema}
                        entityType={entityType}
                        databaseSchemas={databaseSchemas}
                        filterSelectId={filterSelectId}
                        selectNameOrIdentifierId={selectNameOrIdentifierId}
                        setValue={setValue}
                        register={register}
                    />
                    <div className="col-span-12">
                        <div className="group/button relative inline-block">
                            <span className="absolute inset-1 group-hover/button:inset-0 rounded-md bg-linear-to-r from-pink-500 via-fuchsia-600 opacity-75 group-hover/button:opacity-100 to-purple-500 blur-sm transition-all" />
                            <Button
                                type="submit"
                                variant="default"
                                className="px-6! flex gap-2 items-center cursor-pointer relative"
                            >
                                <Icon icon="running-man" className="size-4" />
                                <span>{t('app.settings.executeRequest')}</span>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Right Side - Response */}
            <div className="flex flex-col flex-1 h-svh p-2 overflow-hidden">
                <JSONViewer
                    json={responseData}
                    className="h-full overflow-y-scroll no-scrollbar"
                />
                {pageInfos.totalPages > 1 && (
                    <PaginationControls
                        pageInfos={pageInfos}
                        onPrevious={() => paginate('previous')}
                        onNext={() => paginate('next')}
                    />
                )}
            </div>
        </div>
    );
}
