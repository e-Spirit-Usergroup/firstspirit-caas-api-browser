import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updaterConfig } from '@/config/updater';
import type { UpdateCheckResult } from '@/lib/update-checker';
import { checkForUpdate, normalizeVersion } from '@/lib/update-checker';
import { version } from '../../package.json';
import Icon from './icons/icon';
import { Button } from './ui/button';

function UpdateSection() {
    const { t } = useTranslation();
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateCheckResult, setUpdateCheckResult] =
        useState<UpdateCheckResult | null>(null);

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
        <div className="flex flex-col gap-3 my-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">
                        {t('app.settings.dialog.update.label')}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {t('app.settings.dialog.update.currentVersion', { version })}
                    </span>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCheckForUpdate}
                    disabled={isCheckingUpdate}
                >
                    <Icon icon="arrow-clockwise" className="size-4" />
                    {isCheckingUpdate
                        ? t('app.settings.dialog.update.checking')
                        : t('app.settings.dialog.update.checkButton')}
                </Button>
            </div>
            {updateCheckResult?.status === 'upToDate' ? (
                <p className="text-sm text-green-600">
                    {t('app.settings.dialog.update.upToDate', {
                        currentVersion: normalizeVersion(version),
                        latestVersion: updateCheckResult.latestVersion,
                    })}
                </p>
            ) : null}
            {updateCheckResult?.status === 'updateAvailable' ? (
                <div className="text-sm text-yellow-600 flex items-center gap-2">
                    <span>
                        {t('app.settings.dialog.update.updateAvailable', {
                            currentVersion: normalizeVersion(version),
                            latestVersion: updateCheckResult.latestVersion,
                        })}
                    </span>
                    <a
                        href={updateCheckResult.releaseUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                    >
                        {t('app.settings.dialog.update.viewRelease')}
                    </a>
                </div>
            ) : null}
            {updateCheckResult?.status === 'error' ? (
                <p className="text-sm text-red-600">
                    {t('app.settings.dialog.update.checkFailed')}
                </p>
            ) : null}
        </div>
    );
}

export { UpdateSection };
