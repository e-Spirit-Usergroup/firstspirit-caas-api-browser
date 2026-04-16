import { Description } from '@radix-ui/react-dialog';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updaterConfig } from '@/config/updater';
import type { UpdateCheckResult } from '@/lib/update-checker';
import { checkForUpdate, normalizeVersion } from '@/lib/update-checker';
import {
    getActiveProjectFromState,
    useCaaSConfigStore,
} from '@/stores/caas-config-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { ModeType } from '@/types/mode';
import type { StageType } from '@/types/stage';
import { version } from '../../package.json';
import Icon from './icons/icon';
import ManageProjectsDialog from './manage-projects-dialog';
import { ProjectSettingsSection } from './project-settings-section';
import { Button } from './ui/button';
import { CheckboxFieldWithTooltip } from './ui/checkbox-field-with-tooltip';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';

function Settings() {
    const { t } = useTranslation();

    const npId = useId();
    const repId = useId();
    const countId = useId();

    const {
        locale,
        setLocale,
        mode,
        setMode,
        np,
        setNp,
        rep,
        setRep,
        count,
        setCount,
    } = useSettingsStore();

    const {
        customers,
        activeSelection,
        setActiveCustomer,
        setActiveStage,
        setActiveProject,
    } = useCaaSConfigStore();

    const activeProject = useMemo(
        () => getActiveProjectFromState({ customers, activeSelection }),
        [customers, activeSelection]
    );
    const locales = activeProject?.locales ?? [];

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isManageProjectsOpen, setIsManageProjectsOpen] = useState(false);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateCheckResult, setUpdateCheckResult] =
        useState<UpdateCheckResult | null>(null);

    // Local state for deferred save
    const [localCustomerName, setLocalCustomerName] = useState(
        activeSelection?.customerName ?? ''
    );
    const [localStage, setLocalStage] = useState<StageType>(
        (activeSelection?.stage as StageType) ?? 'dev'
    );
    const [localProjectName, setLocalProjectName] = useState(
        activeSelection?.projectName ?? ''
    );
    const [localLocale, setLocalLocale] = useState(locale ?? locales[0] ?? '');
    const [localMode, setLocalMode] = useState<ModeType>(mode);
    const [localNp, setLocalNp] = useState(np);
    const [localRep, setLocalRep] = useState(rep);
    const [localCount, setLocalCount] = useState(count);

    // Sync local state from store when dialog opens
    // biome-ignore lint/correctness/useExhaustiveDependencies: We just need to set the active selection when the settings are open
    useEffect(() => {
        if (isSettingsOpen) {
            setLocalCustomerName(activeSelection?.customerName ?? '');
            setLocalStage((activeSelection?.stage as StageType) ?? 'dev');
            setLocalProjectName(activeSelection?.projectName ?? '');
            setLocalLocale(locale ?? locales[0] ?? '');
            setLocalMode(mode);
            setLocalNp(np);
            setLocalRep(rep);
            setLocalCount(count);
        }
    }, [isSettingsOpen]);

    // Derive options from local state
    const customerOptions = customers.map((customer) => customer.customerName);
    const localSelectedCustomer = customers.find(
        (customer) => customer.customerName === localCustomerName
    );
    const localStageOptions = localSelectedCustomer
        ? (Object.keys(localSelectedCustomer.stages) as StageType[]).filter(
              (stage) => localSelectedCustomer.stages[stage].length > 0
          )
        : [];
    const localProjectOptions = localSelectedCustomer
        ? (localSelectedCustomer.stages[localStage] ?? [])
        : [];
    const localProjectLocales =
        localProjectOptions.find((p) => p.projectName === localProjectName)
            ?.locales ?? locales;

    const handleCustomerChange = (value: string) => {
        setLocalCustomerName(value);
        setLocalStage('dev');
        setLocalProjectName('');
    };

    const handleStageChange = (value: StageType) => {
        setLocalProjectName('');
        setLocalStage(value);
    };

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setActiveCustomer(localCustomerName);
        setActiveStage(localStage);
        setActiveProject(localProjectName);
        setLocale(localLocale);
        setMode(localMode);
        setNp(localNp);
        setRep(localRep);
        setCount(localCount);
        setIsSettingsOpen(false);
    };

    const handleCancel = () => {
        setIsSettingsOpen(false);
    };

    const onAddProjectClick = () => {
        setIsSettingsOpen(false);
        setIsManageProjectsOpen(false);
    };

    const openManageProjectsDialog = () => {
        setIsSettingsOpen(false);
        setIsManageProjectsOpen(true);
    };

    const handleCheckForUpdate = async () => {
        setIsCheckingUpdate(true);
        setUpdateCheckResult(null);
        try {
            const result = await checkForUpdate(
                version,
                updaterConfig.latestReleaseApiUrl,
                updaterConfig.releasesPageUrl
            );
            setUpdateCheckResult(result);
        } catch {
            setUpdateCheckResult({ status: 'error' });
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    return (
        <>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost">
                        <Icon icon="settings" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-[95vw]">
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>
                                {t('app.settings.dialog.title')}
                            </DialogTitle>
                        </DialogHeader>
                        <Description className="text-sm text-muted-foreground">
                            {t('app.settings.dialog.subtitle')}
                        </Description>

                        <ProjectSettingsSection
                            localCustomerName={localCustomerName}
                            localStage={localStage}
                            localProjectName={localProjectName}
                            localLocale={localLocale}
                            localMode={localMode}
                            customerOptions={customerOptions}
                            stageOptions={localStageOptions}
                            projectOptions={localProjectOptions}
                            localeOptions={localProjectLocales}
                            onCustomerChange={handleCustomerChange}
                            onStageChange={handleStageChange}
                            onProjectChange={setLocalProjectName}
                            onLocaleChange={setLocalLocale}
                            onModeChange={setLocalMode}
                            onManageProjects={openManageProjectsDialog}
                        />

                        <hr className="border-t my-4" />

                        {/* Query Parameters section */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-semibold">
                                {t('app.settings.dialog.queryParams.label')}
                            </h2>
                            <div className="flex items-center gap-8">
                                <CheckboxFieldWithTooltip
                                    id={npId}
                                    label={t(
                                        'app.settings.dialog.queryParams.np.label'
                                    )}
                                    checked={localNp}
                                    onCheckedChange={setLocalNp}
                                    tooltipIcon="information-circle"
                                    tooltipIconColor="text-blue-500"
                                    tooltipText={t(
                                        'app.settings.dialog.queryParams.np.tooltip'
                                    )}
                                />
                                <CheckboxFieldWithTooltip
                                    id={repId}
                                    label={t(
                                        'app.settings.dialog.queryParams.repPj.label'
                                    )}
                                    checked={localRep}
                                    onCheckedChange={setLocalRep}
                                    tooltipIcon="exclamation-triangle"
                                    tooltipIconColor="text-orange-500"
                                    tooltipText={t(
                                        'app.settings.dialog.queryParams.repPj.tooltip'
                                    )}
                                />
                                <CheckboxFieldWithTooltip
                                    id={countId}
                                    label={t(
                                        'app.settings.dialog.queryParams.count.label'
                                    )}
                                    checked={localCount}
                                    onCheckedChange={setLocalCount}
                                    tooltipIcon="information-circle"
                                    tooltipIconColor="text-blue-500"
                                    tooltipText={t(
                                        'app.settings.dialog.queryParams.count.tooltip'
                                    )}
                                />
                            </div>
                        </div>

                        <hr className="border-t my-4" />

                        {/* Updates section */}
                        <div className="flex flex-col gap-3 my-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        {t('app.settings.dialog.update.label')}
                                    </h2>
                                    <span className="text-sm text-muted-foreground">
                                        {t(
                                            'app.settings.dialog.update.currentVersion',
                                            { version }
                                        )}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCheckForUpdate}
                                    disabled={isCheckingUpdate}
                                >
                                    <Icon
                                        icon="arrow-clockwise"
                                        className="size-4"
                                    />
                                    {isCheckingUpdate
                                        ? t(
                                              'app.settings.dialog.update.checking'
                                          )
                                        : t(
                                              'app.settings.dialog.update.checkButton'
                                          )}
                                </Button>
                            </div>
                            {updateCheckResult?.status === 'upToDate' ? (
                                <p className="text-sm text-green-600">
                                    {t('app.settings.dialog.update.upToDate', {
                                        currentVersion:
                                            normalizeVersion(version),
                                        latestVersion:
                                            updateCheckResult.latestVersion,
                                    })}
                                </p>
                            ) : null}
                            {updateCheckResult?.status === 'updateAvailable' ? (
                                <div className="text-sm text-yellow-600 flex items-center gap-2">
                                    <span>
                                        {t(
                                            'app.settings.dialog.update.updateAvailable',
                                            {
                                                currentVersion:
                                                    normalizeVersion(version),
                                                latestVersion:
                                                    updateCheckResult.latestVersion,
                                            }
                                        )}
                                    </span>
                                    <a
                                        href={updateCheckResult.releaseUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline"
                                    >
                                        {t(
                                            'app.settings.dialog.update.viewRelease'
                                        )}
                                    </a>
                                </div>
                            ) : null}
                            {updateCheckResult?.status === 'error' ? (
                                <p className="text-sm text-red-600">
                                    {t(
                                        'app.settings.dialog.update.checkFailed'
                                    )}
                                </p>
                            ) : null}
                        </div>
                        <hr className="border-t my-4" />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            >
                                {t('app.settings.dialog.cancel')}
                            </Button>
                            <Button type="submit" disabled={!localProjectName}>
                                {t('app.settings.dialog.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ManageProjectsDialog
                open={isManageProjectsOpen}
                onOpenChange={setIsManageProjectsOpen}
                onAddNewProjectClick={onAddProjectClick}
            />
        </>
    );
}

export default Settings;
