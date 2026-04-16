import { Description } from '@radix-ui/react-dialog';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updaterConfig } from '@/config/updater';
import {
    getActiveProjectFromState,
    useCaaSConfigStore,
} from '@/stores/caas-config-store';
import { useSettingsStore } from '@/stores/settings-store';
import { type ModeType, modeOptionTexts, modeTypes } from '@/types/mode';
import { type StageType, stageOptionTexts } from '@/types/stage';
import { version } from '../../package.json';
import Icon from './icons/icon';
import ManageProjectsDialog from './manage-projects-dialog';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

type UpdateCheckResult =
    | {
          status: 'upToDate';
          latestVersion: string;
      }
    | {
          status: 'updateAvailable';
          latestVersion: string;
          releaseUrl: string;
      }
    | {
          status: 'error';
      };

const normalizeVersion = (rawVersion: string): string =>
    rawVersion.trim().replace(/^v/i, '').split('-')[0].split('+')[0];

const compareVersions = (leftVersion: string, rightVersion: string): number => {
    const leftParts = leftVersion.split('.').map((part) => Number(part));
    const rightParts = rightVersion.split('.').map((part) => Number(part));
    const maxLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLength; index += 1) {
        const leftPart = Number.isFinite(leftParts[index])
            ? leftParts[index]
            : 0;
        const rightPart = Number.isFinite(rightParts[index])
            ? rightParts[index]
            : 0;

        if (leftPart > rightPart) return 1;
        if (leftPart < rightPart) return -1;
    }

    return 0;
};

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Call all three unconditionally in order — each reads from the store state
        // left by the previous call, so they must chain: customer → stage → project
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

    const checkForUpdate = async () => {
        setIsCheckingUpdate(true);
        setUpdateCheckResult(null);

        try {
            const response = await fetch(updaterConfig.latestReleaseApiUrl);
            if (!response.ok) {
                throw new Error(
                    `Update check failed with status ${response.status}`
                );
            }

            const release = (await response.json()) as {
                tag_name?: string;
                html_url?: string;
            };
            const latestVersion = normalizeVersion(release.tag_name ?? '');
            const currentVersion = normalizeVersion(version);

            if (!latestVersion || !currentVersion) {
                throw new Error('Invalid version payload');
            }

            const comparison = compareVersions(currentVersion, latestVersion);
            if (comparison < 0) {
                setUpdateCheckResult({
                    status: 'updateAvailable',
                    latestVersion,
                    releaseUrl:
                        release.html_url ?? updaterConfig.releasesPageUrl,
                });
            } else {
                setUpdateCheckResult({
                    status: 'upToDate',
                    latestVersion,
                });
            }
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

                        {/* Project section */}
                        <div className="flex flex-col gap-2 mt-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold">
                                    {t('app.form.project')}
                                </h2>
                                <Button
                                    type="button"
                                    onClick={openManageProjectsDialog}
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground gap-1.5"
                                >
                                    <Icon
                                        icon="plus-circle"
                                        className="size-4"
                                    />
                                    {t('app.settings.dialog.manageProjects')}
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm">
                                        {t('app.form.customer')}
                                    </span>
                                    <Select
                                        value={localCustomerName}
                                        onValueChange={handleCustomerChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={t(
                                                    'app.form.customer'
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customerOptions.map(
                                                (customerName) => (
                                                    <SelectItem
                                                        key={customerName}
                                                        value={customerName}
                                                    >
                                                        {customerName}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm">
                                        {t('app.form.stage')}
                                    </span>
                                    <Select
                                        value={localStage}
                                        onValueChange={(value) =>
                                            handleStageChange(
                                                value as StageType
                                            )
                                        }
                                        disabled={!localStageOptions.length}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={t(
                                                    'app.form.stage'
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {localStageOptions.map((stage) => (
                                                <SelectItem
                                                    key={stage}
                                                    value={stage}
                                                >
                                                    {stageOptionTexts[stage]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm">
                                        {t('app.form.project')}
                                    </span>
                                    <Select
                                        value={localProjectName}
                                        onValueChange={setLocalProjectName}
                                        disabled={!localProjectOptions.length}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={t(
                                                    'app.form.project'
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {localProjectOptions.map(
                                                (project) => (
                                                    <SelectItem
                                                        key={
                                                            project.projectName
                                                        }
                                                        value={
                                                            project.projectName
                                                        }
                                                    >
                                                        {project.projectName}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm">
                                        {t('app.settings.dialog.locale.label')}
                                    </span>
                                    <Select
                                        value={localLocale}
                                        onValueChange={setLocalLocale}
                                        disabled={!localProjectLocales.length}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="locale" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {localProjectLocales.map((loc) => (
                                                <SelectItem
                                                    key={loc}
                                                    value={loc}
                                                >
                                                    {loc}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm">
                                        {t('app.settings.dialog.mode.label')}
                                    </span>
                                    <Select
                                        value={localMode}
                                        onValueChange={(value) =>
                                            setLocalMode(value as ModeType)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {modeTypes.map((modeType) => (
                                                <SelectItem
                                                    key={modeType}
                                                    value={modeType}
                                                >
                                                    {modeOptionTexts[modeType]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <hr className="border-t my-4" />

                        {/* Query Parameters section */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-semibold">
                                {t('app.settings.dialog.queryParams.label')}
                            </h2>
                            <div className="flex items-center gap-8">
                                <CheckboxFieldWithTooltip
                                    id={npId}
                                    label={t('app.settings.dialog.queryParams.np.label')}
                                    checked={localNp}
                                    onCheckedChange={setLocalNp}
                                    tooltipIcon="information-circle"
                                    tooltipIconColor="text-blue-500"
                                    tooltipText={t('app.settings.dialog.queryParams.np.tooltip')}
                                />
                                <CheckboxFieldWithTooltip
                                    id={repId}
                                    label={t('app.settings.dialog.queryParams.repPj.label')}
                                    checked={localRep}
                                    onCheckedChange={setLocalRep}
                                    tooltipIcon="exclamation-triangle"
                                    tooltipIconColor="text-orange-500"
                                    tooltipText={t('app.settings.dialog.queryParams.repPj.tooltip')}
                                />
                                <CheckboxFieldWithTooltip
                                    id={countId}
                                    label={t('app.settings.dialog.queryParams.count.label')}
                                    checked={localCount}
                                    onCheckedChange={setLocalCount}
                                    tooltipIcon="information-circle"
                                    tooltipIconColor="text-blue-500"
                                    tooltipText={t('app.settings.dialog.queryParams.count.tooltip')}
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
                                    onClick={checkForUpdate}
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
